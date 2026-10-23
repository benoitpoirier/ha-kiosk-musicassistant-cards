"""Expose Music Assistant's native recommendation feed to the kiosk cards."""

from __future__ import annotations

import asyncio
import logging
import random
from typing import Any

import voluptuous as vol
from homeassistant.components.music_assistant.helpers import get_music_assistant_client
from homeassistant.components.music_assistant.schemas import media_item_dict_from_mass_item
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from music_assistant_models.media_items import media_from_dict

_LOGGER = logging.getLogger(__name__)

TOP_PICKS_LIMIT = 9
MAX_TOP_PICKS_LIMIT = 100
RECENTLY_PLAYED_LIMIT = 12
ROW_LIMIT = 20
MAX_ROW_LIMIT = 50

SOURCE_MUSIC_ASSISTANT = "music_assistant"
SOURCE_SIMILAR = "similar"
# Former name of "similar", kept so existing configurations keep working.
SOURCE_SPOTIFY = "spotify"
SOURCE_MIXED = "mixed"
SOURCES = [SOURCE_MUSIC_ASSISTANT, SOURCE_SIMILAR, SOURCE_SPOTIFY, SOURCE_MIXED]

# Discovery: a few tracks of the listening history are the seeds, and the music
# providers' own recommendation engines (Spotify, Tidal, YouTube Music, Deezer...)
# return similar tracks through Music Assistant. Spotify's engine is reached via
# MA's Spotify provider, whose global session still has the endpoint.
SEED_POOL = 20
SEED_COUNT = 6
SEED_ROWS = 3
SIMILAR_LIMIT = 25

GET_TOP_PICKS_SCHEMA = vol.Schema(
    {
        vol.Required("config_entry_id"): cv.string,
        vol.Optional("limit", default=TOP_PICKS_LIMIT): vol.All(
            cv.positive_int, vol.Range(min=1, max=MAX_TOP_PICKS_LIMIT)
        ),
    }
)

GET_RECOMMENDATIONS_SCHEMA = vol.Schema(
    {
        vol.Required("config_entry_id"): cv.string,
        vol.Optional("username"): cv.string,
        vol.Optional("row_limit", default=ROW_LIMIT): vol.All(
            cv.positive_int, vol.Range(min=1, max=MAX_ROW_LIMIT)
        ),
        vol.Optional("include_hidden", default=False): cv.boolean,
        vol.Optional("source", default=SOURCE_MUSIC_ASSISTANT): vol.In(SOURCES),
        vol.Optional("spotify_entity"): cv.entity_id,
    }
)


def _serialize_item(mass: Any, raw_item: Any, reason: str) -> dict[str, Any]:
    if not isinstance(raw_item, dict):
        raise HomeAssistantError("Music Assistant returned an invalid recommendation item")

    if raw_item.get("media_type") == "folder":
        item = {
            "name": raw_item.get("name"),
            "uri": raw_item.get("uri"),
            "image": None,
            "media_type": "folder",
        }
    else:
        item = media_item_dict_from_mass_item(mass, media_from_dict(raw_item))

    name = item.get("name")
    uri = item.get("uri")
    if not isinstance(name, str) or not name or not isinstance(uri, str) or not uri:
        raise HomeAssistantError("Music Assistant returned a recommendation without a name or URI")

    artists = [
        artist.get("name")
        for artist in item.get("artists") or []
        if isinstance(artist, dict) and artist.get("name")
    ]
    return {
        "name": name,
        "uri": uri,
        "image": item.get("image"),
        "media_type": str(item.get("media_type") or ""),
        "artist": ", ".join(artists[:2]) or None,
        "recommendation_reason": reason,
    }


async def _send(mass: Any, command: str, user: str | None, **kwargs: Any) -> Any:
    """Send a command, on behalf of a Music Assistant user when one is given."""
    if user:
        return await mass.send_command(command, user=user, **kwargs)
    return await mass.send_command(command, **kwargs)


async def _async_fetch_rows(
    mass: Any, user: str | None, include_hidden: bool
) -> list[tuple[dict[str, Any], list[Any]]]:
    folders = await _send(mass, "music/recommendations", user)
    if not isinstance(folders, list):
        raise HomeAssistantError("Music Assistant returned invalid recommendation rows")

    enabled_folders: list[dict[str, Any]] = []
    for folder in folders:
        if not isinstance(folder, dict):
            raise HomeAssistantError("Music Assistant returned an invalid recommendation row")
        if folder.get("enabled_by_default") is False and not include_hidden:
            continue
        if not all(
            isinstance(folder.get(key), str) and folder[key]
            for key in ("provider", "item_id", "name")
        ):
            raise HomeAssistantError("Music Assistant returned an incomplete recommendation row")
        enabled_folders.append(folder)

    row_items = await asyncio.gather(
        *(
            _send(
                mass,
                "music/recommendations/items",
                user,
                provider=folder["provider"],
                item_id=folder["item_id"],
            )
            for folder in enabled_folders
        )
    )
    if any(not isinstance(items, list) for items in row_items):
        raise HomeAssistantError("Music Assistant returned invalid recommendation items")
    return list(zip(enabled_folders, row_items))


async def async_get_top_picks(call: ServiceCall) -> dict[str, list[dict[str, Any]]]:
    """Return the native feed in the user context of HA's authenticated MA client."""
    mass = get_music_assistant_client(call.hass, call.data["config_entry_id"])
    limit = call.data["limit"]
    rows = await _async_fetch_rows(mass, None, False)

    items: list[dict[str, Any]] = []
    seen_uris: set[str] = set()
    max_row_length = max((len(row) for _, row in rows), default=0)
    for index in range(max_row_length):
        for folder, row in rows:
            if index >= len(row):
                continue
            item = _serialize_item(mass, row[index], folder["name"])
            if item["uri"] in seen_uris:
                continue
            seen_uris.add(item["uri"])
            items.append(item)
            if len(items) == limit:
                return {"items": items}

    if len(items) < limit:
        recently_played = await mass.send_command(
            "music/recently_played_items",
            limit=RECENTLY_PLAYED_LIMIT,
        )
        if not isinstance(recently_played, list):
            raise HomeAssistantError("Music Assistant returned invalid recently played items")
        for raw_item in recently_played:
            item = _serialize_item(mass, raw_item, "Recently played")
            if item["uri"] in seen_uris:
                continue
            seen_uris.add(item["uri"])
            items.append(item)
            if len(items) == limit:
                break

    return {"items": items}


async def _async_ma_rows(
    mass: Any, user: str | None, row_limit: int, include_hidden: bool
) -> list[dict[str, Any]]:
    """Music Assistant's own recommendation rows (recently played, random...)."""
    try:
        rows = await _async_fetch_rows(mass, user, include_hidden)
    except HomeAssistantError:
        raise
    except Exception as err:  # noqa: BLE001
        if not user:
            raise HomeAssistantError(str(err) or err.__class__.__name__) from err
        # Servers without impersonation support reject the user argument: the
        # feed of the account Home Assistant is logged in with is better than none.
        _LOGGER.debug("Recommendations as %s failed (%s), retrying without user", user, err)
        rows = await _async_fetch_rows(mass, None, include_hidden)

    result: list[dict[str, Any]] = []
    for folder, raw_items in rows:
        items: list[dict[str, Any]] = []
        seen_uris: set[str] = set()
        for raw_item in raw_items:
            item = _serialize_item(mass, raw_item, folder["name"])
            if item["uri"] in seen_uris or item["media_type"] == "folder":
                continue
            seen_uris.add(item["uri"])
            items.append(item)
            if len(items) == row_limit:
                break
        if not items:
            continue
        result.append(
            {
                "id": f"{folder['provider']}/{folder['item_id']}",
                "name": folder["name"],
                "translation_key": folder.get("translation_key"),
                "subtitle": folder.get("subtitle"),
                "icon": folder.get("icon"),
                "source": SOURCE_MUSIC_ASSISTANT,
                "items": items,
            }
        )
    return result


def _seed_from_uri(uri: str, name: str, artist: str | None) -> dict[str, Any] | None:
    """A seed is a track Music Assistant can find similar tracks for."""
    provider, _, path = str(uri or "").partition("://")
    media_type, _, item_id = path.partition("/")
    if not provider or media_type != "track" or not item_id:
        return None
    return {"provider": provider, "item_id": item_id, "name": name, "artist": artist or ""}


async def _async_spotify_history_seeds(hass: HomeAssistant, entity_id: str) -> list[dict[str, Any]]:
    """The user's Spotify top tracks (last weeks) and recently played tracks via SpotifyPlus."""
    seeds: list[dict[str, Any]] = []

    async def fetch(service: str, data: dict[str, Any]) -> list[dict[str, Any]]:
        try:
            response = await hass.services.async_call(
                "spotifyplus", service, {"entity_id": entity_id, **data},
                blocking=True, return_response=True,
            )
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("SpotifyPlus %s failed: %s", service, err)
            return []
        result = (response or {}).get("result") or {}
        items = result.get("items") if isinstance(result, dict) else None
        return items if isinstance(items, list) else []

    top, recent = await asyncio.gather(
        fetch("get_users_top_tracks", {"time_range": "short_term", "limit": SEED_POOL}),
        fetch("get_player_recent_tracks", {"limit": SEED_POOL}),
    )
    for track in [*top, *(entry.get("track") for entry in recent if isinstance(entry, dict))]:
        if not isinstance(track, dict) or not track.get("id"):
            continue
        artists = track.get("artists") or []
        artist = artists[0].get("name") if artists and isinstance(artists[0], dict) else None
        seeds.append(
            {"provider": "spotify", "item_id": track["id"], "name": track.get("name") or "",
             "artist": artist or ""}
        )
    return seeds


async def _async_ma_history_seeds(hass: HomeAssistant, entry_id: str, user: str | None) -> list[dict[str, Any]]:
    """Fallback seeds: what was played last through Music Assistant, then favourite tracks."""
    seeds: list[dict[str, Any]] = []
    for extra in ({"order_by": "last_played_desc"}, {"favorite": True, "order_by": "random"}):
        data = {"config_entry_id": entry_id, "media_type": "track", "limit": SEED_POOL, **extra}
        if user:
            data["username"] = user
        try:
            response = await hass.services.async_call(
                "music_assistant", "get_library", data, blocking=True, return_response=True
            )
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Music Assistant library seeds failed: %s", err)
            continue
        for item in (response or {}).get("items") or []:
            artists = item.get("artists") or []
            artist = artists[0].get("name") if artists and isinstance(artists[0], dict) else None
            seed = _seed_from_uri(item.get("uri"), item.get("name") or "", artist)
            if seed:
                seeds.append(seed)
    return seeds


async def _async_similar(mass: Any, user: str | None, seed: dict[str, Any]) -> list[Any]:
    kwargs = {
        "item_id": seed["item_id"],
        "provider_instance_id_or_domain": seed["provider"],
        "limit": SIMILAR_LIMIT,
        "allow_lookup": True,
    }
    try:
        result = await _send(mass, "music/tracks/similar_tracks", user, **kwargs)
    except Exception as err:  # noqa: BLE001
        if not user:
            _LOGGER.debug("Similar tracks for %s failed: %s", seed, err)
            return []
        try:
            result = await mass.send_command("music/tracks/similar_tracks", **kwargs)
        except Exception as err2:  # noqa: BLE001
            _LOGGER.debug("Similar tracks for %s failed: %s", seed, err2)
            return []
    return result if isinstance(result, list) else []


async def _async_similar_rows(
    hass: HomeAssistant, mass: Any, entry_id: str, user: str | None,
    spotify_entity: str | None, row_limit: int,
) -> list[dict[str, Any]]:
    """Discovery rows built by the providers' recommendation engines from the listening history."""
    seeds: list[dict[str, Any]] = []
    if spotify_entity:
        seeds = await _async_spotify_history_seeds(hass, spotify_entity)
    if not seeds:
        seeds = await _async_ma_history_seeds(hass, entry_id, user)
    if not seeds:
        return []

    unique: dict[str, dict[str, Any]] = {}
    for seed in seeds:
        unique.setdefault(f"{seed['name'].lower()}|{seed['artist'].lower()}", seed)
    pool = list(unique.values())
    # A different handful of seeds on every refresh keeps the feed moving while
    # each seed's answer stays cached by Music Assistant.
    chosen = random.sample(pool, min(SEED_COUNT, len(pool)))

    answers = await asyncio.gather(*(_async_similar(mass, user, seed) for seed in chosen))
    known = {f"{s['name'].lower()}|{s['artist'].lower()}" for s in pool}

    def items_for(raw_items: list[Any], reason: str) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        for raw_item in raw_items:
            try:
                item = _serialize_item(mass, raw_item, reason)
            except HomeAssistantError:
                continue
            if f"{item['name'].lower()}|{(item['artist'] or '').split(',')[0].lower()}" in known:
                continue
            items.append(item)
        return items

    per_seed = [(seed, items_for(raw, "similar")) for seed, raw in zip(chosen, answers)]
    per_seed = [(seed, items) for seed, items in per_seed if items]
    if not per_seed:
        return []

    mix: list[dict[str, Any]] = []
    seen: set[str] = set()
    for index in range(max(len(items) for _, items in per_seed)):
        for _, items in per_seed:
            if index < len(items) and items[index]["uri"] not in seen:
                seen.add(items[index]["uri"])
                mix.append(items[index])
    icon = "mdi-spotify" if all(i["uri"].startswith("spotify") for i in mix) else "mdi-star-shooting-outline"
    rows = [
        {
            "id": "similar/for_you",
            "name": "Recommended for you",
            "translation_key": "for_you",
            "subtitle": None,
            "icon": icon,
            "source": SOURCE_SIMILAR,
            "items": mix[: max(row_limit, 24)],
        }
    ]
    artists_done: set[str] = set()
    for seed, items in per_seed:
        if len(rows) > SEED_ROWS or not seed["artist"] or seed["artist"].lower() in artists_done:
            continue
        artists_done.add(seed["artist"].lower())
        rows.append(
            {
                "id": f"similar/because/{seed['item_id']}",
                "name": f"Because you listen to {seed['artist']}",
                "translation_key": "because_you_listen",
                "seed": seed["artist"],
                "seed_track": seed["name"],
                "subtitle": None,
                "icon": "mdi-account-music",
                "source": SOURCE_SIMILAR,
                "items": items[:row_limit],
            }
        )
    return rows


async def async_get_recommendations(call: ServiceCall) -> dict[str, list[dict[str, Any]]]:
    """Return discovery rows: similar tracks from the music providers, MA rows, or both."""
    mass = get_music_assistant_client(call.hass, call.data["config_entry_id"])
    user = call.data.get("username")
    row_limit = call.data["row_limit"]
    source = call.data["source"]
    if source == SOURCE_SPOTIFY:
        source = SOURCE_SIMILAR
    rows: list[dict[str, Any]] = []
    if source in (SOURCE_SIMILAR, SOURCE_MIXED):
        rows += await _async_similar_rows(
            call.hass, mass, call.data["config_entry_id"], user,
            call.data.get("spotify_entity"), row_limit,
        )
    if source in (SOURCE_MUSIC_ASSISTANT, SOURCE_MIXED) or not rows:
        rows += await _async_ma_rows(mass, user, row_limit, call.data["include_hidden"])
    return {"rows": rows}

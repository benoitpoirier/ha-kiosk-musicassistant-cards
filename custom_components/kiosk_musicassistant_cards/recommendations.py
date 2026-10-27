"""Expose Music Assistant's native recommendation feed to the kiosk cards."""

from __future__ import annotations

import asyncio
import logging
import random
import re
import time
from typing import Any

import voluptuous as vol
from homeassistant.components.music_assistant.helpers import get_music_assistant_client
from homeassistant.components.music_assistant.schemas import media_item_dict_from_mass_item
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.storage import Store
from music_assistant_models.media_items import media_from_dict

_LOGGER = logging.getLogger(__name__)

# 'spotify--AbC123://track/x' names one account of a provider. Music Assistant
# shares similar-track listings between users, so such a uri can point at an
# account the Music Assistant user playing it may not use ("could not resolve").
# The provider's own uri ('spotify://track/x') lets Music Assistant pick an
# account that user has. Library uris and others are left alone.
_INSTANCE_URI = re.compile(r"^([a-z0-9_]+)--[A-Za-z0-9]+://")


def _portable_uri(uri: str) -> str:
    return _INSTANCE_URI.sub(r"\1://", uri)


# ---------- full track objects ----------
# Playing a provider uri makes Music Assistant fetch the track from the
# provider first (Spotify: GET /v1/tracks/<id>), and Home Assistant's
# play_media verifies it once more. Under Spotify's rate limiting each fetch
# can wait 5-80 s. The similar-track answers already hold the full tracks:
# they are kept here (and saved with the feeds) and handed to Music Assistant
# as they are, which starts playback without any provider request.
DATA_TRACKS = "kiosk_musicassistant_cards_tracks"
DATA_USERS = "kiosk_musicassistant_cards_users"
MAX_TRACKS = 3000
USERS_TTL = 600


def _slim(raw: dict[str, Any]) -> dict[str, Any]:
    """Drop the metadata Music Assistant does not need to play a track."""
    def strip(obj: Any) -> Any:
        if not isinstance(obj, dict):
            return obj
        obj = dict(obj)
        meta = obj.get("metadata")
        if isinstance(meta, dict):
            obj["metadata"] = {"images": meta.get("images")} if meta.get("images") else {}
        return obj

    track = strip(raw)
    track["album"] = strip(track.get("album"))
    track["artists"] = [strip(a) for a in track.get("artists") or []]
    return track


def _remember_tracks(hass: HomeAssistant, user: str | None, raw_items: list[Any]) -> None:
    tracks: dict[tuple, dict[str, Any]] = hass.data.setdefault(DATA_TRACKS, {})
    for raw in raw_items:
        if not isinstance(raw, dict) or raw.get("media_type") != "track" or not raw.get("uri"):
            continue
        key = (user or "", _portable_uri(raw["uri"]))
        tracks.pop(key, None)
        tracks[key] = _slim(raw)
    while len(tracks) > MAX_TRACKS:
        tracks.pop(next(iter(tracks)))


def remembered_track(hass: HomeAssistant, user: str | None, uri: str) -> dict[str, Any] | None:
    return hass.data.get(DATA_TRACKS, {}).get((user or "", _portable_uri(uri)))


async def _async_allowed_providers(hass: HomeAssistant, mass: Any, user: str | None) -> set[str] | None:
    """The music provider instances a Music Assistant user may use; None when unrestricted or unknown."""
    if not user:
        return None
    cache = hass.data.setdefault(DATA_USERS, {})
    if time.monotonic() - cache.get("time", 0) > USERS_TTL:
        try:
            users = await mass.send_command("auth/users")
            cache["filters"] = {
                u.get("username"): set(u.get("provider_filter") or [])
                for u in users if isinstance(u, dict)
            }
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Could not read the Music Assistant users: %s", err)
            cache.setdefault("filters", {})
        cache["time"] = time.monotonic()
    return cache["filters"].get(user) or None


async def async_playable_track(
    hass: HomeAssistant, mass: Any, user: str | None, raw: dict[str, Any]
) -> dict[str, Any] | None:
    """The track bound to accounts the user may play from, or None if it has none."""
    allowed = await _async_allowed_providers(hass, mass, user)
    if allowed is None:
        return raw
    mappings = []
    for mapping in raw.get("provider_mappings") or []:
        instance = mapping.get("provider_instance")
        if instance in allowed:
            mappings.append(mapping)
            continue
        # Similar-track answers are shared between users: move the mapping to
        # this user's account of the same provider.
        domain = mapping.get("provider_domain")
        own = sorted(i for i in allowed if i == domain or i.startswith(f"{domain}--"))
        if own:
            mappings.append({**mapping, "provider_instance": own[0]})
    if not mappings:
        return None
    if raw.get("provider") == "library":
        return {**raw, "provider_mappings": mappings}
    first = mappings[0]
    return {
        **raw,
        "provider_mappings": mappings,
        "item_id": first["item_id"],
        "provider": first["provider_instance"],
        "uri": f"{first['provider_instance']}://track/{first['item_id']}",
    }
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
SIMILAR_TIMEOUT = 15
# Every rebuild asks the provider for new seeds: under Spotify's rate limit
# these requests delay playback, so feeds are rebuilt every 2 hours at most.
CACHE_TTL = 2 * 3600
KEEP_WARM = 24 * 3600
DATA_CACHE = "kiosk_musicassistant_cards_recommendations"
DATA_STORE = "kiosk_musicassistant_cards_recommendations_store"
STORE_VERSION = 1
STORE_SAVE_DELAY = 60

# Music Assistant builds these rows from one play log shared by every user
# (verified on MA 2.10: identical for two users while their own library
# listings differ). With a username they are replaced by rows read from the
# library in that user's context, where last_played and play_count are theirs.
PLAYLOG_ROWS = {
    "recently played", "recent artists", "recent tracks", "recent albums",
    "forgotten tracks", "forgotten albums", "forgotten artists",
    "most played tracks", "never / rarely played",
}
# (translation key, English name, icon, media type, library query, filter field)
USER_ROWS = [
    ("user_recent_tracks", "Recently played", "mdi-history", "tracks",
     {"order_by": "last_played_desc"}, "last_played"),
    ("user_recent_albums", "Recent albums", "mdi-album", "albums",
     {"order_by": "last_played_desc"}, "last_played"),
    ("user_recent_artists", "Recent artists", "mdi-account-music", "artists",
     {"order_by": "last_played_desc"}, "last_played"),
    ("user_most_played", "Most played tracks", "mdi-trophy", "tracks",
     {"order_by": "play_count_desc"}, "play_count"),
    ("user_favorites", "Your favourites", "mdi-heart", "tracks",
     {"favorite": True, "order_by": "random"}, None),
]
DOMAIN = "kiosk_musicassistant_cards"

GET_TOP_PICKS_SCHEMA = vol.Schema(
    {
        vol.Required("config_entry_id"): cv.string,
        vol.Optional("username"): cv.string,
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
        vol.Optional("refresh", default=False): cv.boolean,
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
        "uri": _portable_uri(uri),
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
    user = call.data.get("username")
    rows = await _async_fetch_rows(mass, None, False)
    serialized: list[list[dict[str, Any]]] = []
    if user:
        serialized = [row["items"] for row in await _async_user_rows(mass, user, limit)]
        rows = [(folder, row) for folder, row in rows if not _is_playlog_row(folder)]
    serialized += [[_serialize_item(mass, raw, folder["name"]) for raw in row] for folder, row in rows]

    items: list[dict[str, Any]] = []
    seen_uris: set[str] = set()
    max_row_length = max((len(row) for row in serialized), default=0)
    for index in range(max_row_length):
        for row in serialized:
            if index >= len(row):
                continue
            item = row[index]
            if item["uri"] in seen_uris:
                continue
            seen_uris.add(item["uri"])
            items.append(item)
            if len(items) == limit:
                return {"items": items}

    # The global recently played list would bring another user's history back.
    if len(items) < limit and not user:
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
    if user:
        result = await _async_user_rows(mass, user, row_limit)
        rows = [(folder, raw_items) for folder, raw_items in rows if not _is_playlog_row(folder)]
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


def _is_playlog_row(folder: dict[str, Any]) -> bool:
    keys = {str(folder.get("name") or "").lower(), str(folder.get("translation_key") or "").replace("_", " ").lower()}
    return bool(keys & PLAYLOG_ROWS)


async def _async_user_rows(mass: Any, user: str, row_limit: int) -> list[dict[str, Any]]:
    """Rows from the library as seen by one Music Assistant user (their own play log)."""

    async def fetch(media: str, query: dict[str, Any], field: str | None) -> list[dict[str, Any]]:
        try:
            raw_items = await _send(
                mass, f"music/{media}/library_items", user, limit=row_limit * 2, **query
            )
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Library %s for %s failed: %s", media, user, err)
            return []
        items: list[dict[str, Any]] = []
        for raw in raw_items if isinstance(raw_items, list) else []:
            # Without a play by this user the sort falls back to library order.
            if field and isinstance(raw, dict) and field in raw and not raw[field]:
                continue
            try:
                items.append(_serialize_item(mass, raw, field or "favorite"))
            except HomeAssistantError:
                continue
            if len(items) == row_limit:
                break
        return items

    answers = await asyncio.gather(*(fetch(media, query, field) for _, _, _, media, query, field in USER_ROWS))
    return [
        {
            "id": f"user/{key}",
            "name": name,
            "translation_key": key,
            "subtitle": None,
            "icon": icon,
            "source": SOURCE_MUSIC_ASSISTANT,
            "items": items,
        }
        for (key, name, icon, _, _, _), items in zip(USER_ROWS, answers)
        if items
    ]


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


async def _async_similar(
    mass: Any, user: str | None, seed: dict[str, Any], timeout: float = SIMILAR_TIMEOUT
) -> list[Any]:
    kwargs = {
        "item_id": seed["item_id"],
        "provider_instance_id_or_domain": seed["provider"],
        "limit": SIMILAR_LIMIT,
        "allow_lookup": True,
    }
    try:
        result = await asyncio.wait_for(
            _send(mass, "music/tracks/similar_tracks", user, **kwargs), timeout
        )
    except TimeoutError:
        # A slow provider must not hold the whole feed back; its answer lands
        # in Music Assistant's cache for the next refresh anyway.
        _LOGGER.debug("Similar tracks for %s timed out", seed)
        return []
    except Exception as err:  # noqa: BLE001
        if not user:
            _LOGGER.debug("Similar tracks for %s failed: %s", seed, err)
            return []
        try:
            result = await asyncio.wait_for(
                mass.send_command("music/tracks/similar_tracks", **kwargs), timeout
            )
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
    for raw_items in answers:
        _remember_tracks(hass, user, raw_items)
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
        params = {
            "entry_id": call.data["config_entry_id"],
            "user": user,
            "spotify_entity": call.data.get("spotify_entity"),
            "row_limit": row_limit,
        }
        rows += await _async_cached_similar_rows(call.hass, params, call.data["refresh"])
    if source in (SOURCE_MUSIC_ASSISTANT, SOURCE_MIXED) or not rows:
        rows += await _async_ma_rows(mass, user, row_limit, call.data["include_hidden"])
    return {"rows": rows}


# ---------- cache ----------
# Building the similar-track rows takes 15-45 s on a cold Music Assistant cache.
# The last result is kept per (MA entry, user, Spotify account, row size) and
# served at once; when it is older than CACHE_TTL it is still served and a
# rebuild runs in the background (stale-while-revalidate). A timer rebuilds
# the feeds that were asked for in the last day, so a kiosk opening Discover
# almost never waits.

def _store(hass: HomeAssistant) -> dict[tuple, dict[str, Any]]:
    return hass.data.setdefault(DATA_CACHE, {})


def _schedule(hass: HomeAssistant, key: tuple, params: dict[str, Any]) -> asyncio.Task:
    entry = _store(hass).setdefault(
        key, {"rows": None, "time": 0.0, "used": time.monotonic(), "task": None, "params": params}
    )
    task = entry["task"]
    if task is not None and not task.done():
        return task

    async def build() -> list[dict[str, Any]]:
        mass = get_music_assistant_client(hass, params["entry_id"])
        rows = await _async_similar_rows(
            hass, mass, params["entry_id"], params["user"], params["spotify_entity"],
            params["row_limit"],
        )
        # An empty rebuild (a provider hiccup) does not wipe a good feed.
        if rows or entry["rows"] is None:
            entry["rows"] = rows
        entry["time"] = time.monotonic()
        entry["wall"] = time.time()
        _async_schedule_save(hass)
        return entry["rows"]

    entry["task"] = hass.async_create_background_task(build(), f"{DOMAIN} recommendations")
    return entry["task"]


async def _async_cached_similar_rows(
    hass: HomeAssistant, params: dict[str, Any], refresh: bool
) -> list[dict[str, Any]]:
    key = tuple(sorted(params.items()))
    entry = _store(hass).get(key)
    now = time.monotonic()
    if entry is not None:
        entry["used"] = now
        if entry["rows"] is not None and not refresh:
            if now - entry["time"] > CACHE_TTL:
                _schedule(hass, key, params)
            return entry["rows"]
    # shield: a client that goes away must not cancel a build others will use.
    return await asyncio.shield(_schedule(hass, key, params))


@callback
def async_keep_warm(hass: HomeAssistant) -> None:
    """Rebuild the feeds used recently before they go stale; forget the others."""
    store = _store(hass)
    now = time.monotonic()
    for key, entry in list(store.items()):
        if now - entry["used"] > KEEP_WARM:
            store.pop(key, None)
        elif now - entry["time"] > CACHE_TTL * 0.8:
            _schedule(hass, key, entry["params"])


# ---------- persistence ----------
# The similar-track feeds survive a restart, so the first Discover after it
# (and the first switch to another music source) is served at once while a
# rebuild runs in the background.

def _async_schedule_save(hass: HomeAssistant) -> None:
    store: Store | None = hass.data.get(DATA_STORE)
    if store is None:
        return

    def data() -> dict[str, Any]:
        feeds = [
            {"params": entry["params"], "rows": entry["rows"], "wall": entry.get("wall", 0)}
            for entry in _store(hass).values()
            if entry["rows"]
        ]
        # Only the tracks shown in a saved feed: the first tap after a restart
        # must not wait for the provider either.
        shown = {
            ((feed["params"].get("user") or ""), item.get("uri"))
            for feed in feeds for row in feed["rows"] for item in row.get("items") or []
        }
        tracks = hass.data.get(DATA_TRACKS, {})
        return {
            "feeds": feeds,
            "tracks": [[user, uri, raw] for (user, uri), raw in tracks.items() if (user, uri) in shown],
        }

    store.async_delay_save(data, STORE_SAVE_DELAY)


async def async_load_cache(hass: HomeAssistant) -> None:
    """Restore the similar-track feeds saved before the last restart."""
    store: Store = Store(hass, STORE_VERSION, f"{DOMAIN}.recommendations")
    hass.data[DATA_STORE] = store
    try:
        saved = await store.async_load() or {}
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Could not load the saved recommendations: %s", err)
        return
    now, wall = time.monotonic(), time.time()
    tracks = hass.data.setdefault(DATA_TRACKS, {})
    for saved_track in saved.get("tracks") or []:
        if isinstance(saved_track, list) and len(saved_track) == 3 and isinstance(saved_track[2], dict):
            tracks[(saved_track[0] or "", saved_track[1])] = saved_track[2]
    for feed in saved.get("feeds") or []:
        age = wall - float(feed.get("wall") or 0)
        params = feed.get("params")
        if not isinstance(params, dict) or not feed.get("rows") or not 0 <= age < KEEP_WARM:
            continue
        key = tuple(sorted(params.items()))
        if "tracks" not in saved:
            age = CACHE_TTL  # saved by an older version: rebuild it to get its tracks
        _store(hass).setdefault(
            key,
            # Marked as used now: the keep-warm timer refreshes it during the next day.
            {"rows": feed["rows"], "time": now - age, "wall": feed["wall"], "used": now,
             "task": None, "params": params},
        )

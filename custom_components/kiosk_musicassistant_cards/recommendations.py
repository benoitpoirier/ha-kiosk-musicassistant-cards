"""Expose Music Assistant's native recommendation feed to the kiosk cards."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import voluptuous as vol
from homeassistant.components.music_assistant.helpers import get_music_assistant_client
from homeassistant.components.music_assistant.schemas import media_item_dict_from_mass_item
from homeassistant.core import ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from music_assistant_models.media_items import media_from_dict

_LOGGER = logging.getLogger(__name__)

TOP_PICKS_LIMIT = 9
MAX_TOP_PICKS_LIMIT = 100
RECENTLY_PLAYED_LIMIT = 12
ROW_LIMIT = 20
MAX_ROW_LIMIT = 50

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


async def async_get_recommendations(call: ServiceCall) -> dict[str, list[dict[str, Any]]]:
    """Return Music Assistant's recommendation rows, each with its own items."""
    mass = get_music_assistant_client(call.hass, call.data["config_entry_id"])
    user = call.data.get("username")
    row_limit = call.data["row_limit"]
    include_hidden = call.data["include_hidden"]
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
                "items": items,
            }
        )
    return {"rows": result}

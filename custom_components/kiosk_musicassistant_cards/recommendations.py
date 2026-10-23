"""Expose Music Assistant's native Top Picks feed to the kiosk cards."""

from __future__ import annotations

import asyncio
from typing import Any

import voluptuous as vol
from homeassistant.components.music_assistant.helpers import get_music_assistant_client
from homeassistant.components.music_assistant.schemas import media_item_dict_from_mass_item
from homeassistant.core import ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from music_assistant_models.media_items import media_from_dict

TOP_PICKS_LIMIT = 9
MAX_TOP_PICKS_LIMIT = 100
RECENTLY_PLAYED_LIMIT = 12

GET_TOP_PICKS_SCHEMA = vol.Schema(
    {
        vol.Required("config_entry_id"): cv.string,
        vol.Optional("limit", default=TOP_PICKS_LIMIT): vol.All(
            cv.positive_int, vol.Range(min=1, max=MAX_TOP_PICKS_LIMIT)
        ),
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
        }
    else:
        item = media_item_dict_from_mass_item(mass, media_from_dict(raw_item))

    name = item.get("name")
    uri = item.get("uri")
    if not isinstance(name, str) or not name or not isinstance(uri, str) or not uri:
        raise HomeAssistantError("Music Assistant returned a recommendation without a name or URI")

    return {
        "name": name,
        "uri": uri,
        "image": item.get("image"),
        "recommendation_reason": reason,
    }


async def async_get_top_picks(call: ServiceCall) -> dict[str, list[dict[str, Any]]]:
    """Return the native feed in the user context of HA's authenticated MA client."""
    mass = get_music_assistant_client(call.hass, call.data["config_entry_id"])
    limit = call.data["limit"]
    folders = await mass.send_command("music/recommendations")
    if not isinstance(folders, list):
        raise HomeAssistantError("Music Assistant returned invalid recommendation rows")

    enabled_folders: list[dict[str, Any]] = []
    for folder in folders:
        if not isinstance(folder, dict):
            raise HomeAssistantError("Music Assistant returned an invalid recommendation row")
        if folder.get("enabled_by_default") is False:
            continue
        if not all(
            isinstance(folder.get(key), str) and folder[key]
            for key in ("provider", "item_id", "name")
        ):
            raise HomeAssistantError("Music Assistant returned an incomplete recommendation row")
        enabled_folders.append(folder)

    row_items = await asyncio.gather(
        *(
            mass.send_command(
                "music/recommendations/items",
                provider=folder["provider"],
                item_id=folder["item_id"],
            )
            for folder in enabled_folders
        )
    )
    if any(not isinstance(items, list) for items in row_items):
        raise HomeAssistantError("Music Assistant returned invalid recommendation items")

    items: list[dict[str, Any]] = []
    seen_uris: set[str] = set()
    max_row_length = max((len(row) for row in row_items), default=0)
    for index in range(max_row_length):
        for folder, row in zip(enabled_folders, row_items):
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

"""Page through a Music Assistant player queue for the now-playing card."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol
from homeassistant.components.music_assistant.helpers import get_music_assistant_client
from homeassistant.components.music_assistant.schemas import media_item_dict_from_mass_item
from homeassistant.core import ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from music_assistant_models.queue_item import QueueItem

_LOGGER = logging.getLogger(__name__)

PAGE_SIZE = 25
MAX_PAGE_SIZE = 100
# Without an offset the first page starts a little before the current track,
# so the list opens on what is playing with the previous tracks just above.
CONTEXT_BEFORE = 2

GET_QUEUE_ITEMS_SCHEMA = vol.Schema(
    {
        vol.Required("config_entry_id"): cv.string,
        vol.Required("queue_id"): cv.string,
        vol.Optional("offset"): vol.All(vol.Coerce(int), vol.Range(min=0)),
        vol.Optional("limit", default=PAGE_SIZE * 2): vol.All(
            vol.Coerce(int), vol.Range(min=1, max=MAX_PAGE_SIZE)
        ),
    }
)


def _serialize(mass: Any, raw: dict[str, Any], index: int) -> dict[str, Any]:
    item = QueueItem.from_dict(raw)
    result: dict[str, Any] = {
        "index": index,
        "queue_item_id": item.queue_item_id,
        "name": item.name,
        "duration": item.duration,
        "artist": None,
        "image": None,
    }
    if item.media_item is not None:
        media = media_item_dict_from_mass_item(mass, item.media_item)
        result["name"] = media.get("name") or item.name
        result["image"] = media.get("image")
        artists = [a.get("name") for a in media.get("artists") or [] if isinstance(a, dict)]
        result["artist"] = ", ".join([a for a in artists if a][:2]) or None
    if not result["image"] and item.image is not None:
        try:
            result["image"] = mass.get_media_item_image_url(item)
        except Exception:  # noqa: BLE001
            result["image"] = None
    return result


async def async_get_queue_items(call: ServiceCall) -> dict[str, Any]:
    """Return one window of a queue, with the queue's size and current position."""
    mass = get_music_assistant_client(call.hass, call.data["config_entry_id"])
    queue_id = call.data["queue_id"]
    # The client keeps every queue up to date from server events: no request needed.
    queue = mass.player_queues.get(queue_id)
    if queue is None:
        raise HomeAssistantError(f"Unknown Music Assistant queue: {queue_id}")
    current = queue.current_index
    total = queue.items
    offset = call.data.get("offset")
    if offset is None:
        offset = max(0, (current or 0) - CONTEXT_BEFORE)
    raw_items = await mass.send_command(
        "player_queues/items", queue_id=queue_id, limit=call.data["limit"], offset=offset
    )
    if not isinstance(raw_items, list):
        raise HomeAssistantError("Music Assistant returned invalid queue items")
    items = [
        _serialize(mass, raw, offset + position)
        for position, raw in enumerate(raw_items)
        if isinstance(raw, dict)
    ]
    return {
        "queue_id": queue_id,
        "current_index": current,
        "total": total,
        "offset": offset,
        "items": items,
    }

# ---------- play a list of tracks ----------
# Music Assistant resolves every uri of a play_media call before it starts, so
# a list of 100 tracks can take a minute. The tapped track is started alone
# (replace: it plays at once, at the top of a new queue); the rest of the list
# is then appended by Home Assistant in the background - a handful first so
# "next" works right away. The kiosk card closing does not stop that.
FIRST_BATCH = 5

PLAY_TRACKS_SCHEMA = vol.Schema(
    {
        vol.Required("entity_id"): cv.entity_id,
        vol.Required("uris"): vol.All(cv.ensure_list, [cv.string], vol.Length(min=1, max=500)),
        vol.Optional("username"): cv.string,
    }
)


async def async_play_tracks(call: ServiceCall) -> None:
    """Play the first uri now, then queue the others after it."""
    hass = call.hass
    uris = call.data["uris"]
    target = {"entity_id": call.data["entity_id"]}
    extra = {"username": call.data["username"]} if call.data.get("username") else {}

    async def play(media_id: str | list[str], enqueue: str) -> None:
        await hass.services.async_call(
            "music_assistant", "play_media",
            {"media_id": media_id, "enqueue": enqueue, **extra}, target=target, blocking=True,
        )

    await play(uris[0], "replace")
    rest = uris[1:]
    if not rest:
        return

    async def append() -> None:
        try:
            for batch in (rest[:FIRST_BATCH], rest[FIRST_BATCH:]):
                if batch:
                    await play(batch, "add")
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Could not queue the rest of the list: %s", err)

    hass.async_create_background_task(append(), "kiosk_musicassistant_cards queue tracks")

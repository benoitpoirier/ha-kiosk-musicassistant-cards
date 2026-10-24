"""Page through a Music Assistant player queue for the now-playing card."""

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
from homeassistant.helpers import entity_registry as er
from music_assistant_models.queue_item import QueueItem

from .recommendations import _async_similar, _portable_uri, _seed_from_uri

_LOGGER = logging.getLogger(__name__)

PAGE_SIZE = 25
MAX_PAGE_SIZE = 100
# Without an offset the first page starts at the current track: played tracks
# are not listed.
CONTEXT_BEFORE = 0

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
# is then appended by Home Assistant in the background, in small batches, so
# the kiosk card closing does not stop it.
#
# Taps in quick succession: requests for one player run one at a time (a lock),
# and each new request bumps a generation number. The background append checks
# it before every batch and stops when a newer list was started, so the queue
# only ever holds the latest list. A batch already sent to Music Assistant is
# let finish (cancelling it locally would not stop the server from appending
# it to the new queue), which is why batches stay small.
FIRST_BATCH = 5
MAX_SKIPS = 4
BATCH = 10
DATA_PLAY = "kiosk_musicassistant_cards_play"

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
    entity_id = call.data["entity_id"]
    uris = call.data["uris"]
    extra = {"username": call.data["username"]} if call.data.get("username") else {}
    players = hass.data.setdefault(DATA_PLAY, {})
    player = players.setdefault(entity_id, {"lock": asyncio.Lock(), "generation": 0})
    player["generation"] += 1
    generation = player["generation"]

    async def play(media_id: str | list[str], enqueue: str) -> None:
        await hass.services.async_call(
            "music_assistant", "play_media",
            {"media_id": media_id, "enqueue": enqueue, **extra},
            target={"entity_id": entity_id}, blocking=True,
        )

    # A track that cannot be played (gone, region-locked, an account the user
    # may not use) must not stop the list: start the first one that plays.
    started = None
    first_error: Exception | None = None
    async with player["lock"]:
        if generation != player["generation"]:
            return  # an even newer tap is waiting: it wins
        for index, uri in enumerate(uris[:MAX_SKIPS + 1]):
            try:
                await play(uri, "replace")
            except HomeAssistantError as err:
                _LOGGER.debug("Skipping %s: %s", uri, err)
                first_error = first_error or err
                continue
            started = index
            break
    if started is None:
        raise first_error or HomeAssistantError("Nothing in the list could be played")
    rest = uris[started + 1:]
    if not rest:
        return

    async def append() -> None:
        batches = [rest[:FIRST_BATCH]] + [
            rest[index:index + BATCH] for index in range(FIRST_BATCH, len(rest), BATCH)
        ]
        for batch in batches:
            async with player["lock"]:
                if generation != player["generation"]:
                    return
                try:
                    await play(batch, "add")
                except HomeAssistantError:
                    # One bad uri fails the whole batch: add them one by one.
                    for uri in batch:
                        try:
                            await play(uri, "add")
                        except HomeAssistantError as err:
                            _LOGGER.debug("Skipping %s: %s", uri, err)
                except Exception as err:  # noqa: BLE001
                    _LOGGER.warning("Could not queue the rest of the list on %s: %s", entity_id, err)
                    return

    hass.async_create_background_task(append(), "kiosk_musicassistant_cards queue tracks")

# ---------- play one track now ----------
# Tapping a track replaces the track that is playing and leaves the rest of
# the queue as it is: Music Assistant inserts the new track after the current
# one and starts it (enqueue "play"); the track that was playing is then
# removed from the queue. Only albums and playlists replace the whole queue.
PLAY_NOW_SCHEMA = vol.Schema(
    {
        vol.Required("entity_id"): cv.entity_id,
        vol.Required("uri"): cv.string,
        vol.Optional("username"): cv.string,
        vol.Optional("autofill_similar", default=False): cv.boolean,
    }
)

# Similar tracks are added once the track plays, never before: looking them up
# can take seconds and must not delay the start of playback.
AUTOFILL_COUNT = 10
AUTOFILL_WAIT = 30
AUTOFILL_SETTLE = 2


async def async_play_now(call: ServiceCall) -> None:
    """Play a track at once in place of the current one, keeping the queue."""
    hass = call.hass
    entity_id = call.data["entity_id"]
    extra = {"username": call.data["username"]} if call.data.get("username") else {}
    players = hass.data.setdefault(DATA_PLAY, {})
    player = players.setdefault(entity_id, {"lock": asyncio.Lock(), "generation": 0})
    player["generation"] += 1  # also stops the background append of play_tracks
    generation = player["generation"]

    entry = er.async_get(hass).async_get(entity_id)
    mass = get_music_assistant_client(hass, entry.config_entry_id) if entry and entry.config_entry_id else None
    state = hass.states.get(entity_id)
    queue_id = state.attributes.get("active_queue") if state else None

    previous = None
    async with player["lock"]:
        if generation != player["generation"]:
            return  # an even newer tap is waiting: it wins
        if mass is not None and queue_id:
            queue = mass.player_queues.get(queue_id)
            if queue is not None and queue.current_item is not None:
                previous = queue.current_item.queue_item_id
        await hass.services.async_call(
            "music_assistant", "play_media",
            {"media_id": call.data["uri"], "enqueue": "play", **extra},
            target={"entity_id": entity_id}, blocking=True,
        )
    if previous is not None:
        # Cleanup must not delay the response or the next tap, so it runs after the lock.
        hass.async_create_background_task(
            _remove_previous_item(mass, queue_id, previous),
            "kiosk_musicassistant_cards remove previous track",
        )
    if call.data["autofill_similar"] and mass is not None:
        hass.async_create_background_task(
            _autofill_similar(hass, mass, entity_id, call.data["uri"], extra, player, generation),
            "kiosk_musicassistant_cards autofill similar",
        )


async def _autofill_similar(
    hass: Any, mass: Any, entity_id: str, uri: str, extra: dict[str, str],
    player: dict[str, Any], generation: int,
) -> None:
    """Queue tracks similar to `uri` when it is alone in the queue, once it plays."""
    seed = _seed_from_uri(uri, "", None)
    if seed is None:
        return  # albums, playlists and radio stations bring their own queue
    queue_id = None
    for _ in range(AUTOFILL_WAIT):
        if generation != player["generation"]:
            return
        state = hass.states.get(entity_id)
        if state is not None and state.state == "playing":
            queue_id = state.attributes.get("active_queue")
            break
        await asyncio.sleep(1)
    if not queue_id:
        return
    # Lets the replaced track leave the queue before counting.
    await asyncio.sleep(AUTOFILL_SETTLE)
    queue = mass.player_queues.get(queue_id)
    if generation != player["generation"] or queue is None or (queue.items or 0) > 1:
        return
    try:
        raw_items = await _async_similar(mass, extra.get("username"), seed)
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Similar tracks for %s failed: %s", uri, err)
        return
    uris: list[str] = []
    for raw in raw_items:
        similar = _portable_uri(raw.get("uri") or "") if isinstance(raw, dict) else ""
        if similar and similar != _portable_uri(uri) and similar not in uris:
            uris.append(similar)
        if len(uris) == AUTOFILL_COUNT:
            break
    if not uris:
        return
    async with player["lock"]:
        # A newer tap, or tracks added meanwhile, make the suggestion obsolete.
        if generation != player["generation"] or (queue.items or 0) > 1:
            return
        try:
            await hass.services.async_call(
                "music_assistant", "play_media",
                {"media_id": uris, "enqueue": "add", **extra},
                target={"entity_id": entity_id}, blocking=True,
            )
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Could not queue similar tracks on %s: %s", entity_id, err)


async def _remove_previous_item(mass: Any, queue_id: str, item_id: str) -> None:
    """Drop the track that was replaced; retry once while it is still the current item."""
    for attempt in range(2):
        try:
            await mass.send_command(
                "player_queues/delete_item", queue_id=queue_id, item_id_or_index=item_id
            )
            return
        except Exception as err:  # noqa: BLE001
            if attempt:
                _LOGGER.debug("Could not remove the previous track from %s: %s", queue_id, err)
            else:
                await asyncio.sleep(1)

# ---------- remove a track from the queue ----------
REMOVE_QUEUE_ITEM_SCHEMA = vol.Schema(
    {
        vol.Required("entity_id"): cv.entity_id,
        vol.Required("queue_item_id"): cv.string,
    }
)


async def async_remove_queue_item(call: ServiceCall) -> None:
    """Remove one item from the active queue of a Music Assistant player."""
    hass = call.hass
    entity_id = call.data["entity_id"]
    entry = er.async_get(hass).async_get(entity_id)
    if entry is None or not entry.config_entry_id:
        raise HomeAssistantError(f"{entity_id} is not a Music Assistant player")
    mass = get_music_assistant_client(hass, entry.config_entry_id)
    state = hass.states.get(entity_id)
    queue_id = state.attributes.get("active_queue") if state else None
    if not queue_id:
        raise HomeAssistantError(f"{entity_id} has no active queue")
    await mass.send_command(
        "player_queues/delete_item", queue_id=queue_id, item_id_or_index=call.data["queue_item_id"]
    )

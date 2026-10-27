"""Page through a Music Assistant player queue for the now-playing card."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import voluptuous as vol
from homeassistant.auth.permissions.const import POLICY_CONTROL
from homeassistant.components.music_assistant.helpers import get_music_assistant_client
from homeassistant.components.music_assistant.schemas import media_item_dict_from_mass_item
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError, Unauthorized
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er
from music_assistant_models.enums import QueueOption
from music_assistant_models.errors import MusicAssistantError
from music_assistant_models.queue_item import QueueItem

from .recommendations import (
    _async_similar,
    _portable_uri,
    _remember_tracks,
    _seed_from_uri,
    async_playable_track,
    remembered_track,
)

try:
    from homeassistant.components.music_assistant.helpers import user_from_context
except ImportError:  # older Home Assistant: Music Assistant plays as its own user
    user_from_context = None

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

# ---------- playing through Music Assistant ----------
# Playback is sent straight to Music Assistant with Home Assistant's
# authenticated client, as music_assistant.play_media does, minus its check of
# every uri (one more provider request per track, slow under Spotify's rate
# limit). Tracks of the discovery feeds are sent as full objects: Music
# Assistant then starts them without asking the provider anything.

async def _async_check_control(call: ServiceCall, entity_id: str) -> None:
    """The caller must be allowed to control the player, as for its own services."""
    user_id = call.context.user_id
    if user_id is None:
        return
    user = await call.hass.auth.async_get_user(user_id)
    if user is None or not user.permissions.check_entity(entity_id, POLICY_CONTROL):
        raise Unauthorized(context=call.context, entity_id=entity_id, permission=POLICY_CONTROL)


def _player(hass: HomeAssistant, entity_id: str) -> tuple[Any, str]:
    entry = er.async_get(hass).async_get(entity_id)
    if entry is None or entry.platform != "music_assistant" or not entry.config_entry_id:
        raise HomeAssistantError(f"{entity_id} is not a Music Assistant player")
    return get_music_assistant_client(hass, entry.config_entry_id), entry.unique_id


def _queue_id(mass: Any, player_id: str) -> str:
    """The queue Home Assistant would play on: the player's active source, else its own."""
    player = mass.players.get(player_id)
    if player is not None and player.active_source and mass.player_queues.get(player.active_source):
        return player.active_source
    return player_id


def _ma_user(call: ServiceCall) -> Any:
    """The Music Assistant user to play as: the one asked for, else the calling HA user."""
    if call.data.get("username"):
        return call.data["username"]
    return user_from_context(call.context) if user_from_context else None


async def _async_media(hass: HomeAssistant, mass: Any, user: Any, uris: list[str]) -> list[Any]:
    username = user if isinstance(user, str) else None
    media: list[Any] = []
    for uri in uris:
        raw = remembered_track(hass, username, uri)
        track = await async_playable_track(hass, mass, username, raw) if raw else None
        media.append(track or uri)
    return media


async def _async_play(mass: Any, queue_id: str, media: list[Any], option: QueueOption, user: Any) -> None:
    try:
        await mass.player_queues.play_media(queue_id, media=media, option=option, user=user)
    except MusicAssistantError as err:
        raise HomeAssistantError(str(err) or err.__class__.__name__) from err


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
    await _async_check_control(call, entity_id)
    mass, player_id = _player(hass, entity_id)
    user = _ma_user(call)
    players = hass.data.setdefault(DATA_PLAY, {})
    player = players.setdefault(entity_id, {"lock": asyncio.Lock(), "generation": 0})
    player["generation"] += 1
    generation = player["generation"]

    async def play(batch: list[str], option: QueueOption) -> None:
        media = await _async_media(hass, mass, user, batch)
        await _async_play(mass, _queue_id(mass, player_id), media, option, user)

    # A track that cannot be played (gone, region-locked, an account the user
    # may not use) must not stop the list: start the first one that plays.
    started = None
    first_error: Exception | None = None
    async with player["lock"]:
        if generation != player["generation"]:
            return  # an even newer tap is waiting: it wins
        for index, uri in enumerate(uris[:MAX_SKIPS + 1]):
            try:
                await play([uri], QueueOption.REPLACE)
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
                    await play(batch, QueueOption.ADD)
                except HomeAssistantError:
                    # One bad uri fails the whole batch: add them one by one.
                    for uri in batch:
                        try:
                            await play([uri], QueueOption.ADD)
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
# A cold similar-tracks lookup can take far longer than the discovery rows allow.
AUTOFILL_LOOKUP_TIMEOUT = 45


async def async_play_now(call: ServiceCall) -> None:
    """Play a track at once in place of the current one, keeping the queue."""
    hass = call.hass
    entity_id = call.data["entity_id"]
    await _async_check_control(call, entity_id)
    mass, player_id = _player(hass, entity_id)
    user = _ma_user(call)
    players = hass.data.setdefault(DATA_PLAY, {})
    player = players.setdefault(entity_id, {"lock": asyncio.Lock(), "generation": 0})
    player["generation"] += 1  # also stops the background append of play_tracks
    generation = player["generation"]

    media = await _async_media(hass, mass, user, [call.data["uri"]])
    previous = None
    async with player["lock"]:
        if generation != player["generation"]:
            return  # an even newer tap is waiting: it wins
        queue_id = _queue_id(mass, player_id)
        queue = mass.player_queues.get(queue_id)
        if queue is not None and queue.current_item is not None:
            previous = queue.current_item.queue_item_id
        await _async_play(mass, queue_id, media, QueueOption.PLAY, user)
    if previous is not None:
        # Cleanup must not delay the response or the next tap, so it runs after the lock.
        hass.async_create_background_task(
            _remove_previous_item(mass, queue_id, previous),
            "kiosk_musicassistant_cards remove previous track",
        )
    if call.data["autofill_similar"]:
        hass.async_create_background_task(
            _autofill_similar(hass, mass, entity_id, queue_id, user, player, generation),
            "kiosk_musicassistant_cards autofill similar",
        )


async def _autofill_similar(
    hass: Any, mass: Any, entity_id: str, queue_id: str, user: Any,
    player: dict[str, Any], generation: int,
) -> None:
    """Once the tapped track plays, queue similar tracks if nothing follows it."""
    for _ in range(AUTOFILL_WAIT):
        await asyncio.sleep(1)
        if generation != player["generation"]:
            return
        queue = mass.player_queues.get(queue_id)
        if queue is not None and queue.state == "playing" and queue.current_item is not None:
            await _async_queue_similar(hass, mass, entity_id, queue_id, user)
            return
    _LOGGER.debug("Autofill on %s: the player never started", entity_id)


async def _async_queue_similar(hass: Any, mass: Any, entity_id: str, queue_id: str, user: Any) -> None:
    """Queue tracks similar to the current one when it is the last of the queue."""
    queue = mass.player_queues.get(queue_id)
    if queue is None or queue.current_item is None:
        return
    repeat = getattr(queue.repeat_mode, "value", queue.repeat_mode)
    if repeat not in (None, "off"):
        return  # a repeating queue never runs out
    if (queue.items or 0) - (queue.current_index or 0) > 1:
        return
    uri = getattr(queue.current_item.media_item, "uri", None)
    seed = _seed_from_uri(uri, "", None) if uri else None
    if seed is None:
        return  # radio stations and other non-track items have no similar tracks
    done = hass.data.setdefault(DATA_AUTOFILL, {})
    item_id = queue.current_item.queue_item_id
    if done.get(entity_id) == item_id:
        return  # already filled for this track
    done[entity_id] = item_id
    username = user if isinstance(user, str) else None
    try:
        raw_items = await _async_similar(mass, username, seed, AUTOFILL_LOOKUP_TIMEOUT)
        if not raw_items:
            # A cold lookup can outlast the timeout; its answer is then cached.
            raw_items = await _async_similar(mass, username, seed, AUTOFILL_LOOKUP_TIMEOUT)
    except Exception as err:  # noqa: BLE001
        done.pop(entity_id, None)
        _LOGGER.warning("Similar tracks for %s failed: %s", uri, err)
        return
    _remember_tracks(hass, username, raw_items)
    uris: list[str] = []
    for raw in raw_items:
        similar = _portable_uri(raw.get("uri") or "") if isinstance(raw, dict) else ""
        if similar and similar != _portable_uri(uri) and similar not in uris:
            uris.append(similar)
        if len(uris) == AUTOFILL_COUNT:
            break
    if not uris:
        done.pop(entity_id, None)  # let a later request retry
        _LOGGER.warning("Autofill on %s: no similar tracks for %s", entity_id, uri)
        return
    # Full tracks: adding them asks the provider nothing.
    media = await _async_media(hass, mass, user, uris)
    players = hass.data.setdefault(DATA_PLAY, {})
    player = players.setdefault(entity_id, {"lock": asyncio.Lock(), "generation": 0})
    async with player["lock"]:
        # The track may have changed or the queue grown while looking up.
        queue = mass.player_queues.get(queue_id)
        current = queue.current_item if queue is not None else None
        if current is None or current.queue_item_id != item_id:
            done.pop(entity_id, None)
            return
        if (queue.items or 0) - (queue.current_index or 0) > 1:
            return
        try:
            await _async_play(mass, queue_id, media, QueueOption.ADD, user)
            _LOGGER.info("Autofill on %s: queued %d similar tracks for %s", entity_id, len(uris), uri)
        except Exception as err:  # noqa: BLE001
            done.pop(entity_id, None)
            _LOGGER.warning("Could not queue similar tracks on %s: %s", entity_id, err)


# ---------- keep the queue going ----------
# When the track that plays is the last one of the queue, queue 10 tracks
# similar to it. A card asks once per playing track; the checks are done here,
# on the live queue, so a card that sends a stale request changes nothing.
AUTOFILL_QUEUE_SCHEMA = vol.Schema(
    {
        vol.Required("entity_id"): cv.entity_id,
        vol.Optional("username"): cv.string,
    }
)
DATA_AUTOFILL = "kiosk_musicassistant_cards_autofill"


async def async_autofill_queue(call: ServiceCall) -> None:
    """Queue similar tracks when the current track is the last one of the queue."""
    hass = call.hass
    entity_id = call.data["entity_id"]
    state = hass.states.get(entity_id)
    if state is None or state.state != "playing":
        return
    await _async_check_control(call, entity_id)
    mass, player_id = _player(hass, entity_id)
    await _async_queue_similar(hass, mass, entity_id, _queue_id(mass, player_id), _ma_user(call))


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

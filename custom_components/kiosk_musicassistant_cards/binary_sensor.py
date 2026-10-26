"""Binary sensor: is Music Assistant playing music on any real player?

Kiosk automations used to watch a few media_player entities by id. Music
Assistant re-creates players under new ids (a universal player replacing the
HEOS one, for instance), which silently broke them. This sensor asks Music
Assistant itself, so it follows every player whatever its Home Assistant id.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.components.music_assistant.helpers import get_music_assistant_client
from homeassistant.config_entries import ConfigEntry, ConfigEntryState
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_time_interval
from music_assistant_models.enums import EventType

from .const import DOMAIN

# protocol players are wrapped by a universal player; displays, lights and
# sources do not play audio.
PLAYABLE_TYPES = {"player", "stereo_pair", "group"}
PLAYER_EVENTS = (EventType.PLAYER_ADDED, EventType.PLAYER_UPDATED, EventType.PLAYER_REMOVED)
# Picks up a Music Assistant client re-created by a reload of its integration.
CLIENT_CHECK = timedelta(seconds=60)


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    async_add_entities([MusicPlayingSensor(entry)])


def _value(value: Any) -> str:
    return str(getattr(value, "value", value) or "")


class MusicPlayingSensor(BinarySensorEntity):
    """On while at least one playable Music Assistant player is playing."""

    _attr_has_entity_name = True
    _attr_translation_key = "music_playing"
    _attr_icon = "mdi:music"
    _attr_should_poll = False

    def __init__(self, entry: ConfigEntry) -> None:
        self._attr_unique_id = f"{entry.entry_id}_music_playing"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)}, name="Kiosk Music Assistant Cards"
        )
        self._mass: Any = None
        self._unsubscribe: Any = None

    async def async_added_to_hass(self) -> None:
        self._connect()
        self.async_on_remove(
            async_track_time_interval(self.hass, self._check_client, CLIENT_CHECK)
        )
        self.async_on_remove(self._disconnect)

    @callback
    def _find_client(self) -> Any:
        for ma_entry in self.hass.config_entries.async_entries("music_assistant"):
            if ma_entry.state is ConfigEntryState.LOADED:
                try:
                    return get_music_assistant_client(self.hass, ma_entry.entry_id)
                except Exception:  # noqa: BLE001
                    continue
        return None

    @callback
    def _connect(self) -> None:
        self._disconnect()
        self._mass = self._find_client()
        if self._mass is not None:
            self._unsubscribe = self._mass.subscribe(self._on_event, PLAYER_EVENTS)
        self._refresh()

    @callback
    def _disconnect(self) -> None:
        if self._unsubscribe is not None:
            self._unsubscribe()
            self._unsubscribe = None

    @callback
    def _check_client(self, _now: Any = None) -> None:
        if self._find_client() is not self._mass:
            self._connect()
        else:
            self._refresh()

    @callback
    def _on_event(self, _event: Any) -> None:
        self._refresh()

    @callback
    def _refresh(self) -> None:
        mass = self._mass
        connected = mass is not None and bool(getattr(mass.connection, "connected", False))
        playing: list[Any] = []
        if connected:
            for player in mass.players:
                if (
                    _value(player.type) in PLAYABLE_TYPES
                    and player.available
                    and getattr(player, "enabled", True)
                    and _value(player.playback_state) == "playing"
                ):
                    playing.append(player)
        registry = er.async_get(self.hass)
        attributes = {
            "players": [player.name for player in playing],
            "player_ids": [player.player_id for player in playing],
            "entity_ids": [
                entity_id
                for player in playing
                if (entity_id := registry.async_get_entity_id(
                    "media_player", "music_assistant", player.player_id
                ))
            ],
        }
        is_on = bool(playing)
        if (
            connected == self._attr_available
            and is_on == self._attr_is_on
            and attributes == self._attr_extra_state_attributes
        ):
            return
        self._attr_available = connected
        self._attr_is_on = is_on
        self._attr_extra_state_attributes = attributes
        if self.hass is not None and self.entity_id:
            self.async_write_ha_state()

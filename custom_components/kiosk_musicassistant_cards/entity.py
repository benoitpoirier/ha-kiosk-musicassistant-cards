"""Base for entities that follow Music Assistant's own player list.

Music Assistant re-creates players under new ids (Home Assistant entity ids
and Music Assistant player ids alike), so these entities read the players from
the Music Assistant client instead of watching fixed media_player entities.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from homeassistant.components.music_assistant.helpers import get_music_assistant_client
from homeassistant.config_entries import ConfigEntry, ConfigEntryState
from homeassistant.core import callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity import Entity
from homeassistant.helpers.event import async_track_time_interval
from music_assistant_models.enums import EventType

from .const import DOMAIN

# protocol players are wrapped by a universal player; displays, lights and
# sources do not play audio.
PLAYABLE_TYPES = {"player", "stereo_pair", "group"}
PLAYER_EVENTS = (EventType.PLAYER_ADDED, EventType.PLAYER_UPDATED, EventType.PLAYER_REMOVED)
# Picks up a re-created Music Assistant client and late Home Assistant entities.
CLIENT_CHECK = timedelta(seconds=60)


def enum_value(value: Any) -> str:
    return str(getattr(value, "value", value) or "")


class MusicAssistantPlayersEntity(Entity):
    """Calls `_update` whenever Music Assistant's player list may have changed."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, entry: ConfigEntry, key: str) -> None:
        self._attr_unique_id = f"{entry.entry_id}_{key}"
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
        players = [
            player
            for player in (mass.players if connected else [])
            if enum_value(player.type) in PLAYABLE_TYPES and getattr(player, "enabled", True)
        ]
        if self._update(connected, players) and self.hass is not None and self.entity_id:
            self.async_write_ha_state()

    @callback
    def _entity_id(self, player: Any) -> str | None:
        return er.async_get(self.hass).async_get_entity_id(
            "media_player", "music_assistant", player.player_id
        )

    @callback
    def _update(self, connected: bool, players: list[Any]) -> bool:
        """Set the new state from the playable players; return True when it changed."""
        raise NotImplementedError

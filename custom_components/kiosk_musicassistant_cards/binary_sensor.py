"""Binary sensor: is Music Assistant playing music on any real player?

Kiosk automations used to watch a few media_player entities by id. Music
Assistant re-creates players under new ids (a universal player replacing the
HEOS one, for instance), which silently broke them. This sensor asks Music
Assistant itself, so it follows every player whatever its Home Assistant id.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .entity import MusicAssistantPlayersEntity, enum_value


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    async_add_entities([MusicPlayingSensor(entry)])


class MusicPlayingSensor(MusicAssistantPlayersEntity, BinarySensorEntity):
    """On while at least one playable Music Assistant player is playing."""

    _attr_translation_key = "music_playing"
    _attr_icon = "mdi:music"

    def __init__(self, entry: ConfigEntry) -> None:
        super().__init__(entry, "music_playing")

    @callback
    def _update(self, connected: bool, players: list[Any]) -> bool:
        playing = [
            player
            for player in players
            if player.available and enum_value(player.playback_state) == "playing"
        ]
        attributes = {
            "players": [player.name for player in playing],
            "player_ids": [player.player_id for player in playing],
            "entity_ids": [
                entity_id for player in playing if (entity_id := self._entity_id(player))
            ],
        }
        is_on = bool(playing)
        if (
            connected == self._attr_available
            and is_on == self._attr_is_on
            and attributes == self._attr_extra_state_attributes
        ):
            return False
        self._attr_available = connected
        self._attr_is_on = is_on
        self._attr_extra_state_attributes = attributes
        return True

"""Sensor that publishes Music Assistant's players to the cards.

The cards store a player by its Music Assistant name, the only name that
survives a re-created player, and look up its current entity id here.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .entity import MusicAssistantPlayersEntity, enum_value

# The cards find the sensor through this attribute, whatever its entity id.
CARD_ROLE = "ma_players"


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    async_add_entities([MusicAssistantPlayersSensor(entry)])


class MusicAssistantPlayersSensor(MusicAssistantPlayersEntity, SensorEntity):
    """Number of playable Music Assistant players, with their current entity ids."""

    _attr_translation_key = "ma_players"
    _attr_icon = "mdi:speaker-multiple"
    _unrecorded_attributes = frozenset({"players"})

    def __init__(self, entry: ConfigEntry) -> None:
        super().__init__(entry, "ma_players")
        self._attr_extra_state_attributes = {"kiosk_card_role": CARD_ROLE, "players": []}

    @callback
    def _update(self, connected: bool, players: list[Any]) -> bool:
        listed = sorted(
            (
                {
                    "name": player.name,
                    "player_id": player.player_id,
                    "entity_id": self._entity_id(player),
                    "type": enum_value(player.type),
                    "available": bool(player.available),
                }
                for player in players
            ),
            key=lambda item: (str(item["name"]).lower(), str(item["player_id"])),
        )
        attributes = {"kiosk_card_role": CARD_ROLE, "players": listed}
        value = len(listed) if connected else None
        if (
            connected == self._attr_available
            and value == self._attr_native_value
            and attributes == self._attr_extra_state_attributes
        ):
            return False
        self._attr_available = connected
        self._attr_native_value = value
        self._attr_extra_state_attributes = attributes
        return True

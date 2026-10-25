"""Switch that hides the buttons of the now-playing card."""

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from .const import DOMAIN

# The card finds the switch through this attribute, whatever its entity id.
CARD_ROLE = "hide_controls"


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    async_add_entities([HideControlsSwitch(entry)])


class HideControlsSwitch(SwitchEntity, RestoreEntity):
    """On: the now-playing card hides all its buttons. Off (default): it shows them."""

    _attr_has_entity_name = True
    _attr_translation_key = "hide_controls"
    _attr_icon = "mdi:gesture-tap-button"
    _attr_should_poll = False
    _attr_is_on = False

    def __init__(self, entry: ConfigEntry) -> None:
        self._attr_unique_id = f"{entry.entry_id}_hide_controls"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)}, name="Kiosk Music Assistant Cards"
        )
        self._attr_extra_state_attributes = {"kiosk_card_role": CARD_ROLE}

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        if (last := await self.async_get_last_state()) is not None:
            self._attr_is_on = last.state == "on"

    async def async_turn_on(self, **kwargs) -> None:
        self._attr_is_on = True
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs) -> None:
        self._attr_is_on = False
        self.async_write_ha_state()

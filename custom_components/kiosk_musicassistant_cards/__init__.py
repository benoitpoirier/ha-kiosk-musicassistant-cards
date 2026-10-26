"""Kiosk Music Assistant Cards for Home Assistant."""

from datetime import timedelta
from pathlib import Path

import voluptuous as vol
from homeassistant.components.frontend import add_extra_js_url, remove_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.music_assistant.helpers import get_music_assistant_client
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.loader import async_get_integration
from music_assistant_models.media_items import Track

from .const import CARD_URL, DOMAIN, STATIC_URL
from .queue import (
    AUTOFILL_QUEUE_SCHEMA,
    GET_QUEUE_ITEMS_SCHEMA,
    PLAY_NOW_SCHEMA,
    PLAY_TRACKS_SCHEMA,
    REMOVE_QUEUE_ITEM_SCHEMA,
    async_autofill_queue,
    async_get_queue_items,
    async_play_now,
    async_play_tracks,
    async_remove_queue_item,
)
from .recommendations import (
    GET_RECOMMENDATIONS_SCHEMA,
    GET_TOP_PICKS_SCHEMA,
    async_get_recommendations,
    async_get_top_picks,
    async_keep_warm,
    async_load_cache,
)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
PLATFORMS = [Platform.SWITCH]

WWW_PATH = Path(__file__).parent / "www"
SERVICE_GET_TRACK_LYRICS = "get_track_lyrics"
SERVICE_GET_TOP_PICKS = "get_top_picks"
SERVICE_GET_RECOMMENDATIONS = "get_recommendations"
SERVICE_GET_QUEUE_ITEMS = "get_queue_items"
SERVICE_PLAY_TRACKS = "play_tracks"
SERVICE_PLAY_NOW = "play_now"
SERVICE_REMOVE_QUEUE_ITEM = "remove_queue_item"
SERVICE_AUTOFILL_QUEUE = "autofill_queue"


async def _async_get_track_lyrics(call: ServiceCall) -> dict[str, str | None]:
    mass = get_music_assistant_client(call.hass, call.data["config_entry_id"])
    item = await mass.music.get_item_by_uri(call.data["uri"])
    if not isinstance(item, Track):
        return {"lyrics": None, "lrc_lyrics": None}
    lyrics, lrc_lyrics = await mass.send_command("metadata/get_track_lyrics", track=item)
    return {"lyrics": lyrics, "lrc_lyrics": lrc_lyrics}


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    await hass.http.async_register_static_paths(
        [StaticPathConfig(STATIC_URL, str(WWW_PATH), cache_headers=False)]
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_GET_TRACK_LYRICS,
        _async_get_track_lyrics,
        schema=vol.Schema(
            {
                vol.Required("config_entry_id"): cv.string,
                vol.Required("uri"): cv.string,
            }
        ),
        supports_response=SupportsResponse.ONLY,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_GET_TOP_PICKS,
        async_get_top_picks,
        schema=GET_TOP_PICKS_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_GET_RECOMMENDATIONS,
        async_get_recommendations,
        schema=GET_RECOMMENDATIONS_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_GET_QUEUE_ITEMS,
        async_get_queue_items,
        schema=GET_QUEUE_ITEMS_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )
    hass.services.async_register(
        DOMAIN, SERVICE_PLAY_TRACKS, async_play_tracks, schema=PLAY_TRACKS_SCHEMA
    )
    hass.services.async_register(DOMAIN, SERVICE_PLAY_NOW, async_play_now, schema=PLAY_NOW_SCHEMA)
    hass.services.async_register(
        DOMAIN, SERVICE_AUTOFILL_QUEUE, async_autofill_queue, schema=AUTOFILL_QUEUE_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_REMOVE_QUEUE_ITEM, async_remove_queue_item, schema=REMOVE_QUEUE_ITEM_SCHEMA
    )

    await async_load_cache(hass)

    async def _keep_warm(_now) -> None:
        async_keep_warm(hass)

    async_track_time_interval(hass, _keep_warm, timedelta(minutes=10))
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    integration = await async_get_integration(hass, DOMAIN)
    # The version query string makes browsers fetch the new card after an update.
    url = f"{CARD_URL}?v={integration.version}"
    hass.data[DOMAIN] = url
    add_extra_js_url(hass, url)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    remove_extra_js_url(hass, hass.data.pop(DOMAIN, CARD_URL))
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)

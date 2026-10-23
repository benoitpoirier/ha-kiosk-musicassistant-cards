# Kiosk Music Assistant Cards

Kiosk Music Assistant Cards for Home Assistant.

Touch-first Lovelace cards for [Music Assistant](https://music-assistant.io/), designed for wall tablets, Echo Show / Nest Hub style kiosks and any touch screen running a Home Assistant dashboard.

The package is a Home Assistant custom integration that:

- serves and automatically loads the cards in the Home Assistant frontend (no manual Lovelace resource needed);
- exposes three helper actions that reuse Home Assistant's already authenticated Music Assistant client, so no Music Assistant token is ever sent to the browser.

## Cards

| Card | Type | Description |
| --- | --- | --- |
| Browser | `custom:kiosk-musicassistant-card` | Player, speaker switching, a *Discover* tab with new tracks recommended from your listening history (and Music Assistant rows), library categories, search with on-screen keyboard and navigation buttons in a single card. Visual editor included. |
| Now playing | `custom:kiosk-musicassistant-now-playing` | Full-screen now-playing view: cover art, progress, transport, volume, queue preview, synchronised lyrics and optional Spotify favourites. YAML configuration. |

Interface languages: English, French and Dutch (follows Home Assistant, or set `language`).

Both cards are responsive and tuned for a 1280×800 kiosk (Echo Show 8 class): the tile grid adds columns and enlarges the artwork as the screen gets wider.

## Requirements

- Home Assistant with the official **Music Assistant** integration configured.
- Tested with Home Assistant 2026.10 and Music Assistant 2.10.
- Optional: [SpotifyPlus](https://github.com/thlucas1/homeassistantcomponent_spotifyplus) for the favourite (heart) button of the now-playing card.

## Installation

### HACS (recommended)

1. HACS > three-dot menu > **Custom repositories**.
2. Add `https://github.com/benoitpoirier/ha-kiosk-musicassistant-cards` with type **Integration**.
3. Install **Kiosk Music Assistant Cards** and restart Home Assistant.
4. **Settings > Devices & services > Add integration > Kiosk Music Assistant Cards**.
5. Reload the browser (clear the cache on kiosk devices if needed).

### Manual

Copy `custom_components/kiosk_musicassistant_cards` to `<config>/custom_components/`, restart Home Assistant and add the integration as above.

## Browser card

Add it from the card picker: when only one Music Assistant instance exists, it is selected automatically and a default set of categories is created. Every option below is available in the visual editor, except `radio_delay` and `radio_lag` (YAML only).

### Minimal example

```yaml
type: custom:kiosk-musicassistant-card
config_entry_id: <your_music_assistant_config_entry_id>
```

Without `zones`, every Music Assistant player is listed. Without `categories`, four default categories are used (top picks, recently played, recently added, playlists).

### Full example

```yaml
type: custom:kiosk-musicassistant-card
config_entry_id: <your_music_assistant_config_entry_id>
fill: true
language: en
volume_max: 60
volume_start: 25
volume_step: 2
tile_action: open
zones:
  - name: Living room
    icon: mdi:sofa
    entity: media_player.living_room
    volume: media_player.living_room_amplifier
    before:
      turn_off: media_player.whole_house_group
  - name: Downstairs
    icon: mdi:speaker-multiple
    entity: media_player.kitchen
    before:
      join:
        leader: media_player.kitchen
        members:
          - media_player.dining_room
music_sources:
  - name: Alice
    icon: mdi:spotify
    username: alice
    connect_entity: media_player.spotify_alice
    spotify_entity: media_player.spotifyplus_alice
  - name: Bob
    icon: mdi:spotify
    username: bob
categories:
  - name: Top picks
    source:
      media_type: recommendations
      limit: 9
  - name: Favourite albums
    source:
      media_type: album
      favorite: true
      order_by: last_played_desc
      limit: 24
  - name: Radio
    tiles:
      - name: My radio
        uri: library://radio/1
        play: true
      - name: Chill mix
        uri: library://playlist/65
        icon: mdi:weather-night
        radio_mode: true
links:
  - name: Home
    icon: mdi:home
    path: /lovelace/0
```

### General options

| Option | Default | Description |
| --- | --- | --- |
| `config_entry_id` | **required** | Music Assistant config entry. |
| `height` | `556` | Card height in pixels. |
| `fill` | `false` | Fill the remaining screen height below the card (ignores `height`). |
| `fill_margin` | `8` | Bottom margin in pixels when `fill` is enabled. |
| `arrows` | `true` | Scroll buttons and a draggable scrollbar next to lists (for devices where touch scrolling is unreliable, e.g. cast displays). Also adds left/right buttons to the Discover carousels. |
| `show_player` | `true` | Show the player column on the left. A round chevron handle in the middle of the line between player and browser hides or shows it; while hidden and playing, the handle is outlined in the accent colour. This option sets the initial state. |
| `discover` | `true` | Show the *Discover* tab (first tab, opened by default). |
| `discover_source` | `mixed` | `similar`: new tracks recommended by your music providers (Spotify, Tidal, YouTube Music, Deezer… any Music Assistant provider with similar tracks), seeded with your listening history. `music_assistant`: Music Assistant's own rows only — no streaming service needed. `mixed`: similar tracks first, then Music Assistant rows. `spotify` is accepted as the former name of `similar`. |
| `spotify_entity` | none | Optional SpotifyPlus `media_player` whose Spotify history seeds the recommendations when the selected music source has no `spotify_entity`. |
| `discover_hidden_rows` | `true` | Also show the rows Music Assistant hides by default (random, forgotten, most played, ...). `false` keeps only the default rows. YAML only. |
| `kiosk_theme` | `true` | Kiosk styling with large touch targets. Set to `false` to follow the plain Home Assistant theme. |
| `theme` | `sunset` | Colour theme of the kiosk styling: `sunset` (peach & pink), `spotify` (green on black), `ocean` (cyan & indigo), `aurora` (mint & lavender), `neon` (pink & violet), `ember` (amber & red), `graphite` (monochrome) or `daylight` (light). |
| `language` | HA language | `en`, `fr` or `nl`. |
| `volume_max` | `100` | Maximum volume (%); also the end of the slider. |
| `volume_start` | none | When playback starts while the volume is above `volume_max`, drop back to this value (%). |
| `volume_step` | `1` | Volume button step (%). |
| `tile_action` | `open` | `open` shows the tracks of a tile, `play` plays it straight away. |
| `transfer_on_switch` | `true` | Move the queue to the new speaker when switching zones while playing. |
| `retry_next` | `true` | Re-send *next/previous* once if nothing happened after 2.5 s (some Chromecast players). |
| `keyboard` | `true` | Built-in on-screen keyboard. `false` uses a regular text field and the device keyboard. |
| `limit` | `24` | Search results per media type. |
| `search_types` | all | Subset of `track`, `album`, `artist`, `playlist`. |
| `radio_delay` | `0` | Delay (s) applied to radio title/artwork changes so they match the audio buffer. |
| `radio_lag` | `0` | Stay this many titles behind for stations that announce the next song early. |

### `zones` (speakers)

| Option | Description |
| --- | --- |
| `name`, `icon` | Label and icon of the button. |
| `entity` | Music Assistant `media_player` to play on. |
| `volume` | Optional `media_player` controlled by the volume slider (e.g. an amplifier). |
| `volume_max`, `volume_start`, `volume_step` | Per-zone overrides of the general options. |
| `before.turn_off` | Player to switch off before playing on this zone. |
| `before.unjoin` | Player to detach from its group first. |
| `before.join.leader` / `before.join.members` | Group these players before playing. |

### `music_sources` (Music Assistant users)

Lets several people switch between their own accounts (for example one Spotify account each). Requires Music Assistant users whose provider filter selects the matching account.

| Option | Description |
| --- | --- |
| `name`, `icon` | Label and icon of the button. |
| `username` | **Required.** Music Assistant username. |
| `connect_entity` | Optional Spotify `media_player` of this account; the current Spotify Connect track is resumed when switching source. |
| `spotify_entity` | Optional [SpotifyPlus](https://github.com/thlucas1/homeassistantcomponent_spotifyplus) `media_player` of this account. Its Spotify listening history (top tracks of the last weeks, recently played) seeds the *Discover* recommendations. |

The selected source is remembered per dashboard in the browser local storage.

### `categories`

A category is either a hand-made list (`tiles`) or a list filled by Music Assistant (`source`).

`tiles[]`: `name`, `uri` (Music Assistant media id, required), `image` (optional cover URL), `icon`, `play` (play directly), `radio_mode`.

To find a media id: **Developer tools > Actions > Music Assistant: Search**, enable response, and copy the `uri` of the result (for example `library://playlist/65`).

`source`:

| Option | Description |
| --- | --- |
| `media_type` | `recommendations`, `playlist`, `album`, `artist`, `track` or `radio`. |
| `limit` | Number of tiles (1 to 100; up to 500 in YAML for library types). |
| `order_by` | `name`, `last_played_desc`, `timestamp_added_desc`, `random` or empty for library order. |
| `favorite` | Favourites only. |
| `search` | Optional text filter. |
| `play`, `radio_mode` | Tile behaviour. |

### Discover tab

The *Discover* tab proposes music as horizontal carousels, with a featured pick on top:

- **Similar tracks** (`discover_source: similar` or `mixed`): *Recommended for you* and *Because you listen to …* rows of new tracks. A handful of tracks from your listening history are picked as seeds and your music providers return similar tracks through Music Assistant (`music/tracks/similar_tracks`, the call behind Music Assistant's radio mode). This works with any provider that offers similar tracks (Spotify, Tidal, YouTube Music, Deezer…). The seeds are the tracks last played and the favourite tracks in Music Assistant; with a SpotifyPlus `spotify_entity`, your Spotify top tracks of the last weeks and recently played tracks are used instead, so the recommendations follow your whole Spotify history. The result is cached by the integration for 30 minutes and rebuilt in the background (feeds used in the last day are kept warm every 10 minutes), so the tab opens instantly; the refresh button forces a rebuild with other seeds. Spotify removed its recommendation endpoints from the public Web API in November 2024; Music Assistant's Spotify provider still reaches them with its own session.
- **Music Assistant rows** (`music_assistant` or `mixed`): the rows of Music Assistant's home screen (recently played, recently added, random, forgotten, most played…).

Tapping a recommended track plays it and queues the rest of the row.

**Without Spotify:** nothing to configure — with `mixed`, similar tracks come from whichever provider you use, and when none can recommend (local files only, radio…) the tab shows Music Assistant's rows. Set `discover_source: music_assistant` to skip the similar-track lookup, or `discover: false` to hide the tab. Tap a cover to open an album, playlist or artist; tap the round play button to play it straight away. With `music_sources`, the rows are fetched for the selected Music Assistant user. The feed is cached for 10 minutes; the refresh button reloads it.

### `links`

Navigation buttons inside the card, so a kiosk view can consist of a single card: `name`, `icon`, `path` (for example `/dashboard-kiosk/menu`).

## Now playing card

```yaml
type: custom:kiosk-musicassistant-now-playing
config_entry_id: <your_music_assistant_config_entry_id>
fill: true
language: en
volume_step: 5
players:
  - name: Living room
    entity: media_player.living_room
  - name: Kitchen
    entity: media_player.kitchen
provider_names:
  spotify--abc123: Spotify · Alice
  spotify--def456: Spotify · Bob
favorite_accounts:
  spotify--abc123: media_player.spotifyplus_alice
```

| Option | Default | Description |
| --- | --- | --- |
| `config_entry_id` | none | Music Assistant config entry. Required for the queue preview and lyrics. |
| `height` | `560` | Card height in pixels (420 to 780). |
| `fill` | `false` | Fill the remaining screen height below the card (ignores `height`), e.g. a full-screen panel view on a kiosk. |
| `fill_margin` | `8` | Bottom margin in pixels when `fill` is enabled. |
| `language` | HA language | `en`, `fr` or `nl`. |
| `players` | all Music Assistant players | Players to follow. The card shows the one that is playing (or the most recently paused). When several play at once, buttons let you choose. |
| `volume_step` | `1` | Volume button step (%). The -/+ buttons repeat while held. |
| `theme` | `sunset` | Accent colours, same names as the browser card `theme`. |
| `provider_names` | none | Display names for Music Assistant provider instance ids (`spotify--xxxx`). The instance id is shown in Music Assistant under *Settings > Music providers*. |
| `favorite_accounts` | none | Maps a provider instance id to a SpotifyPlus `media_player` to show a favourite (heart) button for the current track. |

Synchronised lyrics are shown only when Music Assistant provides time-stamped (LRC) lyrics for the current track.

## Actions

All actions return a response (`return_response: true`).

### `kiosk_musicassistant_cards.get_track_lyrics`

```yaml
action: kiosk_musicassistant_cards.get_track_lyrics
data:
  config_entry_id: <your_music_assistant_config_entry_id>
  uri: library://track/123
response_variable: lyrics
```

Returns `lyrics` and `lrc_lyrics` (either may be `null`).

### `kiosk_musicassistant_cards.get_top_picks`

```yaml
action: kiosk_musicassistant_cards.get_top_picks
data:
  config_entry_id: <your_music_assistant_config_entry_id>
  limit: 9
response_variable: picks
```

Returns `items`, each with `name`, `uri`, `image`, `media_type`, `artist` and `recommendation_reason`. Music Assistant recommendation rows are interleaved, then completed with recently played items.

### `kiosk_musicassistant_cards.get_recommendations`

```yaml
action: kiosk_musicassistant_cards.get_recommendations
data:
  config_entry_id: <your_music_assistant_config_entry_id>
  username: alice        # optional Music Assistant user
  row_limit: 20          # optional, items per row (1-50)
  include_hidden: false  # optional, also rows MA hides by default
  source: mixed          # optional: music_assistant (default), similar or mixed
  spotify_entity: media_player.spotifyplus_alice  # optional, Spotify history for the seeds
  refresh: false         # optional, rebuild instead of returning the cached rows
response_variable: discover
```

Returns `rows`, each with `id`, `name`, `translation_key`, `subtitle`, `icon`, `source` (`similar` or `music_assistant`), `seed` (artist, for *because you listen to* rows) and `items` (same fields as above). Used by the *Discover* tab. When the Music Assistant server rejects the `username` argument, the feed of the account Home Assistant is connected with is returned instead.

### `kiosk_musicassistant_cards.get_queue_items`

```yaml
action: kiosk_musicassistant_cards.get_queue_items
data:
  config_entry_id: <your_music_assistant_config_entry_id>
  queue_id: media_player.living_room   # the player's active_queue attribute
  offset: 40   # optional, default: two items before the current track
  limit: 25    # optional, 1-100 (default 50)
response_variable: queue
```

Returns `queue_id`, `current_index`, `total`, `offset` and `items` (`index`, `queue_item_id`, `name`, `artist`, `image`, `duration`). The now-playing card uses it for its queue panel: it opens on the current track with two pages loaded and fetches 25 more items whenever the list is scrolled near either end.

### `kiosk_musicassistant_cards.play_tracks`

```yaml
action: kiosk_musicassistant_cards.play_tracks
data:
  entity_id: media_player.living_room
  uris:
    - library://track/12
    - library://track/34
  username: alice   # optional
```

Plays the first track at once in a new queue, then appends the other tracks in the background (Music Assistant resolves every track of a `play_media` call before starting, which takes a long time for a long list). The browser card uses it when a track is tapped in a list. Tracks that cannot be played are skipped (the first playable one starts). Calls for the same player run one after the other and a newer list stops the background append of the previous one, so tapping several tracks in a row always ends with the last one and its list.
## Finding the Music Assistant `config_entry_id`

In the card editor, pick Music Assistant from the drop-down. In YAML, open **Settings > Devices & services > Music Assistant**; the id is the last part of the URL of the integration entry, or use the drop-down of the `config_entry_id` field in **Developer tools > Actions**.

## Credits

Based on [touch-music-card](https://github.com/mnrgrrt/touch-music-card) by mnrgrrt (MIT licence).

## Licence

[MIT](LICENSE)

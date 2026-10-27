# Changelog

All notable changes to Kiosk Music Assistant Cards, newest first, grouped by minor version.

## 1.11 (1.11.0 to 1.11.4)

- **Discover fills itself after a Home Assistant restart.** An empty feed (Music Assistant still starting) is fetched again automatically instead of waiting for *Refresh*.
- **Fewer Spotify requests per tap.** A track from the Discover rows is handed to Music Assistant complete, so Home Assistant no longer asks Spotify for it first. *Music Assistant 2.10 still looks up each track it has not played before (outside your library) once with Spotify; with Music Assistant's shared Spotify app this can take 5 to 80 seconds when Spotify limits traffic. Set your own Spotify Client ID in each Spotify provider of Music Assistant to avoid it (see README).*
- **Similar songs added to the queue start just as fast**, and are added whenever the track that plays is the last one of the queue.
- **Fewer Spotify requests in the background**: the recommendations are refreshed every 2 hours instead of every 30 minutes.
- **Clear error when a person may not use a speaker** (Music Assistant user without access to that player) instead of nothing happening.
- **Music playing sensor follows Music Assistant itself**, not a fixed list of Home Assistant player ids. *Kiosk automations keep working when Music Assistant renames a player, cover every room and group, and no longer switch back to the screensaver while another speaker is still playing.*

## 1.10 (1.10.0 to 1.10.1)

**Every person gets their own music**

- **Discover rows follow the selected person.** Music Assistant keeps one play history for the whole house, so its "recently played", "most played" or "forgotten" rows were the same for everyone. With a music source selected, they are replaced by that person's own recently played tracks, albums and artists, most played tracks and favourites. *Benoît and Sandrine no longer see each other's history.*
- **Top Picks follow the selected person too.**
- **Switching person is instant.** The recommendations of the other people are prepared in the background, and they are kept across Home Assistant restarts. *No more 15-45 s wait after a restart or the first switch of the day.*
- **No more jumping rows**: while new recommendations load, their place is kept at the top, so the rows below stay still.
- **One person for the whole dashboard**: the Now Playing screen follows the person picked in the browser card (new `follow_source` option, on by default), so the similar songs it adds come from the right history.
- **Simpler Now Playing screen**: the badge showing where the music comes from is gone, since it always read "Music Assistant" (the `provider_names` option is no longer used).

## 1.9 (1.9.0 to 1.9.1)

**Speakers and groups handled by Music Assistant**

- **Groups set up with Music Assistant players**: "Group with" and "Play alone" replace the old join and detach settings, which are converted automatically. *Kitchen alone or kitchen + veranda, in two taps in the editor.*
- **Volume control left to Music Assistant**: the separate "volume goes to" setting is no longer offered (still honoured in YAML); set the volume control of the player in Music Assistant instead.
- **A speaker synced to a group is followed through the group**, and the Now Playing screen no longer lists both a group and its members.
- **Both cards share the same speaker list format** (`zones` or `players`).
- **Stale speakers are fixed in one click**: when Music Assistant re-creates a player under a new name (e.g. "Denon ( MA)"), the editors recognise the same device by its model and offer the replacement, in the Now Playing editor too.

## 1.8 (1.8.0)

**Pick a speaker, not an entity**

- **Only Music Assistant players are offered**, one per physical device. *A Denon seen through HEOS, AirPlay, DLNA and its own integration shows up once; Music Assistant picks the best protocol by itself.*
- **Wrong entities are flagged** in the editors, with a one-click replacement by the matching Music Assistant player.
- **New "Players" field** in the Now Playing editor.

## 1.7 (1.7.0 to 1.7.4)

**Now Playing screen, easier to tailor**

- **Choose the text size** of the title, artist and album, separately for the full view and the buttons-free view. *Lets you read the track from across the room.*
- **Progress bar can stay on screen** even when the buttons are hidden, larger and at the bottom. *You still see how far into the song you are on a clean display.*
- **One simple height setting**: pick a height or let the card fill the screen.
- **Long titles stay tidy**: limited to two lines.
- **The "Show buttons" setting follows the on/off switch live**, in both directions. *An automation can hide the buttons without being overridden by the card settings.*
- **Clearer help text** for the Music Assistant user option.
- **More reliable automatic queue filling**: it waits longer for music services to answer and tries again after a failure. *The music keeps going after the last track.*

## 1.6 (1.6.0)

- **New "Hide player buttons" switch** in Home Assistant, remembered across restarts. *Turn the Now Playing screen into a clean "cover only" display, by hand or from an automation (e.g. at night), with no card setting to change.*

## 1.5 (1.5.0 to 1.5.1)

- **Now Playing screen can be set up with the standard Home Assistant editor**: show or hide the buttons, player name, favourite, queue and lyrics. *No more YAML editing.*
- **The Edit button stays reachable** when the card fills the screen. *You can still change the card from the dashboard editor.*

## 1.4 (1.4.0 to 1.4.16)

**Playing music**

- **Tapping a song plays it right away without erasing what's next.** Only albums, playlists, artists and radios replace the whole list.
- **The music never stops at the end of the list**: similar songs are added automatically when one song is played alone or when the last song of the queue starts (can be turned off).
- **Discreet "starting" bubble** instead of a large window while a song loads. *It no longer blocks the screen; the detailed window remains as an option.*
- **Moving the music to another speaker**: when you change room while music plays, the card asks whether to move the music or just select the other speaker.
- **Changing user no longer interrupts the music**: it only changes whose library and search you use.

**Queue ("Up next")**

- **Remove a song from the queue** with one tap.
- **Only the current and upcoming songs are listed**, and the list refreshes by itself when the song changes.

**Search**

- **Finds any song or artist** from your music services, not only what you've already played.
- **Uses the tablet's own keyboard** by default, so dictation and suggestions work. The built-in on-screen keyboard is still available.

**Display and reliability**

- **Phone layout (portrait)** for both cards.
- **Cover art updates correctly** when the song changes.
- **No more broken cards after an update**: the tablet always loads the latest files.
- **Faster, smoother response** when starting a song; volume buttons restyled to match the play button.
- **Simpler status indicator** at the top of the Now Playing screen.
- README: screenshots, feature highlights and a one-click HACS install button.

## 1.3 (1.3.0 to 1.3.9)

- **Redesigned Now Playing screen**: large cover, clear song details, centred controls, with the queue and synced lyrics shown in place of the cover.
- **8 colour themes** (sunset, spotify, ocean, aurora, neon, ember, graphite, daylight). *Match the tablet to the room's decor.*
- **Songs start instantly**, even from a long list; the rest of the list is added in the background. *No more waiting a minute before the music starts.*
- **Tapping several songs quickly no longer mixes up the queue.**
- **Full queue viewable** by scrolling, loaded as you go.
- **Easier volume control**: wide bar, finger-friendly, and touching it never makes the volume jump.
- **Hide or show the player** on the music browser with a handle on the dividing line. *Gives the whole screen to browsing.*
- **Discover loads faster**: suggestions are kept ready and refreshed in the background, and a refresh button gives new ones.
- **Suggestions work with any compatible music service**, not only Spotify; Spotify is optional.
- **Suggested songs from another family member's account now play correctly**, and errors are shown clearly on screen.
- **No more flickering** on the Now Playing screen.

## 1.2 (1.2.0)

- **Personal suggestions** based on what you've listened to recently ("Recommended for you", "Because you listen to...").
- **Discover tab improvements**: row names translated, correct icons, more categories (forgotten, most played, random...), short rows shown last.

## 1.1 (1.1.0)

- **New Discover tab**, the default home screen: Music Assistant suggestions shown as swipeable rows. *Something to play in one tap, without searching.*
- **Larger artwork on larger screens**, a play button on each cover and a refreshed kiosk look.
- **Now Playing screen can fill the whole screen.**

## 1.0 (1.0.0)

- Initial release: touch music browser and Now Playing cards for Music Assistant, installable through HACS.

# Changelog

All notable changes to Kiosk Music Assistant Cards, newest first, grouped by minor version.

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

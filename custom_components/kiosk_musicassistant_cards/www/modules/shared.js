// Shared utilities, Music Assistant labels, and defaults.

export const SMALL_IMAGE_URL = (u) => (u || '')
  .replace('ab67616d0000b273', 'ab67616d00004851')
  .replace('ab67616d00001e02', 'ab67616d00004851')
  .replace('mosaic.scdn.co/640/', 'mosaic.scdn.co/60/');

export const LARGE_IMAGE_URL = (u) => (u || '')
  .replace('ab67616d0000b273', 'ab67616d00001e02')
  .replace('mosaic.scdn.co/640/', 'mosaic.scdn.co/300/');

export const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

export const PLAYING_STATES = ['playing', 'paused', 'buffering'];

// Ask the integration to queue similar tracks once per playing track; it checks the live queue.
export const AUTOFILL_DELAY = 5000;

export function autofillSimilar(owner, hass, entityId, username) {
  const key = (h) => {
    const state = h && h.states && h.states[entityId];
    const attributes = (state && state.attributes) || {};
    return state && state.state === 'playing' && attributes.active_queue
      ? `${entityId}|${attributes.media_content_id || ''}` : '';
  };
  const wanted = key(hass);
  if (!wanted || owner._autofillKey === wanted) return;
  owner._autofillKey = wanted;
  clearTimeout(owner._autofillTimer);
  // Wait so the player finishes refreshing for the new track first; skip if it changed meanwhile.
  owner._autofillTimer = setTimeout(() => {
    const current = owner._hass;
    if (key(current) !== wanted) return;
    const data = { entity_id: entityId };
    if (username) data.username = username;
    Promise.resolve(current.callService('kiosk_musicassistant_cards', 'autofill_queue', data))
      .catch((error) => console.warn('kiosk_musicassistant_cards.autofill_queue failed', error));
  }, AUTOFILL_DELAY);
}

// Music Assistant serves the covers it proxies itself over plain http, on its
// own address. On a dashboard opened over https - Nabu Casa, a reverse proxy -
// the browser refuses to load those as mixed content and you get an empty
// square with a console warning per image. An honest empty is better than a
// broken one, so such a url is treated as absent and the icon takes over.
// An http image on an https dashboard is blocked as mixed content. For a public
// site (a radio station's logo, say) the same file is almost always there over
// https too, so ask for that. An address on your own network - Music Assistant's
// imageproxy on http://192.168.x.x:8095 - has no https twin, so it is dropped
// and the tile falls back to its icon.
const LOKAAL = /^(localhost|\d{1,3}(\.\d{1,3}){3}|\[[0-9a-f:]+\]|[^.]+|.+\.(local|lan|home|internal))$/i;
export const safeImageUrl = (u) => {
  const s = String(u || '');
  if (!s) return '';
  const https = typeof location !== 'undefined' && location.protocol === 'https:';
  if (!https || s.slice(0, 5).toLowerCase() !== 'http:') return s;
  const m = s.match(/^http:\/\/([^/:?#]+)(:\d+)?/i);
  if (!m || m[2] || LOKAAL.test(m[1])) return '';
  return 'https:' + s.slice(5);
};

// A Music Assistant uri is <provider>://<type>/<id>. The type is the half that
// tells us which library to look in.
export const mediaTypeFromUri = (uri) => ((uri || '').split('://')[1] || '').split('/')[0] || '';
export const normalizeSpotifyUri = (uri) => {
  const value = String(uri || '');
  const match = value.match(/^spotify:(track|album|artist|playlist):([^?]+)/i);
  return match ? `spotify://${match[1]}/${match[2]}` : value;
};

// How long a fetched library list stays good. Music Assistant does not change
// from second to second, and a cast dashboard is open for days: too short and
// the card hangs on the wire, too long and a new playlist stays invisible.
export const BIB_TTL = 10 * 60 * 1000;
export const BIB_MAX = 500;
const DEFAULT_CATEGORIES = [
  { media_type: 'recommendations', limit: 9 },
  { media_type: 'playlist', order_by: 'last_played_desc', limit: 12 },
  { media_type: 'playlist', order_by: 'timestamp_added_desc', limit: 12 },
  { media_type: 'playlist', order_by: 'name', limit: 24 },
];
export const defaultCategories = (language) => {
  const names = getLanguage(language).standaardCats;
  return DEFAULT_CATEGORIES.map((source, index) => ({
    name: names[index],
    source: { ...source },
  }));
};

export const MEDIA_TYPES = [
  { key: 'track', isList: true, responseKey: 'tracks' },
  { key: 'album', isList: false, responseKey: 'albums' },
  { key: 'artist', isList: false, responseKey: 'artists' },
  { key: 'playlist', isList: false, responseKey: 'playlists' },
];

// Interface strings. The card picks the language of Home Assistant, or the
// one set with `language:` in the card config. Adding a language = copying
// one block below and translating it.
export const TAAL = {
  en: {
    soort: { track: 'Tracks', album: 'Albums', artist: 'Artists', playlist: 'Playlists', radio: 'Radio stations' },
    zoeken: 'Search artist, album or track',
    toetsen: 'KEYS', verberg: 'HIDE', zoek: 'SEARCH',
    verplaats: { eyebrow: 'Switch speaker', title: 'Move playback here?', text: 'Stop playback on {from} and continue on {to}.', yes: 'Move playback', no: 'Just switch' },
    wissen: 'Clear', spatie: 'space',
    bezigZoeken: 'Searching...', geenResultaat: 'No results.',
    geenCats: 'No categories configured.',
    terug: 'Back', resultaten: 'Results', speelAlles: 'Play all',
    bezigOphalen: 'Loading...', geenNummers: 'No tracks found.',
    nummer: 'track', nummers: 'tracks', uur: 'h', minuut: 'min',
    stil: 'Nothing playing', geenSpeler: 'Player not found',
    speeltOp: 'playing on', shuffleTitel: 'Shuffle', herhaalTitel: 'Repeat',
    speler: 'Player',
    standaardCats: ['Top picks for you', 'Recently played', 'Recently added', 'Playlists'],
    ontdek: 'Discover', ontdekKop: 'Picked for you', ontdekLeeg: 'No recommendations yet. Play some music and come back later.',
    launch: {
      eyebrow: 'PLAYBACK', title: 'Loading your track', success: 'Playback confirmed',
      player: 'On {player}', hide: 'Hide progress', elapsed: '{seconds} s elapsed',
      steps: [
        { title: 'Prepare the player', detail: 'Apply configured zone and group actions, if needed' },
        { title: 'Check the volume', detail: 'Adjust only if it exceeds the configured limit' },
        { title: 'Send the track to Music Assistant', detail: 'Home Assistant forwards the selected track' },
        { title: 'Confirm playback', detail: 'Wait for this player to report the selected track as playing' },
      ],
      status: ['Preparing the selected zone…', 'Checking the configured volume limit…',
        'Music Assistant is processing the request…', 'Waiting for the player to confirm playback…',
        'Playback confirmed'],
    },
    luister: 'Play', opnieuw: 'Refresh', spelerTonen: 'Show player', spelerVerbergen: 'Hide player', voorJou: 'Recommended for you', zoektVoorJou: 'Finding new music for you…', omdat: 'Because you listen to {x}',
    type1: { track: 'Track', album: 'Album', artist: 'Artist', playlist: 'Playlist', radio: 'Radio', podcast: 'Podcast', audiobook: 'Audiobook' },
    rijNamen: {},
    np: {
      seek: 'Seek in track', playing: 'Playing', paused: 'Paused', stopped: 'Stopped',
      coverOf: 'Cover of', previous: 'Previous', play: 'Play', pause: 'Pause', next: 'Next',
      favAdd: 'Add to favourites', favRemove: 'Remove from favourites',
      queue: 'Queue', lyrics: 'Lyrics', volDown: 'Volume down', volUp: 'Volume up',
      queueLoading: 'Loading queue…', queueEmpty: 'Queue empty or unavailable',
      track: 'Track', external: 'External source', nowLabel: 'Now playing', nextLabel: 'Up next', remove: 'Remove from queue',
    },
    npEd: {
      display: 'Display', textWith: 'Text size with buttons', textWithout: 'Text size without buttons', advanced: 'Advanced',
      config_entry_id: 'Music Assistant', height: 'Height (px, 0 = Auto: fill the screen below the card)',
      show_buttons: 'Show buttons (off hides all of them)', show_player: 'Show the current player',
      show_favorite: 'Show the favourite button', show_queue: 'Show the queue button', show_lyrics: 'Show the lyrics button',
      show_progress: 'Show the progress bar',
      title_size: 'Title (px)', artist_size: 'Artist / band (px)', album_size: 'Album (px)',
      title_size_no_buttons: 'Title (px)', artist_size_no_buttons: 'Artist / band (px)', album_size_no_buttons: 'Album (px)',
      username: 'Music Assistant user',
      username_help: 'Optional. Music Assistant user whose history and favourites seed the similar tracks.',
      players: 'Players', players_help: 'Music Assistant players only, one per device (empty = all of them). Music Assistant picks the protocol itself.',
      nietMa: 'Not a Music Assistant player, the card cannot play on it:', groep: 'group',
      autofill_similar: 'Queue 10 similar tracks when the last track plays', volume_step: 'Volume button step (%)',
    },
    ed: {
      algemeen: 'General', zones: 'Speakers', sources: 'Music sources', cats: 'Categories', links: 'Navigation buttons',
      config_entry_id: 'Music Assistant', height: 'Card height (pixels)',
      fill: 'Fill the screen below the card (ignores the height above)',
      fill_margin: 'Space at the bottom when filling (px)',
      volume_max: 'Maximum volume (%, also the end of the slider)',
      volume_start: 'Drop back to (%) when starting above that maximum',
      volume_step: 'Volume button step (%)',
      language: 'Language', limit: 'Search results per type',
      search_types: 'Searchable', tile_action: 'Tapping a tile',
      keyboard: 'On-screen keyboard', arrows: 'Scroll buttons next to lists',
      discover: 'Discover tab (recommendations)', show_player: 'Show the player column (a handle on the dividing line toggles it)',
      discover_source: 'Discover recommendations from', srcMix: 'Similar tracks, then Music Assistant rows', srcSimilar: 'Similar tracks from your music providers (Spotify, Tidal, YouTube Music...)', srcMa: 'Music Assistant rows only (no streaming service needed)',
      spotify_entity: 'SpotifyPlus player (optional, Spotify history for Discover)',
      kiosk_theme: 'Kiosk theme (large touch targets)', theme: 'Colour theme (kiosk theme)',
      themas: { sunset: 'Sunset (peach & pink)', spotify: 'Spotify (green on black)', ocean: 'Ocean (cyan & indigo)', aurora: 'Aurora (mint & lavender)', neon: 'Neon (pink & violet)', ember: 'Ember (amber & red)', graphite: 'Graphite (monochrome)', daylight: 'Daylight (light)' },
      transfer_on_switch: 'Move the queue when switching speaker',
      retry_next: 'Re-send skip if nothing happens (Chromecast)',
      autofill_similar: 'Queue 10 similar tracks when the last track of the queue plays',
      full_modal: 'Full modal on play (detailed progress steps)',
      automatisch: 'Follow Home Assistant', openen: 'Show its tracks', afspelen: 'Play it',
      entityHint: 'Music Assistant players only, one per device: Music Assistant picks the protocol (HEOS, AirPlay, DLNA...) itself.',
      nietMa: 'Not a Music Assistant player: the card cannot play on it.', gebruikMa: 'Use {name}', groep: 'group',
      naam: 'Name', entity: 'Player', volume: 'Volume goes to (optional)', icon: 'Icon',
      username: 'Music Assistant user',
      usernameHint: 'Username of a Music Assistant user whose provider filter selects the account to use.',
      connect_entity: 'Spotify Connect player',
      turn_off: 'First switch off this Music Assistant player (optional)',
      group_with: 'Group with (Music Assistant players)', solo: 'Play alone (detach it from any group)',
      volumeLegacy: 'Volume is sent to {name} (YAML option volume). Prefer the volume control setting of this player in Music Assistant (Settings > Players).',
      geen: 'None',
      uri: 'Media id', image: 'Cover image URL (optional)',
      uriHint: 'A Music Assistant media id, for example library://playlist/65. '
        + 'Developer tools > Actions > "Music Assistant: Search" returns the id of '
        + 'anything you search for - see the README.',
      play: 'Play straight away', radio: 'Radio mode',
      pad: 'Dashboard path', tegels: 'Tiles',
      zoneToe: 'Add speaker', sourceToe: 'Add source', catToe: 'Add category', tegelToe: 'Add tile', linkToe: 'Add button',
      weg: 'Remove', naamloos: 'Unnamed',
      weergave: 'Display', spelenKop: 'Playing', zoekKop: 'Search',
      vullen: 'Tiles come from', bronHand: 'A list I make myself',
      bronAuto: 'Music Assistant fills it',
      media_type: 'What kind', recommendations: 'Recommendations',
      order_by: 'Order', favorite: 'Favourites only',
      aantal: 'How many tiles', autoTegels: 'filled by Music Assistant',
      ordStandaard: 'Library order', ordRecent: 'Recently played',
      ordNieuw: 'Recently added', ordRandom: 'Random',
    },
  },
  nl: {
    soort: { track: 'Nummers', album: 'Albums', artist: 'Artiesten', playlist: 'Playlists', radio: 'Radiozenders' },
    zoeken: 'Zoek artiest, album of nummer',
    toetsen: 'TOETSEN', verberg: 'VERBERG', zoek: 'ZOEK',
    verplaats: { eyebrow: 'Speaker wisselen', title: 'Muziek hierheen verplaatsen?', text: 'Stop het afspelen op {from} en ga verder op {to}.', yes: 'Muziek verplaatsen', no: 'Alleen wisselen' },
    wissen: 'Wissen', spatie: 'spatie',
    bezigZoeken: 'Bezig met zoeken...', geenResultaat: 'Geen resultaten.',
    geenCats: 'Geen categorieen ingesteld.',
    terug: 'Terug', resultaten: 'Resultaten', speelAlles: 'Speel alles',
    bezigOphalen: 'Bezig met ophalen...', geenNummers: 'Geen nummers gevonden.',
    nummer: 'nummer', nummers: 'nummers', uur: 'u', minuut: 'min',
    stil: 'Niets aan het spelen', geenSpeler: 'Speler niet gevonden',
    speeltOp: 'speelt op', shuffleTitel: 'Willekeurige volgorde', herhaalTitel: 'Herhalen',
    speler: 'Speler',
    standaardCats: ['Topkeuzes voor jou', 'Onlangs gespeeld', 'Onlangs toegevoegd', 'Playlists'],
    ontdek: 'Ontdekken', ontdekKop: 'Voor jou gekozen', ontdekLeeg: 'Nog geen aanbevelingen. Speel wat muziek en kom later terug.',
    launch: {
      eyebrow: 'AFSPELEN', title: 'Bezig met laden', success: 'Afspelen bevestigd',
      player: 'Op {player}', hide: 'Voortgang verbergen', elapsed: '{seconds} s verstreken',
      steps: [
        { title: 'Speler voorbereiden', detail: 'Ingestelde zone- en groepsacties uitvoeren indien nodig' },
        { title: 'Volume controleren', detail: 'Alleen aanpassen als de ingestelde limiet wordt overschreden' },
        { title: 'Nummer naar Music Assistant sturen', detail: 'Home Assistant verstuurt het geselecteerde nummer' },
        { title: 'Afspelen bevestigen', detail: 'Wachten tot deze speler het nummer als afspelend meldt' },
      ],
      status: ['De gekozen zone voorbereiden…', 'De ingestelde volumelimiet controleren…',
        'Music Assistant verwerkt de aanvraag…', 'Wachten op bevestiging van de speler…',
        'Afspelen bevestigd'],
    },
    luister: 'Afspelen', opnieuw: 'Vernieuwen', spelerTonen: 'Speler tonen', spelerVerbergen: 'Speler verbergen', voorJou: 'Aanbevolen voor jou', zoektVoorJou: 'Nieuwe muziek zoeken…', omdat: 'Omdat je {x} luistert',
    type1: { track: 'Nummer', album: 'Album', artist: 'Artiest', playlist: 'Playlist', radio: 'Radio', podcast: 'Podcast', audiobook: 'Luisterboek' },
    rijNamen: {
      'recently played': 'Onlangs gespeeld', 'recently added albums': 'Onlangs toegevoegde albums',
      'recently added tracks': 'Onlangs toegevoegde nummers', 'recently added': 'Onlangs toegevoegd',
      'random artists': 'Willekeurige artiesten', 'random albums': 'Willekeurige albums',
      'random tracks': 'Willekeurige nummers', 'favorite tracks': 'Favoriete nummers',
      'favorite albums': 'Favoriete albums', 'favorite artists': 'Favoriete artiesten',
      'favorite playlists': 'Favoriete playlists', 'favorite radio stations': 'Favoriete radiozenders',
      'in progress': 'Verder luisteren', 'continue listening': 'Verder luisteren',
      'made for you': 'Voor jou gemaakt', 'recommended for you': 'Aanbevolen voor jou',
      'new releases': 'Nieuwe releases', 'top picks': 'Topkeuzes',
      'recent artists': 'Recente artiesten', 'recent tracks': 'Recente nummers',
      'recent albums': 'Recente albums', 'recent playlists': 'Recente playlists',
      'forgotten tracks': 'Vergeten nummers', 'forgotten albums': 'Vergeten albums',
      'forgotten artists': 'Vergeten artiesten', 'most played tracks': 'Meest gespeelde nummers',
      'most played albums': 'Meest gespeelde albums', 'most played artists': 'Meest gespeelde artiesten',
      'never / rarely played': 'Nooit of zelden gespeeld', 'random playlists': 'Willekeurige playlists',
    },
    np: {
      seek: 'Zoeken in nummer', playing: 'Speelt', paused: 'Gepauzeerd', stopped: 'Gestopt',
      coverOf: 'Hoes van', previous: 'Vorige', play: 'Afspelen', pause: 'Pauze', next: 'Volgende',
      favAdd: 'Toevoegen aan favorieten', favRemove: 'Verwijderen uit favorieten',
      queue: 'Wachtrij', lyrics: 'Songtekst', volDown: 'Zachter', volUp: 'Harder',
      queueLoading: 'Wachtrij ophalen…', queueEmpty: 'Wachtrij leeg of niet beschikbaar',
      track: 'Nummer', external: 'Externe bron', nowLabel: 'Speelt nu', nextLabel: 'Hierna', remove: 'Uit wachtrij verwijderen',
    },
    npEd: {
      display: 'Weergave', textWith: 'Tekstgrootte met knoppen', textWithout: 'Tekstgrootte zonder knoppen', advanced: 'Geavanceerd',
      config_entry_id: 'Music Assistant', height: 'Hoogte (px, 0 = Auto: scherm onder de kaart vullen)',
      show_buttons: 'Knoppen tonen (uit verbergt alles)', show_player: 'De huidige speler tonen',
      show_favorite: 'Favorietenknop tonen', show_queue: 'Wachtrijknop tonen', show_lyrics: 'Songtekstknop tonen',
      show_progress: 'Voortgangsbalk tonen',
      title_size: 'Titel (px)', artist_size: 'Artiest / groep (px)', album_size: 'Album (px)',
      title_size_no_buttons: 'Titel (px)', artist_size_no_buttons: 'Artiest / groep (px)', album_size_no_buttons: 'Album (px)',
      username: 'Music Assistant-gebruiker',
      username_help: 'Optioneel. Music Assistant-gebruiker wiens geschiedenis en favorieten de vergelijkbare nummers bepalen.',
      players: 'Spelers', players_help: 'Alleen Music Assistant-spelers, een per apparaat (leeg = allemaal). Music Assistant kiest zelf het protocol.',
      nietMa: 'Geen Music Assistant-speler, de kaart kan er niet op afspelen:', groep: 'groep',
      autofill_similar: '10 vergelijkbare nummers toevoegen als het laatste speelt', volume_step: 'Stap volumeknoppen (%)',
    },
    ed: {
      algemeen: 'Algemeen', zones: 'Speakers', sources: 'Muziekbronnen', cats: 'Categorieen', links: 'Navigatieknoppen',
      config_entry_id: 'Music Assistant', height: 'Hoogte van de kaart (pixels)',
      fill: 'Vult het scherm onder de kaart (hoogte hierboven vervalt dan)',
      fill_margin: 'Ruimte onderaan bij vullen (px)',
      volume_max: 'Maximum volume (%, tevens einde van de schuif)',
      volume_start: 'Bij starten terugzetten naar (%) als het daarboven staat',
      volume_step: 'Volumestap van de knoppen (%)',
      language: 'Taal', limit: 'Zoekresultaten per soort',
      search_types: 'Waarop zoeken', tile_action: 'Tegel aantikken',
      keyboard: 'Schermtoetsenbord', arrows: 'Scrolknoppen naast lijsten',
      discover: 'Tabblad Ontdekken (aanbevelingen)', show_player: 'Spelerkolom tonen (een knop op de scheidingslijn schakelt hem)',
      discover_source: 'Aanbevelingen van', srcMix: 'Vergelijkbare nummers, daarna Music Assistant', srcSimilar: 'Vergelijkbare nummers van je muziekdiensten (Spotify, Tidal, YouTube Music...)', srcMa: 'Alleen Music Assistant (geen streamingdienst nodig)',
      spotify_entity: 'SpotifyPlus-speler (optioneel, Spotify-geschiedenis voor Ontdekken)',
      kiosk_theme: 'Kiosk-thema (grote aanraakknoppen)', theme: 'Kleurthema (kiosk-thema)',
      themas: { sunset: 'Zonsondergang (perzik & roze)', spotify: 'Spotify (groen op zwart)', ocean: 'Oceaan (cyaan & indigo)', aurora: 'Aurora (mint & lavendel)', neon: 'Neon (roze & violet)', ember: 'Gloed (amber & rood)', graphite: 'Grafiet (monochroom)', daylight: 'Daglicht (licht)' },
      transfer_on_switch: 'Muziek meenemen bij wisselen van speaker',
      retry_next: 'Doorspoelen opnieuw sturen als er niets gebeurt (Chromecast)',
      autofill_similar: '10 vergelijkbare nummers toevoegen als het laatste nummer van de wachtrij speelt',
      full_modal: 'Volledige melding bij afspelen (gedetailleerde stappen)',
      automatisch: 'Die van Home Assistant', openen: 'Nummers tonen', afspelen: 'Meteen afspelen',
      entityHint: 'Alleen Music Assistant-spelers, een per apparaat: Music Assistant kiest zelf het protocol (HEOS, AirPlay, DLNA...).',
      nietMa: 'Geen Music Assistant-speler: de kaart kan er niet op afspelen.', gebruikMa: '{name} gebruiken', groep: 'groep',
      naam: 'Naam', entity: 'Speler', volume: 'Volume gaat naar (optioneel)', icon: 'Icoon',
      username: 'Music Assistant-gebruiker',
      usernameHint: 'Gebruikersnaam van een Music Assistant-gebruiker waarvan het bronfilter het account bepaalt.',
      connect_entity: 'Spotify Connect-speler',
      turn_off: 'Eerst deze Music Assistant-speler uitschakelen (optioneel)',
      group_with: 'Groeperen met (Music Assistant-spelers)', solo: 'Alleen spelen (uit elke groep halen)',
      volumeLegacy: 'Volume gaat naar {name} (YAML-optie volume). Gebruik liever de volumeregeling van deze speler in Music Assistant (Instellingen > Spelers).',
      geen: 'Geen',
      uri: 'Media-id', image: 'Afbeelding-URL (optioneel)',
      uriHint: 'Een Music Assistant media-id, bijvoorbeeld library://playlist/65. '
        + 'Ontwikkelhulpmiddelen > Acties > "Music Assistant: Search" geeft het id '
        + 'van alles wat je zoekt - zie de README.',
      play: 'Meteen afspelen', radio: 'Radiomodus',
      pad: 'Pad naar weergave', tegels: 'Tegels',
      zoneToe: 'Speaker toevoegen', sourceToe: 'Bron toevoegen', catToe: 'Categorie toevoegen',
      tegelToe: 'Tegel toevoegen', linkToe: 'Knop toevoegen',
      weg: 'Verwijderen', naamloos: 'Naamloos',
      weergave: 'Weergave', spelenKop: 'Afspelen', zoekKop: 'Zoeken',
      vullen: 'Tegels komen uit', bronHand: 'Een lijst die ik zelf maak',
      bronAuto: 'Music Assistant vult hem',
      media_type: 'Wat voor soort', recommendations: 'Aanbevelingen',
      order_by: 'Volgorde', favorite: 'Alleen favorieten',
      aantal: 'Hoeveel tegels', autoTegels: 'gevuld door Music Assistant',
      ordStandaard: 'Volgorde van de bibliotheek', ordRecent: 'Onlangs gespeeld',
      ordNieuw: 'Onlangs toegevoegd', ordRandom: 'Willekeurig',
    },
  },
  fr: {
    soort: { track: 'Titres', album: 'Albums', artist: 'Artistes', playlist: 'Playlists', radio: 'Radios' },
    zoeken: 'Rechercher un artiste, un album ou un titre',
    toetsen: 'CLAVIER', verberg: 'MASQUER', zoek: 'RECHERCHER',
    verplaats: { eyebrow: 'Changer de lecteur', title: 'Basculer la lecture ici ?', text: 'Arrêter la lecture sur {from} et la reprendre sur {to}.', yes: 'Basculer la lecture', no: 'Changer seulement' },
    wissen: 'Effacer', spatie: 'espace',
    bezigZoeken: 'Recherche en cours...', geenResultaat: 'Aucun résultat.',
    geenCats: 'Aucune catégorie configurée.',
    terug: 'Retour', resultaten: 'Résultats', speelAlles: 'Tout lire',
    bezigOphalen: 'Chargement...', geenNummers: 'Aucun titre trouvé.',
    nummer: 'titre', nummers: 'titres', uur: 'h', minuut: 'min',
    stil: 'Aucune lecture', geenSpeler: 'Lecteur introuvable',
    speeltOp: 'en lecture sur', shuffleTitel: 'Lecture aléatoire', herhaalTitel: 'Répéter',
    speler: 'Lecteur',
    standaardCats: ['Meilleures sélections pour vous', 'Récemment écoutés', 'Récemment ajoutés', 'Playlists'],
    ontdek: 'Découvertes', ontdekKop: 'Sélectionné pour vous', ontdekLeeg: 'Pas encore de recommandations. Écoutez de la musique et revenez plus tard.',
    launch: {
      eyebrow: 'LECTURE', title: 'Chargement en cours', success: 'Lecture confirmée',
      player: 'Sur {player}', hide: 'Masquer la progression', elapsed: '{seconds} s écoulées',
      steps: [
        { title: 'Préparation du lecteur', detail: 'Application des réglages de zone et de groupe, si nécessaire' },
        { title: 'Vérification du volume', detail: 'Ajustement uniquement si la limite configurée est dépassée' },
        { title: 'Envoi du titre à Music Assistant', detail: 'Home Assistant transmet le titre sélectionné' },
        { title: 'Confirmation de lecture', detail: 'Attente de l’état « en lecture » pour ce titre sur ce lecteur' },
      ],
      status: ['Préparation de la zone sélectionnée…', 'Vérification de la limite de volume…',
        'Music Assistant traite la demande…', 'Attente de la confirmation du lecteur…',
        'Lecture confirmée'],
    },
    luister: 'Écouter', opnieuw: 'Actualiser', spelerTonen: 'Afficher le lecteur', spelerVerbergen: 'Masquer le lecteur', voorJou: 'Recommandé pour vous', zoektVoorJou: 'Recherche de nouveautés pour vous…', omdat: 'Parce que vous écoutez {x}',
    type1: { track: 'Titre', album: 'Album', artist: 'Artiste', playlist: 'Playlist', radio: 'Radio', podcast: 'Podcast', audiobook: 'Livre audio' },
    rijNamen: {
      'recently played': 'Écoutés récemment', 'recently added albums': 'Albums ajoutés récemment',
      'recently added tracks': 'Titres ajoutés récemment', 'recently added': 'Ajoutés récemment',
      'random artists': 'Artistes au hasard', 'random albums': 'Albums au hasard',
      'random tracks': 'Titres au hasard', 'favorite tracks': 'Titres favoris',
      'favorite albums': 'Albums favoris', 'favorite artists': 'Artistes favoris',
      'favorite playlists': 'Playlists favorites', 'favorite radio stations': 'Radios favorites',
      'in progress': 'Reprendre l’écoute', 'continue listening': 'Reprendre l’écoute',
      'made for you': 'Conçu pour vous', 'recommended for you': 'Recommandé pour vous',
      'new releases': 'Nouveautés', 'top picks': 'Meilleures sélections',
      'recent artists': 'Artistes récents', 'recent tracks': 'Titres récents',
      'recent albums': 'Albums récents', 'recent playlists': 'Playlists récentes',
      'forgotten tracks': 'Titres oubliés', 'forgotten albums': 'Albums oubliés',
      'forgotten artists': 'Artistes oubliés', 'most played tracks': 'Titres les plus écoutés',
      'most played albums': 'Albums les plus écoutés', 'most played artists': 'Artistes les plus écoutés',
      'never / rarely played': 'Jamais ou rarement écoutés', 'random playlists': 'Playlists au hasard',
    },
    np: {
      seek: 'Rechercher dans le titre', playing: 'Lecture en cours', paused: 'En pause',
      stopped: 'À l’arrêt', coverOf: 'Pochette de', previous: 'Précédent', play: 'Lecture',
      pause: 'Pause', next: 'Suivant',
      favAdd: 'Ajouter aux favoris', favRemove: 'Retirer des favoris',
      queue: 'File d’attente', lyrics: 'Paroles', volDown: 'Baisser le volume',
      volUp: 'Augmenter le volume', queueLoading: 'Chargement de la file…',
      queueEmpty: 'File vide ou indisponible', track: 'Titre', external: 'Source externe',
      nowLabel: 'En cours', nextLabel: 'À suivre', remove: 'Retirer de la file',
    },
    npEd: {
      display: 'Affichage', textWith: 'Taille du texte avec boutons', textWithout: 'Taille du texte sans boutons', advanced: 'Avancé',
      config_entry_id: 'Music Assistant', height: 'Hauteur (px, 0 = Auto : remplir l’écran sous la carte)',
      show_buttons: 'Afficher les boutons (désactivé : tous masqués)', show_player: 'Afficher le lecteur en cours',
      show_favorite: 'Afficher le bouton J’aime', show_queue: 'Afficher le bouton de la file', show_lyrics: 'Afficher le bouton des paroles',
      show_progress: 'Afficher la barre de progression',
      title_size: 'Titre (px)', artist_size: 'Groupe / artiste (px)', album_size: 'Album (px)',
      title_size_no_buttons: 'Titre (px)', artist_size_no_buttons: 'Groupe / artiste (px)', album_size_no_buttons: 'Album (px)',
      username: 'Utilisateur Music Assistant',
      username_help: 'Facultatif. Utilisateur Music Assistant dont l’historique et les favoris servent de base aux titres similaires.',
      players: 'Lecteurs', players_help: 'Lecteurs Music Assistant uniquement, un par appareil (vide = tous). Music Assistant choisit lui-même le protocole.',
      nietMa: 'Pas un lecteur Music Assistant, la carte ne peut pas y jouer :', groep: 'groupe',
      autofill_similar: 'Ajouter 10 titres similaires quand le dernier joue', volume_step: 'Pas des boutons de volume (%)',
    },
    ed: {
      algemeen: 'Général', zones: 'Lecteurs', sources: 'Sources musicales', cats: 'Catégories',
      links: 'Boutons de navigation',
      config_entry_id: 'Music Assistant', height: 'Hauteur de la carte (pixels)',
      fill: 'Remplir l’écran sous la carte (ignore la hauteur indiquée)',
      fill_margin: 'Marge inférieure au remplissage (px)',
      volume_max: 'Volume maximal (%, également la fin du curseur)',
      volume_start: 'Réduire à (%) au démarrage si le volume dépasse ce maximum',
      volume_step: 'Pas des boutons de volume (%)',
      language: 'Langue', limit: 'Résultats par type',
      search_types: 'Types recherchés', tile_action: 'Action au toucher d’une tuile',
      keyboard: 'Clavier à l’écran', arrows: 'Boutons de défilement des listes',
      discover: 'Onglet Découvertes (recommandations)', show_player: 'Afficher la colonne lecteur (une poignée sur la séparation la masque/affiche)',
      discover_source: 'Source des recommandations', srcMix: 'Titres similaires, puis lignes Music Assistant', srcSimilar: 'Titres similaires de vos services (Spotify, Tidal, YouTube Music…)', srcMa: 'Lignes Music Assistant uniquement (sans service de streaming)',
      spotify_entity: 'Lecteur SpotifyPlus (facultatif, historique Spotify pour Découvertes)',
      kiosk_theme: 'Thème kiosque (grandes zones tactiles)', theme: 'Thème de couleurs (thème kiosque)',
      themas: { sunset: 'Coucher de soleil (pêche et rose)', spotify: 'Spotify (vert sur noir)', ocean: 'Océan (cyan et indigo)', aurora: 'Aurore (menthe et lavande)', neon: 'Néon (rose et violet)', ember: 'Braise (ambre et rouge)', graphite: 'Graphite (monochrome)', daylight: 'Jour (clair)' },
      transfer_on_switch: 'Transférer la file lors du changement de lecteur',
      retry_next: 'Renvoyer la commande Suivant si rien ne se passe (Chromecast)',
      autofill_similar: 'Ajouter 10 titres similaires quand le dernier titre de la file joue',
      full_modal: 'Modale complète à la lecture (étapes détaillées)',
      automatisch: 'Suivre Home Assistant', openen: 'Afficher ses titres', afspelen: 'Lire',
      entityHint: 'Lecteurs Music Assistant uniquement, un par appareil : Music Assistant choisit lui-même le protocole (HEOS, AirPlay, DLNA…).',
      nietMa: 'Ce n’est pas un lecteur Music Assistant : la carte ne peut pas y jouer.', gebruikMa: 'Utiliser {name}', groep: 'groupe',
      naam: 'Nom', entity: 'Lecteur', volume: 'Lecteur de volume (facultatif)', icon: 'Icône',
      username: 'Utilisateur Music Assistant',
      usernameHint: 'Nom d’utilisateur MA dont le filtre fournisseur sélectionne le compte à utiliser.',
      connect_entity: 'Lecteur Spotify Connect',
      turn_off: 'Éteindre d’abord ce lecteur Music Assistant (facultatif)',
      group_with: 'Grouper avec (lecteurs Music Assistant)', solo: 'Jouer seul (le détacher de tout groupe)',
      volumeLegacy: 'Le volume est envoyé à {name} (option YAML volume). Préférez le réglage de contrôle du volume de ce lecteur dans Music Assistant (Paramètres > Lecteurs).',
      geen: 'Aucun',
      uri: 'Identifiant média', image: 'URL de la pochette (facultatif)',
      uriHint: 'Identifiant Music Assistant, par exemple library://playlist/65. Outils de développement > Actions > Music Assistant : Rechercher renvoie cet identifiant.',
      play: 'Lire immédiatement', radio: 'Mode radio',
      pad: 'Chemin du tableau de bord', tegels: 'Tuiles',
      zoneToe: 'Ajouter un lecteur', sourceToe: 'Ajouter une source',
      catToe: 'Ajouter une catégorie', tegelToe: 'Ajouter une tuile', linkToe: 'Ajouter un bouton',
      weg: 'Supprimer', naamloos: 'Sans nom',
      weergave: 'Affichage', spelenKop: 'Lecture', zoekKop: 'Recherche',
      vullen: 'Origine des tuiles', bronHand: 'Liste personnalisée',
      bronAuto: 'Fournie par Music Assistant',
      media_type: 'Type de média', recommendations: 'Recommandations',
      order_by: 'Tri', favorite: 'Favoris uniquement',
      aantal: 'Nombre de tuiles', autoTegels: 'fournies par Music Assistant',
      ordStandaard: 'Ordre de la bibliothèque', ordRecent: 'Récemment écoutés',
      ordNieuw: 'Récemment ajoutés', ordRandom: 'Aléatoire',
    },
  },
};

// Language from the card config, else Home Assistant's, else English.
export const getLanguage = (...kandidaten) => {
  const g = String(kandidaten.find(Boolean) || 'en').slice(0, 2).toLowerCase();
  return TAAL[g] || TAAL.en;
};

export const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];


export const ICON_ALIASES = {
  soundbar: 'mdi:soundbar', speaker: 'mdi:speaker', groep: 'mdi:surround-sound',
  keuken: 'mdi:countertop', serre: 'mdi:greenhouse',
  min: 'mdi:volume-minus', plus: 'mdi:volume-plus', shuffle: 'mdi:shuffle-variant',
  zoek: 'mdi:magnify', play: 'mdi:play', pause: 'mdi:pause',
  prev: 'mdi:skip-previous', next: 'mdi:skip-next', terug: 'mdi:arrow-left',
  hart: 'mdi:heart', muziek: 'mdi:music', klok: 'mdi:history', ster: 'mdi:star',
  plus2: 'mdi:playlist-plus', album: 'mdi:album', artiest: 'mdi:account-music',
  oneindig: 'mdi:infinity', lijst: 'mdi:playlist-music', radio: 'mdi:radio',
  ontdek: 'mdi:compass-outline', vernieuw: 'mdi:refresh', links: 'mdi:chevron-left', rechts: 'mdi:chevron-right',
};

export const svg = (naam) => {
  const n = String(naam || 'muziek');
  const mdi = n.indexOf(':') > 0 ? n : (ICON_ALIASES[n] || 'mdi:music');
  return `<ha-icon icon="${esc(mdi)}"></ha-icon>`;
};

export const formatDuration = (s) => {
  const n = parseInt(s, 10);
  if (!n || n < 0) return '';
  const m = Math.floor(n / 60);
  const r = n % 60;
  return m + ':' + (r < 10 ? '0' : '') + r;
};

// ---------- volume control, shared by both cards ----------
// A native range (keyboard, accessibility) restyled for touch: a 48px hit area,
// a thumb and track that grow while the finger is on them, a value bubble, 1%
// steps, and -/+ buttons that repeat while held. Touch and mouse drag the value
// relatively (like a jog dial): putting a finger down never changes the volume,
// only moving it does, and a vertical swipe still scrolls the page. The value is sent while dragging
// (at most 4 times a second) and once more on release; incoming state does not
// move the slider while it is being touched or for 2 s after.
export const VOLUME_CSS = `
.vol-box { position:relative; flex:1 1 auto; min-width:60px; height:48px; display:flex; align-items:center;
  touch-action:pan-y; cursor:grab; -webkit-user-select:none; user-select:none;
  --v:0%; --vr-track:8px; --vr-thumb:24px; }
.vol-box.vol-active { --vr-track:14px; --vr-thumb:36px; cursor:grabbing; }
.vol-range { -webkit-appearance:none; appearance:none; width:100%; height:48px; margin:0; padding:0;
  background:transparent; pointer-events:none; -webkit-tap-highlight-color:transparent; }
.vol-range:focus-visible::-webkit-slider-thumb { box-shadow:0 0 0 4px var(--vr-fill,#fff); }
.vol-range:focus { outline:none; }
.vol-range::-webkit-slider-runnable-track { height:var(--vr-track); border-radius:99px; transition:height .15s ease;
  background:linear-gradient(90deg,var(--vr-fill,#fff) 0 var(--v),var(--vr-rest,rgba(255,255,255,.2)) var(--v) 100%); }
.vol-range::-webkit-slider-thumb { -webkit-appearance:none; width:var(--vr-thumb); height:var(--vr-thumb);
  margin-top:calc((var(--vr-track) - var(--vr-thumb)) / 2); border-radius:50%; background:#fff;
  box-shadow:0 2px 10px rgba(0,0,0,.45),0 0 0 6px rgba(255,255,255,.12);
  transition:width .15s ease, height .15s ease, margin-top .15s ease; }
.vol-range::-moz-range-track { height:var(--vr-track); border-radius:99px; background:var(--vr-rest,rgba(255,255,255,.2)); }
.vol-range::-moz-range-progress { height:var(--vr-track); border-radius:99px; background:var(--vr-fill,#fff); }
.vol-range::-moz-range-thumb { width:var(--vr-thumb); height:var(--vr-thumb); border:0; border-radius:50%; background:#fff; }
.vol-bubble { position:absolute; bottom:calc(100% + 2px); left:clamp(20px,var(--v),calc(100% - 20px));
  transform:translateX(-50%) translateY(6px) scale(.7); opacity:0; pointer-events:none; padding:5px 11px;
  border-radius:12px; background:var(--vr-fill,#fff); color:var(--vr-on,#000); font-size:16px; font-weight:800;
  font-variant-numeric:tabular-nums; box-shadow:0 6px 18px rgba(0,0,0,.35); transition:opacity .15s, transform .15s; }
.vol-box.vol-active .vol-bubble { opacity:1; transform:translateX(-50%) scale(1); }
`;

export const volumeControlHtml = (label) => `<div class="vol-box"><input class="vol-range" type="range" min="0" max="100"
  step="1" value="0" aria-label="${esc(label)}"><output class="vol-bubble"></output></div>`;

const volPaint = (range) => {
  const max = Number(range.max) || 100;
  const value = Number(range.value) || 0;
  const box = range.parentElement;
  box.style.setProperty('--v', `${Math.max(0, Math.min(100, (value / max) * 100))}%`);
  const bubble = box.querySelector('.vol-bubble');
  if (bubble) bubble.textContent = `${value}%`;
  const label = range.getRootNode().querySelector('.vol-label');
  if (label) label.textContent = `${value}%`;
};

// Shows the player's volume (percent) unless the slider is being touched.
export const updateVolumeDisplay = (root, percent, max) => {
  const range = root.querySelector('.vol-range');
  if (!range) return;
  if (max && range.max !== String(max)) range.max = String(max);
  if (range._busyUntil && Date.now() < range._busyUntil) return;
  const value = String(Math.round(percent));
  if (range.value !== value || !range.parentElement.style.getPropertyValue('--v')) {
    range.value = value;
    volPaint(range);
  }
};

// Wires every .vol-range and [data-vol] button inside root. send(percent) sets
// the volume; step() returns the button step in percent.
export const bindVolumeControl = (root, { send, step }) => {
  let last = 0;
  let timer = null;
  let hold = null;
  const range = () => root.querySelector('.vol-range');
  const push = (value, now) => {
    clearTimeout(timer);
    const go = () => { last = Date.now(); send(value); };
    const wait = 250 - (Date.now() - last);
    if (now || wait <= 0) go(); else timer = setTimeout(go, wait);
  };
  const active = (r, on) => {
    r.parentElement.classList.toggle('vol-active', on);
    r._busyUntil = on ? Infinity : Date.now() + 2000;
  };
  const isRange = (node) => node && node.classList && node.classList.contains('vol-range');
  root.addEventListener('input', (event) => {
    if (!isRange(event.target)) return;
    active(event.target, true);
    volPaint(event.target);
    push(Number(event.target.value));
  });
  root.addEventListener('change', (event) => {
    if (!isRange(event.target)) return;
    active(event.target, false);
    volPaint(event.target);
    push(Number(event.target.value), true);
  });
  // Relative drag on the whole box; the range itself ignores the pointer.
  let drag = null;
  root.addEventListener('pointerdown', (event) => {
    const path = event.composedPath();
    const box = path.find((node) => node && node.classList && node.classList.contains('vol-box'));
    if (box) {
      const r = box.querySelector('.vol-range');
      if (!r || event.button > 0) return;
      drag = { box, r, x: event.clientX, v: Number(r.value) || 0, moved: false, id: event.pointerId };
      try { box.setPointerCapture(event.pointerId); } catch (error) { /* not capturable */ }
      active(r, true);
      return;
    }
    const button = path.find((node) => node && node.dataset && node.dataset.vol);
    const r = range();
    if (!button || !r) return;
    const direction = Number(button.dataset.vol);
    const tick = () => {
      const max = Number(r.max) || 100;
      r.value = String(Math.max(0, Math.min(max, Math.round(Number(r.value) + direction * step()))));
      active(r, true);
      volPaint(r);
      push(Number(r.value));
    };
    tick();
    clearTimeout(hold);
    hold = setTimeout(function repeat() { tick(); hold = setTimeout(repeat, 110); }, 450);
  });
  root.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 6) return;
    drag.moved = true;
    const max = Number(drag.r.max) || 100;
    const width = drag.box.getBoundingClientRect().width || 1;
    const value = Math.max(0, Math.min(max, Math.round(drag.v + (dx / width) * max)));
    if (String(value) === drag.r.value) return;
    drag.r.value = String(value);
    volPaint(drag.r);
    push(value);
  });
  const release = () => {
    if (drag) {
      const { r, moved } = drag;
      drag = null;
      active(r, false);
      if (moved) push(Number(r.value), true);
      return;
    }
    const r = range();
    const held = hold !== null;
    clearTimeout(hold);
    hold = null;
    if (r && r.parentElement.classList.contains('vol-active')) {
      active(r, false);
      if (held) push(Number(r.value), true);
    }
  };
  // On the window: the finger may leave the button or the card before lifting.
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
};
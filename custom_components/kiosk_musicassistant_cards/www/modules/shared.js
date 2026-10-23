// Shared utilities, Music Assistant labels, and defaults.

export const KLEIN = (u) => (u || '')
  .replace('ab67616d0000b273', 'ab67616d00004851')
  .replace('ab67616d00001e02', 'ab67616d00004851')
  .replace('mosaic.scdn.co/640/', 'mosaic.scdn.co/60/');

export const GROOT = (u) => (u || '')
  .replace('ab67616d0000b273', 'ab67616d00001e02')
  .replace('mosaic.scdn.co/640/', 'mosaic.scdn.co/300/');

export const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

export const SPEELT = ['playing', 'paused', 'buffering'];

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
export const VEILIG = (u) => {
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
export const SOORT_VAN = (uri) => ((uri || '').split('://')[1] || '').split('/')[0] || '';
export const SPOTIFY_URI = (uri) => {
  const value = String(uri || '');
  const match = value.match(/^spotify:(track|album|artist|playlist):([^?]+)/i);
  return match ? `spotify://${match[1]}/${match[2]}` : value;
};

// How long a fetched library list stays good. Music Assistant does not change
// from second to second, and a cast dashboard is open for days: too short and
// the card hangs on the wire, too long and a new playlist stays invisible.
export const BIB_TTL = 10 * 60 * 1000;
export const BIB_MAX = 500;
const CATEGORIES_PAR_DEFAUT = [
  { media_type: 'recommendations', limit: 9 },
  { media_type: 'playlist', order_by: 'last_played_desc', limit: 12 },
  { media_type: 'playlist', order_by: 'timestamp_added_desc', limit: 12 },
  { media_type: 'playlist', order_by: 'name', limit: 24 },
];
export const categoriesParDefaut = (language) => {
  const names = taalVan(language).standaardCats;
  return CATEGORIES_PAR_DEFAUT.map((source, index) => ({
    name: names[index],
    source: { ...source },
  }));
};

export const SOORTEN = [
  { key: 'track', lijst: true, veld: 'tracks' },
  { key: 'album', lijst: false, veld: 'albums' },
  { key: 'artist', lijst: false, veld: 'artists' },
  { key: 'playlist', lijst: false, veld: 'playlists' },
];

// Interface strings. The card picks the language of Home Assistant, or the
// one set with `language:` in the card config. Adding a language = copying
// one block below and translating it.
export const TAAL = {
  en: {
    soort: { track: 'Tracks', album: 'Albums', artist: 'Artists', playlist: 'Playlists', radio: 'Radio stations' },
    zoeken: 'Search artist, album or track',
    toetsen: 'KEYS', verberg: 'HIDE', zoek: 'SEARCH',
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
    luister: 'Play', opnieuw: 'Refresh',
    type1: { track: 'Track', album: 'Album', artist: 'Artist', playlist: 'Playlist', radio: 'Radio', podcast: 'Podcast', audiobook: 'Audiobook' },
    rijNamen: {},
    np: {
      seek: 'Seek in track', playing: 'Playing', paused: 'Paused', stopped: 'Stopped',
      coverOf: 'Cover of', previous: 'Previous', play: 'Play', pause: 'Pause', next: 'Next',
      favAdd: 'Add to favourites', favRemove: 'Remove from favourites',
      queue: 'Queue', lyrics: 'Lyrics', volDown: 'Volume down', volUp: 'Volume up',
      queueLoading: 'Loading queue…', queueEmpty: 'Queue empty or unavailable',
      track: 'Track', external: 'External source',
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
      discover: 'Discover tab (Music Assistant recommendations)',
      kiosk_theme: 'Kiosk theme (large touch targets)',
      transfer_on_switch: 'Move the queue when switching speaker',
      retry_next: 'Re-send skip if nothing happens (Chromecast)',
      automatisch: 'Follow Home Assistant', openen: 'Show its tracks', afspelen: 'Play it',
      naam: 'Name', entity: 'Player', volume: 'Volume goes to (optional)', icon: 'Icon',
      username: 'Music Assistant user',
      usernameHint: 'Username of a Music Assistant user whose provider filter selects the account to use.',
      connect_entity: 'Spotify Connect player',
      turn_off: 'First switch off (optional)', unjoin: 'First detach (optional)',
      joinLeader: 'First group onto (optional)', joinMembers: 'these speakers',
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
    luister: 'Afspelen', opnieuw: 'Vernieuwen',
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
    },
    np: {
      seek: 'Zoeken in nummer', playing: 'Speelt', paused: 'Gepauzeerd', stopped: 'Gestopt',
      coverOf: 'Hoes van', previous: 'Vorige', play: 'Afspelen', pause: 'Pauze', next: 'Volgende',
      favAdd: 'Toevoegen aan favorieten', favRemove: 'Verwijderen uit favorieten',
      queue: 'Wachtrij', lyrics: 'Songtekst', volDown: 'Zachter', volUp: 'Harder',
      queueLoading: 'Wachtrij ophalen…', queueEmpty: 'Wachtrij leeg of niet beschikbaar',
      track: 'Nummer', external: 'Externe bron',
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
      discover: 'Tabblad Ontdekken (aanbevelingen van Music Assistant)',
      kiosk_theme: 'Kiosk-thema (grote aanraakknoppen)',
      transfer_on_switch: 'Muziek meenemen bij wisselen van speaker',
      retry_next: 'Doorspoelen opnieuw sturen als er niets gebeurt (Chromecast)',
      automatisch: 'Die van Home Assistant', openen: 'Nummers tonen', afspelen: 'Meteen afspelen',
      naam: 'Naam', entity: 'Speler', volume: 'Volume gaat naar (optioneel)', icon: 'Icoon',
      username: 'Music Assistant-gebruiker',
      usernameHint: 'Gebruikersnaam van een Music Assistant-gebruiker waarvan het bronfilter het account bepaalt.',
      connect_entity: 'Spotify Connect-speler',
      turn_off: 'Eerst uitzetten (optioneel)', unjoin: 'Eerst loskoppelen (optioneel)',
      joinLeader: 'Eerst groeperen op (optioneel)', joinMembers: 'met deze speakers',
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
    luister: 'Écouter', opnieuw: 'Actualiser',
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
    },
    np: {
      seek: 'Rechercher dans le titre', playing: 'Lecture en cours', paused: 'En pause',
      stopped: 'À l’arrêt', coverOf: 'Pochette de', previous: 'Précédent', play: 'Lecture',
      pause: 'Pause', next: 'Suivant',
      favAdd: 'Ajouter aux favoris', favRemove: 'Retirer des favoris',
      queue: 'File d’attente', lyrics: 'Paroles', volDown: 'Baisser le volume',
      volUp: 'Augmenter le volume', queueLoading: 'Chargement de la file…',
      queueEmpty: 'File vide ou indisponible', track: 'Titre', external: 'Source externe',
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
      discover: 'Onglet Découvertes (recommandations Music Assistant)',
      kiosk_theme: 'Thème kiosque (grandes zones tactiles)',
      transfer_on_switch: 'Transférer la file lors du changement de lecteur',
      retry_next: 'Renvoyer la commande Suivant si rien ne se passe (Chromecast)',
      automatisch: 'Suivre Home Assistant', openen: 'Afficher ses titres', afspelen: 'Lire',
      naam: 'Nom', entity: 'Lecteur', volume: 'Lecteur de volume (facultatif)', icon: 'Icône',
      username: 'Utilisateur Music Assistant',
      usernameHint: 'Nom d’utilisateur MA dont le filtre fournisseur sélectionne le compte à utiliser.',
      connect_entity: 'Lecteur Spotify Connect',
      turn_off: 'Éteindre d’abord (facultatif)', unjoin: 'Dissocier d’abord (facultatif)',
      joinLeader: 'Regrouper d’abord avec (facultatif)', joinMembers: 'ces lecteurs',
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
export const taalVan = (...kandidaten) => {
  const g = String(kandidaten.find(Boolean) || 'en').slice(0, 2).toLowerCase();
  return TAAL[g] || TAAL.en;
};

export const RIJEN = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];


export const KORT = {
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
  const mdi = n.indexOf(':') > 0 ? n : (KORT[n] || 'mdi:music');
  return `<ha-icon icon="${esc(mdi)}"></ha-icon>`;
};

export const mmss = (s) => {
  const n = parseInt(s, 10);
  if (!n || n < 0) return '';
  const m = Math.floor(n / 60);
  const r = n % 60;
  return m + ':' + (r < 10 ? '0' : '') + r;
};

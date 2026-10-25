// Entry point. Home Assistant loads this resource as a JavaScript module.
// Sub-modules are imported with the same ?v= query so a new version never reuses cached files.
const VERSION = '1.7.4';
const Q = `?v=${VERSION}`;
const { MusicAssistantTouchCard } = await import(`./modules/browser-card.js${Q}`);
const { MusicAssistantTouchCardEditor } = await import(`./modules/card-editor.js${Q}`);
const { KioskNowPlayingCard, KioskNowPlayingEditor } = await import(`./modules/now-playing-card.js${Q}`);

const DOCS = 'https://github.com/benoitpoirier/ha-kiosk-musicassistant-cards';

const elements = [
  ['kiosk-musicassistant-card-editor', MusicAssistantTouchCardEditor],
  ['kiosk-musicassistant-card', MusicAssistantTouchCard],
  ['kiosk-musicassistant-now-playing', KioskNowPlayingCard],
  ['kiosk-musicassistant-now-playing-editor', KioskNowPlayingEditor],
];
for (const [tag, element] of elements) {
  if (!customElements.get(tag)) customElements.define(tag, element);
}

const customCards = Array.isArray(window.customCards)
  ? window.customCards
  : (window.customCards = []);
const cards = [
  {
    type: 'kiosk-musicassistant-card',
    name: 'Kiosk Music Assistant (browser)',
    preview: false,
    description: 'Music Assistant player, library and search in one card, built for touch panels',
    documentationURL: DOCS,
  },
  {
    type: 'kiosk-musicassistant-now-playing',
    name: 'Kiosk Music Assistant (now playing)',
    preview: false,
    description: 'Full-screen now playing view for Music Assistant players, with synced lyrics',
    documentationURL: DOCS,
  },
];
for (const card of cards) {
  if (!customCards.some((registered) => registered.type === card.type)) customCards.push(card);
}

console.info(
  `%c KIOSK-MUSICASSISTANT-CARDS %c ${VERSION} `,
  'color:#fff;background:#1DB954;font-weight:700',
  'color:#1DB954;background:#222'
);

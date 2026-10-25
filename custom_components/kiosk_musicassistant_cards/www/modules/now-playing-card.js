const Q = new URL(import.meta.url).search;
const { safeImageUrl, VOLUME_CSS, esc, svg, getLanguage, bindVolumeControl, volumeControlHtml, updateVolumeDisplay, autofillSimilar } = await import(`./shared.js${Q}`);
const { THEME_COLORS } = await import(`./kiosk-theme.js${Q}`);

const DOMAIN = 'kiosk_musicassistant_cards';
const QUEUE_PAGE = 25;

const NOW_PLAYING_STYLE = `
:host { display:block; width:100%; color:#fff; container-type:inline-size; container-name:np;
  --np-acc:#f6b26b; --np-acc2:#e5739b; }
:host([data-bare]) :is(.players, .actions, .transport, .bottom, .progress) { display:none !important; }
* { box-sizing:border-box; }
button { font:inherit; color:inherit; border:0; background:none; padding:0; margin:0; cursor:pointer;
  -webkit-tap-highlight-color:transparent;
  transition:transform .12s ease, background .2s ease, color .2s ease, opacity .2s ease, box-shadow .2s ease; }
button:active { transform:scale(.93); }
button:disabled { opacity:.35; cursor:default; }
ha-icon { pointer-events:none; }
.shell { position:relative; isolation:isolate; width:100%; height:var(--now-playing-height,560px);
  min-height:420px; max-height:var(--now-playing-max,780px); overflow:hidden; border-radius:28px;
  background:#0a141c; box-shadow:0 24px 60px rgba(0,0,0,.35); }
.background { position:absolute; z-index:-3; inset:-90px; background-size:cover; background-position:center;
  filter:blur(70px) saturate(1.6) brightness(.6); transform:scale(1.25); transition:background-image .8s ease; }
.shade { position:absolute; z-index:-2; inset:0;
  background:radial-gradient(90% 130% at 20% 50%,rgba(0,0,0,0) 0%,rgba(0,0,0,.22) 60%,rgba(0,0,0,.5) 100%),
    linear-gradient(90deg,rgba(0,0,0,0) 35%,rgba(0,0,0,.32) 100%); }
.layout { --pad:clamp(24px,3.6cqw,48px);
  --cov:min(calc(var(--now-playing-height,560px) - var(--pad) * 2), 46cqw);
  display:grid; grid-template-columns:var(--cov) minmax(0,1fr); gap:clamp(28px,4.5cqw,64px);
  align-items:center; height:100%; padding:var(--pad); }

/* left: cover, or the queue / lyrics in its place */
.cover-area { position:relative; width:var(--cov); aspect-ratio:1; }
.cover,.cover-empty,.pane { position:absolute; inset:0; width:100%; height:100%; border-radius:clamp(16px,2cqw,26px); }
.cover { object-fit:cover; box-shadow:0 40px 80px -24px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.08);
  animation:in .5s ease; }
@keyframes in { from { opacity:0; transform:scale(.97); } to { opacity:1; transform:none; } }
.cover-empty { display:grid; place-items:center; color:rgba(255,255,255,.45);
  background:linear-gradient(145deg,rgba(255,255,255,.1),rgba(255,255,255,.03));
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.08); }
.cover-empty ha-icon { --mdc-icon-size:96px; }
.pane { display:flex; flex-direction:column; overflow:hidden; background:rgba(10,14,20,.55);
  -webkit-backdrop-filter:blur(24px) saturate(1.3); backdrop-filter:blur(24px) saturate(1.3);
  box-shadow:0 40px 80px -24px rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,255,255,.08); animation:in .3s ease; }
.lyrics-pane { display:block; overflow:auto; scrollbar-width:none;
  -webkit-mask-image:linear-gradient(transparent,#000 14%,#000 86%,transparent);
  mask-image:linear-gradient(transparent,#000 14%,#000 86%,transparent); }
.lyrics-pane::-webkit-scrollbar,.q-list::-webkit-scrollbar { display:none; }
.lyrics-lines { display:flex; flex-direction:column; align-items:flex-start; gap:18px; padding:45% 30px; }
.lyric-line { font-size:clamp(18px,2.1cqw,26px); font-weight:750; line-height:1.3; letter-spacing:-.01em;
  color:rgba(255,255,255,.3); overflow-wrap:anywhere; transform-origin:left center;
  transition:color .35s ease, transform .35s ease; }
.lyric-line.active { color:#fff; transform:scale(1.04); }
.pane-head { display:flex; align-items:center; gap:10px; padding:18px 16px 10px 22px; flex:none;
  font-size:12.5px; font-weight:800; letter-spacing:.9px; text-transform:uppercase; color:rgba(255,255,255,.75); }
.pane-head ha-icon { --mdc-icon-size:20px; color:var(--np-acc); }
.pane-head .close { margin-left:auto; width:40px; height:40px; border-radius:50%; display:grid; place-items:center;
  background:rgba(255,255,255,.1); }
.pane-head .close ha-icon { color:#fff; }
.q-list { flex:1; overflow:auto; scrollbar-width:none; padding:0 12px 12px; overscroll-behavior:contain; }
.q-row { display:grid; grid-template-columns:56px minmax(0,1fr) auto 40px; gap:12px; align-items:center;
  transition:opacity .2s ease, transform .2s ease, max-height .25s ease .15s, padding .25s ease .15s; max-height:120px; overflow:hidden;
  padding:10px; border-radius:16px; }
.q-row.now { background:rgba(255,255,255,.09); }
.q-row img,.q-ph { width:56px; height:56px; border-radius:10px; object-fit:cover; }
.q-row.played { opacity:.5; }
.q-dur { font-size:13px; color:rgba(255,255,255,.55); font-variant-numeric:tabular-nums; padding-right:4px; }
.q-more[hidden] { display:none; }
.q-del,.q-del-ph { width:40px; height:40px; }
.q-del { display:grid; place-items:center; border-radius:50%; color:rgba(255,255,255,.55);
  background:rgba(255,255,255,.06); }
.q-del ha-icon { --mdc-icon-size:20px; }
.q-del:active { background:rgba(239,68,68,.35); color:#fff; }
@media (hover:hover) { .q-del { opacity:0; } .q-row:hover .q-del { opacity:1; } .q-del:hover { color:#fff; background:rgba(239,68,68,.35); } }
.q-row.removing { opacity:0; transform:translateX(24px); max-height:0; padding-top:0; padding-bottom:0; pointer-events:none; }
.q-ph { display:grid; place-items:center; background:rgba(255,255,255,.08); color:rgba(255,255,255,.5); }
.q-tx { min-width:0; }
.q-label { font-size:11px; font-weight:800; letter-spacing:.8px; text-transform:uppercase; color:var(--np-acc); }
.q-name { font-size:17px; font-weight:700; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.q-art { font-size:14px; color:rgba(255,255,255,.6); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.q-more,.pane-empty { padding:12px 14px; font-size:14px; color:rgba(255,255,255,.6); }

/* right: one column as tall as the cover - status on top, controls at the bottom */
.side { display:flex; flex-direction:column; justify-content:space-between; gap:16px; min-width:0;
  height:var(--cov); max-height:100%; }
.top { display:flex; align-items:center; gap:8px; flex-wrap:wrap; min-width:0; min-height:44px; }
.status { display:inline-flex; align-items:center; gap:9px; height:36px; max-width:100%; padding:0 14px 0 12px;
  border-radius:999px; background:rgba(255,255,255,.1); box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);
  font-size:13px; font-weight:700; white-space:nowrap; overflow:hidden; }
.st-label { font-size:11.5px; font-weight:800; letter-spacing:.9px; text-transform:uppercase; color:var(--np-acc); }
.st-player { display:inline-flex; align-items:center; gap:5px; min-width:0; overflow:hidden; text-overflow:ellipsis;
  color:rgba(255,255,255,.85); }
.st-player ha-icon { --mdc-icon-size:16px; flex:none; }
.eq { display:inline-flex; align-items:flex-end; gap:2px; height:14px; flex:none; }
.eq i { width:3px; height:4px; border-radius:2px; background:var(--np-acc); opacity:.6; }
.status.playing .eq i { opacity:1; animation:eq 1s ease-in-out infinite; }
.status.playing .eq i:nth-child(2) { animation-delay:-.45s; }
.status.playing .eq i:nth-child(3) { animation-delay:-.7s; }
@keyframes eq { 0%,100% { height:4px; } 50% { height:14px; } }
.players { display:flex; flex-wrap:wrap; gap:6px; }
.players:empty { display:none; }
.players button { display:inline-flex; align-items:center; gap:6px; height:36px; padding:0 13px; border-radius:999px;
  background:rgba(255,255,255,.08); color:rgba(255,255,255,.75); font-size:13px; font-weight:650; }
.players button.active { background:#fff; color:#0a141c; }
.players ha-icon { --mdc-icon-size:16px; }
.mid { display:flex; flex-direction:column; gap:clamp(10px,1.6cqw,20px); min-width:0; }
.meta { display:flex; flex-direction:column; min-width:0; }
.title { font-size:clamp(30px,3.7cqw,52px); font-weight:800; letter-spacing:-.03em; line-height:1.06;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; overflow-wrap:anywhere; }
.artist { margin-top:8px; font-size:clamp(18px,1.95cqw,25px); font-weight:650; color:rgba(255,255,255,.9);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.album { margin-top:2px; font-size:clamp(15px,1.5cqw,18px); color:rgba(255,255,255,.58);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.context { display:inline-flex; align-self:flex-start; align-items:center; gap:6px; max-width:100%; height:30px;
  margin-top:12px; padding:0 12px 0 9px; border-radius:999px; background:rgba(255,255,255,.08);
  color:rgba(255,255,255,.78); font-size:12.5px; font-weight:700; white-space:nowrap; overflow:hidden; }
.context:empty { display:none; }
.context ha-icon { --mdc-icon-size:16px; color:var(--np-acc); flex:none; }
.progress { position:relative; display:block; width:100%; height:46px; }
.progress:active { transform:none; }
.progress[hidden] { display:none; }
.track { position:absolute; top:14px; left:0; right:0; height:6px; overflow:hidden; border-radius:99px;
  background:rgba(255,255,255,.2); }
.fill { display:block; width:0; height:100%; border-radius:inherit;
  background:linear-gradient(90deg,var(--np-acc),var(--np-acc2)); transition:width .25s linear; }
.thumb { position:absolute; top:17px; left:0; width:16px; height:16px; border-radius:50%; background:#fff;
  transform:translate(-50%,-50%); box-shadow:0 0 0 5px rgba(255,255,255,.14),0 2px 8px rgba(0,0,0,.4); }
.times { position:absolute; top:28px; left:0; right:0; display:flex; justify-content:space-between;
  font-size:12.5px; font-weight:650; color:rgba(255,255,255,.62); font-variant-numeric:tabular-nums; }
.transport { display:flex; align-items:center; justify-content:space-between; width:100%; padding:0 2px; }
.btn { position:relative; display:grid; place-items:center; flex:none; border-radius:50%; color:rgba(255,255,255,.92); }
.btn.sm { width:52px; height:52px; color:rgba(255,255,255,.62); }
.btn.sm ha-icon { --mdc-icon-size:24px; }
.btn.sm.on { color:var(--np-acc); }
.btn.sm.on::after { content:''; position:absolute; bottom:6px; width:5px; height:5px; border-radius:50%; background:var(--np-acc); }
.btn.md { width:clamp(56px,5.6cqw,70px); height:clamp(56px,5.6cqw,70px); background:rgba(255,255,255,.1); }
.btn.md ha-icon { --mdc-icon-size:34px; }
.btn.play { width:clamp(76px,7.4cqw,94px); height:clamp(76px,7.4cqw,94px); background:#fff; color:#0a141c;
  box-shadow:0 18px 40px -10px rgba(0,0,0,.55),0 0 0 8px rgba(255,255,255,.08); }
.btn.play ha-icon { --mdc-icon-size:46px; }
/* volume: the whole bottom bar, as wide as the column */
.bottom { display:flex; align-items:center; min-height:64px; padding:8px 10px; border-radius:999px;
  background:rgba(255,255,255,.08); box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);
  -webkit-backdrop-filter:blur(16px); backdrop-filter:blur(16px); }
.bottom[hidden] { display:none; }
.volume-row { display:flex; flex:1; align-items:center; gap:6px; min-width:0; }
.volume-row:empty { display:none; }
.volume-row .btn { width:48px; height:48px; color:rgba(255,255,255,.85); background:rgba(255,255,255,.08); }
.volume-row .btn ha-icon { --mdc-icon-size:24px; }
/* favourite, queue, lyrics: small round buttons at the end of the top row */
.actions { display:flex; gap:6px; flex:none; margin-left:auto; }
.actions:empty { display:none; }
.actions .btn { width:44px; height:44px; color:rgba(255,255,255,.85); background:rgba(255,255,255,.1);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.08); }
.actions .btn ha-icon { --mdc-icon-size:22px; }
.actions .btn.on { background:#fff; color:#0a141c; }
.actions .btn.fav.on { background:rgba(255,255,255,.1); color:var(--np-acc); }
.volume-row .vol-box { --vr-fill:#fff; --vr-rest:rgba(255,255,255,.22); --vr-on:#0a141c; margin:0 8px; height:52px; }
.vol-label { min-width:52px; padding-right:10px; text-align:right; font-size:15px; font-weight:750;
  color:rgba(255,255,255,.8); font-variant-numeric:tabular-nums; }
.notice { position:absolute; left:50%; bottom:16px; z-index:2; max-width:80%; transform:translateX(-50%);
  padding:9px 16px; border-radius:14px; background:rgba(127,29,29,.85); color:#ffe4e0; font-size:13px; }
.notice:empty { display:none; }

/* phone, narrow column: stack everything */
@container np (max-width:760px) {
  .shell { height:auto; max-height:none; }
  .layout { grid-template-columns:minmax(0,1fr); --cov:min(74cqw,380px); justify-items:center; height:auto;
    gap:22px; padding:24px 20px 24px; }
  .side { width:100%; height:auto; gap:18px; }
  .top { justify-content:center; }
  .meta { align-items:center; text-align:center; }
  .context { align-self:center; }
  .btn.sm { width:46px; height:46px; }
}
/* portrait phone */
@container np (max-width:480px) {
  .layout { --cov:min(78cqw,340px); gap:18px; padding:18px 16px 20px; }
  .cover-area:has(.pane) { width:100%; aspect-ratio:auto; height:min(64vh,460px); }
  .top { gap:8px; }
  .actions { margin-left:0; }
  .title { font-size:clamp(24px,7cqw,30px); }
  .artist { font-size:18px; }
  .album { font-size:15px; }
  .btn.md { width:52px; height:52px; }
  .btn.play { width:76px; height:76px; }
  .volume-row .btn { width:42px; height:42px; }
  .volume-row .vol-box { margin:0 4px; }
  .vol-label { min-width:42px; padding-right:6px; font-size:14px; }
}
`;

export class KioskNowPlayingCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._selected = null;
    this._signature = '';
    this._qs = null;
    this._queueContextKey = '';
    this._queueContext = null;
    this._queueOpen = false;
    this._notice = '';
    this._lyricsLines = [];
    this._lyricsAvailable = false;
    this._lyricsVisible = false;
    this._activeLyricIndex = -1;
  }

  static async getStubConfig(hass) {
    const stub = { config_entry_id: '', height: 560 };
    try {
      const entries = await hass.callWS({ type: 'config_entries/get', domain: 'music_assistant' });
      const loaded = (entries || []).filter((entry) => entry.state === 'loaded');
      if (loaded.length === 1) stub.config_entry_id = loaded[0].entry_id;
    } catch (error) { /* No admin rights or no Music Assistant: set it in YAML. */ }
    return stub;
  }

  setConfig(config) {
    this._cfg = Object.assign({ height: 560 }, config || {});
    this._configuredPlayers = (Array.isArray(this._cfg.players) ? this._cfg.players : [])
      .filter((player) => player && typeof player.entity === 'string' && player.entity.startsWith('media_player.'));
    this._autoPlayers = null;
    this._selected = this._configuredPlayers[0] ? this._configuredPlayers[0].entity : null;
  }

  // Configured players, or else every Music Assistant player (looked up once).
  get _players() {
    if (this._configuredPlayers.length) return this._configuredPlayers;
    if (this._autoPlayers) return this._autoPlayers;
    const states = (this._hass && this._hass.states) || {};
    const found = Object.keys(states)
      .filter((id) => id.startsWith('media_player.') && (states[id].attributes || {}).mass_player_type)
      .map((id) => ({ name: states[id].attributes.friendly_name || id, entity: id }));
    if (found.length) this._autoPlayers = found;
    return found;
  }

  _getTranslations() {
    const lang = getLanguage(this._cfg.language, this._hass && this._hass.language);
    return Object.assign({}, lang.np, {
      stil: lang.stil, shuffle: lang.shuffleTitel, repeat: lang.herhaalTitel, tracks: lang.nummers, track1: lang.nummer,
    });
  }

  _volumeStep() {
    const step = parseFloat(this._cfg.volume_step);
    return Number.isFinite(step) && step > 0 && step <= 100 ? step : 1;
  }

  connectedCallback() {
    this._startProgressTimer();
    if (this._cfg && this._cfg.fill === true && !this._resizeListener && this.shadowRoot.firstChild) {
      this._resizeListener = () => this._fillHeight();
      window.addEventListener('resize', this._resizeListener);
      this._filledHeight = null;
      requestAnimationFrame(() => this._fillHeight());
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot.firstChild) this._build();
    this._startProgressTimer();
    this._sync();
  }

  _startProgressTimer() {
    if (this._timer) return;
    this._timer = setInterval(() => { this._updateProgress(); this._fillHeight(); }, 1000);
  }

  getCardSize() { return 5; }

  _build() {
    const height = Math.max(420, Math.min(780, Number(this._cfg.height) || 560));
    const t = this._getTranslations();
    this.shadowRoot.innerHTML = `<style>${NOW_PLAYING_STYLE}${VOLUME_CSS}</style>
      <section class="shell" style="--now-playing-height:${height}px;${this._themeStyle()}">
        <div class="background" id="background"></div><div class="shade"></div>
        <div class="layout">
          <div class="cover-area" id="cover"></div>
          <div class="side">
            <div class="top"><div class="status" id="status"></div><div class="players" id="players"></div><div class="actions" id="actions"></div></div>
            <div class="mid">
              <div class="meta">
                <div class="title" id="title"></div>
                <div class="artist" id="artist"></div>
                <div class="album" id="album"></div>
                <div class="context" id="context"></div>
              </div>
              <button class="progress" data-act="seek" id="progress" aria-label="${esc(t.seek)}">
                <span class="track"><span class="fill" id="fill"></span></span><span class="thumb" id="thumb"></span>
                <span class="times"><span id="position">0:00</span><span id="duration">0:00</span></span>
              </button>
              <div class="transport" id="transport"></div>
            </div>
            <div class="bottom" id="bottom"><div class="volume-row" id="volume-row"></div></div>
          </div>
        </div>
        <div class="notice" id="notice"></div>
      </section>`;
    this.shadowRoot.addEventListener('click', (event) => this._click(event));
    this.shadowRoot.addEventListener('error', (event) => {
      const img = event.target;
      if (!img || !img.classList || !img.classList.contains('cover')) return;
      const cover = this.shadowRoot.getElementById('cover');
      if (!cover || cover._retried === cover._key) return;
      cover._retried = cover._key;
      cover._key = null;
      this._signature = '';
      this._sync();
    }, true);
    this.shadowRoot.addEventListener('scroll', (event) => {
      if (event.target && event.target.id === 'q-list') this._queueScroll();
    }, true);
    bindVolumeControl(this.shadowRoot, {
      step: () => this._volumeStep(),
      send: (percent) => {
        if (!this._entity || !this._hass) return;
        this._hass.callService('media_player', 'volume_set',
          { volume_level: Math.max(0, Math.min(1, percent / 100)) }, { entity_id: this._entity })
          .catch((error) => { this._notice = error && error.message ? error.message : String(error); this._sync(); });
      },
    });
    this._startProgressTimer();
    if (this._cfg.fill === true) {
      requestAnimationFrame(() => this._fillHeight());
      if (!this._resizeListener) {
        this._resizeListener = () => this._fillHeight();
        window.addEventListener('resize', this._resizeListener);
      }
    }
  }

  // fill: true -> use the screen height left below the top of the card, so a
  // panel view on a 1280x800 kiosk gets a full-screen player.
  _fillHeight() {
    if (this._cfg.fill !== true || !this.isConnected) return;
    const shell = this.shadowRoot && this.shadowRoot.querySelector('.shell');
    if (!shell) return;
    const margin = this._cfg.fill_margin == null ? 8 : Number(this._cfg.fill_margin) || 0;
    const height = Math.max(420, Math.round(window.innerHeight - this.getBoundingClientRect().top - margin));
    if (height === this._filledHeight) return;
    this._filledHeight = height;
    shell.style.setProperty('--now-playing-height', `${height}px`);
    shell.style.setProperty('--now-playing-max', 'none');
  }

  _state(entity) { return this._hass && this._hass.states ? this._hass.states[entity] : null; }

  _activeEntity() {
    const playing = this._players.filter((player) => {
      const state = this._state(player.entity);
      return state && ['playing', 'buffering'].includes(state.state);
    });
    if (playing.length) {
      const selected = playing.find((player) => player.entity === this._selected);
      this._selected = (selected || playing[0]).entity;
      return this._selected;
    }
    const paused = this._players.filter((player) => {
      const state = this._state(player.entity);
      return state && state.state === 'paused';
    }).sort((left, right) => {
      const a = Date.parse((this._state(left.entity) || {}).last_changed || '') || 0;
      const b = Date.parse((this._state(right.entity) || {}).last_changed || '') || 0;
      return b - a;
    });
    if (paused.length) {
      const selected = paused.find((player) => player.entity === this._selected);
      this._selected = (selected || paused[0]).entity;
      return this._selected;
    }
    return this._selected || (this._players[0] && this._players[0].entity) || null;
  }

  _provider(attributes) {
    const uri = String(attributes.media_content_id || '');
    const queueProvider = String((this._queueContext && this._queueContext.provider) || '');
    const scheme = String(queueProvider || uri.split('://')[0] || '').toLowerCase();
    const names = this._cfg.provider_names || {};
    const named = Object.keys(names).find((key) => key.toLowerCase() === scheme);
    if (named) return String(names[named]);
    if (scheme.includes('spotify')) return 'Spotify';
    if (scheme.includes('youtube')) return 'YouTube Music';
    if (scheme.includes('jellyfin')) return 'Jellyfin';
    if (scheme.includes('plex')) return 'Plex';
    if (queueProvider) {
      return queueProvider.replace(/^spotify--/i, 'Spotify ')
        .replace(/[-_]+/g, ' ').replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
    }
    if (attributes.active_queue) return 'Music Assistant';
    return String(attributes.source || attributes.app_id || this._getTranslations().external);
  }

  _favoriteAccount(provider) {
    const accounts = this._cfg.favorite_accounts || {};
    const key = Object.keys(accounts).find((name) =>
      name.toLowerCase() === String(provider || '').toLowerCase());
    const entity = key && accounts[key];
    const state = entity && this._state(entity);
    return state && !['unknown', 'unavailable'].includes(state.state) ? entity : null;
  }

  _supports(attributes, feature) {
    if (attributes.supported_features == null) return true;
    return (Number(attributes.supported_features) & feature) !== 0;
  }

  _sync() {
    if (!this.shadowRoot || !this.shadowRoot.getElementById('title')) return;
    const entity = this._activeEntity();
    this._entity = entity;
    // An entity driven by an HA automation (e.g. an input_boolean) hides every control.
    const hideEntity = this._cfg.hide_controls_entity;
    const hideState = this._state(hideEntity);
    this.toggleAttribute('data-bare', !!hideEntity && !!hideState && hideState.state === String(this._cfg.hide_controls_state || 'on'));
    if (this._cfg.autofill_similar !== false) autofillSimilar(this, this._hass, entity, this._cfg.username);
    const state = this._state(entity);
    const attributes = (state && state.attributes) || {};
    const queueContextKey = attributes.active_queue
      ? `${entity}|${attributes.active_queue}|${attributes.media_content_id || ''}` : '';
    if (queueContextKey !== this._queueContextKey) {
      this._queueContextKey = queueContextKey;
      this._queueContext = null;
      this._lyricsLines = [];
      this._lyricsAvailable = false;
      this._lyricsVisible = false;
      this._activeLyricIndex = -1;
      if (queueContextKey) this._loadQueueContext(entity, queueContextKey);
      // A new track: reopen the list on it.
      if (this._queueOpen && queueContextKey) Promise.resolve().then(() => { if (this._queueOpen) this._refreshQueue(); });
    }
    const picture = safeImageUrl(attributes.entity_picture_local || attributes.entity_picture || '');
    const signature = [entity, state && state.state, attributes.media_title, attributes.media_artist,
      attributes.media_album_name, attributes.media_content_id,
      picture.replace(/([?&])token=[^&]*/g, '$1'), attributes.active_queue,
      attributes.shuffle, attributes.repeat, attributes.supported_features,
      Number.isFinite(Number(attributes.volume_level)), this._selected,
      this._queueContext && this._queueContext.provider,
      this._queueContext && this._queueContext.itemId,
      this._queueContext && this._queueContext.favorite,
      this._lyricsAvailable, this._lyricsVisible, this._lyricsLines.length,
      this._players.map((player) => {
        const current = this._state(player.entity);
        return `${player.entity}:${current ? current.state : ''}`;
      }).join(','),
      this._queueOpen, this._qs && this._qs.generation, this._qs && this._qs.loading === 'all',
      this._qs && this._qs.items.length > 0, this._notice].join('|');
    if (signature !== this._signature) {
      this._signature = signature;
      this._render(state, attributes, picture);
    }
    this._syncVolume(attributes);
    this._updateProgress();
  }

  // Accent colours from the same palettes as the browser card (theme: ocean...).
  _themeStyle() {
    const colors = THEME_COLORS[this._cfg.theme] || THEME_COLORS.sunset;
    return `--np-acc:${colors.acc};--np-acc2:${colors.acc2};`;
  }

  // ---------- queue ----------
  // The list opens on the current track with two pages (50 items) loaded; the
  // rest is fetched a page at a time when the list is scrolled near either end.
  // Rows are added to the DOM in place, so the scroll position never jumps.
  _queueRowHtml(item, t) {
    const current = this._qs && item.index === this._qs.current;
    const played = this._qs && this._qs.current != null && item.index < this._qs.current;
    const image = safeImageUrl(item.image || '');
    return `<div class="q-row${current ? ' now' : ''}${played ? ' played' : ''}" data-q="${item.index}">
      ${image ? `<img alt="" loading="lazy" src="${esc(image)}">` : `<span class="q-ph">${svg('mdi:music')}</span>`}
      <div class="q-tx">${current ? `<div class="q-label">${esc(t.nowLabel)}</div>` : ''}
        <div class="q-name">${esc(item.name || t.track)}</div>${item.artist ? `<div class="q-art">${esc(item.artist)}</div>` : ''}</div>
      <span class="q-dur">${item.duration ? this._time(item.duration) : ''}</span>
      ${current || !item.queue_item_id ? '<span class="q-del-ph"></span>' : `<button class="q-del" data-act="q-del"
        data-id="${esc(item.queue_item_id)}" title="${esc(t.remove)}" aria-label="${esc(t.remove)} ${esc(item.name || '')}">${svg('mdi:close')}</button>`}</div>`;
  }

  _queueHtml(t) {
    const qs = this._qs;
    const head = `<div class="pane-head">${svg('mdi:playlist-music')}<span id="q-head">${esc(this._queueCountText(t))}</span>
      <button class="close" data-act="queue" aria-label="${esc(t.queue)}">${svg('mdi:close')}</button></div>`;
    if (!qs || qs.loading === 'all') return `<div class="pane">${head}<div class="pane-empty">${esc(t.queueLoading)}</div></div>`;
    if (!qs.items.length) return `<div class="pane">${head}<div class="pane-empty">${esc(t.queueEmpty)}</div></div>`;
    return `<div class="pane">${head}<div class="q-list" id="q-list">
      <div class="q-more" id="q-top"${qs.start > this._queueFloor() ? '' : ' hidden'}>${esc(t.queueLoading)}</div>
      <div id="q-rows">${qs.items.filter((item) => item.index >= this._queueFloor()).map((item) => this._queueRowHtml(item, t)).join('')}</div>
      <div class="q-more" id="q-bottom"${qs.start + qs.items.length < qs.total ? '' : ' hidden'}>${esc(t.queueLoading)}</div>
    </div></div>`;
  }

  // Played tracks are not listed: the list starts at the track playing.
  _queueFloor() {
    const current = this._qs && Number(this._qs.current);
    return Number.isFinite(current) && current > 0 ? current : 0;
  }

  // Tracks still to come, the one playing included.
  _queueCountText(t) {
    const qs = this._qs;
    const left = qs ? Math.max(0, qs.total - this._queueFloor()) : 0;
    return `${t.queue}${left ? ` · ${left} ${left === 1 ? t.track1 : t.tracks}` : ''}`;
  }

  async _queuePage(offset, limit) {
    const state = this._state(this._entity);
    const queueId = state && state.attributes && state.attributes.active_queue;
    if (!queueId || !this._cfg.config_entry_id) throw new Error('no queue');
    const data = { config_entry_id: this._cfg.config_entry_id, queue_id: queueId };
    if (offset != null) data.offset = offset;
    if (limit != null) data.limit = limit;
    const result = await this._hass.callWS({
      type: 'call_service', domain: DOMAIN, service: 'get_queue_items',
      service_data: data, return_response: true,
    });
    return (result && result.response) || {};
  }

  async _loadQueue() {
    this._queueOpen = true;
    const generation = (this._qs ? this._qs.generation : 0) + 1;
    this._qs = { generation, loading: 'all', items: [], start: 0, total: 0, current: null };
    this._sync();
    try {
      const page = await this._queuePage(null, QUEUE_PAGE * 2);
      if (!this._qs || this._qs.generation !== generation) return;
      this._qs = {
        generation, loading: null, items: page.items || [], start: Number(page.offset) || 0,
        total: Number(page.total) || 0, current: page.current_index, scrolled: false,
      };
      this._notice = '';
    } catch (error) {
      if (!this._qs || this._qs.generation !== generation) return;
      this._qs = { generation, loading: null, items: [], start: 0, total: 0, current: null };
      this._notice = error && error.message ? error.message : String(error);
    }
    this._sync();
  }

  // A new track while the list is open: fetch it again from the new current
  // track and swap the rows in place - no "loading" flash - then go back to the
  // top, where the track playing now is.
  async _refreshQueue() {
    const qs = this._qs;
    const list = this.shadowRoot.getElementById('q-list');
    if (!qs || qs.loading || !list) { this._loadQueue(); return; }
    qs.loading = 'refresh';
    let page;
    try {
      page = await this._queuePage(null, QUEUE_PAGE * 2);
    } catch (error) {
      qs.loading = null;
      return;
    }
    if (this._qs !== qs || !this._queueOpen) return;
    qs.loading = null;
    qs.items = page.items || [];
    qs.start = Number(page.offset) || 0;
    qs.total = Number(page.total) || 0;
    qs.current = page.current_index;
    const t = this._getTranslations();
    const rows = this.shadowRoot.getElementById('q-rows');
    if (!rows || !qs.items.length) { this._loadQueue(); return; }
    rows.innerHTML = qs.items.filter((item) => item.index >= this._queueFloor())
      .map((item) => this._queueRowHtml(item, t)).join('');
    const head = this.shadowRoot.getElementById('q-head');
    if (head) head.textContent = this._queueCountText(t);
    const top = this.shadowRoot.getElementById('q-top');
    const bottom = this.shadowRoot.getElementById('q-bottom');
    if (top) top.hidden = qs.start <= this._queueFloor();
    if (bottom) bottom.hidden = qs.start + qs.items.length >= qs.total;
    list.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Called after every render and on scroll: centres the current track once,
  // then fetches a page when the list gets near an end.
  _queueScroll() {
    const qs = this._qs;
    const list = this.shadowRoot.getElementById('q-list');
    if (!qs || !list || qs.loading) return;
    if (!qs.scrolled) {
      qs.scrolled = true;
      const now = list.querySelector('.q-row.now');
      if (now) list.scrollTop = Math.max(0, now.offsetTop - list.offsetTop - 12);
      return;
    }
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 400;
    const nearTop = list.scrollTop < 300;
    if (nearBottom && qs.start + qs.items.length < qs.total) this._queueMore(1);
    else if (nearTop && qs.start > this._queueFloor()) this._queueMore(-1);
  }

  // Removes a row at once (it slides out) and asks Music Assistant to drop the
  // item; on failure the row comes back and the error is shown.
  async _removeQueueItem(button) {
    const qs = this._qs;
    const row = button.closest('.q-row');
    const id = button.dataset.id;
    if (!qs || !row || !id || row.classList.contains('removing')) return;
    row.classList.add('removing');
    try {
      await this._hass.callService(DOMAIN, 'remove_queue_item', { entity_id: this._entity, queue_item_id: id });
    } catch (error) {
      row.classList.remove('removing');
      this._notice = error && error.message ? error.message : String(error);
      this._sync();
      return;
    }
    if (this._qs !== qs) return;
    const position = qs.items.findIndex((item) => item.queue_item_id === id);
    if (position >= 0) {
      const removed = qs.items[position].index;
      qs.items.splice(position, 1);
      for (const item of qs.items) if (item.index > removed) item.index -= 1;
      if (qs.current != null && removed < qs.current) qs.current -= 1;
      qs.total = Math.max(0, qs.total - 1);
    }
    setTimeout(() => row.remove(), 450);
    const head = this.shadowRoot.getElementById('q-head');
    const t = this._getTranslations();
    if (head) head.textContent = this._queueCountText(t);
  }

  async _queueMore(direction) {
    const qs = this._qs;
    const t = this._getTranslations();
    qs.loading = direction > 0 ? 'down' : 'up';
    const offset = direction > 0 ? qs.start + qs.items.length : Math.max(this._queueFloor(), qs.start - QUEUE_PAGE);
    const limit = direction > 0 ? QUEUE_PAGE : qs.start - offset;
    let items = [];
    try {
      const page = await this._queuePage(offset, limit);
      items = page.items || [];
      if (Number.isFinite(Number(page.total))) qs.total = Number(page.total);
    } catch (error) {
      items = [];
    }
    if (this._qs !== qs) return;
    qs.loading = null;
    const list = this.shadowRoot.getElementById('q-list');
    const rows = this.shadowRoot.getElementById('q-rows');
    if (!list || !rows) return;
    const html = items.map((item) => this._queueRowHtml(item, t)).join('');
    if (direction > 0) {
      qs.items = qs.items.concat(items);
      rows.insertAdjacentHTML('beforeend', html);
      if (!items.length) qs.total = qs.start + qs.items.length;
    } else {
      // Keep what is under the finger in place while rows appear above it.
      const before = list.scrollHeight;
      qs.items = items.concat(qs.items);
      qs.start = offset;
      rows.insertAdjacentHTML('afterbegin', html);
      list.scrollTop += list.scrollHeight - before;
      if (!items.length) qs.start = this._queueFloor();
    }
    const top = this.shadowRoot.getElementById('q-top');
    const bottom = this.shadowRoot.getElementById('q-bottom');
    if (top) top.hidden = qs.start <= this._queueFloor();
    if (bottom) bottom.hidden = qs.start + qs.items.length >= qs.total;
  }

  // Replaces an element's content only when it really changed, so a state
  // update elsewhere in the house does not rebuild (and flash) the controls.
  _patch(id, html) {
    const el = this.shadowRoot.getElementById(id);
    if (!el || el._html === html) return false;
    el._html = html;
    el.innerHTML = html;
    return true;
  }

  _syncVolume(attributes) {
    const volume = Number(attributes.volume_level);
    if (Number.isFinite(volume)) updateVolumeDisplay(this.shadowRoot, volume * 100, 100);
  }
  _render(state, attributes, picture) {
    const entity = this._entity;
    const configured = this._players.find((player) => player.entity === entity) || {};
    const playing = state && ['playing', 'buffering'].includes(state.state);
    const paused = state && state.state === 'paused';
    const t = this._getTranslations();
    const $ = (id) => this.shadowRoot.getElementById(id);
    const title = attributes.media_title || t.stil;
    const artist = attributes.media_artist || '';
    const album = attributes.media_album_name || '';
    const playerName = attributes.friendly_name || configured.name || entity || '';
    const activePlayers = this._players.filter((player) => {
      const current = this._state(player.entity);
      return current && ['playing', 'buffering'].includes(current.state);
    });
    const provider = this._provider(attributes);

    const statusEl = $('status');
    statusEl.classList.toggle('playing', !!playing);
    // The state stays available to screen readers and as a tooltip.
    const stateLabel = playing ? t.playing : paused ? t.paused : t.stopped;
    if (statusEl.title !== stateLabel) { statusEl.title = stateLabel; statusEl.setAttribute('aria-label', `${stateLabel} · ${playerName}`); }
    this._patch('status', `<span class="eq"><i></i><i></i><i></i></span>
      <span class="st-player">${svg('mdi:speaker')}<span>${esc(playerName)}</span></span>`);
    this._patch('players', activePlayers.length > 1
      ? activePlayers.map((player) => `<button class="${player.entity === entity ? 'active' : ''}"
          data-act="player" data-entity="${esc(player.entity)}">${svg('mdi:speaker')}<span>${esc(player.name || player.entity)}</span></button>`).join('')
      : '');

    // The cover, the lyrics and the queue are only rebuilt when what they show
    // changes. Home Assistant rotates the access token in the picture URL every
    // few minutes: that is the same picture and must not reload the image.
    const pictureKey = picture.replace(/([?&])token=[^&]*/g, '$1');
    let coverKey;
    let coverHtml;
    if (this._queueOpen) {
      coverHtml = this._queueHtml(t);
      const qs = this._qs;
      coverKey = `queue|${qs ? qs.generation : 0}|${!qs || qs.loading === 'all' ? 'loading' : qs.items.length ? 'list' : 'empty'}`;
    } else if (this._lyricsVisible && this._lyricsAvailable) {
      // No 'active' class here: _updateLyrics moves it without a rebuild.
      coverHtml = `<div class="pane lyrics-pane" id="lyrics-pane"><div class="lyrics-lines">${this._lyricsLines
        .map((line, index) => `<div class="lyric-line" data-lyric-index="${index}">${esc(line.text)}</div>`)
        .join('')}</div></div>`;
      coverKey = `lyrics|${this._queueContextKey}|${this._lyricsLines.length}`;
    } else {
      coverHtml = picture ? `<img class="cover" src="${esc(picture)}" alt="${esc(t.coverOf)} ${esc(title)}">`
        : `<div class="cover-empty">${svg('mdi:music')}</div>`;
      coverKey = `img|${pictureKey}`;
    }
    const cover = $('cover');
    if (cover._key !== coverKey) {
      cover._key = coverKey;
      cover.innerHTML = coverHtml;
      this._activeLyricIndex = -1;
      if (this._queueOpen) requestAnimationFrame(() => this._queueScroll());
    }
    const background = $('background');
    if (background._key !== pictureKey) {
      background._key = pictureKey;
      background.style.backgroundImage = picture ? `url("${picture.replace(/["\\\n\r]/g, '')}")` : '';
    }
    $('title').textContent = title;
    $('artist').textContent = artist;
    $('album').textContent = album && album !== title ? album : '';
    const providerIcon = /spotify/i.test(provider) ? 'mdi:spotify'
      : /youtube/i.test(provider) ? 'mdi:youtube' : /radio/i.test(provider) ? 'mdi:radio' : 'mdi:music-circle-outline';
    this._patch('context', provider ? `${svg(providerIcon)}<span>${esc(provider)}</span>` : '');

    const duration = Number(attributes.media_duration) || 0;
    const progress = $('progress');
    progress.hidden = duration <= 0;
    progress.disabled = !this._supports(attributes, 2);

    const canPlayPause = playing ? this._supports(attributes, 1) : this._supports(attributes, 16384);
    const button = (cls, act, label, icon) =>
      `<button class="btn ${cls}" data-act="${act}" title="${esc(label)}" aria-label="${esc(label)}">${svg(icon)}</button>`;
    const shuffle = this._supports(attributes, 32768)
      ? button(`sm${attributes.shuffle ? ' on' : ''}`, 'shuffle', t.shuffle, 'mdi:shuffle-variant') : '<span class="btn sm"></span>';
    const repeat = this._supports(attributes, 131072)
      ? button(`sm${attributes.repeat && attributes.repeat !== 'off' ? ' on' : ''}`, 'repeat', t.repeat,
        attributes.repeat === 'one' ? 'mdi:repeat-once' : 'mdi:repeat') : '<span class="btn sm"></span>';
    this._patch('transport', `${shuffle}
      ${this._supports(attributes, 16) ? button('md', 'previous', t.previous, 'mdi:skip-previous') : ''}
      ${canPlayPause ? button('play', 'play-pause', playing ? t.pause : t.play, playing ? 'mdi:pause' : 'mdi:play') : ''}
      ${this._supports(attributes, 32) ? button('md', 'next', t.next, 'mdi:skip-next') : ''}
      ${repeat}`);

    const favorite = this._queueContext || {};
    const hasFavorite = !!favorite.favoriteAccount && !!favorite.itemId && typeof favorite.favorite === 'boolean';
    const hasQueue = !!(attributes.active_queue && this._cfg.config_entry_id);
    const favLabel = favorite.favorite ? t.favRemove : t.favAdd;
    this._patch('actions', [
      hasFavorite ? button(`fav${favorite.favorite ? ' on' : ''}`, 'favorite', favLabel,
        favorite.favorite ? 'mdi:heart' : 'mdi:heart-outline') : '',
      hasQueue ? button(this._queueOpen ? 'on' : '', 'queue', t.queue, 'mdi:playlist-music') : '',
      this._lyricsAvailable ? button(this._lyricsVisible ? 'on' : '', 'lyrics', t.lyrics, 'mdi:microphone-variant') : '',
    ].join(''));

    // The slider itself is only built once; its value is set by _syncVolume.
    const hasVolume = this._supports(attributes, 4) && Number.isFinite(Number(attributes.volume_level));
    this._patch('volume-row', hasVolume ? `
      <button class="btn" data-vol="-1" title="${esc(t.volDown)}" aria-label="${esc(t.volDown)}">${svg('mdi:volume-minus')}</button>
      ${volumeControlHtml('Volume')}
      <button class="btn" data-vol="1" title="${esc(t.volUp)}" aria-label="${esc(t.volUp)}">${svg('mdi:volume-plus')}</button>
      <span class="vol-label"></span>` : '');
    $('bottom').hidden = !hasVolume;    if ($('notice').textContent !== this._notice) $('notice').textContent = this._notice;
  }

  _time(seconds) {
    const value = Math.max(0, Math.floor(Number(seconds) || 0));
    return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
  }

  _parseLrc(content) {
    const lines = [];
    let offset = 0;
    for (const raw of String(content || '').split(/\r?\n/)) {
      const offsetTag = raw.match(/^\[offset:([+-]?\d+)\]/i);
      if (offsetTag) {
        offset = Number(offsetTag[1]) / 1000;
        continue;
      }
      const stamps = Array.from(raw.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g));
      const text = raw.replace(/\[[^\]]+\]/g, '').trim();
      if (!text || !stamps.length) continue;
      for (const stamp of stamps) {
        const fraction = stamp[3] ? Number(`0.${stamp[3]}`) : 0;
        lines.push({
          time: Math.max(0, Number(stamp[1]) * 60 + Number(stamp[2]) + fraction + offset),
          text,
        });
      }
    }
    return lines.sort((left, right) => left.time - right.time);
  }

  async _loadLyrics(uri, key) {
    try {
      const result = await this._hass.callWS({
        type: 'call_service',
        domain: DOMAIN,
        service: 'get_track_lyrics',
        service_data: { config_entry_id: this._cfg.config_entry_id, uri },
        return_response: true,
      });
      if (this._queueContextKey !== key) return;
      const response = (result && result.response) || result || {};
      this._lyricsLines = this._parseLrc(response.lrc_lyrics);
      this._lyricsAvailable = this._lyricsLines.length > 0;
      this._lyricsVisible = this._lyricsVisible && this._lyricsAvailable;
    } catch (error) {
      if (this._queueContextKey !== key) return;
      this._lyricsLines = [];
      this._lyricsAvailable = false;
      this._lyricsVisible = false;
    }
    this._activeLyricIndex = -1;
    this._signature = '';
    this._sync();
  }

  _updateLyrics(position) {
    // Hidden lyrics cost nothing: the active line is found when they are shown.
    if (!this._lyricsVisible || !this._lyricsAvailable || !this._lyricsLines.length) return;
    let active = -1;
    for (let index = 0; index < this._lyricsLines.length; index++) {
      if (this._lyricsLines[index].time > position) break;
      active = index;
    }
    if (active === this._activeLyricIndex) return;
    this._activeLyricIndex = active;
    const pane = this.shadowRoot.getElementById('lyrics-pane');
    const lines = this.shadowRoot.querySelectorAll('.lyric-line');
    lines.forEach((line, index) => line.classList.toggle('active', index === active));
    if (!this._lyricsVisible || active < 0 || !pane || !lines[active]) return;
    const line = lines[active];
    const paneRect = pane.getBoundingClientRect();
    const lineRect = line.getBoundingClientRect();
    const top = pane.scrollTop + lineRect.top - paneRect.top - (pane.clientHeight - lineRect.height) / 2;
    pane.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  _updateProgress() {
    if (!this.shadowRoot) return;
    const state = this._state(this._entity);
    const attributes = (state && state.attributes) || {};
    const duration = Number(attributes.media_duration) || 0;
    if (!state || !duration) {
      this._updateLyrics(Number(attributes.media_position) || 0);
      return;
    }
    let position = Number(attributes.media_position) || 0;
    if (state.state === 'playing' && attributes.media_position_updated_at) {
      const updated = Date.parse(attributes.media_position_updated_at);
      if (Number.isFinite(updated)) position += (Date.now() - updated) / 1000;
    }
    position = Math.max(0, Math.min(duration, position));
    const percent = (position / duration) * 100;
    const fill = this.shadowRoot.getElementById('fill');
    const thumb = this.shadowRoot.getElementById('thumb');
    if (fill) fill.style.width = `${percent}%`;
    if (thumb) thumb.style.left = `${percent}%`;
    const current = this.shadowRoot.getElementById('position');
    const total = this.shadowRoot.getElementById('duration');
    if (current) current.textContent = this._time(position);
    if (total) total.textContent = this._time(duration);
    this._updateLyrics(position);
  }

  async _service(service, data = {}, entity = this._entity) {
    if (!entity || !this._hass) return;
    try {
      await this._hass.callService('media_player', service, data, { entity_id: entity });
      this._notice = '';
    } catch (error) {
      this._notice = error && error.message ? error.message : String(error);
    }
    this._signature = '';
    this._sync();
  }

  async _loadQueueContext(entity, key) {
    try {
      const result = await this._hass.callWS({
        type: 'call_service', domain: 'music_assistant', service: 'get_queue',
        service_data: {}, target: { entity_id: entity }, return_response: true,
      });
      if (this._queueContextKey !== key) return;
      const response = (result && result.response) || result || {};
      const queue = response[entity] || {};
      const trackUri = queue.current_item && queue.current_item.media_item
        ? queue.current_item.media_item.uri : '';
      const stream = (queue.current_item && queue.current_item.stream_details) || {};
      const itemId = stream.item_id || '';
      const account = this._favoriteAccount(stream.provider);
      this._queueContext = {
        provider: stream.provider || '', itemId, favoriteAccount: account, favorite: null, trackUri,
      };
    } catch (error) {
      if (this._queueContextKey !== key) return;
      this._queueContext = null;
      this._signature = '';
      this._sync();
      return;
    }
    this._signature = '';
    this._sync();
    const context = this._queueContext;
    if (context.trackUri) this._loadLyrics(context.trackUri, key);
    if (!context.favoriteAccount || !context.itemId) return;
    try {
      const result = await this._hass.callWS({
        type: 'call_service', domain: 'spotifyplus', service: 'check_track_favorites',
        service_data: { entity_id: context.favoriteAccount, ids: context.itemId },
        return_response: true,
      });
      if (this._queueContextKey !== key || this._queueContext !== context) return;
      const response = (result && result.response) || result || {};
      const favorites = response.result || {};
      context.favorite = !!favorites[`spotify:track:${context.itemId}`];
    } catch (error) {
      if (this._queueContextKey !== key || this._queueContext !== context) return;
      context.favorite = null;
    }
    this._signature = '';
    this._sync();
  }

  async _toggleFavorite() {
    const context = this._queueContext;
    if (!context || !context.favoriteAccount || !context.itemId
      || typeof context.favorite !== 'boolean') return;
    try {
      await this._hass.callService('spotifyplus',
        context.favorite ? 'remove_track_favorites' : 'save_track_favorites',
        { entity_id: context.favoriteAccount, ids: context.itemId });
      context.favorite = !context.favorite;
      this._notice = '';
    } catch (error) {
      this._notice = error && error.message ? error.message : String(error);
    }
    this._signature = '';
    this._sync();
  }

  _click(event) {
    const target = event.composedPath().find((node) => node && node.dataset && node.dataset.act);
    if (!target) return;
    const state = this._state(this._entity);
    const attributes = (state && state.attributes) || {};
    if (target.dataset.act === 'player') {
      this._selected = target.dataset.entity;
      this._signature = '';
      this._sync();
    } else if (target.dataset.act === 'play-pause') {
      this._service(state && ['playing', 'buffering'].includes(state.state) ? 'media_pause' : 'media_play');
    } else if (target.dataset.act === 'previous') this._service('media_previous_track');
    else if (target.dataset.act === 'next') this._service('media_next_track');
    else if (target.dataset.act === 'shuffle') this._service('shuffle_set', { shuffle: !attributes.shuffle });
    else if (target.dataset.act === 'repeat') {
      const repeat = attributes.repeat || 'off';
      this._service('repeat_set', { repeat: repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off' });
    } else if (target.dataset.act === 'seek') {
      const rect = target.getBoundingClientRect();
      const duration = Number(attributes.media_duration) || 0;
      if (rect.width && duration) this._service('media_seek', {
        seek_position: Math.max(0, Math.min(duration, (event.clientX - rect.left) / rect.width * duration)),
      });
    } else if (target.dataset.act === 'favorite') {
      this._toggleFavorite();
    } else if (target.dataset.act === 'q-del') {
      this._removeQueueItem(target);
    } else if (target.dataset.act === 'queue') {
      if (this._queueOpen) {
        this._queueOpen = false;
        const cover = this.shadowRoot.getElementById('cover');
        if (cover) cover._key = null;
        this._signature = '';
        this._sync();
      } else { this._lyricsVisible = false; this._loadQueue(); }
    } else if (target.dataset.act === 'lyrics') {
      this._lyricsVisible = !this._lyricsVisible;
      if (this._lyricsVisible) this._queueOpen = false;
      this._activeLyricIndex = -1;
      this._signature = '';
      this._sync();
    }
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    this._timer = null;
    if (this._resizeListener) {
      window.removeEventListener('resize', this._resizeListener);
      this._resizeListener = null;
    }
  }
}


// ---------------------------------------------------------------------------
// Visual settings. All options use selectors and input fields; no YAML needed.
// ---------------------------------------------------------------------------


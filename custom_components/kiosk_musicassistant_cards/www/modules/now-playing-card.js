import { VEILIG, esc, svg, taalVan } from './shared.js';
import { THEME_COLORS } from './kiosk-theme.js';

const DOMAIN = 'kiosk_musicassistant_cards';

const NOW_PLAYING_STYLE = `
:host { display:block; width:100%; color:#fff; container-type:inline-size; container-name:np;
  --np-acc:#f6b26b; --np-acc2:#e5739b; }
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
.q-list { flex:1; overflow:auto; scrollbar-width:none; padding:0 12px 12px; }
.q-row { display:grid; grid-template-columns:64px minmax(0,1fr); gap:14px; align-items:center;
  padding:10px; border-radius:16px; }
.q-row.now { background:rgba(255,255,255,.09); }
.q-row img,.q-ph { width:64px; height:64px; border-radius:10px; object-fit:cover; }
.q-ph { display:grid; place-items:center; background:rgba(255,255,255,.08); color:rgba(255,255,255,.5); }
.q-tx { min-width:0; }
.q-label { font-size:11px; font-weight:800; letter-spacing:.8px; text-transform:uppercase; color:var(--np-acc); }
.q-name { font-size:17px; font-weight:700; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.q-art { font-size:14px; color:rgba(255,255,255,.6); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.q-more,.pane-empty { padding:12px 14px; font-size:14px; color:rgba(255,255,255,.6); }

/* right: one column as tall as the cover - status on top, controls at the bottom */
.side { display:flex; flex-direction:column; justify-content:space-between; gap:16px; min-width:0;
  height:var(--cov); max-height:100%; }
.top { display:flex; align-items:center; gap:8px; flex-wrap:wrap; min-width:0; }
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
.bottom { display:flex; align-items:center; gap:4px; min-height:60px; padding:6px; border-radius:999px;
  background:rgba(255,255,255,.08); box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);
  -webkit-backdrop-filter:blur(16px); backdrop-filter:blur(16px); }
.bottom[hidden] { display:none; }
.actions { display:flex; gap:2px; flex:none; }
.actions:empty { display:none; }
.actions .btn { width:48px; height:48px; color:rgba(255,255,255,.82); }
.actions .btn ha-icon { --mdc-icon-size:23px; }
.actions .btn.on { background:#fff; color:#0a141c; }
.actions .btn.fav.on { background:transparent; color:var(--np-acc); }
.actions:not(:empty) + .volume-row { margin-left:6px; padding-left:8px; border-left:1px solid rgba(255,255,255,.14); }
.volume-row { display:flex; flex:1; align-items:center; gap:2px; min-width:0; }
.volume-row:empty { display:none; }
.volume-row .btn { width:44px; height:44px; color:rgba(255,255,255,.75); }
.volume-row .btn ha-icon { --mdc-icon-size:22px; }
.volume-range { -webkit-appearance:none; appearance:none; flex:1; min-width:40px; height:44px; margin:0 4px;
  background:transparent; cursor:pointer; touch-action:pan-y; }
.volume-range::-webkit-slider-runnable-track { height:6px; border-radius:99px;
  background:linear-gradient(90deg,#fff 0 var(--v,0%),rgba(255,255,255,.2) var(--v,0%) 100%); }
.volume-range::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; margin-top:-7px;
  border-radius:50%; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,.45); }
.volume-range::-moz-range-track { height:6px; border-radius:99px; background:rgba(255,255,255,.2); }
.volume-range::-moz-range-progress { height:6px; border-radius:99px; background:#fff; }
.volume-range::-moz-range-thumb { width:20px; height:20px; border:0; border-radius:50%; background:#fff; }
.vol-label { min-width:48px; padding-right:12px; text-align:right; font-size:13px; font-weight:750;
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
`;

export class KioskNowPlayingCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._selected = null;
    this._signature = '';
    this._queue = [];
    this._queueTotal = 0;
    this._queueContextKey = '';
    this._queueContext = null;
    this._queueOpen = false;
    this._queueBusy = false;
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

  _t() {
    const lang = taalVan(this._cfg.language, this._hass && this._hass.language);
    return Object.assign({}, lang.np, {
      stil: lang.stil, shuffle: lang.shuffleTitel, repeat: lang.herhaalTitel, tracks: lang.nummers, track1: lang.nummer,
    });
  }

  _volumeStep() {
    const step = parseFloat(this._cfg.volume_step);
    return (Number.isFinite(step) && step > 0 && step <= 100 ? step : 5) / 100;
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
    const t = this._t();
    this.shadowRoot.innerHTML = `<style>${NOW_PLAYING_STYLE}</style>
      <section class="shell" style="--now-playing-height:${height}px;${this._themeStyle()}">
        <div class="background" id="background"></div><div class="shade"></div>
        <div class="layout">
          <div class="cover-area" id="cover"></div>
          <div class="side">
            <div class="top"><div class="status" id="status"></div><div class="players" id="players"></div></div>
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
            <div class="bottom" id="bottom"><div class="actions" id="actions"></div><div class="volume-row" id="volume-row"></div></div>
          </div>
        </div>
        <div class="notice" id="notice"></div>
      </section>`;
    this.shadowRoot.addEventListener('click', (event) => this._click(event));
    this.shadowRoot.addEventListener('change', (event) => this._change(event));
    this.shadowRoot.addEventListener('input', (event) => this._input(event));
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
    return String(attributes.source || attributes.app_id || this._t().external);
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
    }
    const picture = VEILIG(attributes.entity_picture_local || attributes.entity_picture || '');
    const signature = [entity, state && state.state, attributes.media_title, attributes.media_artist,
      attributes.media_album_name, attributes.media_content_id, picture, attributes.active_queue,
      attributes.shuffle, attributes.repeat, attributes.supported_features,
      attributes.volume_level, this._selected,
      this._queueContext && this._queueContext.provider,
      this._queueContext && this._queueContext.itemId,
      this._queueContext && this._queueContext.favorite,
      this._lyricsAvailable, this._lyricsVisible, this._lyricsLines.length,
      this._players.map((player) => {
        const current = this._state(player.entity);
        return `${player.entity}:${current ? current.state : ''}`;
      }).join(','),
      this._queueOpen, this._queueBusy, this._notice].join('|');
    if (signature !== this._signature) {
      this._signature = signature;
      this._render(state, attributes, picture);
    }
    this._updateProgress();
  }

  // Accent colours from the same palettes as the browser card (theme: ocean...).
  _themeStyle() {
    const colors = THEME_COLORS[this._cfg.theme] || THEME_COLORS.sunset;
    return `--np-acc:${colors.acc};--np-acc2:${colors.acc2};`;
  }

  _queueHtml(t) {
    const head = `<div class="pane-head">${svg('mdi:playlist-music')}<span>${esc(t.queue)}${this._queueTotal
      ? ` · ${this._queueTotal} ${esc(this._queueTotal === 1 ? t.track1 : t.tracks)}` : ''}</span>
      <button class="close" data-act="queue" aria-label="${esc(t.queue)}">${svg('mdi:close')}</button></div>`;
    if (this._queueBusy) return `<div class="pane">${head}<div class="pane-empty">${esc(t.queueLoading)}</div></div>`;
    if (!this._queue.length) return `<div class="pane">${head}<div class="pane-empty">${esc(t.queueEmpty)}</div></div>`;
    const rows = this._queue.map((item, index) => {
      const media = item.media_item || {};
      const image = VEILIG(media.image || item.image || '');
      const name = media.name || item.name || item.title || item.media_title || t.track;
      const artists = (media.artists || []).map((artist) => artist && artist.name).filter(Boolean).slice(0, 2).join(', ');
      return `<div class="q-row${index === 0 ? ' now' : ''}">
        ${image ? `<img alt="" src="${esc(image)}">` : `<span class="q-ph">${svg('mdi:music')}</span>`}
        <div class="q-tx"><div class="q-label">${esc(index === 0 ? t.nowLabel : t.nextLabel)}</div>
          <div class="q-name">${esc(name)}</div>${artists ? `<div class="q-art">${esc(artists)}</div>` : ''}</div></div>`;
    }).join('');
    const more = this._queueTotal > this._queue.length
      ? `<div class="q-more">+ ${this._queueTotal - this._queue.length} ${esc(t.tracks)}</div>` : '';
    return `<div class="pane">${head}<div class="q-list">${rows}${more}</div></div>`;
  }

  _render(state, attributes, picture) {
    const entity = this._entity;
    const configured = this._players.find((player) => player.entity === entity) || {};
    const playing = state && ['playing', 'buffering'].includes(state.state);
    const paused = state && state.state === 'paused';
    const t = this._t();
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

    const status = $('status');
    status.classList.toggle('playing', !!playing);
    status.innerHTML = `<span class="eq"><i></i><i></i><i></i></span>
      <span class="st-label">${esc(playing ? t.playing : paused ? t.paused : t.stopped)}</span>
      <span class="st-player">${svg('mdi:speaker')}<span>${esc(playerName)}</span></span>`;
    $('players').innerHTML = activePlayers.length > 1
      ? activePlayers.map((player) => `<button class="${player.entity === entity ? 'active' : ''}"
          data-act="player" data-entity="${esc(player.entity)}">${svg('mdi:speaker')}<span>${esc(player.name || player.entity)}</span></button>`).join('')
      : '';

    const cover = $('cover');
    if (this._queueOpen) cover.innerHTML = this._queueHtml(t);
    else if (this._lyricsVisible && this._lyricsAvailable) {
      cover.innerHTML = `<div class="pane lyrics-pane" id="lyrics-pane"><div class="lyrics-lines">${this._lyricsLines
        .map((line, index) => `<div class="lyric-line${index === this._activeLyricIndex ? ' active' : ''}" data-lyric-index="${index}">${esc(line.text)}</div>`)
        .join('')}</div></div>`;
    } else {
      cover.innerHTML = picture ? `<img class="cover" src="${esc(picture)}" alt="${esc(t.coverOf)} ${esc(title)}">`
        : `<div class="cover-empty">${svg('mdi:music')}</div>`;
    }
    $('background').style.backgroundImage = picture
      ? `url("${picture.replace(/["\\\n\r]/g, '')}")` : '';

    $('title').textContent = title;
    $('artist').textContent = artist;
    $('album').textContent = album && album !== title ? album : '';
    const providerIcon = /spotify/i.test(provider) ? 'mdi:spotify'
      : /youtube/i.test(provider) ? 'mdi:youtube' : /radio/i.test(provider) ? 'mdi:radio' : 'mdi:music-circle-outline';
    $('context').innerHTML = provider ? `${svg(providerIcon)}<span>${esc(provider)}</span>` : '';

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
    $('transport').innerHTML = `${shuffle}
      ${this._supports(attributes, 16) ? button('md', 'previous', t.previous, 'mdi:skip-previous') : ''}
      ${canPlayPause ? button('play', 'play-pause', playing ? t.pause : t.play, playing ? 'mdi:pause' : 'mdi:play') : ''}
      ${this._supports(attributes, 32) ? button('md', 'next', t.next, 'mdi:skip-next') : ''}
      ${repeat}`;

    const favorite = this._queueContext || {};
    const hasFavorite = !!favorite.favoriteAccount && !!favorite.itemId && typeof favorite.favorite === 'boolean';
    const hasQueue = !!(attributes.active_queue && this._cfg.config_entry_id);
    const favLabel = favorite.favorite ? t.favRemove : t.favAdd;
    $('actions').innerHTML = [
      hasFavorite ? button(`fav${favorite.favorite ? ' on' : ''}`, 'favorite', favLabel,
        favorite.favorite ? 'mdi:heart' : 'mdi:heart-outline') : '',
      hasQueue ? button(this._queueOpen ? 'on' : '', 'queue', t.queue, 'mdi:playlist-music') : '',
      this._lyricsAvailable ? button(this._lyricsVisible ? 'on' : '', 'lyrics', t.lyrics, 'mdi:microphone-variant') : '',
    ].join('');

    const volume = Number(attributes.volume_level);
    const hasVolume = this._supports(attributes, 4) && Number.isFinite(volume);
    const percent = Math.round((hasVolume ? volume : 0) * 100);
    $('volume-row').innerHTML = hasVolume ? `
      ${button('', 'volume-down', t.volDown, percent === 0 ? 'mdi:volume-off' : 'mdi:volume-low')}
      <input class="volume-range" data-act="volume" type="range" min="0" max="1" step="0.01" value="${volume}"
        style="--v:${percent}%" aria-label="Volume">
      ${button('', 'volume-up', t.volUp, 'mdi:volume-high')}
      <span class="vol-label" id="vol-label">${percent}%</span>` : '';
    $('bottom').hidden = !hasVolume && !$('actions').innerHTML;
    $('notice').textContent = this._notice;
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
    if (!this._lyricsAvailable || !this._lyricsLines.length) return;
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

  async _loadQueue() {
    const state = this._state(this._entity);
    const queueId = state && state.attributes && state.attributes.active_queue;
    if (!queueId || !this._cfg.config_entry_id) return;
    this._queueOpen = true;
    this._queueBusy = true;
    this._sync();
    try {
      const result = await this._hass.callWS({
        type: 'call_service', domain: 'music_assistant', service: 'get_queue',
        service_data: {}, target: { entity_id: this._entity },
        return_response: true,
      });
      const response = (result && result.response) || result || {};
      const queue = response[this._entity] || {};
      this._queue = [queue.current_item, queue.next_item].filter(Boolean);
      this._queueTotal = Number(queue.items) || this._queue.length;
      this._notice = '';
    } catch (error) {
      this._queue = [];
      this._queueTotal = 0;
      this._notice = error && error.message ? error.message : String(error);
    }
    this._queueBusy = false;
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
    } else if (target.dataset.act === 'volume-down' || target.dataset.act === 'volume-up') {
      const current = Number(attributes.volume_level) || 0;
      const change = target.dataset.act === 'volume-up' ? this._volumeStep() : -this._volumeStep();
      const volume = Math.max(0, Math.min(1, Math.round((current + change) * 100) / 100));
      this._service('volume_set', { volume_level: volume });
    } else if (target.dataset.act === 'seek') {
      const rect = target.getBoundingClientRect();
      const duration = Number(attributes.media_duration) || 0;
      if (rect.width && duration) this._service('media_seek', {
        seek_position: Math.max(0, Math.min(duration, (event.clientX - rect.left) / rect.width * duration)),
      });
    } else if (target.dataset.act === 'favorite') {
      this._toggleFavorite();
    } else if (target.dataset.act === 'queue') {
      if (this._queueOpen) { this._queueOpen = false; this._sync(); } else { this._lyricsVisible = false; this._loadQueue(); }
    } else if (target.dataset.act === 'lyrics') {
      this._lyricsVisible = !this._lyricsVisible;
      if (this._lyricsVisible) this._queueOpen = false;
      this._activeLyricIndex = -1;
      this._signature = '';
      this._sync();
    }
  }

  // Move the slider fill and the label while dragging; the volume is sent on release.
  _input(event) {
    const range = event.target;
    if (!range || !range.dataset || range.dataset.act !== 'volume') return;
    const percent = Math.round(Number(range.value) * 100);
    range.style.setProperty('--v', `${percent}%`);
    const label = this.shadowRoot.getElementById('vol-label');
    if (label) label.textContent = `${percent}%`;
  }

  _change(event) {
    if (event.target && event.target.dataset && event.target.dataset.act === 'volume') {
      this._service('volume_set', { volume_level: Number(event.target.value) });
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
// Visuele instellingen. Alles met keuzelijsten en invulvelden; YAML hoeft niet.
// ---------------------------------------------------------------------------


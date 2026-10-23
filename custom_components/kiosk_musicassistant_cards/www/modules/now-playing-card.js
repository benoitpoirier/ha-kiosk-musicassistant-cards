import { VEILIG, esc, svg, taalVan } from './shared.js';

const DOMAIN = 'kiosk_musicassistant_cards';

const NOW_PLAYING_STYLE = `
:host { display:block; width:100%; height:100%; min-height:480px; color:#fff; }
* { box-sizing:border-box; }
.shell { position:relative; isolation:isolate; width:100%; height:var(--now-playing-height,560px);
  min-height:480px; max-height:780px; overflow:hidden; border-radius:14px; background:#073d49; }
.background { position:absolute; z-index:-2; inset:-40px; background-position:center; background-size:cover;
  filter:blur(34px) saturate(1.12) brightness(.56); transform:scale(1.1); }
.shade { position:absolute; z-index:-1; inset:0;
  background:linear-gradient(105deg,rgba(4,61,70,.28),rgba(5,29,48,.86)); }
.layout { position:relative; display:grid; grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);
  grid-template-rows:minmax(0,1fr) auto; align-items:stretch; gap:18px 28px; height:100%; padding:28px; }
.cover-area { display:grid; grid-row:1 / span 2; min-width:0; place-items:center; }
.cover,.cover-empty { width:min(100%,380px); aspect-ratio:1; border-radius:20px;
  box-shadow:0 18px 44px rgba(0,0,0,.4); }
.cover { object-fit:cover; }
.cover-empty { display:grid; place-items:center; background:rgba(0,0,0,.22); color:rgba(255,255,255,.65); }
.cover-empty ha-icon { --mdc-icon-size:72px; }
.lyrics-pane { width:min(100%,380px); aspect-ratio:1; overflow:auto; border-radius:20px;
  background:rgba(0,0,0,.22); box-shadow:0 18px 44px rgba(0,0,0,.4); scrollbar-width:none; }
.lyrics-pane::-webkit-scrollbar { display:none; }
.lyrics-lines { display:flex; min-height:100%; flex-direction:column; align-items:center;
  justify-content:center; gap:14px; padding:24px 18px; text-align:center; }
.lyric-line { flex:none; color:rgba(255,255,255,.56); font-size:17px; font-weight:550;
  line-height:1.35; overflow-wrap:anywhere; transition:color .25s, opacity .25s, font-size .25s; }
.lyric-line.active { color:#fff; font-size:22px; font-weight:750; }
.side { display:flex; grid-column:2; grid-row:1; min-width:0; flex-direction:column; justify-content:center; gap:14px; padding:28px 4px 0 0; }
.bottom-controls { display:flex; grid-column:2; grid-row:2; min-width:0; flex-direction:column; gap:6px; padding:0 4px 4px 0; }
.status { position:absolute; top:14px; right:14px; z-index:1; display:flex; align-items:center; gap:7px;
  max-width:calc(100% - 28px); padding:8px 13px; border-radius:999px; background:rgba(0,18,27,.72);
  font-size:13px; font-weight:650; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.status ha-icon { --mdc-icon-size:16px; flex:none; }
.players { display:flex; flex-wrap:wrap; gap:7px; min-height:0; }
.players:empty { display:none; }
.players button { display:inline-flex; align-items:center; gap:6px; min-height:38px; padding:0 11px;
  border:1px solid rgba(255,255,255,.22); border-radius:999px; background:rgba(0,24,34,.38);
  color:rgba(255,255,255,.78); font:inherit; font-size:13px; }
.players button.active { border-color:rgba(255,255,255,.72); background:rgba(255,255,255,.18); color:#fff; }
.players ha-icon { --mdc-icon-size:17px; }
.title { max-height:2.22em; overflow:hidden; font-size:36px; font-weight:750; line-height:1.1;
  overflow-wrap:anywhere; }
.artist { overflow:hidden; color:rgba(255,255,255,.78); font-size:22px; line-height:1.3; text-overflow:ellipsis; white-space:nowrap; }
.album { overflow:hidden; color:rgba(255,255,255,.64); font-size:18px; line-height:1.3; text-overflow:ellipsis; white-space:nowrap; }
.context { overflow:hidden; color:rgba(255,255,255,.62); font-size:13px; text-overflow:ellipsis; white-space:nowrap; }
.progress { position:relative; display:block; width:100%; height:48px; padding:0; border:0; background:transparent; color:inherit; }
.track { position:absolute; top:20px; right:0; left:0; height:5px; overflow:hidden; border-radius:99px; background:rgba(255,255,255,.3); }
.fill { display:block; width:0; height:100%; border-radius:inherit; background:#fff; transition:width .2s linear; }
.thumb { position:absolute; top:50%; left:0; width:16px; height:16px; border-radius:50%; background:#fff;
  box-shadow:0 1px 4px rgba(0,0,0,.3); transform:translate(-50%,-50%); }
.times { display:flex; justify-content:space-between; margin-top:29px; color:rgba(255,255,255,.72); font-size:13px; }
.transport,.actions { display:flex; align-items:center; justify-content:center; gap:14px; }
button.icon { display:grid; flex:none; width:48px; height:48px; place-items:center; border:0; border-radius:50%;
  background:transparent; color:rgba(255,255,255,.78); }
button.icon:disabled { opacity:.35; }
button.icon ha-icon { --mdc-icon-size:27px; }
button.play { width:76px; height:76px; background:#fff; color:#092d39; }
button.play ha-icon { --mdc-icon-size:38px; }
button.on { color:#fff; background:rgba(255,255,255,.16); }
.actions { justify-content:flex-start; gap:5px; }
.actions button.icon { width:46px; height:46px; }
.volume-row { display:grid; grid-template-columns:46px minmax(0,1fr) 46px; align-items:center;
  gap:10px; width:100%; min-height:48px; }
.volume-row button.icon { width:46px; height:46px; background:rgba(255,255,255,.07); }
.volume-range { width:100%; min-width:0; height:48px; margin:0; padding:0; accent-color:#fff; touch-action:pan-y; }
.queue { max-height:112px; overflow:auto; border-top:1px solid rgba(255,255,255,.16); padding-top:7px; }
.queue-title { padding:0 0 5px; color:rgba(255,255,255,.76); font-size:13px; font-weight:650; }
.queue-row { overflow:hidden; padding:4px 0; color:rgba(255,255,255,.76); font-size:13px; text-overflow:ellipsis; white-space:nowrap; }
.notice { min-height:0; color:#ffd0c7; font-size:13px; }
@media (max-width:700px) {
  :host { min-height:100vh; }
  .shell { height:auto; min-height:100vh; max-height:none; }
  .layout { grid-template-columns:minmax(0,1fr); grid-template-rows:auto auto auto;
    align-content:center; gap:18px; min-height:100vh; padding:76px 20px 20px; }
  .cover-area { grid-column:1; grid-row:1; }
  .cover,.cover-empty { width:min(62vw,300px); }
  .lyrics-pane { width:min(62vw,300px); }
  .lyric-line { font-size:15px; }
  .lyric-line.active { font-size:19px; }
  .side { grid-column:1; grid-row:2; gap:10px; padding:0; }
  .bottom-controls { grid-column:1; grid-row:3; padding:0; }
  .title { font-size:27px; text-align:center; }
  .artist,.album,.context { text-align:center; }
  .transport { gap:10px; }
  .actions { justify-content:center; flex-wrap:wrap; }
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
      stil: lang.stil, shuffle: lang.shuffleTitel, repeat: lang.herhaalTitel, tracks: lang.nummers,
    });
  }

  _volumeStep() {
    const step = parseFloat(this._cfg.volume_step);
    return (Number.isFinite(step) && step > 0 && step <= 100 ? step : 5) / 100;
  }

  connectedCallback() {
    this._startProgressTimer();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot.firstChild) this._build();
    this._startProgressTimer();
    this._sync();
  }

  _startProgressTimer() {
    if (this._timer) return;
    this._timer = setInterval(() => this._updateProgress(), 1000);
  }

  getCardSize() { return 5; }

  _build() {
    const height = Math.max(480, Math.min(780, Number(this._cfg.height) || 560));
    const t = this._t();
    this.shadowRoot.innerHTML = `<style>${NOW_PLAYING_STYLE}</style>
      <section class="shell" style="--now-playing-height:${height}px">
        <div class="background" id="background"></div><div class="shade"></div>
        <div class="status" id="status"></div>
        <div class="layout">
          <div class="cover-area" id="cover"></div>
          <div class="side">
            <div class="players" id="players"></div>
            <div class="title" id="title"></div>
            <div class="artist" id="artist"></div>
            <div class="album" id="album"></div>
            <div class="context" id="context"></div>
            <button class="progress" data-act="seek" id="progress" aria-label="${esc(t.seek)}">
              <span class="track"><span class="fill" id="fill"></span><span class="thumb" id="thumb"></span></span>
              <span class="times"><span id="position">0:00</span><span id="duration">0:00</span></span>
            </button>
            <div class="transport" id="transport"></div>
            <div class="actions" id="actions"></div>
            <div class="queue" id="queue" hidden></div>
            <div class="notice" id="notice"></div>
          </div>
          <div class="bottom-controls">
            <div class="volume-row" id="volume-row"></div>
          </div>
        </div>
      </section>`;
    this.shadowRoot.addEventListener('click', (event) => this._click(event));
    this.shadowRoot.addEventListener('change', (event) => this._change(event));
    this._startProgressTimer();
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

  _render(state, attributes, picture) {
    const entity = this._entity;
    const configured = this._players.find((player) => player.entity === entity) || {};
    const playing = state && ['playing', 'buffering'].includes(state.state);
    const t = this._t();
    const title = attributes.media_title || t.stil;
    const artist = attributes.media_artist || '';
    const album = attributes.media_album_name || '';
    const playerName = attributes.friendly_name || configured.name || entity || '';
    const activePlayers = this._players.filter((player) => {
      const current = this._state(player.entity);
      return current && ['playing', 'buffering'].includes(current.state);
    });
    const provider = this._provider(attributes);
    const status = this.shadowRoot.getElementById('status');
    status.innerHTML = `${svg(playing ? 'mdi:play-circle' : 'mdi:pause-circle')}<span>${esc(playing ? t.playing : state && state.state === 'paused' ? t.paused : t.stopped)} · ${esc(playerName)}</span>`;
    const cover = this.shadowRoot.getElementById('cover');
    cover.innerHTML = this._lyricsVisible && this._lyricsAvailable
      ? `<div class="lyrics-pane" id="lyrics-pane"><div class="lyrics-lines">${this._lyricsLines
        .map((line, index) => `<div class="lyric-line${index === this._activeLyricIndex ? ' active' : ''}" data-lyric-index="${index}">${esc(line.text)}</div>`)
        .join('')}</div></div>`
      : picture ? `<img class="cover" src="${esc(picture)}" alt="${esc(t.coverOf)} ${esc(title)}">`
        : `<div class="cover-empty">${svg('mdi:music')}</div>`;
    this.shadowRoot.getElementById('background').style.backgroundImage = picture
      ? `url("${picture.replace(/["\\\n\r]/g, '')}")` : '';
    this.shadowRoot.getElementById('players').innerHTML = activePlayers.length > 1
      ? activePlayers.map((player) => `<button class="${player.entity === entity ? 'active' : ''}"
          data-act="player" data-entity="${esc(player.entity)}">${svg('mdi:speaker')}<span>${esc(player.name || player.entity)}</span></button>`).join('')
      : '';
    this.shadowRoot.getElementById('title').textContent = title;
    this.shadowRoot.getElementById('artist').textContent = artist;
    this.shadowRoot.getElementById('album').textContent = album;
    this.shadowRoot.getElementById('context').textContent = `${provider} · ${playerName}`;
    const duration = Number(attributes.media_duration) || 0;
    const progress = this.shadowRoot.getElementById('progress');
    progress.hidden = duration <= 0;
    progress.disabled = !this._supports(attributes, 2);
    const canPlayPause = playing ? this._supports(attributes, 1) : this._supports(attributes, 16384);
    this.shadowRoot.getElementById('transport').innerHTML = `
      ${this._supports(attributes, 16) ? `<button class="icon" data-act="previous" title="${esc(t.previous)}" aria-label="${esc(t.previous)}">${svg('mdi:skip-previous')}</button>` : ''}
      ${canPlayPause ? `<button class="icon play" data-act="play-pause" title="${esc(playing ? t.pause : t.play)}" aria-label="${esc(playing ? t.pause : t.play)}">${svg(playing ? 'mdi:pause' : 'mdi:play')}</button>` : ''}
      ${this._supports(attributes, 32) ? `<button class="icon" data-act="next" title="${esc(t.next)}" aria-label="${esc(t.next)}">${svg('mdi:skip-next')}</button>` : ''}`;
    const favorite = this._queueContext || {};
    const hasFavorite = !!favorite.favoriteAccount && !!favorite.itemId
      && typeof favorite.favorite === 'boolean';
    const hasQueue = !!(attributes.active_queue && this._cfg.config_entry_id);
    const volume = Number(attributes.volume_level);
    const favLabel = esc(favorite.favorite ? t.favRemove : t.favAdd);
    this.shadowRoot.getElementById('actions').innerHTML = `
      ${hasFavorite ? `<button class="icon ${favorite.favorite ? 'on' : ''}" data-act="favorite" title="${favLabel}" aria-label="${favLabel}">${svg(favorite.favorite ? 'mdi:heart' : 'mdi:heart-outline')}</button>` : ''}
      ${this._supports(attributes, 32768) ? `<button class="icon ${attributes.shuffle ? 'on' : ''}" data-act="shuffle" title="${esc(t.shuffle)}" aria-label="${esc(t.shuffle)}">${svg('mdi:shuffle')}</button>` : ''}
      ${this._supports(attributes, 131072) ? `<button class="icon ${attributes.repeat && attributes.repeat !== 'off' ? 'on' : ''}" data-act="repeat" title="${esc(t.repeat)}" aria-label="${esc(t.repeat)}">${svg(attributes.repeat === 'one' ? 'mdi:repeat-once' : 'mdi:repeat')}</button>` : ''}
      ${hasQueue ? `<button class="icon ${this._queueOpen ? 'on' : ''}" data-act="queue" title="${esc(t.queue)}" aria-label="${esc(t.queue)}">${svg('mdi:playlist-music')}</button>` : ''}
      ${this._lyricsAvailable ? `<button class="icon ${this._lyricsVisible ? 'on' : ''}" data-act="lyrics" title="${esc(t.lyrics)}" aria-label="${esc(t.lyrics)}">${svg('mdi:menu')}</button>` : ''}`;
    const volumeRow = this.shadowRoot.getElementById('volume-row');
    const hasVolume = this._supports(attributes, 4) && Number.isFinite(volume);
    volumeRow.style.display = hasVolume ? 'grid' : 'none';
    volumeRow.innerHTML = hasVolume ? `
      <button class="icon" data-act="volume-down" title="${esc(t.volDown)}" aria-label="${esc(t.volDown)}">${svg('mdi:volume-minus')}</button>
      <input class="volume-range" data-act="volume" type="range" min="0" max="1" step="0.01" value="${volume}" aria-label="Volume">
      <button class="icon" data-act="volume-up" title="${esc(t.volUp)}" aria-label="${esc(t.volUp)}">${svg('mdi:volume-plus')}</button>` : '';
    const queue = this.shadowRoot.getElementById('queue');
    queue.hidden = !this._queueOpen;
    queue.innerHTML = this._queueBusy ? `<div class="queue-title">${esc(t.queueLoading)}</div>`
      : this._queueOpen ? `<div class="queue-title">${esc(t.queue)}${this._queueTotal ? ` · ${this._queueTotal} ${esc(t.tracks)}` : ''}</div>${this._queue.length
        ? this._queue.map((item) => `<div class="queue-row">${esc(item.name || item.title || item.media_title || t.track)}</div>`).join('')
        : `<div class="queue-row">${esc(t.queueEmpty)}</div>`}` : '';
    this.shadowRoot.getElementById('notice').textContent = this._notice;
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
      if (this._queueOpen) { this._queueOpen = false; this._sync(); } else this._loadQueue();
    } else if (target.dataset.act === 'lyrics') {
      this._lyricsVisible = !this._lyricsVisible;
      this._activeLyricIndex = -1;
      this._signature = '';
      this._sync();
    }
  }

  _change(event) {
    if (event.target && event.target.dataset && event.target.dataset.act === 'volume') {
      this._service('volume_set', { volume_level: Number(event.target.value) });
    }
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    this._timer = null;
  }
}


// ---------------------------------------------------------------------------
// Visuele instellingen. Alles met keuzelijsten en invulvelden; YAML hoeft niet.
// ---------------------------------------------------------------------------


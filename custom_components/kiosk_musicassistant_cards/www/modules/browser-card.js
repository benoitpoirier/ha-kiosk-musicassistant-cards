import {
  BIB_MAX, BIB_TTL, GROOT, KLEIN, KORT, RIJEN, SOORTEN, SOORT_VAN,
  SPOTIFY_URI, SPEELT, VEILIG, categoriesParDefaut, esc, mmss, svg, taalVan,
} from './shared.js';

const DOMAIN = 'kiosk_musicassistant_cards';

const STYLE = `
:host {
  display:block;
  container-type:inline-size;
  --acc:#1DB954;
  --ov1:rgba(255,255,255,.05);
  --ov2:rgba(255,255,255,.09);
  --line:rgba(255,255,255,.07);
  --zacht:rgba(255,255,255,.55);
  --flauw:rgba(255,255,255,.34);
}
/* Light or dark follows the Home Assistant theme the card actually sits in, not the
   operating system: a light dashboard on a dark laptop must still get dark text. */
:host(.licht) { --ov1:rgba(0,0,0,.04); --ov2:rgba(0,0,0,.07); --line:rgba(0,0,0,.08);
                --zacht:rgba(0,0,0,.6); --flauw:rgba(0,0,0,.38); }
* { box-sizing:border-box; }

/* Alles staat op een enkel vlak - geen losse kaartjes binnen de kaart. */
.wrap { display:grid; grid-template-columns:288px 1px minmax(0,1fr); gap:18px;
        overflow:hidden; max-width:100%; height:var(--mc-h,556px);
        padding:16px 18px; border-radius:20px;
        background:var(--ha-card-background, var(--card-background-color, #1c1c1e));
        font-family:var(--primary-font-family,sans-serif);
        color:var(--primary-text-color,#e9e9ea); font-size:14px; }
.scheiding { background:var(--line); align-self:stretch; }
.col { display:flex; flex-direction:column; min-width:0; max-width:100%; }
.col > * { max-width:100%; min-width:0; }
.right { min-width:0; max-width:100%; overflow:hidden; }
button { font:inherit; color:inherit; border:0; cursor:pointer; background:none; padding:0;
         transition:opacity .12s, color .12s, background .12s, transform .08s; }
button:active { transform:scale(.96); }
.bezig { opacity:.35 !important; }
ha-icon { pointer-events:none; }

/* zones: een segmentregelaar, geen drie losse knoppen */
.zones { display:grid; grid-template-columns:repeat(var(--zn,3),minmax(0,1fr)); gap:2px;
         background:var(--ov1); border-radius:11px; padding:3px; flex:0 0 auto; }
.sources { margin-top:6px; }
.zones button { height:32px; border-radius:9px; display:flex; align-items:center;
                justify-content:center; position:relative; color:var(--flauw); }
.zones button.on { background:var(--ov2); color:var(--primary-text-color,#e9e9ea); }
.zones ha-icon { --mdc-icon-size:19px; }
.zones button.on ha-icon { color:var(--acc); }
.zones button.speelt::before { content:''; position:absolute; bottom:3px; width:3px; height:3px;
        border-radius:999px; background:var(--acc); }

/* de speler is de hoofdzaak van de linkerkolom */
.np { flex:1 1 auto; min-height:0; display:flex; flex-direction:column;
      align-items:center; justify-content:center; text-align:center; position:relative;
      padding:12px 0 4px; }
.np .glow { position:absolute; top:6px; left:50%; transform:translateX(-50%);
            width:180px; height:180px; border-radius:50%; background-size:cover;
            background-position:center; filter:blur(38px) saturate(1.5); opacity:.4; }
.np .art { position:relative; width:168px; height:168px; border-radius:12px; object-fit:cover;
           box-shadow:0 10px 26px rgba(0,0,0,.45); flex:0 0 auto; }
.np .leegart { position:relative; width:168px; height:168px; border-radius:12px;
               background:var(--ov1); display:flex; align-items:center; justify-content:center;
               flex:0 0 auto; }
.np .leegart ha-icon { --mdc-icon-size:46px; color:var(--flauw); }
.np .tx { position:relative; width:100%; padding:14px 2px 0; }
.np .t { font-size:16px; font-weight:600; letter-spacing:-.2px;
         white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.np .a { font-size:12.5px; color:var(--flauw); margin-top:2px;
         white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.np .op { font-size:10px; font-weight:700; letter-spacing:.5px; text-transform:uppercase;
          color:var(--acc); margin-top:6px; white-space:nowrap; overflow:hidden;
          text-overflow:ellipsis; }
.np .voort { position:relative; width:100%; padding:12px 2px 0; }
.np .vbaan { height:3px; border-radius:999px; background:var(--ov2); }
.np .vfill { height:3px; border-radius:999px; background:var(--zacht); width:0; }
.np .vtijd { display:flex; justify-content:space-between; font-size:10.5px;
             color:var(--flauw); margin-top:5px; font-variant-numeric:tabular-nums; }
.np .ctr { position:relative; display:flex; align-items:center; justify-content:center;
           gap:14px; margin-top:14px; width:100%; }
.np .ctr button { width:34px; height:34px; display:flex; align-items:center;
                  justify-content:center; color:var(--zacht); flex:0 0 auto; }
.np .ctr button:hover { color:var(--primary-text-color,#e9e9ea); }
.np .ctr button.hoofd { width:50px; height:50px; border-radius:999px;
                        background:var(--acc); color:#fff; }
.np .ctr button.hoofd ha-icon { --mdc-icon-size:26px; }
.np .ctr button.shuf.on, .np .ctr button.rep.on { color:var(--acc); }
.np .ctr ha-icon { --mdc-icon-size:22px; }
.np .ctr button.shuf ha-icon, .np .ctr button.rep ha-icon { --mdc-icon-size:18px; }

/* volume */
.volrow { display:flex; align-items:center; gap:12px; flex:0 0 auto; margin-top:14px; }
.volrow > button.vk { width:30px; height:30px; flex:0 0 auto; display:flex;
                      align-items:center; justify-content:center; color:var(--zacht); }
.volrow ha-icon { --mdc-icon-size:21px; }
.volrow .vollbl { flex:0 0 auto; min-width:36px; text-align:right; font-size:12px;
                  font-weight:600; color:var(--zacht); font-variant-numeric:tabular-nums; }
.volrow > button.slider { flex:1 1 0; width:auto; min-width:0; height:30px;
                          position:relative; display:flex; align-items:center; }
.slider .baan { position:absolute; left:0; right:0; height:6px; border-radius:999px;
                background:var(--ov2); }
.slider .fill { position:absolute; left:0; height:6px; border-radius:999px; background:var(--acc); }
.slider .knop { position:absolute; width:14px; height:14px; border-radius:999px;
                background:var(--primary-text-color,#fff);
                box-shadow:0 1px 3px rgba(0,0,0,.35); margin-left:-7px; }

/* tabs: onderstreping in plaats van pillen */
.chips { display:flex; gap:20px; flex-wrap:nowrap; min-width:0; max-width:100%;
         border-bottom:1px solid var(--line); flex:0 0 auto; overflow:hidden; }
.chips button { height:36px; font-size:13.5px; font-weight:600; color:var(--flauw);
                white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
                border-bottom:2px solid transparent; margin-bottom:-1px; flex:0 1 auto; }
.chips button.on { color:var(--primary-text-color,#e9e9ea); border-bottom-color:var(--acc); }
.chips button.zoektab { margin-left:auto; flex:0 0 auto; display:flex; align-items:center; }
.chips button.zoektab ha-icon { --mdc-icon-size:19px; }

.tiles { min-height:0; max-width:100%; height:100%; overflow-y:auto; overflow-x:hidden; display:grid;
         grid-template-columns:repeat(4,minmax(0,1fr)); gap:11px 12px; align-content:start;
         padding-top:2px; scrollbar-width:none; }
.tiles::-webkit-scrollbar { display:none; }
.tile { display:flex; flex-direction:column; align-items:center; min-width:0; max-width:100%;
        position:relative; }
.tile img, .tile .ph, .tile .ic { width:var(--tw,108px); height:var(--tw,108px); max-width:100%;
       border-radius:9px; object-fit:cover; }
.tile img { box-shadow:0 4px 12px rgba(0,0,0,.3); }
.tile .ph { background:var(--ov1); }
.tile .ic { background:var(--ov1); display:flex; align-items:center; justify-content:center; }
.tile .ic ha-icon { --mdc-icon-size:36px; color:var(--acc); opacity:.85; }
.tile span { font-size:11.5px; padding-top:6px; max-width:var(--tw,108px); color:var(--zacht);
             white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center; }
.tile .reason { position:absolute; top:5px; left:5px; max-width:calc(100% - 10px);
                padding:3px 6px; border-radius:999px; background:rgba(0,0,0,.72); color:#fff;
                font-size:10px; font-weight:600; line-height:1.2; white-space:nowrap;
                overflow:hidden; text-overflow:ellipsis; }

.lijst { min-height:0; max-width:100%; height:100%; overflow-y:auto; overflow-x:hidden;
         display:flex; flex-direction:column; padding-top:2px; scrollbar-width:none; }
.lijst::-webkit-scrollbar { display:none; }
.rij { display:grid; grid-template-columns:46px minmax(0,1fr) auto; align-items:center; height:44px;
       flex:0 0 auto; max-width:100%; text-align:left; border-bottom:1px solid var(--line); }
.rij:last-child { border-bottom:0; }
.rij:hover { background:var(--ov1); }
.rij img { width:32px; height:32px; border-radius:4px; object-fit:cover; justify-self:center; }
.rij .tx { padding-left:2px; min-width:0; overflow:hidden; white-space:nowrap;
           text-overflow:ellipsis; font-size:13.5px; }
.rij .tx b { font-weight:600; }
.rij .tx span { color:var(--flauw); }
.rij .du { font-size:11.5px; color:var(--flauw); padding:0 8px 0 8px; font-variant-numeric:tabular-nums; }

/* zoekregel rechts */
.qbar { display:grid; grid-template-columns:26px minmax(0,1fr) auto; align-items:center;
        height:40px; max-width:100%; border-bottom:1px solid var(--line); flex:0 0 auto; }
.qbar ha-icon { --mdc-icon-size:18px; color:var(--flauw); }
.qbar .q { font-size:16px; min-width:0; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
.qbar .q i { color:var(--flauw); font-style:normal; }
.qbar input.q { border:0; outline:none; background:transparent; color:inherit; width:100%; }
.qbar .kb { height:26px; padding:0 12px; border-radius:999px; background:var(--acc);
            color:#fff; font-size:11px; font-weight:700; letter-spacing:.4px; }

.kbd { display:flex; flex-direction:column; gap:5px; margin-top:8px; max-width:100%; }
.kbd .kr { display:flex; gap:5px; justify-content:center; min-width:0; }
.kbd button { flex:1 1 0; min-width:0; height:44px; border-radius:8px; background:var(--ov1);
              font-size:17px; font-weight:500; }
.kbd .num button { height:34px; font-size:14px; }
.kbd .wide button { font-size:13px; font-weight:600; }
.kbd .go { background:var(--acc) !important; color:#fff; font-size:13px !important;
           font-weight:700; letter-spacing:.3px; }

.kop { display:flex; gap:14px; align-items:center; min-width:0; max-width:100%;
       height:40px; border-bottom:1px solid var(--line); flex:0 0 auto; }
.kop .terug { flex:0 0 auto; display:flex; align-items:center; gap:5px; font-size:13px;
              color:var(--flauw); }
.kop .terug ha-icon { --mdc-icon-size:17px; }
.kop .titel { flex:1 1 0; min-width:0; font-size:15px; font-weight:600; white-space:nowrap;
              overflow:hidden; text-overflow:ellipsis; }
.kop .titel .aantal { font-size:12.5px; font-weight:400; color:var(--flauw); margin-left:8px; }
.kop .alles { flex:0 0 auto; height:28px; padding:0 14px; border-radius:999px; background:var(--acc);
              color:#fff; font-size:11.5px; font-weight:700; letter-spacing:.4px; }

.scrollbox { flex:1; min-height:0; max-width:100%; display:grid;
             grid-template-columns:minmax(0,1fr); gap:4px; margin-top:4px; }
.scrollbox.pijl { grid-template-columns:minmax(0,1fr) 34px; }
.pijlen { display:flex; flex-direction:column; gap:4px; min-height:0; }
.pijlen button { flex:0 0 44px; border-radius:8px; background:var(--ov1); color:var(--flauw);
                 display:flex; align-items:center; justify-content:center; }
.pijlen ha-icon { --mdc-icon-size:22px; }
/* dunne balk tussen de pijlen: laat zien waar je zit en is versleepbaar.
   Het hele vak is aanraakgebied; alleen het streepje in het midden is zichtbaar. */
.rail { flex:1 1 0; min-height:20px; width:100%; margin:2px 0; position:relative;
        opacity:0; transition:opacity .2s; touch-action:none; cursor:pointer; }
.rail.aan { opacity:1; }
.rail::before { content:''; position:absolute; top:0; bottom:0; left:50%; width:6px;
        margin-left:-3px; border-radius:999px; background:var(--ov1); }
.duim { position:absolute; left:50%; width:12px; margin-left:-6px; top:0; height:20%;
        border-radius:999px; background:var(--flauw);
        transition:top .12s linear, height .12s linear; }
.rail.sleep .duim { transition:none; background:var(--zacht); }
.leeg { color:var(--flauw); font-size:13px; padding:16px 2px; }
#melding { padding:2px 2px 0; min-height:14px; font-size:11.5px; color:#ff8a80; flex:0 0 auto; }

/* optionele navigatieknoppen naar andere views, binnen de kaart zelf */
.links { display:flex; gap:8px; flex-wrap:wrap; flex:0 0 auto; padding-top:8px;
         border-top:1px solid var(--line); margin-top:6px; }
.links:empty { display:none; border:0; margin:0; padding:0; }
.links button { display:flex; align-items:center; gap:5px; height:28px; padding:0 11px;
                border-radius:999px; background:var(--ov1); color:var(--zacht);
                font-size:12px; font-weight:600; }
.links ha-icon { --mdc-icon-size:15px; }

/* Smaller than a 1024x600 panel - a phone, a narrow column, or the preview
   pane of the card editor. Zonder dit wordt de rechterkolom onleesbaar smal. */
@container (max-width: 940px) {
  .wrap { grid-template-columns:250px 1px minmax(0,1fr); gap:14px; padding:14px; }
  .tiles { grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px 10px; }
  .np .art, .np .leegart { width:140px; height:140px; }
  .np .glow { width:150px; height:150px; }
  .chips { gap:14px; }
}
@container (max-width: 780px) {
  .wrap { grid-template-columns:210px 1px minmax(0,1fr); }
  .tiles { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .np .art, .np .leegart { width:118px; height:118px; }
  .np .ctr { gap:8px; }
  .kbd button { height:38px; font-size:15px; }
}
/* This width is the preview pane of the card editor. The card must keep its
   two columns here: the whole point of the preview is seeing the thing you are
   configuring, and a stacked version is not that thing. So squeeze rather than
   rearrange - a narrower left column, smaller artwork, tighter controls. */
@container (max-width: 560px) {
  .wrap { grid-template-columns:150px 1px minmax(0,1fr); gap:10px; padding:12px; }
  .np { padding:8px 0 2px; }
  .np .art, .np .leegart { width:104px; height:104px; }
  .np .glow { width:110px; height:110px; }
  .np .tx { padding-top:10px; }
  .np .t { font-size:14px; }
  .np .ctr { gap:4px; margin-top:10px; }
  .np .ctr button { width:26px; height:26px; }
  .np .ctr button.hoofd { width:40px; height:40px; }
  .np .ctr button.hoofd ha-icon { --mdc-icon-size:21px; }
  .np .ctr ha-icon { --mdc-icon-size:18px; }
  .volrow { gap:5px; margin-top:10px; }
  .volrow > button.vk { width:24px; height:24px; }
  .volrow ha-icon { --mdc-icon-size:17px; }
  .volrow .vollbl { min-width:28px; font-size:11px; }
  .chips { gap:10px; }
  .chips button { font-size:12px; }
  .tiles { gap:9px 8px; }
}
/* Genuinely narrow - a phone in portrait, or a one-column dashboard. Two
   columns stop being readable here, so stack them. Never hide one: on the
   card's own dashboard that half is the reason the card exists. */
@container (max-width: 400px) {
  .wrap { grid-template-columns:minmax(0,1fr); height:auto;
          min-height:var(--mc-h,556px); row-gap:14px; padding:14px; }
  .scheiding { display:none; }
  .right { min-height:340px; }
  .np .art, .np .leegart { width:132px; height:132px; }
}
`;

// Korte namen -> mdi. In de config mag je ook gewoon 'mdi:...' schrijven.
export class MusicAssistantTouchCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._mode = 'home';      // home | zoek | detail
    this._cat = 0;
    this._soort = 0;
    this._q = '';
    this._res = [];
    this._det = [];
    this._detTitel = '';
    this._detUri = '';
    this._terug = 'zoek';
    this._kbd = true;
    this._zone = 0;
    this._src = 0;
    this._sourceGeneration = 0;
    this._searchSeq = 0;
    this._bezig = false;
    this._beeld = {};      // uri -> the cover Music Assistant has right now
    this._bron = {};       // source key -> { tijd, items }
    this._bezigBron = {};  // source key -> in-flight promise, so two draws fetch once
  }

  connectedCallback() {
    if (this._hass && this._cfg) this._vulAan();
  }

  static getConfigElement() {
    return document.createElement('kiosk-musicassistant-card-editor');
  }

  // What you get when you add the card from the card picker. The aim is a card
  // that works the moment it lands, with nothing to fill in: nearly everyone has
  // exactly one Music Assistant, so the card looks it up and takes that one. The
  // speakers fill themselves already (every Music Assistant player, when no zones
  // are set), and one category that Music Assistant fills shows there is music
  // behind the card from the first second, instead of an empty "no categories".
  // The lookup needs admin rights, which whoever opens the card picker has.
  static async getStubConfig(hass) {
    const stub = {
      config_entry_id: '',
      height: 556,
      keyboard: true,
      limit: 24,
      categories: categoriesParDefaut(hass && hass.language),
    };
    try {
      const lijst = await hass.callWS({ type: 'config_entries/get', domain: 'music_assistant' });
      const actief = (lijst || []).filter((e) => e.state === 'loaded');
      if (actief.length === 1) stub.config_entry_id = actief[0].entry_id;
    } catch (e) { /* no rights or no Music Assistant: the editor dropdown takes over */ }
    return stub;
  }

  setConfig(config) {
    if (!config || !config.config_entry_id) {
      throw new Error('Pick your Music Assistant in the card editor (config_entry_id).');
    }
    this._cfg = Object.assign({}, config);
    this._catsStandaard = !Array.isArray(this._cfg.categories);
    if (this._catsStandaard) {
      this._cfg.categories = categoriesParDefaut(config.language || (this._hass && this._hass.language));
    }
    this._cats = this._cfg.categories;
    this._sources = (Array.isArray(config.music_sources) ? config.music_sources : [])
      .filter((source) => source && typeof source.username === 'string' && source.username.trim())
      .map((source) => Object.assign({}, source, { username: source.username.trim() }));
    this._sourceGeneration++;
    this._searchSeq++;
    this._restoreSource();
    // keyboard: true  -> eigen schermtoetsenbord (Nest Hub, kiosk)
    // keyboard: false -> gewoon tekstveld met het toetsenbord van het apparaat
    this._schermtoetsen = config.keyboard !== false;
    this._kbd = this._schermtoetsen;
    this._zones = null;
  }

  _sourceStorageKey() {
    const path = typeof location !== 'undefined' ? location.pathname : '';
    return `${DOMAIN}:source:${this._cfg.config_entry_id}:${path}`;
  }

  _trackStorageKey(username) {
    return `${this._sourceStorageKey()}:track:${username}`;
  }

  _restoreSource() {
    this._src = 0;
    if (!this._sources.length) return;
    try {
      const stored = window.localStorage.getItem(this._sourceStorageKey());
      const index = this._sources.findIndex((source) => source.username === stored);
      if (index >= 0) this._src = index;
    } catch (error) { /* Kiosk browsers can disable local storage. */ }
  }

  _saveSource() {
    const source = this._sourceCfg();
    if (!source) return;
    try {
      window.localStorage.setItem(this._sourceStorageKey(), source.username);
    } catch (error) { /* Kiosk browsers can disable local storage. */ }
  }

  _sourceCfg() { return this._sources[this._src] || null; }
  _user() { const source = this._sourceCfg(); return source ? source.username : undefined; }
  _avecUser(data, username = this._user()) {
    return username ? Object.assign({}, data, { username }) : data;
  }

  // zones uit de config, of anders alle Music Assistant spelers automatisch
  _zoneLijst() {
    if (this._cfg.zones && this._cfg.zones.length) return this._cfg.zones;
    if (this._zones) return this._zones;
    const uit = [];
    const st = (this._hass && this._hass.states) || {};
    for (const id of Object.keys(st)) {
      if (!id.startsWith('media_player.')) continue;
      const a = st[id].attributes || {};
      if (!a.mass_player_type) continue;
      uit.push({
        name: a.friendly_name || id,
        entity: id,
        icon: a.mass_player_type === 'group' ? 'groep' : 'speaker',
      });
    }
    this._zones = uit.length ? uit : [{ name: this._taal().speler, entity: '', icon: 'speaker' }];
    return this._zones;
  }

  getCardSize() { return 12; }

  // ---------- the library ----------
  //
  // Two things need Music Assistant's library: a category that fills itself,
  // and the cover of a tile whose configuration does not pin one. Both are
  // answered by music_assistant.get_library, so both share one cache and one
  // rule: drawing never waits for it. The card paints what it knows, asks for
  // the rest in the background, and redraws once when it arrives.

  _bronSleutel(b) {
    return [this._user() || '', b.media_type || 'playlist', b.order_by || '', b.favorite ? 1 : 0,
      b.search || '', b.limit || 24].join('|');
  }

  // Every library answer also feeds the cover index, so a hand-made tile that
  // happens to point at the same uri gets a fresh image for free.
  _onthoudBeeld(items) {
    for (const it of items || []) {
      const u = it.uri || it.media_content_id;
      if (u && it.image) this._beeld[u] = it.image;
    }
  }

  _bronHaal(b) {
    const s = this._bronSleutel(b);
    const generation = this._sourceGeneration;
    const username = this._user();
    const c = this._bron[s];
    if (c && Date.now() - c.tijd < BIB_TTL) return Promise.resolve(c.items);
    if (this._bezigBron[s]) return this._bezigBron[s];
    const data = {
      config_entry_id: this._cfg.config_entry_id,
      media_type: b.media_type || 'playlist',
      limit: Math.min(b.limit || 24, BIB_MAX),
    };
    if (b.order_by) data.order_by = b.order_by;
    if (b.favorite) data.favorite = true;
    if (b.search) data.search = b.search;
    const request = b.media_type === 'recommendations'
      ? this._ws({
        type: 'call_service',
        domain: DOMAIN,
        service: 'get_top_picks',
        service_data: { config_entry_id: data.config_entry_id, limit: data.limit },
        return_response: true,
      }).then((r) => {
        const items = r && r.response && r.response.items;
        if (!Array.isArray(items)) {
          throw new Error('Music Assistant returned an invalid Top Picks response');
        }
        return items;
      })
      : this._ws({
        type: 'call_service',
        domain: 'music_assistant',
        service: 'get_library',
        service_data: this._avecUser(data, username),
        return_response: true,
      }).then((r) => ((r && r.response) || {}).items || []);
    const p = request.then((items) => {
      if (generation !== this._sourceGeneration) return items;
      this._onthoudBeeld(items);
      this._bron[s] = { tijd: Date.now(), items };
      delete this._bezigBron[s];
      return items;
    }).catch((error) => {
      if (generation !== this._sourceGeneration) return [];
      // A failed fetch is cached as empty for the same TTL. Without that, a
      // Music Assistant that is down turns every redraw into another attempt.
      this._bron[s] = { tijd: Date.now(), items: [] };
      this._fout(error);
      return [];
    }).finally(() => {
      if (this._bezigBron[s] === p) delete this._bezigBron[s];
    });
    this._bezigBron[s] = p;
    return p;
  }

  // Work out what is still missing and fetch it, once, in parallel.
  _vulAan() {
    if (!this._hass || !this._cfg || !this._cfg.config_entry_id) return;
    const generation = this._sourceGeneration;
    const soorten = new Set();
    const taken = [];
    for (const cat of this._cats) {
      if (cat.source) { taken.push(this._bronHaal(cat.source)); continue; }
      for (const t of cat.tiles || []) {
        // A pinned image or a chosen icon needs nothing fetched.
        if (t.image || t.icon || this._beeld[t.uri]) continue;
        const soort = SOORT_VAN(t.uri);
        if (soort) soorten.add(soort);
      }
    }
    for (const soort of soorten) {
      taken.push(this._bronHaal({ media_type: soort, limit: BIB_MAX }));
    }
    if (!taken.length) return;
    Promise.all(taken).then(() => {
      if (this.isConnected && this._mode === 'home'
        && generation === this._sourceGeneration) this._tekenRechts();
    });
  }

  // A category is either a list you wrote or a source Music Assistant fills.
  // Both leave here in the same shape, so nothing downstream has to care.
  _tegelsVan(cat) {
    if (!cat) return [];
    if (!cat.source) return cat.tiles || [];
    const c = this._bron[this._bronSleutel(cat.source)];
    if (!c) return [];
    return c.items.map((it) => ({
      name: it.name,
      uri: it.uri,
      image: it.image,
      recommendation_reason: it.recommendation_reason,
      play: cat.source.play === true,
      radio_mode: cat.source.radio_mode === true,
    }));
  }

  // Configuration wins, then whatever Music Assistant has now, then the icon.
  // A chosen icon counts as configuration: several playlists carry Music
  // Assistant's own placeholder logo as their cover, and fetching that over a
  // deliberate icon makes the wall of tiles worse, not fresher.
  _tegelBeeld(t) {
    const eigen = VEILIG(t.image);
    if (eigen) return eigen;
    if (t.icon) return '';
    return VEILIG(this._beeld[t.uri]);
  }

  // Taal: config.language, anders die van Home Assistant, anders Engels.
  _taal() {
    return taalVan(this._cfg.language, this._hass && this._hass.language);
  }

  set hass(hass) {
    const eerste = !this._hass;
    this._hass = hass;
    if (eerste && this._catsStandaard && !this._cfg.language && hass.language) {
      this._cfg.categories = categoriesParDefaut(hass.language);
      this._cats = this._cfg.categories;
    }
    if (eerste || !this.shadowRoot.firstChild) this._bouw();
    this._pasThemaToe();
    this._syncKioskEditMode();
    this._syncSpeler();
  }

  // Measure the background the theme gives the card and switch the overlay colours
  // with it. A view can carry its own theme, so the global dark-mode flag is not
  // enough; what counts is what is really behind the card.
  _pasThemaToe() {
    // Measure the surface the card really paints, not a variable that may disagree with
    // it: a view theme can set --card-background-color dark while --ha-card-background,
    // which the surface uses, stays light.
    const vlak = this.shadowRoot && this.shadowRoot.querySelector('.wrap');
    const echt = vlak ? getComputedStyle(vlak).backgroundColor : '';
    const zichtbaar = echt && !/^rgba\([^)]*,\s*0\)$/.test(echt) && echt !== 'transparent';
    const cs = getComputedStyle(this);
    const kleur = (zichtbaar ? echt : '')
      || cs.getPropertyValue('--ha-card-background')
      || cs.getPropertyValue('--card-background-color')
      || cs.getPropertyValue('--primary-background-color') || '';
    if (kleur === this._themaKleur) return;
    this._themaKleur = kleur;
    let r, g, b;
    const hex = kleur.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
      const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
      r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
    } else {
      const m = kleur.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
      if (!m) return;
      r = +m[1]; g = +m[2]; b = +m[3];
    }
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    this.classList.toggle('licht', lum > 0.5);
  }

  // ---------- helpers ----------
  _zoneCfg() { const z = this._zoneLijst(); return z[Math.min(this._zone, z.length - 1)]; }
  _speler() { return this._zoneCfg().entity; }
  _volEntity() { return this._zoneCfg().volume || this._zoneCfg().entity; }
  _st(e) { return (this._hass && this._hass.states[e]) || null; }

  // De speler die de muziek echt vasthoudt. Staat de gekozen zone zelf te spelen,
  // dan is dat hem. Speelt een groep waar deze speler in zit (of die dezelfde
  // wachtrij heeft), dan moeten play/pauze/volgende naar die groep - anders
  // komt het commando bij een lege wachtrij terecht en gebeurt er niets.
  _actief() {
    if (this._actEnt && this._actHass === this._hass && this._actZone === this._zone) return this._actEnt;
    const eigen = this._speler();
    const s = this._st(eigen);
    let uit = eigen;
    if (!(s && SPEELT.includes(s.state))) {
      const q = s && s.attributes ? s.attributes.active_queue : null;
      let viaGroep = null;
      for (const zone of this._zoneLijst()) {
        const id = zone.entity;
        if (!id || id === eigen || !id.startsWith('media_player.')) continue;
        const player = this._st(id);
        if (!player) continue;
        const a = player.attributes || {};
        if (!a.mass_player_type || !SPEELT.includes(player.state)) continue;
        if (q && a.active_queue === q) { viaGroep = id; break; }
        if (!viaGroep && (a.group_members || []).indexOf(eigen) !== -1) viaGroep = id;
      }
      uit = viaGroep || eigen;
    }
    this._actHass = this._hass;
    this._actZone = this._zone;
    this._actEnt = uit;
    return uit;
  }

  // Schuifregelaar loopt tot volume_max procent in plaats van tot 100.
  // Zo is 0-20% het hele bereik in plaats van het eerste vijfde deel.
  _volMax() {
    const z = this._zoneCfg();
    const v = z.volume_max != null ? z.volume_max : this._cfg.volume_max;
    const n = parseFloat(v);
    return (n > 0 && n <= 100) ? n : 100;
  }

  // Volume waarop de muziek altijd start. Leeg = niets aanraken.
  _volStart() {
    const z = this._zoneCfg();
    const v = z.volume_start != null ? z.volume_start : this._cfg.volume_start;
    const n = parseFloat(v);
    return (n >= 0 && n <= 100) ? n : null;
  }

  _volStep() {
    const z = this._zoneCfg();
    const v = z.volume_step != null ? z.volume_step : this._cfg.volume_step;
    const n = parseFloat(v);
    return (Number.isFinite(n) && n > 0 && n <= 100) ? n : 1;
  }

  // volume_start is geen vaste startwaarde maar een terugvalwaarde: staat het
  // volume binnen het maximum, dan blijft het gewoon staan. Alleen als het
  // erboven staat (tv op de soundbar) gaat het bij het starten omlaag.
  async _startVolume() {
    const p = this._volStart();
    if (p == null) return;
    const vs = this._st(this._volEntity());
    const nu = (vs && vs.attributes.volume_level != null)
      ? vs.attributes.volume_level * 100 : null;
    if (nu == null || nu <= this._volMax()) return;
    await this._call('media_player', 'volume_set',
      { volume_level: p / 100 }, { entity_id: this._volEntity() }).catch(() => {});
  }

  _volStap(richting) {
    const stap = this._volStep() / 100;
    const vs = this._st(this._volEntity());
    const nu = Number(vs && vs.attributes.volume_level) || 0;
    const doel = Math.max(0, Math.min(1, Math.round((nu + richting * stap) * 10000) / 10000));
    this._call('media_player', 'volume_set',
      { volume_level: doel }, { entity_id: this._volEntity() });
  }

  async _ws(msg) { return this._hass.connection.sendMessagePromise(msg); }

  async _call(domain, service, data, target) {
    return this._hass.callService(domain, service, data, target);
  }

  // Bedieningsknop: even dimmen zolang het loopt, en een fout laten zien
  // in plaats van stilletjes niets doen.
  _bedien(service, data, el, naVullen, herkans) {
    const ent = this._actief();
    if (!ent) return false;
    // Een speaker doet er soms een seconde over. Korte blokkade tegen
    // dubbeltikken, zodat een tweede tik de eerste niet weer ongedaan maakt.
    const nu = Date.now();
    if (nu < (this._slotTot || 0)) return false;
    this._slotTot = nu + 800;
    if (el) {
      el.classList.add('bezig');
      setTimeout(() => el.classList.remove('bezig'), 350);
    }
    const stuur = () => this._call('media_player', service, data || {}, { entity_id: ent })
      .catch((e) => this._fout(e));
    // De JBL's hangen via de cast-integratie aan Music Assistant en slikken
    // het spring-commando niet altijd. Speelt na 2,5 seconde nog hetzelfde
    // nummer, dan een keer opnieuw sturen.
    const merk = () => {
      const x = (this._st(ent) || {}).attributes || {};
      return String(x.media_content_id) + '|' + String(x.media_position_updated_at);
    };
    const opnieuw = herkans && this._cfg.retry_next !== false;
    const doe = !opnieuw ? stuur : () => stuur().then(() => {
      const voor = merk();
      setTimeout(() => { if (merk() === voor) stuur(); }, 2500);
    });
    // Vorige/volgende: als de rest van de lijst nog in de wachtrij gezet wordt,
    // eerst dat afwachten - anders is er nog geen volgend nummer om heen te gaan.
    if (naVullen && this._vul) {
      if (el) el.classList.add('bezig');
      this._vul.then(doe, doe).then(() => { if (el) el.classList.remove('bezig'); });
    } else doe();
    return true;
  }

  // `behalve` is de speler waar de muziek vandaan komt: die mag je niet
  // uitzetten, anders is er niets meer om over te zetten. Hetzelfde geldt voor
  // een groep die diezelfde wachtrij vasthoudt: Music Assistant leegt bij het
  // uitzetten van een groep de wachtrij van de leden, en dan vindt
  // transfer_queue een lege bron ("The queue is empty"). Staat er een lijst in
  // `uitstel`, dan wordt zo'n uitzetten daarin geparkeerd tot na de overdracht.
  async _voorbereiden(behalve, uitstel) {
    const b = this._zoneCfg().before;
    if (!b) return;
    let gedaan = false;
    if (b.turn_off && b.turn_off !== behalve) {
      const st = this._st(b.turn_off);
      if (st && ['playing', 'paused', 'on', 'idle', 'buffering'].includes(st.state)) {
        const bron = behalve ? this._st(behalve) : null;
        const q = bron && bron.attributes ? bron.attributes.active_queue : null;
        const zelfdeRij = !!q && st.attributes.active_queue === q;
        if (uitstel && zelfdeRij) {
          uitstel.push(b.turn_off);
        } else {
          await this._call('media_player', 'turn_off', {}, { entity_id: b.turn_off }).catch(() => {});
          gedaan = true;
        }
      }
    }
    if (b.unjoin) {
      const st = this._st(b.unjoin);
      const gm = (st && st.attributes.group_members) || [];
      if (gm.length > 1) {
        await this._call('media_player', 'unjoin', {}, { entity_id: b.unjoin }).catch(() => {});
        gedaan = true;
      }
    }
    if (b.join) {
      const l = this._st(b.join.leader);
      const gm = (l && l.attributes.group_members) || [];
      const mist = (b.join.members || []).some((m) => gm.indexOf(m) === -1);
      if (mist) {
        await this._call('media_player', 'join',
          { group_members: b.join.members }, { entity_id: b.join.leader }).catch(() => {});
        gedaan = true;
      }
    }
    if (gedaan) await new Promise((r) => setTimeout(r, 350));
  }

  // Van speler wisselen. Speelt er iets? Dan verhuist de wachtrij mee.
  // Zet transfer_on_switch: false in de config om alleen van beeld te wisselen.
  async _wisselZone(i, el) {
    const username = this._user();
    const oudEnt = this._actief();
    const st = this._st(oudEnt);
    const speelde = st && SPEELT.includes(st.state);
    // Onthouden wat er speelt vóór er iets geschakeld wordt. Raakt de wachtrij
    // onderweg toch kwijt, dan kan de kaart dit nummer op de nieuwe speler
    // opnieuw starten in plaats van stil te vallen.
    const bron = speelde && st.attributes
      ? { media: st.attributes.media_content_id || '', queue: st.attributes.active_queue || null }
      : null;
    this._zone = i;
    this._opt = null;
    this._syncSpeler();
    const nieuw = this._zoneCfg();
    if (el) el.classList.add('bezig');
    try {
      // Zelfde speler, andere samenstelling (bv. Sonos keuken alleen tegenover
      // keuken + serre): niets verhuizen, alleen koppelen of loskoppelen.
      if (nieuw.entity === oudEnt) { await this._voorbereiden(); return; }

      // Groep uitzetten of juist koppelen zoals deze zone het wil - maar nooit
      // de speler waar de muziek nu vandaan komt, en niet een groep die
      // dezelfde wachtrij vasthoudt: die gaat pas na de overdracht uit.
      const doorgeven = speelde && this._cfg.transfer_on_switch !== false;
      const later = [];
      await this._voorbereiden(oudEnt, doorgeven ? later : null);

      if (!doorgeven) return;

      // Een uitgezette speler of groep neemt de wachtrij niet aan.
      const ns = this._st(nieuw.entity);
      if (!ns || ['off', 'unavailable', 'standby'].includes(ns.state)) {
        await this._call('media_player', 'turn_on', {}, { entity_id: nieuw.entity })
          .catch(() => {});
        await new Promise((r) => setTimeout(r, 700));
      }
      this._opt = { state: 'playing', tot: Date.now() + 12000 };
      let over = true;
      try {
        await this._call('music_assistant', 'transfer_queue',
          { source_player: oudEnt, auto_play: true }, { entity_id: nieuw.entity });
      } catch (e) { over = false; }

      // Weigert Music Assistant de overdracht (lege wachtrij), dan begint de
      // kaart het onthouden nummer gewoon opnieuw op de nieuwe speler.
      if (!over && bron && bron.media) {
        await this._call('music_assistant', 'play_media',
          this._avecUser({ media_id: bron.media, enqueue: 'replace' }, username),
          { entity_id: nieuw.entity })
          .catch((e) => this._fout(e));
      }

      // Pas nu de oude groep uitzetten, en alleen als die nog staat te spelen.
      for (const ent of later) {
        const gs = this._st(ent);
        if (gs && SPEELT.includes(gs.state)) {
          await this._call('media_player', 'turn_off', {}, { entity_id: ent }).catch(() => {});
        }
      }
    } catch (e) {
      this._opt = null;
      this._fout(e);
    }
    if (el) el.classList.remove('bezig');
  }

  async _speel(uri, radio, el, username = this._user(), generation = this._sourceGeneration) {
    if (!uri || generation !== this._sourceGeneration) return;
    if (el) el.classList.add('bezig');
    this._opt = { state: 'playing', tot: Date.now() + 8000 };
    try {
      await this._voorbereiden();
      if (generation !== this._sourceGeneration) return;
      await this._startVolume();
      if (generation !== this._sourceGeneration) return;
      await this._call('music_assistant', 'play_media',
        this._avecUser({ media_id: uri, enqueue: 'replace', radio_mode: !!radio }, username),
        { entity_id: this._speler() });
    } catch (e) {
      this._fout(e);
    } finally {
      if (el) el.classList.remove('bezig');
    }
  }

  // Een nummer uit een lijst starten. We zetten de hele lijst in de wachtrij,
  // te beginnen bij het aangetikte nummer (de nummers ervoor komen erachter).
  // Anders staat er maar een nummer in de wachtrij en doet 'volgende' niets.
  async _speelLijst(uris, start, el) {
    const schoon = (uris || []).filter(Boolean);
    if (!schoon.length) return;
    const username = this._user();
    const i = Math.max(0, Math.min(start || 0, schoon.length - 1));
    const rij = schoon.slice(i).concat(schoon.slice(0, i)).slice(0, 150);
    const speler = this._speler();
    if (el) el.classList.add('bezig');
    this._opt = { state: 'playing', tot: Date.now() + 8000 };
    try {
      await this._voorbereiden();
      await this._startVolume();
      // Eerst alleen het aangetikte nummer starten - dat gaat meteen.
      // Music Assistant zoekt elk nummer apart op, dus de rest van de lijst
      // schuiven we er daarna achteraan zonder erop te wachten.
      await this._call('music_assistant', 'play_media',
        this._avecUser({ media_id: rij[0], enqueue: 'replace' }, username),
        { entity_id: speler });
      if (el) el.classList.remove('bezig');
      if (rij.length > 1) {
        // Eerst een handjevol, zodat 'volgende' meteen iets heeft; daarna de rest.
        const bij = (v) => this._call('music_assistant', 'play_media',
          this._avecUser({ media_id: v, enqueue: 'add' }, username), { entity_id: speler });
        this._vul = bij(rij.slice(1, 6))
          .then(() => (rij.length > 6 ? bij(rij.slice(6)) : null))
          .catch((e) => this._fout(e))
          .then(() => { this._vul = null; });
      } else this._vul = null;
      return;
    } catch (e) {
      this._fout(e);
    }
    if (el) el.classList.remove('bezig');
  }

  _fout(e) {
    const el = this.shadowRoot.getElementById('melding');
    if (!el) return;
    el.textContent = (e && e.message ? e.message : String(e));
    clearTimeout(this._foutTimer);
    this._foutTimer = setTimeout(() => { el.textContent = ''; }, 6000);
  }

  async _zoek() {
    const q = this._q.trim();
    if (!q) return;
    const generation = this._sourceGeneration;
    const sequence = ++this._searchSeq;
    const username = this._user();
    this._bezig = true;
    this._mode = 'zoek';
    if (this._schermtoetsen) this._kbd = false;
    this._tekenRechts();
    const soort = SOORTEN[this._soort];
    try {
      const r = await this._ws({
        type: 'call_service',
        domain: 'music_assistant',
        service: 'search',
        service_data: this._avecUser({
          config_entry_id: this._cfg.config_entry_id,
          name: q,
          media_type: [soort.key],
          limit: this._cfg.limit || 24,
        }, username),
        return_response: true,
      });
      if (generation !== this._sourceGeneration || sequence !== this._searchSeq) return;
      const lijst = ((r && r.response) || {})[soort.veld] || [];
      this._onthoudBeeld(lijst);
      const ql = q.toLowerCase();
      const a = [], b = [];
      for (const it of lijst) {
        const art = ((it.artists && it.artists[0] && it.artists[0].name) || it.name || '').toLowerCase();
        (art.includes(ql) ? a : b).push(it);
      }
      this._res = a.concat(b);
    } catch (e) {
      if (generation !== this._sourceGeneration || sequence !== this._searchSeq) return;
      this._res = [];
      this._fout(e);
    }
    this._bezig = false;
    this._tekenRechts();
  }

  async _open(it, el, terug) {
    const uri = it.uri || it.media_content_id;
    if (!uri) return;
    const soort = (uri.split('://')[1] || '').split('/')[0];
    if (soort === 'track' || soort === 'radio') { this._speel(uri, false, el); return; }
    this._bezig = true;
    this._terug = terug || 'zoek';
    this._detTitel = it.name || it.title || '';
    this._detUri = uri;
    this._mode = 'detail';
    this._det = [];
    this._tekenRechts();
    try {
      const r = await this._hass.callWS({
        type: 'media_player/browse_media',
        entity_id: this._speler(),
        media_content_id: uri,
        media_content_type: soort,
      });
      this._det = (r && r.children) || [];
    } catch (e) {
      this._fout(e);
    }
    this._bezig = false;
    this._tekenRechts();
  }

  _toets(t) {
    if (t === 'BS') this._q = this._q.slice(0, -1);
    else if (t === 'CLR') this._q = '';
    else if (t === 'SP') this._q += ' ';
    else this._q += t;
    const q = this.shadowRoot.getElementById('qtekst');
    if (q) q.innerHTML = this._q ? esc(this._q) : `<i>${esc(this._taal().zoeken)}</i>`;
  }

  // ---------- opbouw ----------
  _bouw() {
    // fill: true -> de kaart meet zelf hoeveel scherm er onder hem over is en
    // vult dat. Werkt in elk soort weergave (sections, panel, masonry).
    const vul = this._cfg.fill === true;
    const h = (this._cfg.height || 556) + 'px';
    const thema = this._cfg.kiosk_theme === false
      ? '' : `<link rel="stylesheet" href="/${DOMAIN}/kiosk-theme.css">`;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      ${thema}
      <div class="wrap" style="--mc-h:${h};--zn:${this._zoneLijst().length}">
        <div class="col left">
          <div class="zones" id="zones"></div>
          ${this._sources.length
            ? `<div class="zones sources" id="sources" style="--zn:${this._sources.length}"></div>`
            : ''}
          <div class="np" id="np"></div>
          <div class="volrow">
            <button class="vk" data-act="vol-">${svg('min')}</button>
            <button class="slider" id="slider" data-act="volset">
              <div class="baan"></div><div class="fill" id="volfill"></div>
              <div class="knop" id="volknop"></div>
            </button>
            <button class="vk" data-act="vol+">${svg('plus')}</button>
            <div class="vollbl" id="vollbl"></div>
          </div>
          <div id="melding"></div>
          <div class="links" id="links"></div>
        </div>
        <div class="scheiding"></div>
        <div class="col right" id="right"></div>
      </div>`;
    this._observeKioskEditMode();
    this._tekenZones();
    this._tekenSources();
    this._tekenLinks();
    this._tekenRechts();
    clearInterval(this._tikTimer);
    this._tikTimer = setInterval(() => {
      this._toonVoortgang(); this._vulHoogte(); this._pasTegels(); this._toonRail();
    }, 1000);
    if (vul) requestAnimationFrame(() => this._vulHoogte());
    if (!this._maatLuister) {
      this._maatLuister = () => {
        this._vulHoogte();
        this._pasTegels();
      };
      window.addEventListener('resize', this._maatLuister);
    }
    this.shadowRoot.addEventListener('click', (ev) => this._klik(ev));
    this.shadowRoot.addEventListener('pointerdown', (ev) => {
      const t = ev.composedPath().find((n) => n.dataset && n.dataset.act);
      if (t && (t.dataset.act === 'op' || t.dataset.act === 'neer')) {
        this._scrollVast(t.dataset.act === 'op' ? -1 : 1);
      }
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((e) =>
      this.shadowRoot.addEventListener(e, () => { this._scrollLos(); this._sleepLos(); }));
    // scrollbalk met de vinger verslepen
    this.shadowRoot.addEventListener('pointerdown', (ev) => {
      const rail = ev.composedPath().find((n) => n.classList && n.classList.contains('rail'));
      if (!rail) return;
      ev.preventDefault();
      this._sleep = rail;
      rail.classList.add('sleep');
      try { rail.setPointerCapture(ev.pointerId); } catch (e) { /* niet erg */ }
      this._sleepNaar(ev);
    });
    this.shadowRoot.addEventListener('pointermove', (ev) => {
      if (this._sleep) { ev.preventDefault(); this._sleepNaar(ev); }
    });
    this.shadowRoot.addEventListener('scroll', () => this._toonRail(), true);
    this.shadowRoot.addEventListener('input', (ev) => {
      if (ev.target && ev.target.id === 'qveld') this._q = ev.target.value;
    });
    this.shadowRoot.addEventListener('keydown', (ev) => {
      if (ev.target && ev.target.id === 'qveld' && ev.key === 'Enter') {
        this._q = ev.target.value;
        this._zoek();
      }
    });
    // The card is on screen now; everything it still needs can arrive late.
    this._vulAan();
  }

  _tekenZones() {
    const el = this.shadowRoot.getElementById('zones');
    el.innerHTML = this._zoneLijst().map((z, i) =>
      `<button data-act="zone" data-i="${i}" title="${esc(z.name || '')}">${svg(z.icon || 'speaker')}</button>`).join('');
  }

  _tekenSources() {
    const el = this.shadowRoot.getElementById('sources');
    if (!el) return;
    el.innerHTML = this._sources.map((source, index) => {
      const label = source.name || source.username;
      return `<button class="${index === this._src ? 'on' : ''}" data-act="src" data-i="${index}"
        title="${esc(label)}" aria-label="${esc(label)}">${svg(source.icon || 'mdi:spotify')}</button>`;
    }).join('');
  }

  _connectLiveTrack(source) {
    const state = source && source.connect_entity ? this._st(source.connect_entity) : null;
    if (!state || !SPEELT.includes(state.state)) return '';
    return SPOTIFY_URI((state.attributes || {}).media_content_id || '');
  }

  _rememberConnectTrack(source, track) {
    if (!source || !source.username || !track) return;
    try {
      window.localStorage.setItem(this._trackStorageKey(source.username), track);
    } catch (error) { /* Kiosk browsers can disable local storage. */ }
  }

  _connectTrack(source) {
    const liveTrack = this._connectLiveTrack(source);
    if (liveTrack) {
      this._rememberConnectTrack(source, liveTrack);
      return liveTrack;
    }
    if (!source || !source.username) return '';
    try {
      return window.localStorage.getItem(this._trackStorageKey(source.username)) || '';
    } catch (error) { return ''; }
  }

  _connectStopEntity(source) {
    const spotify = source && source.connect_entity ? this._st(source.connect_entity) : null;
    const sourceName = String((spotify && spotify.attributes && spotify.attributes.source) || '')
      .trim().toLowerCase();
    if (sourceName) {
      const linked = this._zoneLijst().find((zone) => {
        const state = this._st(zone.entity);
        const name = String((state && state.attributes && state.attributes.friendly_name)
          || zone.name || zone.entity).trim().toLowerCase();
        return name === sourceName && state && SPEELT.includes(state.state);
      });
      if (linked) return linked.entity;
    }
    const active = this._actief();
    const activeState = this._st(active);
    if (activeState && SPEELT.includes(activeState.state)) return active;
    const connectPlayer = this._zoneLijst().find((zone) => {
      const state = this._st(zone.entity);
      const mediaId = state && state.attributes ? state.attributes.media_content_id || '' : '';
      return state && SPEELT.includes(state.state) && mediaId.startsWith('spotify_connect://');
    });
    return connectPlayer ? connectPlayer.entity : '';
  }

  async _wisselSource(index) {
    if (!this._sources[index] || index === this._src) return;
    const previous = this._sourceCfg();
    this._rememberConnectTrack(previous, this._connectLiveTrack(previous));
    const target = this._sources[index];
    const stopEntity = this._connectStopEntity(previous);
    const track = this._connectTrack(target);
    this._src = index;
    const generation = ++this._sourceGeneration;
    this._searchSeq++;
    this._bezig = false;
    this._opt = null;
    this._saveSource();
    this._bron = {};
    this._bezigBron = {};
    this._beeld = {};
    this._res = [];
    this._det = [];
    this._detUri = '';
    this._detTitel = '';
    this._q = '';
    this._mode = 'home';
    this._tekenSources();
    this._tekenRechts();
    this._vulAan();
    if (stopEntity) {
      await this._call('media_player', 'media_stop', {}, { entity_id: stopEntity })
        .catch((error) => this._fout(error));
    }
    if (generation !== this._sourceGeneration) return;
    if (track) await this._speel(track, false, null, target.username, generation);
  }

  // Navigatieknoppen naar andere dashboardweergaven, zodat de view uit
  // precies een kaart kan bestaan: links: [{ name, icon, path }]
  _tekenLinks() {
    const el = this.shadowRoot.getElementById('links');
    if (!el) return;
    el.innerHTML = (this._cfg.links || []).map((l, i) =>
      `<button data-act="link" data-i="${i}">${l.icon ? svg(l.icon) : ''}${esc(l.name || '')}</button>`).join('');
  }

  _ganaar(pad) {
    if (!pad) return;
    history.pushState(null, '', pad);
    window.dispatchEvent(new Event('location-changed'));
  }

  _klik(ev) {
    const t = ev.composedPath().find((n) => n.dataset && n.dataset.act);
    if (!t) return;
    const a = t.dataset.act;
    const i = t.dataset.i !== undefined ? parseInt(t.dataset.i, 10) : null;
    if (a === 'zone') this._wisselZone(i, t);
    else if (a === 'src') this._wisselSource(i);
    else if (a === 'link') this._ganaar(((this._cfg.links || [])[i] || {}).path);
    else if (a === 'vol+') this._volStap(1);
    else if (a === 'vol-') this._volStap(-1);
    else if (a === 'volset') {
      const r = t.getBoundingClientRect();
      const f = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
      this._call('media_player', 'volume_set',
        { volume_level: Math.min(1, f * this._volMax() / 100) },
        { entity_id: this._volEntity() });
    }
    else if (a === 'shuffle') {
      const s = this._st(this._actief());
      this._bedien('shuffle_set', { shuffle: !(s && s.attributes.shuffle) }, t);
    }
    else if (a === 'repeat') {
      const s = this._st(this._actief());
      const nu = (s && s.attributes.repeat) || 'off';
      this._bedien('repeat_set', { repeat: nu === 'off' ? 'all' : (nu === 'all' ? 'one' : 'off') }, t);
    }
    else if (a === 'naarzoek') { this._mode = 'zoek'; this._kbd = this._schermtoetsen; this._tekenRechts(); }
    else if (a === 'home') { this._mode = 'home'; this._tekenRechts(); }
    else if (a === 'cat') { this._cat = i; this._mode = 'home'; this._tekenRechts(); }
    else if (a === 'soort') { this._soort = i; if (this._q.trim()) this._zoek(); else this._tekenRechts(); }
    else if (a === 'kbd') { this._kbd = !this._kbd; this._tekenRechts(); }
    else if (a === 'toets') this._toets(t.dataset.t);
    else if (a === 'zoeknu') this._zoek();
    else if (a === 'op') this._scroll(-1);
    else if (a === 'neer') this._scroll(1);
    else if (a === 'tegel') {
      const tl = this._tegelsVan(this._cats[this._cat])[i];
      if (!tl) return;
      const direct = tl.play === true || this._cfg.tile_action === 'play';
      if (direct) this._speel(tl.uri, tl.radio_mode, t);
      else this._open({ name: tl.name, uri: tl.uri }, t, 'home');
    }
    else if (a === 'res') {
      const it = this._res[i];
      if (!it) return;
      const uri = it.uri || it.media_content_id || '';
      // Losse nummers: hele resultatenlijst in de wachtrij zodat 'volgende' werkt.
      if (uri.indexOf('://track/') !== -1) {
        this._speelLijst(this._res.map((x) => x.uri || x.media_content_id), i, t);
      } else this._open(it, t, 'zoek');
    }
    else if (a === 'det') {
      if (!this._det[i]) return;
      this._speelLijst(this._det.map((d) => d.media_content_id), i, t);
    }
    else if (a === 'alles') this._speel(this._detUri, false, t);
    else if (a === 'terug') { this._mode = this._terug || 'zoek'; this._tekenRechts(); }
    else if (a === 'pp') {
      const speelt = this._toonState === 'playing';
      if (this._bedien(speelt ? 'media_pause' : 'media_play', {}, t)) {
        // Meteen het andere icoon tonen; de echte status volgt zo vanzelf.
        this._opt = { state: speelt ? 'paused' : 'playing', tot: Date.now() + 8000 };
        this._syncSpeler();
      }
    }
    else if (a === 'prev') this._bedien('media_previous_track', {}, t, true);
    else if (a === 'next') this._bedien('media_next_track', {}, t, true, true);
  }

  // Scrollbaar vak. Op een gecaste Nest Hub werkt aanraakscrollen niet,
  // dus staan er standaard pijlknoppen naast. Zet arrows: false voor pc/telefoon.
  _scrollbox(inhoud) {
    if (this._cfg.arrows === false) return `<div class="scrollbox">${inhoud}</div>`;
    return `<div class="scrollbox pijl">${inhoud}
      <div class="pijlen">
        <button data-act="op">${svg('mdi:chevron-up')}</button>
        <div class="rail"><div class="duim"></div></div>
        <button data-act="neer">${svg('mdi:chevron-down')}</button>
      </div></div>`;
  }

  // fill: true -> hoogte = wat er onder de bovenkant van de kaart nog aan
  // scherm over is. Zo staat de kaart overal precies onder de badges/chips
  // zonder dat je per weergave een hoogte hoeft uit te rekenen.
  _vulHoogte() {
    if (this._cfg.fill !== true) return;
    const wrap = this.shadowRoot && this.shadowRoot.querySelector('.wrap');
    if (!wrap || !this.isConnected) return;
    const boven = this.getBoundingClientRect().top;
    const marge = this._cfg.fill_margin == null ? 8 : this._cfg.fill_margin;
    const h = Math.max(300, Math.round(window.innerHeight - boven - marge));
    // Keep the player density tied to card space, including space used by HA's header.
    const modus = h <= 440 ? 'short' : h <= 560 ? 'tight' : h <= 720 ? 'compact' : 'normal';
    if (wrap.dataset.heightMode !== modus) wrap.dataset.heightMode = modus;
    const hoogte = h + 'px';
    if (h === this._vulH && wrap.style.getPropertyValue('--mc-h') === hoogte) return;
    this._vulH = h;
    wrap.style.setProperty('--mc-h', hoogte);
  }

  // Fit thumbnails to cell width and height; extra rows remain scrollable.
  _pasTegels() {
    const vak = this.shadowRoot && this.shadowRoot.querySelector('.tiles.vlak');
    if (!vak || !vak.clientHeight || !vak.children.length) return;
    const firstTile = vak.firstElementChild;
    const label = firstTile && firstTile.querySelector('span');
    const labelHeight = label ? label.getBoundingClientRect().height : 0;
    const style = getComputedStyle(vak);
    const kolommen = (style.gridTemplateColumns || '').split(' ').filter(Boolean).length || 1;
    const rijTussenruimte = Number.parseFloat(style.rowGap) || 0;
    const rijen = Math.ceil(vak.children.length / kolommen);
    const zichtbareRijen = Math.min(rijen, 3);
    const hoogtePerRij = (vak.clientHeight - rijTussenruimte * (zichtbareRijen - 1)) / zichtbareRijen;
    const breedte = firstTile ? firstTile.getBoundingClientRect().width : vak.clientWidth / kolommen;
    const voorstel = Math.min(108, breedte, hoogtePerRij - labelHeight);
    const grootte = Math.max(64, Math.floor(voorstel / 4) * 4);
    const sleutel = [vak.children.length, vak.clientHeight, Math.round(vak.clientWidth),
      kolommen, Math.round(rijTussenruimte), Math.round(labelHeight), grootte].join('x');
    if (sleutel === this._tegelSleutel) return;
    this._tegelSleutel = sleutel;
    if (grootte >= 108) vak.style.removeProperty('--tw');
    else vak.style.setProperty('--tw', `${grootte}px`);
  }

  // Vinger op de scrollbalk: de duim volgt en de lijst schuift mee.
  _sleepNaar(ev) {
    const rail = this._sleep;
    const vak = this.shadowRoot && this.shadowRoot.querySelector('.scrollbox .vlak');
    if (!rail || !vak) return;
    const duim = rail.firstElementChild;
    const r = rail.getBoundingClientRect();
    const dh = (duim && duim.offsetHeight) || 0;
    const ruimte = Math.max(1, r.height - dh);
    const f = Math.max(0, Math.min(1, (ev.clientY - r.top - dh / 2) / ruimte));
    vak.scrollTop = f * Math.max(0, vak.scrollHeight - vak.clientHeight);
    this._toonRail();
  }

  _sleepLos() {
    if (!this._sleep) return;
    this._sleep.classList.remove('sleep');
    this._sleep = null;
  }

  // Positie-indicator tussen de pijlknoppen bijwerken.
  _toonRail() {
    const sr = this.shadowRoot;
    if (!sr) return;
    const rail = sr.querySelector('.scrollbox.pijl .rail');
    const vak = sr.querySelector('.scrollbox .vlak');
    if (!rail || !vak) return;
    const duim = rail.firstElementChild;
    const hoog = vak.scrollHeight;
    const zicht = vak.clientHeight;
    if (!zicht || hoog <= zicht + 2) { rail.classList.remove('aan'); return; }
    rail.classList.add('aan');
    const deel = Math.max(0.12, zicht / hoog);
    const pos = vak.scrollTop / (hoog - zicht);
    duim.style.height = (deel * 100) + '%';
    duim.style.top = (Math.max(0, Math.min(1, pos)) * (1 - deel) * 100) + '%';
  }

  _scroll(richting) {
    const vak = this.shadowRoot.querySelector('.scrollbox .vlak');
    if (!vak) return;
    // Bijna een volle bladzijde per tik, met een streepje overlap.
    const stap = Math.max(160, Math.round(vak.clientHeight * 0.9));
    if (vak.scrollBy) vak.scrollBy({ top: richting * stap, behavior: 'smooth' });
    else vak.scrollTop += richting * stap;
  }

  // Ingedrukt houden blijft doorscrollen.
  _scrollVast(richting) {
    clearInterval(this._scrollTimer);
    this._scrollTimer = setInterval(() => this._scroll(richting), 320);
  }

  _scrollLos() { clearInterval(this._scrollTimer); }

  // ---------- rechterkolom ----------
  _tekenRechts() {
    const el = this.shadowRoot.getElementById('right');
    if (!el) return;
    if (this._mode === 'home') el.innerHTML = this._homeHtml();
    else if (this._mode === 'detail') el.innerHTML = this._detailHtml();
    else el.innerHTML = this._zoekHtml();
    this._tegelSleutel = null;
    requestAnimationFrame(() => { this._pasTegels(); this._toonRail(); });
  }

  _homeHtml() {
    const cats = this._cats;
    if (!cats.length) return `<div class="leeg">${this._taal().geenCats}</div>`;
    const chips = this._tabsHtml(false);
    const cat = cats[this._cat] || {};
    const lijst = this._tegelsVan(cat);
    // A source category has nothing to show until its fetch lands. Say so
    // rather than drawing an empty grid that looks like a broken category.
    if (cat.source && !lijst.length) {
      return chips + `<div class="leeg">${this._taal().bezigOphalen}</div>`;
    }
    const tiles = lijst.map((t, i) => {
      const b = this._tegelBeeld(t);
      const ic = `<div class="ic">${svg(t.icon || (SOORT_VAN(t.uri) === 'radio' ? 'radio' : 'muziek'))}</div>`;
      // An image that will not load (a site that refuses hotlinking, a dead
      // link) falls back to the icon instead of leaving a broken picture.
      const beeld = b
        ? `<img loading="lazy" src="${esc(GROOT(b))}" onerror="this.outerHTML=this.nextElementSibling.innerHTML"><template>${ic}</template>`
        : ic;
      const reason = t.recommendation_reason
        ? `<small class="reason">${esc(t.recommendation_reason)}</small>`
        : '';
      return `<button class="tile" data-act="tegel" data-i="${i}">${beeld}${reason}<span>${esc(t.name)}</span></button>`;
    }).join('');
    return chips + this._scrollbox(`<div class="tiles vlak">${tiles}</div>`);
  }

  // De categorietabs, met de zoekknop als laatste tab rechts.
  _tabsHtml(zoekt) {
    const tabs = this._cats.map((c, i) =>
      `<button class="${!zoekt && i === this._cat ? 'on' : ''}" data-act="cat" data-i="${i}">${esc(c.name)}</button>`).join('');
    return `<div class="chips">${tabs}
      <button class="zoektab${zoekt ? ' on' : ''}" data-act="naarzoek"
              title="${esc(this._taal().zoek)}">${svg('zoek')}</button></div>`;
  }

  _zoekHtml() {
    const t = this._taal();
    const soorten = (this._cfg.search_types || SOORTEN.map((s) => s.key));
    const chips = SOORTEN.map((s, i) => soorten.includes(s.key)
      ? `<button class="${i === this._soort ? 'on' : ''}" data-act="soort" data-i="${i}">${esc(t.soort[s.key])}</button>`
      : '').join('');
    const qbar = this._schermtoetsen
      ? `<div class="qbar">${svg('zoek')}
          <div class="q" id="qtekst">${this._q ? esc(this._q) : `<i>${esc(t.zoeken)}</i>`}</div>
          <button class="kb" data-act="kbd">${this._kbd ? t.verberg : t.toetsen}</button></div>`
      : `<div class="qbar">${svg('zoek')}
          <input class="q" id="qveld" type="search" autocomplete="off"
                 placeholder="${esc(t.zoeken)}" value="${esc(this._q)}">
          <button class="kb" data-act="zoeknu">${t.zoek}</button></div>`;
    const body = (this._schermtoetsen && this._kbd) ? this._kbdHtml() : this._resHtml();
    return this._tabsHtml(true) + qbar
      + `<div class="chips" style="margin-top:6px">${chips}</div>` + body;
  }

  _kbdHtml() {
    const kn = (t, l, cls) => `<button class="${cls || ''}" data-act="toets" data-t="${t}">${l}</button>`;
    const num = `<div class="kr num">${[...'1234567890'].map((c) => kn(c, c)).join('')}</div>`;
    const rijen = RIJEN.map((r, idx) => {
      let html = [...r].map((c) => kn(c, c.toUpperCase())).join('');
      if (idx === 2) html += kn('BS', '&#9003;');
      return `<div class="kr">${html}</div>`;
    }).join('');
    const t = this._taal();
    const onder = `<div class="kr wide">${kn('CLR', t.wissen)}${kn('SP', t.spatie)}
      <button class="go" data-act="zoeknu">${t.zoek}</button></div>`;
    return `<div class="kbd">${num}${rijen}${onder}</div>`;
  }

  _resHtml() {
    const t = this._taal();
    if (this._bezig) return `<div class="leeg">${t.bezigZoeken}</div>`;
    if (!this._res.length) return `<div class="leeg">${t.geenResultaat}</div>`;
    const soort = SOORTEN[this._soort];
    if (soort.lijst) {
      const rijen = this._res.map((it, i) => {
        const art = (it.artists && it.artists[0] && it.artists[0].name) || '';
        const bron = VEILIG(it.image);
        const img = bron ? `<img loading="lazy" src="${esc(KLEIN(bron))}">` : '<span></span>';
        return `<button class="rij" data-act="res" data-i="${i}">${img}
          <div class="tx"><b>${esc(it.name)}</b>${art ? ' <span>&middot; ' + esc(art) + '</span>' : ''}</div>
          <span class="du">${mmss(it.duration)}</span></button>`;
      }).join('');
      return this._scrollbox(`<div class="lijst vlak">${rijen}</div>`);
    }
    const tiles = this._res.map((it, i) => {
      const art = (it.artists && it.artists[0] && it.artists[0].name) || '';
      const bi = VEILIG(it.image);
      const beeld = bi ? `<img loading="lazy" src="${esc(GROOT(bi))}">` : '<div class="ph"></div>';
      return `<button class="tile" data-act="res" data-i="${i}">${beeld}
        <span>${esc(it.name)}${art ? ' &middot; ' + esc(art) : ''}</span></button>`;
    }).join('');
    return this._scrollbox(`<div class="tiles vlak">${tiles}</div>`);
  }

  _detailHtml() {
    const t = this._taal();
    const n = this._det.length;
    let tijd = 0;
    for (const d of this._det) tijd += parseInt(d.media_duration || 0, 10) || 0;
    const min = Math.round(tijd / 60);
    const extra = min > 0 ? (min >= 60
      ? ` · ${Math.floor(min / 60)} ${t.uur} ${min % 60} ${t.minuut}`
      : ` · ${min} ${t.minuut}`) : '';
    const telling = (this._bezig || !n) ? ''
      : `<span class="aantal">${n} ${n === 1 ? t.nummer : t.nummers}${extra}</span>`;
    const kop = `<div class="kop">
      <button class="terug" data-act="terug">${svg('terug')} ${this._terug === 'home' ? t.terug : t.resultaten}</button>
      <div class="titel">${esc(this._detTitel)}${telling}</div>
      <button class="alles" data-act="alles">${t.speelAlles}</button></div>`;
    if (this._bezig) return kop + `<div class="leeg">${t.bezigOphalen}</div>`;
    if (!n) return kop + `<div class="leeg">${t.geenNummers}</div>`;
    const rijen = this._det.map((d, i) => {
      const img = d.thumbnail ? `<img loading="lazy" src="${esc(KLEIN(d.thumbnail))}">` : '<span></span>';
      return `<button class="rij" data-act="det" data-i="${i}">${img}
        <div class="tx"><b>${esc(d.title)}</b></div>
        <span class="du">${mmss(d.media_duration)}</span></button>`;
    }).join('');
    return kop + this._scrollbox(`<div class="lijst vlak">${rijen}</div>`);
  }

  // ---------- live speler ----------
  // A speaker plays from a buffer, so a radio stream announces the next title
  // while you are still hearing the previous song: the card runs a track ahead.
  // 'radio_delay' holds every change in title, artist and artwork back by that
  // many seconds, so what you see matches what you hear. A talk break still shows
  // as a talk break, just as late as the sound. Zero (the default) changes nothing.
  // Only radio is held back: a track from a library or from Spotify has a length
  // and starts when the player says it starts, so there is nothing to make up for.
  _metaLater(ent, a) {
    const wacht = Math.max(0, Number(this._cfg.radio_delay) || 0) * 1000;
    const radio = !a.media_duration && !!a.media_title;
    const achter = Math.max(0, Number(this._cfg.radio_lag) || 0);
    if (!ent || !radio || (!wacht && !achter)) return a;
    if (achter) {
      // Some stations publish their titles a whole song ahead: while you hear one
      // track, the stream already names the next. A song has no fixed length, so
      // seconds cannot fix that - staying one title behind can. The programme's
      // own name (artist equal to the station) is not a track and passes straight
      // through, so a talk break still shows as a talk break.
      const zender = a.media_album_name || a.media_channel || '';
      const programma = !!zender && (a.media_artist || '') === zender;
      if (!this._reeks) this._reeks = {};
      const lijst = this._reeks[ent] || (this._reeks[ent] = []);
      if (!programma) {
        const kop = lijst.length ? lijst[lijst.length - 1] : null;
        if (!kop || kop.titel !== a.media_title) {
          lijst.push({
            titel: a.media_title,
            artiest: a.media_artist || '',
            pic: a.entity_picture_local || a.entity_picture || '',
          });
          if (lijst.length > 10) lijst.shift();
          this._reeksTijd = this._reeksTijd || {};
          this._reeksTijd[ent] = Date.now();
        }
        const ouder = lijst[lijst.length - 1 - achter];
        if (ouder) {
          return Object.assign({}, a, {
            media_title: ouder.titel,
            media_artist: ouder.artiest,
            entity_picture: ouder.pic,
            entity_picture_local: '',
          });
        }
      }
      // The programme's name also arrives in the middle of a song, which looks the
      // same as a real talk break. So it only takes over once no new title has come
      // in for five minutes: a break or the news, rather than a flip mid-song.
      const sinds = (this._reeksTijd || {})[ent];
      if (programma && sinds && Date.now() - sinds < 300000) {
        const vorig = lijst[lijst.length - 1 - achter];
        if (vorig) {
          return Object.assign({}, a, {
            media_title: vorig.titel,
            media_artist: vorig.artiest,
            entity_picture: vorig.pic,
            entity_picture_local: '',
          });
        }
      }
      return a;
    }
    if (!this._meta) this._meta = {};
    const rij = this._meta[ent] || (this._meta[ent] = []);
    const nu = Date.now();
    const nieuw = {
      titel: a.media_title || '',
      artiest: a.media_artist || '',
      pic: a.entity_picture_local || a.entity_picture || '',
    };
    const laatste = rij.length ? rij[rij.length - 1] : null;
    if (!laatste || laatste.titel !== nieuw.titel || laatste.artiest !== nieuw.artiest || laatste.pic !== nieuw.pic) {
      rij.push(Object.assign({}, nieuw, { t: nu }));
      if (rij.length > 20) rij.shift();
    }
    // The newest entry that is old enough to be audible by now.
    let toon = rij[0];
    for (const x of rij) { if (nu - x.t >= wacht) toon = x; }
    // Still waiting on the next one: come back when it is due.
    const volgende = rij.find(x => nu - x.t < wacht);
    if (volgende && !this._metaTimer) {
      this._metaTimer = setTimeout(() => {
        this._metaTimer = null;
        this._syncSpeler();
      }, wacht - (nu - volgende.t) + 100);
    }
    if (!toon || (toon.titel === nieuw.titel && toon.artiest === nieuw.artiest && toon.pic === nieuw.pic)) return a;
    return Object.assign({}, a, {
      media_title: toon.titel,
      media_artist: toon.artiest,
      entity_picture: toon.pic,
      entity_picture_local: '',
    });
  }

  _syncSpeler() {
    const sr = this.shadowRoot;
    if (!sr || !sr.getElementById('np')) return;
    const ent = this._actief();
    const eigen = this._speler();
    const zones = this._zoneLijst();
    const zs = sr.querySelectorAll('#zones button');
    zs.forEach((b, i) => {
      b.classList.toggle('on', i === this._zone);
      const z = zones[i];
      const zst = z && this._st(z.entity);
      b.classList.toggle('speelt', !!(zst && SPEELT.includes(zst.state)));
    });

    const vs = this._st(this._volEntity());
    const vol = vs && vs.attributes.volume_level != null ? vs.attributes.volume_level : 0;
    const fill = sr.getElementById('volfill');
    const lbl = sr.getElementById('vollbl');
    const knop = sr.getElementById('volknop');
    const pct = Math.round(vol * 100);
    const stand = Math.max(0, Math.min(100, pct / this._volMax() * 100));
    if (fill) fill.style.width = stand + '%';
    if (knop) knop.style.left = stand + '%';
    if (lbl) lbl.textContent = pct + '%';

    const s = this._st(ent);
    const np = sr.getElementById('np');
    const a = this._metaLater(ent, (s && s.attributes) || {});
    const pic = a.entity_picture_local || a.entity_picture || '';
    const t = this._taal();
    const titel = a.media_title || (s ? t.stil : t.geenSpeler);
    const artiest = [a.media_artist, a.media_album_name].filter(Boolean).join(' · ');

    // Na een druk op play/pauze tonen we alvast de nieuwe stand, tot de speler
    // het echt bevestigt (of de tijd om is).
    let toon = s ? s.state : '';
    if (this._opt) {
      if (Date.now() > this._opt.tot || toon === this._opt.state) this._opt = null;
      else toon = this._opt.state;
    }
    this._toonState = toon;
    const speelt = toon === 'playing';

    // Alleen hertekenen als er iets veranderd is - anders bouwt de kaart het
    // hoesje bij elke statuswijziging in huis opnieuw op en wordt hij traag.
    const sig = [ent, eigen, toon, titel, artiest, a.media_content_id,
      pic.split('&cache=')[0], a.shuffle, a.repeat, a.media_duration].join('|');
    if (sig === this._npSig) { this._toonVoortgang(); return; }
    this._npSig = sig;
    // Speelt het ergens anders dan op de gekozen zone? Laat zien waar.
    const elders = (ent && ent !== eigen && s && SPEELT.includes(s.state))
      ? `<div class="op">${t.speeltOp} ${esc(a.friendly_name || ent)}</div>` : '';
    const duur = parseInt(a.media_duration, 10) || 0;
    np.innerHTML = `
      ${pic ? `<div class="glow" style="background-image:url('${esc(pic)}')"></div>` : ''}
      ${pic ? `<img class="art" src="${esc(pic)}">`
            : `<div class="leegart">${svg('muziek')}</div>`}
      <div class="tx">
        <div class="t">${esc(titel)}</div>
        <div class="a">${esc(artiest)}</div>
        ${elders}
      </div>
      ${duur ? `<div class="voort">
        <div class="vbaan"><div class="vfill" id="vfill"></div></div>
        <div class="vtijd"><span id="vnu">0:00</span><span>${mmss(duur)}</span></div>
      </div>` : ''}
      <div class="ctr">
        <button class="shuf${a.shuffle ? ' on' : ''}" data-act="shuffle"
                title="${t.shuffleTitel}">${svg('shuffle')}</button>
        <button data-act="prev">${svg('prev')}</button>
        <button class="hoofd" data-act="pp">${svg(speelt ? 'pause' : 'play')}</button>
        <button data-act="next">${svg('next')}</button>
        <button class="rep${a.repeat && a.repeat !== 'off' ? ' on' : ''}" data-act="repeat"
                title="${t.herhaalTitel}">${svg(a.repeat === 'one' ? 'mdi:repeat-once' : 'mdi:repeat')}</button>
      </div>`;
    this._toonVoortgang();
  }

  // Afspeelpositie. Home Assistant stuurt alleen af en toe een nieuwe stand,
  // dus tellen we er tussendoor zelf bij op.
  _toonVoortgang() {
    const sr = this.shadowRoot;
    const fill = sr && sr.getElementById('vfill');
    if (!fill) return;
    const s = this._st(this._actief());
    const a = (s && s.attributes) || {};
    const duur = parseInt(a.media_duration, 10) || 0;
    if (!duur) return;
    let pos = parseFloat(a.media_position) || 0;
    if (s && s.state === 'playing' && a.media_position_updated_at) {
      pos += (Date.now() - new Date(a.media_position_updated_at).getTime()) / 1000;
    }
    pos = Math.max(0, Math.min(duur, pos));
    fill.style.width = (pos / duur * 100) + '%';
    const nu = sr.getElementById('vnu');
    if (nu) nu.textContent = mmss(Math.round(pos));
  }

  _syncKioskEditMode() {
    let node = this;
    let editing = false;
    while (node && !editing) {
      editing = node.tagName === 'HUI-CARD-OPTIONS';
      const root = node.getRootNode && node.getRootNode();
      node = node.parentElement || (root && root.host);
    }
    this.classList.toggle('kiosk-edit', editing);
  }

  _observeKioskEditMode() {
    this._syncKioskEditMode();
    if (this._editObserver || typeof MutationObserver === 'undefined') return;
    const roots = new Set();
    let node = this;
    while (node) {
      const root = node.getRootNode && node.getRootNode();
      if (root && root.nodeType === 11) roots.add(root);
      node = (root && root.host) || node.parentElement;
    }
    this._editObserver = new MutationObserver(() => this._syncKioskEditMode());
    roots.forEach((root) => this._editObserver.observe(root, { childList: true, subtree: true }));
  }

  disconnectedCallback() {
    if (this._editObserver) {
      this._editObserver.disconnect();
      this._editObserver = null;
    }
    this._sleepLos();
    clearInterval(this._tikTimer);
    clearInterval(this._scrollTimer);
    if (this._maatLuister) {
      window.removeEventListener('resize', this._maatLuister);
      this._maatLuister = null;
    }
  }
}

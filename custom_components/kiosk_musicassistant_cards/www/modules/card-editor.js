import { KORT, TAAL } from './shared.js';
import { KIOSK_THEMES } from './kiosk-theme.js';

const EDSTYLE = `
:host { display:block; }
.vak { margin-bottom:18px; }
.kop { font-size:15px; font-weight:700; margin:0 0 8px; display:flex;
       align-items:center; justify-content:space-between; gap:10px; }
ha-expansion-panel { margin-bottom:8px; --expansion-panel-summary-padding:0 12px; }
.rij { display:flex; align-items:center; gap:8px; }
.blok { padding:4px 4px 12px; }
.knop { border:0; cursor:pointer; font:inherit; font-size:13px; font-weight:600;
        border-radius:999px; padding:7px 14px;
        background:var(--primary-color); color:var(--text-primary-color,#fff); }
.knop.weg { background:transparent; color:var(--error-color,#db4437); padding:6px 4px; }
.leeg { opacity:.6; font-size:13px; padding:4px 2px 10px; }
.tegels { padding-left:4px; }
.tegel { border-top:1px solid var(--divider-color); padding:10px 0 2px; }
.tegel:first-child { border-top:0; }
`;

const ED_LABEL = { path: 'pad', radio_mode: 'radio', count: 'aantal' };

// Hint line under a field in the editor. Only for the fields where a new user
// has nothing to go on - the media id above all: it is a plain text box and
// nothing on screen says what belongs in it or where to find it.
const ED_HINT = { uri: 'uriHint', username: 'usernameHint' };

export class MusicAssistantTouchCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    const j = JSON.stringify(config || {});
    this._cfg = JSON.parse(j);
    if (j === this._laatst) return;   // onze eigen wijziging: niet herbouwen
    this._laatst = j;
    this._vuil = true;
    this._teken();
  }

  set hass(hass) {
    const eerste = !this._hass;
    this._hass = hass;
    if (eerste || this._vuil) this._teken();
    else this.shadowRoot.querySelectorAll('ha-form').forEach((f) => { f.hass = hass; });
  }

  _ed() {
    const g = ((this._cfg && this._cfg.language)
      || (this._hass && this._hass.language) || 'en').slice(0, 2).toLowerCase();
    return (TAAL[g] || TAAL.en).ed;
  }

  _soortNaam() {
    const g = ((this._cfg && this._cfg.language)
      || (this._hass && this._hass.language) || 'en').slice(0, 2).toLowerCase();
    return (TAAL[g] || TAAL.en).soort;
  }

  _melden() {
    this._laatst = JSON.stringify(this._cfg);
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._cfg }, bubbles: true, composed: true,
    }));
  }

  _herbouw() {
    this._melden();
    this._vuil = true;
    this._teken();
  }

  _mdi(naam) {
    const n = String(naam || '');
    if (!n) return '';
    return n.indexOf(':') > 0 ? n : (KORT[n] || '');
  }

  // Een ha-form met eigen labels. Data wordt eenmalig gezet; ha-form houdt
  // daarna zijn eigen invoer bij, dus typen verliest nooit de focus.
  _form(schema, data, bij) {
    const ed = this._ed();
    const f = document.createElement('ha-form');
    f.hass = this._hass;
    f.schema = schema;
    f.data = data;
    f.computeLabel = (sch) => ed[ED_LABEL[sch.name] || sch.name] || sch.name;
    f.computeHelper = (sch) => ed[ED_HINT[sch.name]] || '';
    f.addEventListener('value-changed', (ev) => {
      ev.stopPropagation();
      bij(ev.detail.value);
    });
    return f;
  }

  _knop(tekst, cls, bij) {
    const b = document.createElement('button');
    b.className = 'knop' + (cls ? ' ' + cls : '');
    b.textContent = tekst;
    b.addEventListener('click', bij);
    return b;
  }

  _paneel(titel, inhoud, weg) {
    const p = document.createElement('ha-expansion-panel');
    p.outlined = true;
    p.header = titel;
    const blok = document.createElement('div');
    blok.className = 'blok';
    blok.appendChild(inhoud);
    if (weg) {
      const r = document.createElement('div');
      r.className = 'rij';
      r.appendChild(this._knop(this._ed().weg, 'weg', weg));
      blok.appendChild(r);
    }
    p.appendChild(blok);
    return p;
  }

  _teken() {
    if (!this._hass || !this._cfg) return;
    this._vuil = false;
    const ed = this._ed();
    const sn = this._soortNaam();
    const c = this._cfg;
    const sr = this.shadowRoot;
    sr.innerHTML = `<style>${EDSTYLE}</style>`;
    const wortel = document.createElement('div');
    sr.appendChild(wortel);

    // ---- algemeen ----
    //
    // Only the one field you cannot do without sits in the open. The rest is
    // grouped by the question it answers - how it looks, how it plays, how it
    // searches - because a single column of fourteen settings tells a newcomer
    // nothing about which three of them matter.
    const algVak = document.createElement('div');
    algVak.className = 'vak';
    algVak.innerHTML = `<div class="kop">${ed.algemeen}</div>`;
    algVak.appendChild(this._form(
      [{ name: 'config_entry_id', required: true,
        selector: { config_entry: { integration: 'music_assistant' } } }],
      { config_entry_id: c.config_entry_id || '' },
      (v) => { this._cfg.config_entry_id = v.config_entry_id; this._melden(); }
    ));

    algVak.appendChild(this._paneel(ed.weergave, this._form(
      [
        { name: '', type: 'grid', schema: [
          { name: 'height', selector: { number: { min: 240, max: 1400, step: 2, mode: 'box' } } },
          { name: 'fill_margin', selector: { number: { min: 0, max: 200, step: 1, mode: 'box' } } },
        ] },
        { name: 'fill', selector: { boolean: {} } },
        { name: 'show_player', selector: { boolean: {} } },
        { name: 'discover', selector: { boolean: {} } },
        { name: 'discover_source', selector: { select: { mode: 'dropdown', options: [
          { value: 'mixed', label: ed.srcMix }, { value: 'similar', label: ed.srcSimilar },
          { value: 'music_assistant', label: ed.srcMa },
        ] } } },
        { name: 'arrows', selector: { boolean: {} } },
        { name: 'kiosk_theme', selector: { boolean: {} } },
        { name: 'theme', selector: { select: { mode: 'dropdown', options: KIOSK_THEMES
          .map((value) => ({ value, label: (ed.themas || {})[value] || value })) } } },
        { name: 'language', selector: { select: { mode: 'dropdown', options: [
          { value: '', label: ed.automatisch },
          { value: 'nl', label: 'Nederlands' }, { value: 'en', label: 'English' },
          { value: 'fr', label: 'Français' },
        ] } } },
      ],
      {
        height: c.height == null ? 556 : c.height,
        fill_margin: c.fill_margin == null ? 8 : c.fill_margin,
        fill: c.fill === true,
        show_player: c.show_player !== false,
        discover: c.discover !== false,
        discover_source: c.discover_source === 'spotify' ? 'similar' : (c.discover_source || 'mixed'),
        arrows: c.arrows !== false,
        kiosk_theme: c.kiosk_theme !== false,
        theme: KIOSK_THEMES.includes(c.theme) ? c.theme : 'sunset',
        language: c.language || '',
      },
      (v) => {
        this._cfg.height = v.height;
        if (v.fill_margin == null || v.fill_margin === '' || v.fill_margin === 8) {
          delete this._cfg.fill_margin;
        } else this._cfg.fill_margin = v.fill_margin;
        if (v.fill) this._cfg.fill = true; else delete this._cfg.fill;
        if (v.show_player === false) this._cfg.show_player = false; else delete this._cfg.show_player;
        if (v.discover === false) this._cfg.discover = false; else delete this._cfg.discover;
        if (v.discover_source && v.discover_source !== 'mixed') this._cfg.discover_source = v.discover_source;
        else delete this._cfg.discover_source;
        this._cfg.arrows = !!v.arrows;
        if (v.kiosk_theme === false) this._cfg.kiosk_theme = false; else delete this._cfg.kiosk_theme;
        if (v.theme && v.theme !== 'sunset') this._cfg.theme = v.theme; else delete this._cfg.theme;
        if (v.language) this._cfg.language = v.language; else delete this._cfg.language;
        this._melden();
      }
    )));

    algVak.appendChild(this._paneel(ed.spelenKop, this._form(
      [
        { name: '', type: 'grid', schema: [
          { name: 'volume_max', selector: { number: { min: 5, max: 100, step: 1, mode: 'box' } } },
          { name: 'volume_start', selector: { number: { min: 0, max: 100, step: 1, mode: 'box' } } },
          { name: 'volume_step', selector: { number: { min: 0.1, max: 100, step: 0.1, mode: 'box' } } },
        ] },
        { name: 'tile_action', selector: { select: { mode: 'dropdown', options: [
          { value: 'open', label: ed.openen }, { value: 'play', label: ed.afspelen },
        ] } } },
        { name: 'transfer_on_switch', selector: { boolean: {} } },
        { name: 'retry_next', selector: { boolean: {} } },
      ],
      {
        volume_max: c.volume_max == null ? 100 : c.volume_max,
        volume_start: c.volume_start == null ? null : c.volume_start,
        volume_step: c.volume_step == null ? 1 : c.volume_step,
        tile_action: c.tile_action || 'open',
        transfer_on_switch: c.transfer_on_switch !== false,
        retry_next: c.retry_next !== false,
      },
      (v) => {
        if (v.volume_max && v.volume_max !== 100) this._cfg.volume_max = v.volume_max;
        else delete this._cfg.volume_max;
        if (v.volume_start == null || v.volume_start === '') delete this._cfg.volume_start;
        else this._cfg.volume_start = v.volume_start;
        if (v.volume_step == null || v.volume_step === '') delete this._cfg.volume_step;
        else this._cfg.volume_step = v.volume_step;
        this._cfg.tile_action = v.tile_action;
        this._cfg.transfer_on_switch = !!v.transfer_on_switch;
        this._cfg.retry_next = !!v.retry_next;
        this._melden();
      }
    )));

    algVak.appendChild(this._paneel(ed.zoekKop, this._form(
      [
        { name: 'keyboard', selector: { boolean: {} } },
        { name: 'limit', selector: { number: { min: 6, max: 100, step: 1, mode: 'box' } } },
        { name: 'search_types', selector: { select: { multiple: true, mode: 'list', options: [
          { value: 'track', label: sn.track }, { value: 'album', label: sn.album },
          { value: 'artist', label: sn.artist }, { value: 'playlist', label: sn.playlist },
        ] } } },
      ],
      {
        keyboard: c.keyboard !== false,
        limit: c.limit == null ? 24 : c.limit,
        search_types: c.search_types || ['track', 'album', 'artist', 'playlist'],
      },
      (v) => {
        this._cfg.keyboard = !!v.keyboard;
        this._cfg.limit = v.limit;
        this._cfg.search_types = v.search_types;
        this._melden();
      }
    )));
    wortel.appendChild(algVak);

    // ---- speakers ----
    const zVak = document.createElement('div');
    zVak.className = 'vak';
    zVak.innerHTML = `<div class="kop">${ed.zones}</div>`;
    const zones = c.zones || [];
    const zSchema = [
      { name: '', type: 'grid', schema: [
        { name: 'name', selector: { text: {} } },
        { name: 'icon', selector: { icon: {} } },
      ] },
      { name: 'entity', selector: { entity: { filter: { domain: 'media_player' } } } },
      { name: 'volume', selector: { entity: { filter: { domain: 'media_player' } } } },
      { name: '', type: 'grid', schema: [
        { name: 'volume_max', selector: { number: { min: 5, max: 100, step: 1, mode: 'box' } } },
        { name: 'volume_start', selector: { number: { min: 0, max: 100, step: 1, mode: 'box' } } },
        { name: 'volume_step', selector: { number: { min: 0.1, max: 100, step: 0.1, mode: 'box' } } },
      ] },
      { name: 'turn_off', selector: { entity: { filter: { domain: 'media_player' } } } },
      { name: 'unjoin', selector: { entity: { filter: { domain: 'media_player' } } } },
      { name: 'joinLeader', selector: { entity: { filter: { domain: 'media_player' } } } },
      { name: 'joinMembers',
        selector: { entity: { multiple: true, filter: { domain: 'media_player' } } } },
    ];
    zones.forEach((z, i) => {
      const b = z.before || {};
      const plat = {
        name: z.name || '', icon: this._mdi(z.icon), entity: z.entity || '',
        volume: z.volume || '', volume_max: z.volume_max == null ? null : z.volume_max,
        volume_start: z.volume_start == null ? null : z.volume_start,
        volume_step: z.volume_step == null ? null : z.volume_step,
        turn_off: b.turn_off || '', unjoin: b.unjoin || '',
        joinLeader: (b.join && b.join.leader) || '',
        joinMembers: (b.join && b.join.members) || [],
      };
      const form = this._form(zSchema, plat, (v) => {
        const zn = { name: v.name, entity: v.entity };
        if (v.icon) zn.icon = v.icon;
        if (v.volume) zn.volume = v.volume;
        if (v.volume_max != null && v.volume_max !== '') zn.volume_max = v.volume_max;
        if (v.volume_start != null && v.volume_start !== '') zn.volume_start = v.volume_start;
        if (v.volume_step != null && v.volume_step !== '') zn.volume_step = v.volume_step;
        const voor = {};
        if (v.turn_off) voor.turn_off = v.turn_off;
        if (v.unjoin) voor.unjoin = v.unjoin;
        if (v.joinLeader && (v.joinMembers || []).length) {
          voor.join = { leader: v.joinLeader, members: v.joinMembers };
        }
        if (Object.keys(voor).length) zn.before = voor;
        this._cfg.zones = (this._cfg.zones || []).slice();
        this._cfg.zones[i] = zn;
        this._melden();
      });
      zVak.appendChild(this._paneel(z.name || ed.naamloos, form, () => {
        this._cfg.zones = zones.filter((x, k) => k !== i);
        if (!this._cfg.zones.length) delete this._cfg.zones;
        this._herbouw();
      }));
    });
    zVak.appendChild(this._knop(ed.zoneToe, '', () => {
      this._cfg.zones = (this._cfg.zones || []).concat([{ name: '', entity: '' }]);
      this._herbouw();
    }));
    wortel.appendChild(zVak);

    const sVak = document.createElement('div');
    sVak.className = 'vak';
    sVak.innerHTML = `<div class="kop">${ed.sources}</div>`;
    const sources = c.music_sources || [];
    const sSchema = [
      { name: '', type: 'grid', schema: [
        { name: 'name', selector: { text: {} } },
        { name: 'icon', selector: { icon: {} } },
      ] },
      { name: 'username', required: true, selector: { text: {} } },
      { name: 'connect_entity', selector: { entity: {
        filter: { domain: 'media_player', integration: 'spotify' },
      } } },
      { name: 'spotify_entity', selector: { entity: {
        filter: { domain: 'media_player', integration: 'spotifyplus' },
      } } },
    ];
    sources.forEach((source, index) => {
      const form = this._form(sSchema, {
        name: source.name || '', icon: this._mdi(source.icon), username: source.username || '',
        connect_entity: source.connect_entity || '',
        spotify_entity: source.spotify_entity || '',
      }, (value) => {
        const entry = { name: value.name, username: (value.username || '').trim() };
        if (value.icon) entry.icon = value.icon;
        if (value.connect_entity) entry.connect_entity = value.connect_entity;
        if (value.spotify_entity) entry.spotify_entity = value.spotify_entity;
        this._cfg.music_sources = (this._cfg.music_sources || []).slice();
        this._cfg.music_sources[index] = entry;
        this._melden();
      });
      sVak.appendChild(this._paneel(source.name || ed.naamloos, form, () => {
        this._cfg.music_sources = (this._cfg.music_sources || [])
          .filter((item, itemIndex) => itemIndex !== index);
        if (!this._cfg.music_sources.length) delete this._cfg.music_sources;
        this._herbouw();
      }));
    });
    sVak.appendChild(this._knop(ed.sourceToe, '', () => {
      this._cfg.music_sources = (this._cfg.music_sources || [])
        .concat([{ name: '', username: '', icon: 'mdi:spotify' }]);
      this._herbouw();
    }));
    wortel.appendChild(sVak);

    // ---- categorieen ----
    const cVak = document.createElement('div');
    cVak.className = 'vak';
    cVak.innerHTML = `<div class="kop">${ed.cats}</div>`;
    const cats = c.categories || [];
    const tSchema = [
      { name: '', type: 'grid', schema: [
        { name: 'name', selector: { text: {} } },
        { name: 'icon', selector: { icon: {} } },
      ] },
      { name: 'uri', required: true, selector: { text: {} } },
      { name: 'image', selector: { text: {} } },
      { name: '', type: 'grid', schema: [
        { name: 'play', selector: { boolean: {} } },
        { name: 'radio_mode', selector: { boolean: {} } },
      ] },
    ];
    cats.forEach((cat, ci) => {
      const binnen = document.createElement('div');
      const auto = !!cat.source;
      // The one question that decides what the rest of this panel looks like:
      // do you write the list, or does Music Assistant.
      binnen.appendChild(this._form(
        [
          { name: 'name', selector: { text: {} } },
          { name: 'vullen', selector: { select: { mode: 'dropdown', options: [
            { value: 'hand', label: ed.bronHand },
            { value: 'auto', label: ed.bronAuto },
          ] } } },
        ],
        { name: cat.name || '', vullen: auto ? 'auto' : 'hand' },
        (v) => {
          const lijst = (this._cfg.categories || []).slice();
          const nw = Object.assign({}, lijst[ci], { name: v.name });
          const wilAuto = v.vullen === 'auto';
          if (wilAuto && !nw.source) {
            nw.source = { media_type: 'playlist', limit: 12, order_by: 'last_played_desc' };
            delete nw.tiles;
          } else if (!wilAuto && nw.source) {
            delete nw.source;
            nw.tiles = nw.tiles || [];
          }
          lijst[ci] = nw;
          this._cfg.categories = lijst;
          if (wilAuto !== auto) this._herbouw(); else this._melden();
        }
      ));
      if (auto) {
        const br = cat.source || {};
        const type = br.media_type || 'playlist';
        const sourceFields = [
          { name: '', type: 'grid', schema: [
            { name: 'media_type', selector: { select: { mode: 'dropdown', options: [
              { value: 'recommendations', label: ed.recommendations },
              { value: 'playlist', label: sn.playlist }, { value: 'album', label: sn.album },
              { value: 'artist', label: sn.artist }, { value: 'track', label: sn.track },
              { value: 'radio', label: sn.radio },
            ] } } },
            { name: 'count', selector: { number: { min: 1, max: 100, step: 1, mode: 'box' } } },
          ] },
        ];
        if (type !== 'recommendations') {
          sourceFields.push(
            { name: 'order_by', selector: { select: { mode: 'dropdown', options: [
              { value: '', label: ed.ordStandaard },
              { value: 'last_played_desc', label: ed.ordRecent },
              { value: 'timestamp_added_desc', label: ed.ordNieuw },
              { value: 'random', label: ed.ordRandom },
            ] } } },
            { name: 'favorite', selector: { boolean: {} } },
            { name: 'play', selector: { boolean: {} } },
          );
        }
        binnen.appendChild(this._form(
          sourceFields,
          {
            media_type: type,
            count: br.limit == null ? (type === 'recommendations' ? 9 : 12) : br.limit,
            order_by: br.order_by || '',
            favorite: br.favorite === true,
            play: br.play === true,
          },
          (v) => {
            const nieuwType = v.media_type !== type;
            const recommendations = v.media_type === 'recommendations';
            const bron = {
              media_type: v.media_type,
              limit: v.count || (recommendations ? 9 : 12),
            };
            if (!recommendations) {
              if (v.order_by) bron.order_by = v.order_by;
              if (v.favorite) bron.favorite = true;
              if (v.play) bron.play = true;
            }
            const lijst = (this._cfg.categories || []).slice();
            lijst[ci] = Object.assign({}, lijst[ci], { source: bron });
            this._cfg.categories = lijst;
            if (nieuwType) this._herbouw(); else this._melden();
          }
        ));
      }
      const tegels = document.createElement('div');
      tegels.className = 'tegels';
      (auto ? [] : cat.tiles || []).forEach((tg, ti) => {
        const rij = document.createElement('div');
        rij.className = 'tegel';
        rij.appendChild(this._form(tSchema, {
          name: tg.name || '', icon: this._mdi(tg.icon), uri: tg.uri || '',
          image: tg.image || '', play: !!tg.play, radio_mode: !!tg.radio_mode,
        }, (v) => {
          const nt = { name: v.name, uri: v.uri };
          if (v.image) nt.image = v.image;
          else if (v.icon) nt.icon = v.icon;
          if (v.play) nt.play = true;
          if (v.radio_mode) nt.radio_mode = true;
          const lijst = (this._cfg.categories[ci].tiles || []).slice();
          lijst[ti] = nt;
          this._cfg.categories[ci] = Object.assign({}, this._cfg.categories[ci], { tiles: lijst });
          this._melden();
        }));
        const wr = document.createElement('div');
        wr.className = 'rij';
        wr.appendChild(this._knop(ed.weg, 'weg', () => {
          this._cfg.categories[ci].tiles = (cat.tiles || []).filter((x, k) => k !== ti);
          this._herbouw();
        }));
        rij.appendChild(wr);
        tegels.appendChild(rij);
      });
      binnen.appendChild(tegels);
      if (!auto) {
        binnen.appendChild(this._knop(ed.tegelToe, '', () => {
          this._cfg.categories[ci].tiles = (cat.tiles || []).concat([{ name: '', uri: '' }]);
          this._herbouw();
        }));
      }
      const kop = (cat.name || ed.naamloos) + '  ·  ' + (auto
        ? ed.autoTegels
        : ((cat.tiles || []).length) + ' ' + ed.tegels.toLowerCase());
      cVak.appendChild(this._paneel(kop, binnen, () => {
        this._cfg.categories = cats.filter((x, k) => k !== ci);
        if (!this._cfg.categories.length) delete this._cfg.categories;
        this._herbouw();
      }));
    });
    cVak.appendChild(this._knop(ed.catToe, '', () => {
      this._cfg.categories = (this._cfg.categories || []).concat([{ name: '', tiles: [] }]);
      this._herbouw();
    }));
    wortel.appendChild(cVak);

    // ---- navigatieknoppen ----
    const lVak = document.createElement('div');
    lVak.className = 'vak';
    lVak.innerHTML = `<div class="kop">${ed.links}</div>`;
    const links = c.links || [];
    const lSchema = [
      { name: '', type: 'grid', schema: [
        { name: 'name', selector: { text: {} } },
        { name: 'icon', selector: { icon: {} } },
      ] },
      { name: 'path', selector: { text: {} } },
    ];
    links.forEach((l, li) => {
      const form = this._form(lSchema,
        { name: l.name || '', icon: this._mdi(l.icon), path: l.path || '' },
        (v) => {
          this._cfg.links = (this._cfg.links || []).slice();
          this._cfg.links[li] = { name: v.name, icon: v.icon, path: v.path };
          this._melden();
        });
      lVak.appendChild(this._paneel(l.name || ed.naamloos, form, () => {
        this._cfg.links = links.filter((x, k) => k !== li);
        if (!this._cfg.links.length) delete this._cfg.links;
        this._herbouw();
      }));
    });
    lVak.appendChild(this._knop(ed.linkToe, '', () => {
      this._cfg.links = (this._cfg.links || []).concat([{ name: '', icon: 'mdi:home', path: '' }]);
      this._herbouw();
    }));
    wortel.appendChild(lVak);
  }
}

const Q = new URL(import.meta.url).search;
const { ICON_ALIASES, TAAL } = await import(`./shared.js${Q}`);
const { KIOSK_THEMES } = await import(`./kiosk-theme.js${Q}`);
const { maPlayerOptions, isMaPlayer, suggestMaPlayer } = await import(`./players.js${Q}`);

const EDSTYLE = `
:host { display:block; }
.section { margin-bottom:18px; }
.heading { font-size:15px; font-weight:700; margin:0 0 8px; display:flex;
       align-items:center; justify-content:space-between; gap:10px; }
ha-expansion-panel { margin-bottom:8px; --expansion-panel-summary-padding:0 12px; }
.row { display:flex; align-items:center; gap:8px; }
.block { padding:4px 4px 12px; }
.button { border:0; cursor:pointer; font:inherit; font-size:13px; font-weight:600;
        border-radius:999px; padding:7px 14px;
        background:var(--primary-color); color:var(--text-primary-color,#fff); }
.button.remove { background:transparent; color:var(--error-color,#db4437); padding:6px 4px; }
.empty { opacity:.6; font-size:13px; padding:4px 2px 10px; }
.tiles { padding-left:4px; }
.tile { border-top:1px solid var(--divider-color); padding:10px 0 2px; }
.tile:first-child { border-top:0; }
`;

const ED_LABEL = { path: 'pad', radio_mode: 'radio', count: 'aantal', fill_source: 'vullen' };

// Hint line under a field in the editor. Only for the fields where a new user
// has nothing to go on - the media id above all: it is a plain text box and
// nothing on screen says what belongs in it or where to find it.
const ED_HINT = { uri: 'uriHint', username: 'usernameHint', entity: 'entityHint' };

export class MusicAssistantTouchCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    const configJson = JSON.stringify(config || {});
    this._cfg = JSON.parse(configJson);
    if (configJson === this._lastConfigJson) return;   // Our own change: do not rebuild.
    this._lastConfigJson = configJson;
    this._dirty = true;
    this._renderEditor();
  }

  set hass(hass) {
    const isFirstUpdate = !this._hass;
    this._hass = hass;
    if (isFirstUpdate || this._dirty) this._renderEditor();
    else this.shadowRoot.querySelectorAll('ha-form').forEach((f) => { f.hass = hass; });
  }

  _getEditorText() {
    const languageCode = ((this._cfg && this._cfg.language)
      || (this._hass && this._hass.language) || 'en').slice(0, 2).toLowerCase();
    return (TAAL[languageCode] || TAAL.en).ed;
  }

  _getMediaTypeLabel() {
    const languageCode = ((this._cfg && this._cfg.language)
      || (this._hass && this._hass.language) || 'en').slice(0, 2).toLowerCase();
    return (TAAL[languageCode] || TAAL.en).soort;
  }

  _emitConfigChange() {
    this._lastConfigJson = JSON.stringify(this._cfg);
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._cfg }, bubbles: true, composed: true,
    }));
  }

  _rebuildEditor() {
    this._emitConfigChange();
    this._dirty = true;
    this._renderEditor();
  }

  _iconHtml(name) {
    const n = String(name || '');
    if (!n) return '';
    return n.indexOf(':') > 0 ? n : (ICON_ALIASES[n] || '');
  }

  // A ha-form with custom labels. Set its data once; ha-form keeps subsequent
  // input itself, so typing never loses focus.
  _appendForm(schema, data, onChange) {
    const editorText = this._getEditorText();
    const formElement = document.createElement('ha-form');
    formElement.hass = this._hass;
    formElement.schema = schema;
    formElement.data = data;
    formElement.computeLabel = (sch) => editorText[ED_LABEL[sch.name] || sch.name] || sch.name;
    formElement.computeHelper = (sch) => editorText[ED_HINT[sch.name]] || '';
    formElement.addEventListener('value-changed', (ev) => {
      ev.stopPropagation();
      onChange(ev.detail.value);
    });
    return formElement;
  }

  _addButton(label, cls, onClick) {
    const b = document.createElement('button');
    b.className = 'button' + (cls ? ' ' + cls : '');
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  _addPanel(title, content, onRemove) {
    const panel = document.createElement('ha-expansion-panel');
    panel.outlined = true;
    panel.header = title;
    const contentBlock = document.createElement('div');
    contentBlock.className = 'block';
    contentBlock.appendChild(content);
    if (onRemove) {
      const removeRow = document.createElement('div');
      removeRow.className = 'row';
      removeRow.appendChild(this._addButton(this._getEditorText().weg, 'remove', onRemove));
      contentBlock.appendChild(removeRow);
    }
    panel.appendChild(contentBlock);
    return panel;
  }

  _renderEditor() {
    if (!this._hass || !this._cfg) return;
    this._dirty = false;
    const editorText = this._getEditorText();
    const mediaTypeLabels = this._getMediaTypeLabel();
    const config = this._cfg;
    const shadowRoot = this.shadowRoot;
    shadowRoot.innerHTML = `<style>${EDSTYLE}</style>`;
    const root = document.createElement('div');
    shadowRoot.appendChild(root);

    // ---- general ----
    //
    // Only the one field you cannot do without sits in the open. The rest is
    // grouped by the question it answers - how it looks, how it plays, how it
    // searches - because a single column of fourteen settings tells a newcomer
    // nothing about which three of them matter.
    const generalSection = document.createElement('div');
    generalSection.className = 'section';
    generalSection.innerHTML = `<div class="heading">${editorText.algemeen}</div>`;
    generalSection.appendChild(this._appendForm(
      [{ name: 'config_entry_id', required: true,
        selector: { config_entry: { integration: 'music_assistant' } } }],
      { config_entry_id: config.config_entry_id || '' },
      (v) => { this._cfg.config_entry_id = v.config_entry_id; this._emitConfigChange(); }
    ));

    generalSection.appendChild(this._addPanel(editorText.weergave, this._appendForm(
      [
        { name: '', type: 'grid', schema: [
          { name: 'height', selector: { number: { min: 240, max: 1400, step: 2, mode: 'box' } } },
          { name: 'fill_margin', selector: { number: { min: 0, max: 200, step: 1, mode: 'box' } } },
        ] },
        { name: 'fill', selector: { boolean: {} } },
        { name: 'show_player', selector: { boolean: {} } },
        { name: 'discover', selector: { boolean: {} } },
        { name: 'discover_source', selector: { select: { mode: 'dropdown', options: [
          { value: 'mixed', label: editorText.srcMix }, { value: 'similar', label: editorText.srcSimilar },
          { value: 'music_assistant', label: editorText.srcMa },
        ] } } },
        { name: 'arrows', selector: { boolean: {} } },
        { name: 'kiosk_theme', selector: { boolean: {} } },
        { name: 'theme', selector: { select: { mode: 'dropdown', options: KIOSK_THEMES
          .map((value) => ({ value, label: (editorText.themas || {})[value] || value })) } } },
        { name: 'language', selector: { select: { mode: 'dropdown', options: [
          { value: '', label: editorText.automatisch },
          { value: 'nl', label: 'Nederlands' }, { value: 'en', label: 'English' },
          { value: 'fr', label: 'Français' },
        ] } } },
      ],
      {
        height: config.height == null ? 556 : config.height,
        fill_margin: config.fill_margin == null ? 8 : config.fill_margin,
        fill: config.fill === true,
        show_player: config.show_player !== false,
        discover: config.discover !== false,
        discover_source: config.discover_source === 'spotify' ? 'similar' : (config.discover_source || 'mixed'),
        arrows: config.arrows !== false,
        kiosk_theme: config.kiosk_theme !== false,
        theme: KIOSK_THEMES.includes(config.theme) ? config.theme : 'sunset',
        language: config.language || '',
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
        this._emitConfigChange();
      }
    )));

    generalSection.appendChild(this._addPanel(editorText.spelenKop, this._appendForm(
      [
        { name: '', type: 'grid', schema: [
          { name: 'volume_max', selector: { number: { min: 5, max: 100, step: 1, mode: 'box' } } },
          { name: 'volume_start', selector: { number: { min: 0, max: 100, step: 1, mode: 'box' } } },
          { name: 'volume_step', selector: { number: { min: 0.1, max: 100, step: 0.1, mode: 'box' } } },
        ] },
        { name: 'tile_action', selector: { select: { mode: 'dropdown', options: [
          { value: 'open', label: editorText.openen }, { value: 'play', label: editorText.afspelen },
        ] } } },
        { name: 'transfer_on_switch', selector: { boolean: {} } },
        { name: 'retry_next', selector: { boolean: {} } },
        { name: 'autofill_similar', selector: { boolean: {} } },
        { name: 'full_modal', selector: { boolean: {} } },
      ],
      {
        volume_max: config.volume_max == null ? 100 : config.volume_max,
        volume_start: config.volume_start == null ? null : config.volume_start,
        volume_step: config.volume_step == null ? 1 : config.volume_step,
        tile_action: config.tile_action || 'open',
        transfer_on_switch: config.transfer_on_switch !== false,
        retry_next: config.retry_next !== false,
        autofill_similar: config.autofill_similar !== false,
        full_modal: config.full_modal === true,
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
        this._cfg.autofill_similar = !!v.autofill_similar;
        if (v.full_modal) this._cfg.full_modal = true;
        else delete this._cfg.full_modal;
        this._emitConfigChange();
      }
    )));

    generalSection.appendChild(this._addPanel(editorText.zoekKop, this._appendForm(
      [
        { name: 'keyboard', selector: { boolean: {} } },
        { name: 'limit', selector: { number: { min: 6, max: 100, step: 1, mode: 'box' } } },
        { name: 'search_types', selector: { select: { multiple: true, mode: 'list', options: [
          { value: 'track', label: mediaTypeLabels.track }, { value: 'album', label: mediaTypeLabels.album },
          { value: 'artist', label: mediaTypeLabels.artist }, { value: 'playlist', label: mediaTypeLabels.playlist },
        ] } } },
      ],
      {
        keyboard: config.keyboard === true,
        limit: config.limit == null ? 24 : config.limit,
        search_types: config.search_types || ['track', 'album', 'artist', 'playlist'],
      },
      (v) => {
        this._cfg.keyboard = !!v.keyboard;
        this._cfg.limit = v.limit;
        this._cfg.search_types = v.search_types;
        this._emitConfigChange();
      }
    )));
    root.appendChild(generalSection);

    // ---- speakers ----
    const zoneSection = document.createElement('div');
    zoneSection.className = 'section';
    zoneSection.innerHTML = `<div class="heading">${editorText.zones}</div>`;
    const zones = config.zones || [];
    zones.forEach((z, i) => {
      const b = z.before || {};
      const groupWithIds = Array.isArray(z.group_with) ? z.group_with
        : (b.join && b.join.leader === z.entity && Array.isArray(b.join.members)
          ? b.join.members.filter((id) => id !== z.entity) : []);
      const zSchema = [
        { name: '', type: 'grid', schema: [
          { name: 'name', selector: { text: {} } },
          { name: 'icon', selector: { icon: {} } },
        ] },
        { name: 'entity', selector: { select: { mode: 'dropdown', options: maPlayerOptions(this._hass, [z.entity], editorText.groep) } } },
        { name: '', type: 'grid', schema: [
          { name: 'volume_max', selector: { number: { min: 5, max: 100, step: 1, mode: 'box' } } },
          { name: 'volume_start', selector: { number: { min: 0, max: 100, step: 1, mode: 'box' } } },
          { name: 'volume_step', selector: { number: { min: 0.1, max: 100, step: 0.1, mode: 'box' } } },
        ] },
        { name: 'group_with', selector: { select: { multiple: true, mode: 'dropdown',
          options: maPlayerOptions(this._hass, groupWithIds, editorText.groep).filter((option) => option.value !== z.entity) } } },
        { name: 'solo', selector: { boolean: {} } },
        { name: 'turn_off', selector: { select: { mode: 'dropdown', options: [
          { value: '', label: editorText.geen },
          ...maPlayerOptions(this._hass, [b.turn_off], editorText.groep),
        ] } } },
      ];
      const zoneFormData = {
        name: z.name || '', icon: this._iconHtml(z.icon), entity: z.entity || '',
        volume_max: z.volume_max == null ? null : z.volume_max,
        volume_start: z.volume_start == null ? null : z.volume_start,
        volume_step: z.volume_step == null ? null : z.volume_step,
        group_with: groupWithIds,
        solo: !!z.solo || b.unjoin === z.entity,
        turn_off: b.turn_off || '',
      };
      const form = this._appendForm(zSchema, zoneFormData, (v) => {
        const currentZone = (this._cfg.zones || [])[i] || z;
        const zoneConfig = Object.assign({}, currentZone, { name: v.name, entity: v.entity });
        if (v.icon) zoneConfig.icon = v.icon;
        else delete zoneConfig.icon;
        for (const key of ['volume_max', 'volume_start', 'volume_step']) {
          if (v[key] != null && v[key] !== '') zoneConfig[key] = v[key];
          else delete zoneConfig[key];
        }
        const groupWith = [].concat(v.group_with || []).filter((id) => id && id !== v.entity);
        if (groupWith.length) zoneConfig.group_with = groupWith;
        else delete zoneConfig.group_with;
        if (v.solo) zoneConfig.solo = true;
        else delete zoneConfig.solo;
        const beforeConfig = Object.assign({}, currentZone.before || {});
        if (v.turn_off) beforeConfig.turn_off = v.turn_off;
        else delete beforeConfig.turn_off;
        if (beforeConfig.join && beforeConfig.join.leader === currentZone.entity) delete beforeConfig.join;
        if (beforeConfig.unjoin === currentZone.entity) delete beforeConfig.unjoin;
        if (Object.keys(beforeConfig).length) zoneConfig.before = beforeConfig;
        else delete zoneConfig.before;
        this._cfg.zones = (this._cfg.zones || []).slice();
        this._cfg.zones[i] = zoneConfig;
        this._emitConfigChange();
      });
      const content = document.createElement('div');
      if (z.entity && !isMaPlayer(this._hass && this._hass.states[z.entity])) {
        const alert = document.createElement('ha-alert');
        alert.setAttribute('alert-type', 'warning');
        alert.textContent = editorText.nietMa;
        content.appendChild(alert);
        const suggestion = suggestMaPlayer(this._hass, z.entity);
        if (suggestion) {
          const suggestedState = this._hass.states[suggestion];
          const suggestedName = (suggestedState && suggestedState.attributes && suggestedState.attributes.friendly_name) || suggestion;
          content.appendChild(this._addButton(editorText.gebruikMa.replace('{name}', suggestedName), '', () => {
            this._cfg.zones = (this._cfg.zones || []).slice();
            this._cfg.zones[i] = Object.assign({}, z, { entity: suggestion });
            this._rebuildEditor();
          }));
        }
      }
      if (z.volume) {
        const volumeState = this._hass && this._hass.states[z.volume];
        const volumeName = (volumeState && volumeState.attributes && volumeState.attributes.friendly_name) || z.volume;
        const alert = document.createElement('ha-alert');
        alert.setAttribute('alert-type', 'info');
        alert.textContent = editorText.volumeLegacy.replace('{name}', volumeName);
        content.appendChild(alert);
      }
      content.appendChild(form);
      zoneSection.appendChild(this._addPanel(z.name || editorText.naamloos, content, () => {
        this._cfg.zones = zones.filter((x, k) => k !== i);
        if (!this._cfg.zones.length) delete this._cfg.zones;
        this._rebuildEditor();
      }));
    });
    zoneSection.appendChild(this._addButton(editorText.zoneToe, '', () => {
      this._cfg.zones = (this._cfg.zones || []).concat([{ name: '', entity: '' }]);
      this._rebuildEditor();
    }));
    root.appendChild(zoneSection);

    const sourceSection = document.createElement('div');
    sourceSection.className = 'section';
    sourceSection.innerHTML = `<div class="heading">${editorText.sources}</div>`;
    const sources = config.music_sources || [];
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
      const form = this._appendForm(sSchema, {
        name: source.name || '', icon: this._iconHtml(source.icon), username: source.username || '',
        connect_entity: source.connect_entity || '',
        spotify_entity: source.spotify_entity || '',
      }, (value) => {
        const entry = { name: value.name, username: (value.username || '').trim() };
        if (value.icon) entry.icon = value.icon;
        if (value.connect_entity) entry.connect_entity = value.connect_entity;
        if (value.spotify_entity) entry.spotify_entity = value.spotify_entity;
        this._cfg.music_sources = (this._cfg.music_sources || []).slice();
        this._cfg.music_sources[index] = entry;
        this._emitConfigChange();
      });
      sourceSection.appendChild(this._addPanel(source.name || editorText.naamloos, form, () => {
        this._cfg.music_sources = (this._cfg.music_sources || [])
          .filter((item, itemIndex) => itemIndex !== index);
        if (!this._cfg.music_sources.length) delete this._cfg.music_sources;
        this._rebuildEditor();
      }));
    });
    sourceSection.appendChild(this._addButton(editorText.sourceToe, '', () => {
      this._cfg.music_sources = (this._cfg.music_sources || [])
        .concat([{ name: '', username: '', icon: 'mdi:spotify' }]);
      this._rebuildEditor();
    }));
    root.appendChild(sourceSection);

    // ---- categories ----
    const categorySection = document.createElement('div');
    categorySection.className = 'section';
    categorySection.innerHTML = `<div class="heading">${editorText.cats}</div>`;
    const cats = config.categories || [];
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
      const contentSection = document.createElement('div');
      const auto = !!cat.source;
      // The one question that decides what the rest of this panel looks like:
      // do you write the list, or does Music Assistant.
      contentSection.appendChild(this._appendForm(
        [
          { name: 'name', selector: { text: {} } },
          { name: 'fill_source', selector: { select: { mode: 'dropdown', options: [
            { value: 'hand', label: editorText.bronHand },
            { value: 'auto', label: editorText.bronAuto },
          ] } } },
        ],
        { name: cat.name || '', fill_source: auto ? 'auto' : 'hand' },
        (v) => {
          const categoriesCopy = (this._cfg.categories || []).slice();
          const updatedCategory = Object.assign({}, categoriesCopy[ci], { name: v.name });
          const wantsAutomaticSource = v.fill_source === 'auto';
          if (wantsAutomaticSource && !updatedCategory.source) {
            updatedCategory.source = { media_type: 'playlist', limit: 12, order_by: 'last_played_desc' };
            delete updatedCategory.tiles;
          } else if (!wantsAutomaticSource && updatedCategory.source) {
            delete updatedCategory.source;
            updatedCategory.tiles = updatedCategory.tiles || [];
          }
          categoriesCopy[ci] = updatedCategory;
          this._cfg.categories = categoriesCopy;
          if (wantsAutomaticSource !== auto) this._rebuildEditor(); else this._emitConfigChange();
        }
      ));
      if (auto) {
        const br = cat.source || {};
        const type = br.media_type || 'playlist';
        const sourceFields = [
          { name: '', type: 'grid', schema: [
            { name: 'media_type', selector: { select: { mode: 'dropdown', options: [
              { value: 'recommendations', label: editorText.recommendations },
              { value: 'playlist', label: mediaTypeLabels.playlist }, { value: 'album', label: mediaTypeLabels.album },
              { value: 'artist', label: mediaTypeLabels.artist }, { value: 'track', label: mediaTypeLabels.track },
              { value: 'radio', label: mediaTypeLabels.radio },
            ] } } },
            { name: 'count', selector: { number: { min: 1, max: 100, step: 1, mode: 'box' } } },
          ] },
        ];
        if (type !== 'recommendations') {
          sourceFields.push(
            { name: 'order_by', selector: { select: { mode: 'dropdown', options: [
              { value: '', label: editorText.ordStandaard },
              { value: 'last_played_desc', label: editorText.ordRecent },
              { value: 'timestamp_added_desc', label: editorText.ordNieuw },
              { value: 'random', label: editorText.ordRandom },
            ] } } },
            { name: 'favorite', selector: { boolean: {} } },
            { name: 'play', selector: { boolean: {} } },
          );
        }
        contentSection.appendChild(this._appendForm(
          sourceFields,
          {
            media_type: type,
            count: br.limit == null ? (type === 'recommendations' ? 9 : 12) : br.limit,
            order_by: br.order_by || '',
            favorite: br.favorite === true,
            play: br.play === true,
          },
          (v) => {
            const mediaTypeChanged = v.media_type !== type;
            const recommendations = v.media_type === 'recommendations';
            const sourceConfig = {
              media_type: v.media_type,
              limit: v.count || (recommendations ? 9 : 12),
            };
            if (!recommendations) {
              if (v.order_by) sourceConfig.order_by = v.order_by;
              if (v.favorite) sourceConfig.favorite = true;
              if (v.play) sourceConfig.play = true;
            }
            const categoriesCopy = (this._cfg.categories || []).slice();
            categoriesCopy[ci] = Object.assign({}, categoriesCopy[ci], { source: sourceConfig });
            this._cfg.categories = categoriesCopy;
            if (mediaTypeChanged) this._rebuildEditor(); else this._emitConfigChange();
          }
        ));
      }
      const tileList = document.createElement('div');
      tileList.className = 'tiles';
      (auto ? [] : cat.tiles || []).forEach((tile, tileIndex) => {
        const tileRow = document.createElement('div');
        tileRow.className = 'tile';
        tileRow.appendChild(this._appendForm(tSchema, {
          name: tile.name || '', icon: this._iconHtml(tile.icon), uri: tile.uri || '',
          image: tile.image || '', play: !!tile.play, radio_mode: !!tile.radio_mode,
        }, (v) => {
          const tileConfig = { name: v.name, uri: v.uri };
          if (v.image) tileConfig.image = v.image;
          else if (v.icon) tileConfig.icon = v.icon;
          if (v.play) tileConfig.play = true;
          if (v.radio_mode) tileConfig.radio_mode = true;
          const tileConfigs = (this._cfg.categories[ci].tiles || []).slice();
          tileConfigs[tileIndex] = tileConfig;
          this._cfg.categories[ci] = Object.assign({}, this._cfg.categories[ci], { tiles: tileConfigs });
          this._emitConfigChange();
        }));
        const actionRow = document.createElement('div');
        actionRow.className = 'row';
        actionRow.appendChild(this._addButton(editorText.weg, 'remove', () => {
          this._cfg.categories[ci].tiles = (cat.tiles || []).filter((x, k) => k !== tileIndex);
          this._rebuildEditor();
        }));
        tileRow.appendChild(actionRow);
        tileList.appendChild(tileRow);
      });
      contentSection.appendChild(tileList);
      if (!auto) {
        contentSection.appendChild(this._addButton(editorText.tegelToe, '', () => {
          this._cfg.categories[ci].tiles = (cat.tiles || []).concat([{ name: '', uri: '' }]);
          this._rebuildEditor();
        }));
      }
      const panelTitle = (cat.name || editorText.naamloos) + '  ·  ' + (auto
        ? editorText.autoTegels
        : ((cat.tiles || []).length) + ' ' + editorText.tegels.toLowerCase());
      categorySection.appendChild(this._addPanel(panelTitle, contentSection, () => {
        this._cfg.categories = cats.filter((x, k) => k !== ci);
        if (!this._cfg.categories.length) delete this._cfg.categories;
        this._rebuildEditor();
      }));
    });
    categorySection.appendChild(this._addButton(editorText.catToe, '', () => {
      this._cfg.categories = (this._cfg.categories || []).concat([{ name: '', tiles: [] }]);
      this._rebuildEditor();
    }));
    root.appendChild(categorySection);

    // ---- navigation buttons ----
    const navigationSection = document.createElement('div');
    navigationSection.className = 'section';
    navigationSection.innerHTML = `<div class="heading">${editorText.links}</div>`;
    const links = config.links || [];
    const lSchema = [
      { name: '', type: 'grid', schema: [
        { name: 'name', selector: { text: {} } },
        { name: 'icon', selector: { icon: {} } },
      ] },
      { name: 'path', selector: { text: {} } },
    ];
    links.forEach((l, li) => {
      const form = this._appendForm(lSchema,
        { name: l.name || '', icon: this._iconHtml(l.icon), path: l.path || '' },
        (v) => {
          this._cfg.links = (this._cfg.links || []).slice();
          this._cfg.links[li] = { name: v.name, icon: v.icon, path: v.path };
          this._emitConfigChange();
        });
      navigationSection.appendChild(this._addPanel(l.name || editorText.naamloos, form, () => {
        this._cfg.links = links.filter((x, k) => k !== li);
        if (!this._cfg.links.length) delete this._cfg.links;
        this._rebuildEditor();
      }));
    });
    navigationSection.appendChild(this._addButton(editorText.linkToe, '', () => {
      this._cfg.links = (this._cfg.links || []).concat([{ name: '', icon: 'mdi:home', path: '' }]);
      this._rebuildEditor();
    }));
    root.appendChild(navigationSection);
  }
}

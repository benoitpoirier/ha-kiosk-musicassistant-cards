import {
  BIB_MAX, BIB_TTL, LARGE_IMAGE_URL, SMALL_IMAGE_URL, ICON_ALIASES, KEYBOARD_ROWS, MEDIA_TYPES, mediaTypeFromUri,
  normalizeSpotifyUri, PLAYING_STATES, safeImageUrl, VOLUME_CSS, defaultCategories, esc, formatDuration, svg, getLanguage, bindVolumeControl, volumeControlHtml, updateVolumeDisplay,
} from './shared.js';
import { KIOSK_CSS, KIOSK_THEMES } from './kiosk-theme.js';

const DOMAIN = 'kiosk_musicassistant_cards';

const STYLE = `
:host {
  display:block;
  container-type:inline-size;
  container-name:card;
  --acc:#1DB954;
  --grad:var(--acc);
  --acc-glow:rgba(29,185,84,.35);
  --ov1:rgba(255,255,255,.05);
  --ov2:rgba(255,255,255,.09);
  --line:rgba(255,255,255,.07);
  --muted:rgba(255,255,255,.55);
  --subtle:rgba(255,255,255,.34);
}
/* Light or dark follows the Home Assistant theme the card actually sits in, not the
   operating system: a light dashboard on a dark laptop must still get dark text. */
:host(.light) { --ov1:rgba(0,0,0,.04); --ov2:rgba(0,0,0,.07); --line:rgba(0,0,0,.08);
                --muted:rgba(0,0,0,.6); --subtle:rgba(0,0,0,.38); }
* { box-sizing:border-box; }

/* Keep the card on one surface; avoid nested cards. */
.wrap { display:grid; grid-template-columns:288px 1px minmax(0,1fr); gap:18px;
        overflow:hidden; max-width:100%; height:var(--card-height,556px);
        padding:16px 18px; border-radius:20px;
        background:var(--ha-card-background, var(--card-background-color, #1c1c1e));
        font-family:var(--primary-font-family,sans-serif);
        color:var(--primary-text-color,#e9e9ea); font-size:14px; }
.divider { background:var(--line); align-self:stretch; }
.col { display:flex; flex-direction:column; min-width:0; max-width:100%; }
.col > * { max-width:100%; min-width:0; }
.right { min-width:0; max-width:100%; overflow:hidden; }
button { font:inherit; color:inherit; border:0; cursor:pointer; background:none; padding:0;
         transition:opacity .12s, color .12s, background .12s, transform .08s; }
button:active { transform:scale(.96); }
  _stabilizeMetadata(entityId, attributes) {
    const delayMs = Math.max(0, Number(this._cfg.radio_delay) || 0) * 1000;
    const isRadio = !attributes.media_duration && !!attributes.media_title;
    const trackLag = Math.max(0, Number(this._cfg.radio_lag) || 0);
    if (!entityId || !isRadio || (!delayMs && !trackLag)) return attributes;
    if (trackLag) {
      // Some stations publish their titles a whole song ahead: while you hear one
      // track, the stream already names the next. A song has no fixed length, so
      // seconds cannot fix that - staying one title behind can. The programme's
      // own name (artist equal to the station) is not a track and passes straight
      // through, so a talk break still shows as a talk break.
      const stationName = attributes.media_album_name || attributes.media_channel || '';
      const isProgramSegment = !!stationName && (attributes.media_artist || '') === stationName;
      if (!this._metadataHistory) this._metadataHistory = {};
      const history = this._metadataHistory[entityId] || (this._metadataHistory[entityId] = []);
      if (!isProgramSegment) {
        const latestEntry = history.length ? history[history.length - 1] : null;
        if (!latestEntry || latestEntry.title !== attributes.media_title) {
          history.push({
            title: attributes.media_title,
            artist: attributes.media_artist || '',
            image: attributes.entity_picture_local || attributes.entity_picture || '',
          });
          if (history.length > 10) history.shift();
          this._metadataHistoryTimes = this._metadataHistoryTimes || {};
          this._metadataHistoryTimes[entityId] = Date.now();
        }
        const delayedEntry = history[history.length - 1 - trackLag];
        if (delayedEntry) {
          return Object.assign({}, attributes, {
            media_title: delayedEntry.title,
            media_artist: delayedEntry.artist,
            entity_picture: delayedEntry.image,
            entity_picture_local: '',
          });
        }
      }
      // The programme's name also arrives in the middle of a song, which looks the
      // same as a real talk break. So it only takes over once no new title has come
      // in for five minutes: a break or the news, rather than a flip mid-song.
      const lastTrackAt = (this._metadataHistoryTimes || {})[entityId];
      if (isProgramSegment && lastTrackAt && Date.now() - lastTrackAt < 300000) {
        const previousEntry = history[history.length - 1 - trackLag];
        if (previousEntry) {
          return Object.assign({}, attributes, {
            media_title: previousEntry.title,
            media_artist: previousEntry.artist,
            entity_picture: previousEntry.image,
            entity_picture_local: '',
          });
        }
      }
      return attributes;
    }
    if (!this._meta) this._meta = {};
    const history = this._meta[entityId] || (this._meta[entityId] = []);
    const now = Date.now();
    const currentMetadata = {
      title: attributes.media_title || '',
      artist: attributes.media_artist || '',
      image: attributes.entity_picture_local || attributes.entity_picture || '',
    };
    const latestEntry = history.length ? history[history.length - 1] : null;
    if (!latestEntry || latestEntry.title !== currentMetadata.title
      || latestEntry.artist !== currentMetadata.artist || latestEntry.image !== currentMetadata.image) {
      history.push(Object.assign({}, currentMetadata, { timestamp: now }));
      if (history.length > 20) history.shift();
    }
    // The newest entry that is old enough to be audible by now.
    let displayedEntry = history[0];
    for (const entry of history) { if (now - entry.timestamp >= delayMs) displayedEntry = entry; }
    // Still waiting on the next one: come back when it is due.
    const nextEntry = history.find((entry) => now - entry.timestamp < delayMs);
    if (nextEntry && !this._metaTimer) {
      this._metaTimer = setTimeout(() => {
        this._metaTimer = null;
        this._syncPlayer();
      }, delayMs - (now - nextEntry.timestamp) + 100);
    }
    if (!displayedEntry || (displayedEntry.title === currentMetadata.title
      && displayedEntry.artist === currentMetadata.artist && displayedEntry.image === currentMetadata.image)) return attributes;
    return Object.assign({}, attributes, {
      media_title: displayedEntry.title,
      media_artist: displayedEntry.artist,
      entity_picture: displayedEntry.image,
      entity_picture_local: '',
    });
  }
         gap:18px 16px; align-content:start; padding:4px 2px 12px; scrollbar-width:none; }
.tiles::-webkit-scrollbar { display:none; }
@container right-column (max-width: 600px) { .tiles { --tmin:112px; gap:14px 12px; } }
@container right-column (max-width: 420px) { .tiles { --tmin:96px; gap:12px 10px; } }
@container right-column (min-width: 1000px) { .tiles { --tmin:168px; gap:22px 20px; } }
@container right-column (min-width: 1300px) { .tiles { --tmin:196px; gap:26px 22px; } }
@container right-column (min-width: 1700px) { .tiles { --tmin:228px; } }

.tile { display:flex; flex-direction:column; align-items:stretch; min-width:0; max-width:100%;
        position:relative; text-align:left; border-radius:14px; }
.tile .cover { position:relative; width:100%; aspect-ratio:1; border-radius:12px; overflow:hidden;
               background:var(--ov1); box-shadow:0 8px 22px rgba(0,0,0,.28);
               transition:transform .18s ease, box-shadow .18s ease; }
.tile.round .cover { border-radius:50%; }
.tile .cover img { width:100%; height:100%; object-fit:cover; display:block; }
.tile .cover .ic { width:100%; height:100%; display:flex; align-items:center; justify-content:center;
                   background:linear-gradient(145deg,var(--ov2),var(--ov1)); }
.tile .cover .ic ha-icon { --mdc-icon-size:40px; color:var(--acc); opacity:.9; }
.tile .play-button { position:absolute; right:8px; bottom:8px; width:40px; height:40px; border-radius:50%;
               display:flex; align-items:center; justify-content:center; background:var(--grad);
               color:#fff; box-shadow:0 6px 16px rgba(0,0,0,.4); opacity:.92;
               transition:transform .15s ease, opacity .15s ease; }
.tile.round .play-button { right:12%; bottom:12%; }
.tile .play-button ha-icon { --mdc-icon-size:24px; }
.tile .play-button:active { transform:scale(.88); }
.tile:active .cover { transform:scale(.97); }
@media (hover:hover) {
  .tile .play-button { opacity:0; transform:translateY(6px); }
  .tile:hover .play-button { opacity:1; transform:none; }
  .tile:hover .cover { transform:translateY(-2px); box-shadow:0 14px 30px rgba(0,0,0,.38); }
}
.tile .tt { font-size:13.5px; font-weight:650; padding-top:9px; line-height:1.25;
            color:var(--primary-text-color,#e9e9ea);
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tile .subtitle { font-size:12px; color:var(--subtle); padding-top:2px; line-height:1.25;
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tile.round .tt, .tile.round .subtitle { text-align:center; }

/* loading placeholders */
@keyframes glans { from { background-position:-200px 0; } to { background-position:calc(200px + 100%) 0; } }
.skelet .cover, .skelet .tt, .skelet .subtitle, .skelet-txt, .featured.skelet {
  background:linear-gradient(90deg,var(--ov1) 0,var(--ov2) 50%,var(--ov1) 100%) no-repeat;
  background-size:200px 100%; background-color:var(--ov1); animation:glans 1.3s ease-in-out infinite;
  box-shadow:none; }
.skelet .tt { height:13px; width:80%; margin-top:10px; padding:0; border-radius:6px; }
.skelet .subtitle { height:11px; width:50%; margin-top:6px; padding:0; border-radius:6px; }
.skelet-txt { height:18px; width:180px; border-radius:8px; }
.discover-title.skelet-txt { flex:0 0 180px; }

/* discover: featured pick + one carousel per recommendation row */
.discover { min-height:0; height:100%; overflow-y:auto; overflow-x:hidden; scrollbar-width:none;
          display:flex; flex-direction:column; gap:22px; padding:4px 2px 16px; }
.discover::-webkit-scrollbar { display:none; }
.featured { position:relative; flex:0 0 auto; display:flex; align-items:center; gap:22px; min-height:184px;
        padding:20px; border-radius:20px; overflow:hidden; isolation:isolate;
        background:var(--ov1); box-shadow:inset 0 0 0 1px var(--line); }
.featured-background { position:absolute; inset:-40px; z-index:-1; background-size:cover; background-position:center;
           filter:blur(36px) saturate(1.4) brightness(.55); transform:scale(1.15); }
.featured::after { content:''; position:absolute; inset:0; z-index:-1;
               background:linear-gradient(90deg,rgba(0,0,0,.35),rgba(0,0,0,.05)); }
.featured-art { flex:0 0 auto; width:144px; height:144px; border-radius:14px; overflow:hidden;
            box-shadow:0 14px 34px rgba(0,0,0,.5); }
.featured-art img { width:100%; height:100%; object-fit:cover; display:block; }
.featured-content { min-width:0; flex:1 1 auto; color:#fff; }
.featured-label { display:flex; align-items:center; gap:6px; font-size:11.5px; font-weight:700;
                letter-spacing:.8px; text-transform:uppercase; color:rgba(255,255,255,.75);
                white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.featured-label ha-icon { --mdc-icon-size:16px; }
.featured-title { font-size:30px; font-weight:800; letter-spacing:-.5px; line-height:1.1; margin-top:8px;
              display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.featured-subtitle { font-size:14px; color:rgba(255,255,255,.75); margin-top:6px;
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.featured-actions { display:flex; gap:10px; margin-top:16px; align-items:center; }
.button { display:inline-flex; align-items:center; gap:8px; height:46px; padding:0 22px; border-radius:999px;
        background:rgba(255,255,255,.14); color:#fff; font-size:15px; font-weight:700; }
.button ha-icon { --mdc-icon-size:22px; }
.button.primary { background:var(--grad); box-shadow:0 8px 22px var(--acc-glow); }
.button.round { width:46px; padding:0; justify-content:center; }
.discover-section { flex:0 0 auto; min-width:0; }
.discover-header { display:flex; align-items:center; gap:10px; margin-bottom:10px; min-height:36px; }
.discover-icon { width:32px; height:32px; border-radius:10px; display:flex; align-items:center; justify-content:center;
         background:var(--ov2); color:var(--acc); flex:0 0 auto; }
.discover-icon ha-icon { --mdc-icon-size:18px; }
.discover-title { flex:1 1 auto; min-width:0; font-size:19px; font-weight:750; letter-spacing:-.2px;
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.discover-title small { display:block; font-size:12px; font-weight:500; color:var(--subtle); letter-spacing:0; }
.discover-navigation { display:flex; gap:6px; flex:0 0 auto; }
.discover-navigation button { width:36px; height:36px; border-radius:50%; background:var(--ov1); color:var(--muted);
                 display:flex; align-items:center; justify-content:center; }
.discover-navigation ha-icon { --mdc-icon-size:22px; }
.carousel { --carousel-item-width:150px; display:grid; grid-auto-flow:column; grid-auto-columns:var(--carousel-item-width); gap:16px;
             overflow-x:auto; overflow-y:hidden; scroll-snap-type:x proximity; scrollbar-width:none;
             padding:2px 2px 6px; overscroll-behavior-x:contain; }
.carousel::-webkit-scrollbar { display:none; }
.carousel > .tile { scroll-snap-align:start; }
@container right-column (max-width: 600px) { .carousel { --carousel-item-width:118px; gap:12px; } .featured-art { width:104px; height:104px; } .featured-title { font-size:22px; } }
@container right-column (min-width: 1000px) { .carousel { --carousel-item-width:176px; gap:20px; } .featured-art { width:168px; height:168px; } }
@container right-column (min-width: 1300px) { .carousel { --carousel-item-width:204px; gap:22px; } .featured-art { width:196px; height:196px; } .featured-title { font-size:38px; } }
.empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px;
              text-align:center; flex:1 1 auto; font-size:15px; padding:40px 20px; }
.empty-state ha-icon { --mdc-icon-size:48px; color:var(--acc); }
.empty-state .button { color:var(--primary-text-color,#fff); background:var(--ov2); }

.list { min-height:0; max-width:100%; height:100%; overflow-y:auto; overflow-x:hidden;
         display:flex; flex-direction:column; padding-top:2px; scrollbar-width:none; }
.list::-webkit-scrollbar { display:none; }
.row { display:grid; grid-template-columns:46px minmax(0,1fr) auto; align-items:center; height:44px;
       flex:0 0 auto; max-width:100%; text-align:left; border-bottom:1px solid var(--line); }
.row:last-child { border-bottom:0; }
.row:hover { background:var(--ov1); }
.row img { width:32px; height:32px; border-radius:4px; object-fit:cover; justify-self:center; }
.row .tx { padding-left:2px; min-width:0; overflow:hidden; white-space:nowrap;
           text-overflow:ellipsis; font-size:13.5px; }
.row .tx b { font-weight:600; }
.row .tx span { color:var(--subtle); }
.row .duration { font-size:11.5px; color:var(--subtle); padding:0 8px 0 8px; font-variant-numeric:tabular-nums; }

/* Search row in the right column. */
.qbar { display:grid; grid-template-columns:26px minmax(0,1fr) auto; align-items:center;
        height:40px; max-width:100%; border-bottom:1px solid var(--line); flex:0 0 auto; }
.qbar ha-icon { --mdc-icon-size:18px; color:var(--subtle); }
.qbar .query { font-size:16px; min-width:0; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
.qbar .query i { color:var(--subtle); font-style:normal; }
.qbar input.query { border:0; outline:none; background:transparent; color:inherit; width:100%; }
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

.header { display:flex; gap:14px; align-items:center; min-width:0; max-width:100%;
       height:40px; border-bottom:1px solid var(--line); flex:0 0 auto; }
.header .back { flex:0 0 auto; display:flex; align-items:center; gap:5px; font-size:13px;
              color:var(--subtle); }
.header .back ha-icon { --mdc-icon-size:17px; }
.header .title { flex:1 1 0; min-width:0; font-size:15px; font-weight:600; white-space:nowrap;
              overflow:hidden; text-overflow:ellipsis; }
.header .title .count { font-size:12.5px; font-weight:400; color:var(--subtle); margin-left:8px; }
.header .play-all-button { flex:0 0 auto; height:28px; padding:0 14px; border-radius:999px; background:var(--acc);
              color:#fff; font-size:11.5px; font-weight:700; letter-spacing:.4px; }

.scrollbox { flex:1; min-height:0; max-width:100%; display:grid;
             grid-template-columns:minmax(0,1fr); gap:4px; margin-top:4px; }
.scrollbox.arrows-enabled { grid-template-columns:minmax(0,1fr) 34px; }
.arrows { display:flex; flex-direction:column; gap:4px; min-height:0; }
.arrows button { flex:0 0 44px; border-radius:8px; background:var(--ov1); color:var(--subtle);
                 display:flex; align-items:center; justify-content:center; }
.arrows ha-icon { --mdc-icon-size:22px; }
/* The narrow bar between the arrows shows position and can be dragged.
  The full track is touchable; only the center indicator is visible. */
.rail { flex:1 1 0; min-height:20px; width:100%; margin:2px 0; position:relative;
        opacity:0; transition:opacity .2s; touch-action:none; cursor:pointer; }
.rail.active { opacity:1; }
.rail::before { content:''; position:absolute; top:0; bottom:0; left:50%; width:6px;
        margin-left:-3px; border-radius:999px; background:var(--ov1); }
.thumb { position:absolute; left:50%; width:12px; margin-left:-6px; top:0; height:20%;
        border-radius:999px; background:var(--subtle);
        transition:top .12s linear, height .12s linear; }
.rail.sleep .thumb { transition:none; background:var(--muted); }
.empty { color:var(--subtle); font-size:13px; padding:16px 2px; }
/* errors: a toast over the card, visible whether the player column is shown or not */
#error-message { position:absolute; left:50%; bottom:18px; z-index:6; max-width:min(80%,560px);
  transform:translateX(-50%); display:flex; align-items:center; gap:10px; padding:12px 18px;
  border-radius:16px; background:rgba(127,29,29,.92); color:#ffe4e0; font-size:14px; font-weight:600;
  line-height:1.3; box-shadow:0 12px 32px rgba(0,0,0,.45); animation:toast .25s ease; }
#error-message:empty { display:none; }
#error-message::before { content:'!'; flex:none; width:22px; height:22px; border-radius:50%; display:grid; place-items:center;
  background:#fecaca; color:#7f1d1d; font-weight:900; font-size:14px; }
@keyframes toast { from { opacity:0; transform:translate(-50%,10px); } to { opacity:1; transform:translateX(-50%); } }

/* track launch: the overlay follows the command through to player confirmation */
.launch-overlay { position:absolute; inset:0; z-index:20; display:grid; place-items:center;
  padding:16px; background:rgba(0,0,0,.64); -webkit-backdrop-filter:blur(8px);
  backdrop-filter:blur(8px); animation:launch-fade .18s ease-out; }
.launch-overlay[hidden] { display:none; }
.launch-dialog { width:min(100%,440px); max-height:calc(100% - 8px); overflow:auto;
  padding:22px; border:1px solid var(--line); border-radius:18px;
  background:var(--ha-card-background,var(--card-background-color,#1c1c1e));
  color:var(--primary-text-color,#e9e9ea); box-shadow:0 24px 70px rgba(0,0,0,.5);
  animation:launch-pop .22s cubic-bezier(.2,.8,.2,1); }
.launch-head { display:grid; grid-template-columns:44px minmax(0,1fr) 36px;
  align-items:center; gap:12px; }
.launch-badge { width:44px; height:44px; display:grid; place-items:center;
  border-radius:13px; background:var(--acc); color:var(--on-acc,#fff);
  box-shadow:0 7px 20px var(--acc-glow,rgba(29,185,84,.3)); }
.launch-badge ha-icon { --mdc-icon-size:23px; }
.launch-eyebrow { margin:0; color:var(--muted); font-size:10px; font-weight:800;
  line-height:1.2; text-transform:uppercase; }
.launch-title { margin:3px 0 0; font-size:19px; line-height:1.2; font-weight:750; }
.launch-player { margin:4px 0 0; color:var(--subtle); font-size:12px; line-height:1.3;
  overflow-wrap:anywhere; }
.launch-close { width:36px; height:36px; display:flex; align-items:center;
  justify-content:center; border-radius:50%; background:var(--ov1); color:var(--muted); }
.launch-close ha-icon { --mdc-icon-size:20px; }
.launch-close:focus-visible { outline:2px solid var(--acc); outline-offset:2px; }
.launch-steps { display:flex; flex-direction:column; gap:0; margin:22px 0 0; padding:0;
  list-style:none; }
.launch-step { position:relative; display:grid; grid-template-columns:28px minmax(0,1fr);
  align-items:start; gap:12px; min-height:58px; }
.launch-step:not(:last-child)::after { content:''; position:absolute; top:29px; bottom:-1px;
  left:13px; width:2px; background:var(--line); }
.launch-step-mark { z-index:1; width:28px; height:28px; display:grid; place-items:center;
  border:1px solid var(--line); border-radius:50%; background:var(--ov1);
  color:var(--subtle); font-size:11px; font-weight:750; }
.launch-step-mark::before { content:attr(data-number); }
.launch-step.active .launch-step-mark { border-color:var(--acc); background:var(--ov2); color:var(--acc); }
.launch-step.active .launch-step-mark::before { width:8px; height:8px; border-radius:50%;
  background:var(--acc); content:''; animation:launch-pulse 1.1s ease-in-out infinite; }
.launch-step.done .launch-step-mark { border-color:var(--acc); background:var(--acc);
  color:var(--on-acc,#fff); }
.launch-step.done .launch-step-mark::before { content:'✓'; }
.launch-step-copy { min-width:0; padding:1px 0 12px; }
.launch-step-copy strong { display:block; font-size:13px; line-height:1.25; font-weight:700; }
.launch-step-copy small { display:block; margin-top:3px; color:var(--subtle);
  font-size:11px; line-height:1.35; }
.launch-step.pending .launch-step-copy strong { color:var(--subtle); font-weight:600; }
.launch-progress { height:3px; margin-top:8px; overflow:hidden; border-radius:999px; background:var(--ov2); }
.launch-progress span { display:block; width:0; height:100%; border-radius:inherit;
  background:var(--acc); transition:width .28s ease; }
.launch-status { display:grid; grid-template-columns:8px minmax(0,1fr) auto; align-items:center;
  gap:9px; min-height:18px; margin:13px 0 0; color:var(--muted); font-size:11.5px; line-height:1.3; }
.launch-status-pulse { width:7px; height:7px; border-radius:50%; background:var(--acc);
  animation:launch-pulse 1.1s ease-in-out infinite; }
.launch-elapsed { color:var(--subtle); font-variant-numeric:tabular-nums; white-space:nowrap; }
.launch-done .launch-status-pulse { animation:none; }
.launch-done .launch-badge { box-shadow:0 0 0 4px var(--ov2); }
@keyframes launch-fade { from { opacity:0; } to { opacity:1; } }
@keyframes launch-pop { from { opacity:0; transform:translateY(8px) scale(.98); }
  to { opacity:1; transform:translateY(0) scale(1); } }
@keyframes launch-pulse { 50% { opacity:.45; transform:scale(.78); } }
@container card (max-width:400px) {
  .launch-overlay { padding:10px; }
  .launch-dialog { padding:18px 16px; }
  .launch-steps { margin-top:18px; }
}
@media (prefers-reduced-motion:reduce) {
  .launch-overlay, .launch-dialog, .launch-step.active .launch-step-mark::before,
  .launch-status-pulse { animation:none; }
  .launch-progress span { transition:none; }
}

/* Optional navigation buttons to other views, inside the card. */
.links { display:flex; gap:8px; flex-wrap:wrap; flex:0 0 auto; padding-top:8px;
         border-top:1px solid var(--line); margin-top:6px; }
.links:empty { display:none; border:0; margin:0; padding:0; }
.links button { display:flex; align-items:center; gap:5px; height:28px; padding:0 11px;
                border-radius:999px; background:var(--ov1); color:var(--muted);
                font-size:12px; font-weight:600; }
.links ha-icon { --mdc-icon-size:15px; }
.volume-row .vol-box { --vr-fill:var(--acc); --vr-rest:var(--ov2); --vr-on:var(--on-acc,#fff); }

/* ambient light: the current artwork, heavily blurred, tints the whole card */
.wrap { position:relative; isolation:isolate; }
.wrap::before { content:''; position:absolute; inset:-80px; z-index:-1; pointer-events:none;
                background-image:var(--art,none); background-size:cover; background-position:left center;
                filter:blur(70px) saturate(1.5); opacity:0; transition:opacity .6s ease; }
.wrap.met-art::before { opacity:.28; }
:host(.light) .wrap.met-art::before { opacity:.18; }

/* tabs scroll sideways instead of being cut off; search stays visible on the right */
.tabrij { display:flex; align-items:flex-start; gap:8px; flex:0 0 auto; min-width:0; max-width:100%; }
.tabrij .chips { flex:1 1 auto; }
/* player column toggle: a round handle in the middle of the dividing line */
.left { grid-column:1; } .divider { grid-column:2; position:relative; z-index:2; } .right { grid-column:3; }
.player-toggle { position:absolute; top:50%; left:50%; width:34px; height:34px; border-radius:50%;
  transform:translate(-50%,-50%); display:flex; align-items:center; justify-content:center;
  background:var(--surface,var(--ha-card-background,var(--card-background-color,#1c1c1e))); color:var(--muted);
  -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
  box-shadow:0 0 0 1px var(--line),0 4px 14px rgba(0,0,0,.35);
  transition:color .2s, box-shadow .2s, transform .25s ease; }
.player-toggle::before { content:''; position:absolute; inset:-10px; border-radius:50%; }
.player-toggle ha-icon { --mdc-icon-size:22px; transition:transform .25s ease; }
.player-toggle:active { transform:translate(-50%,-50%) scale(.9); }
.wrap.no-player .player-toggle ha-icon { transform:rotate(180deg); }
.wrap.no-player .player-toggle.playing { color:var(--acc); box-shadow:0 0 0 2px var(--acc),0 4px 14px var(--acc-glow,rgba(0,0,0,.35)); }
@media (hover:hover) { .player-toggle:hover { color:var(--primary-text-color,#fff); } }
@container card (min-width: 401px) {
  :host .wrap.no-player { grid-template-columns:0 1px minmax(0,1fr) !important; }
  .wrap.no-player > .left { display:none !important; }
  .wrap.no-player > .right { animation:expand-content .3s ease; }
}
@keyframes expand-content { from { opacity:.4; } to { opacity:1; } }.tabrij .chips.search-chips { flex:0 0 auto; }
.chips { overflow-x:auto; overflow-y:hidden; scrollbar-width:none; }
.chips::-webkit-scrollbar { display:none; }
.chips button.discover-tab { display:flex; align-items:center; gap:6px; flex:0 0 auto; }
.chips button.discover-tab ha-icon { --mdc-icon-size:18px; }

.header .header-art { width:40px; height:40px; border-radius:8px; object-fit:cover; flex:0 0 auto;
                box-shadow:0 4px 12px rgba(0,0,0,.35); }
.header .play-all-button { display:flex; align-items:center; gap:4px; }
.header .play-all-button ha-icon { --mdc-icon-size:18px; }
.row .nr { justify-self:center; font-size:12.5px; color:var(--subtle); font-variant-numeric:tabular-nums; }

/* Smaller than a 1024x600 panel - a phone, a narrow column, or the preview
  pane of the card editor. Without this, the right column becomes unreadably narrow. */
@container card (max-width: 940px) {
  .wrap { grid-template-columns:250px 1px minmax(0,1fr); gap:14px; padding:14px; }
  .now-playing .art, .now-playing .empty-art { width:140px; height:140px; }
  .now-playing .glow { width:150px; height:150px; }
  .chips { gap:14px; }
}
@container card (max-width: 780px) {
  .wrap { grid-template-columns:210px 1px minmax(0,1fr); }
  .now-playing .art, .now-playing .empty-art { width:118px; height:118px; }
  .now-playing .ctr { gap:8px; }
  .kbd button { height:38px; font-size:15px; }
}
/* This width is the preview pane of the card editor. The card must keep its
   two columns here: the whole point of the preview is seeing the thing you are
   configuring, and a stacked version is not that thing. So squeeze rather than
   rearrange - a narrower left column, smaller artwork, tighter controls. */
@container card (max-width: 560px) {
  .wrap { grid-template-columns:150px 1px minmax(0,1fr); gap:10px; padding:12px; }
  .now-playing { padding:8px 0 2px; }
  .now-playing .art, .now-playing .empty-art { width:104px; height:104px; }
  .now-playing .glow { width:110px; height:110px; }
  .now-playing .tx { padding-top:10px; }
  .now-playing .t { font-size:14px; }
  .now-playing .ctr { gap:4px; margin-top:10px; }
  .now-playing .ctr button { width:26px; height:26px; }
  .now-playing .ctr button.primary { width:40px; height:40px; }
  .now-playing .ctr button.primary ha-icon { --mdc-icon-size:21px; }
  .now-playing .ctr ha-icon { --mdc-icon-size:18px; }
  .volume-row { gap:5px; margin-top:10px; }
  .volume-row > button.vk { width:24px; height:24px; }
  .volume-row ha-icon { --mdc-icon-size:17px; }
  .volume-row .volume-label { min-width:28px; font-size:11px; }
  .chips { gap:10px; }
  .chips button { font-size:12px; }
}
/* Genuinely narrow - a phone in portrait, or a one-column dashboard. Two
   columns stop being readable here, so stack them. Never hide one: on the
   card's own dashboard that half is the reason the card exists. */
@container card (max-width: 400px) {
  .wrap { grid-template-columns:minmax(0,1fr); height:auto;
          min-height:var(--card-height,556px); row-gap:14px; padding:14px; }
  .divider { display:none; }
  .right { min-height:340px; }
  .now-playing .art, .now-playing .empty-art { width:132px; height:132px; }
}
`;

// Short names map to MDI icons; configuration may also use 'mdi:...'.
export class MusicAssistantTouchCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._mode = 'home';      // home | search | detail | discover
    this._categoryIndex = 0;
    this._mediaTypeIndex = 0;
    this._searchQuery = '';
    this._searchResults = [];
    this._detailItems = [];
    this._detailTitle = '';
    this._detailUri = '';
    this._returnMode = 'search';
    this._keyboardVisible = true;
    this._zoneIndex = 0;
    this._sourceIndex = 0;
    this._sourceGeneration = 0;
    this._searchSeq = 0;
    this._isSearching = false;
    this._playbackProgress = null;
    this._playbackSequence = 0;
    this._imageCache = {};      // uri -> the cover Music Assistant has right now
    this._sourceCache = {};       // source key -> { updatedAt, items }
    this._pendingSources = {};  // source key -> in-flight promise, so two draws fetch once
    this._discoverState = null;   // { key, updatedAt, rows } of the discover feed
    this._discoverRequest = null;
  }

  connectedCallback() {
    if (this._hass && this._cfg) this._loadMissingData();
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
      categories: defaultCategories(hass && hass.language),
    };
    try {
      const entries = await hass.callWS({ type: 'config_entries/get', domain: 'music_assistant' });
      const loadedEntries = (entries || []).filter((e) => e.state === 'loaded');
      if (loadedEntries.length === 1) stub.config_entry_id = loadedEntries[0].entry_id;
    } catch (e) { /* no rights or no Music Assistant: the editor dropdown takes over */ }
    return stub;
  }

  setConfig(config) {
    if (!config || !config.config_entry_id) {
      throw new Error('Pick your Music Assistant in the card editor (config_entry_id).');
    }
    this._cfg = Object.assign({}, config);
    this._usesDefaultCategories = !Array.isArray(this._cfg.categories);
    if (this._usesDefaultCategories) {
      this._cfg.categories = defaultCategories(config.language || (this._hass && this._hass.language));
    }
    this._categories = this._cfg.categories;
    this._sources = (Array.isArray(config.music_sources) ? config.music_sources : [])
      .filter((source) => source && typeof source.username === 'string' && source.username.trim())
      .map((source) => Object.assign({}, source, { username: source.username.trim() }));
    this._sourceGeneration++;
    this._searchSeq++;
    this._restoreSource();
    // keyboard: true uses the on-screen keyboard (Nest Hub, kiosk).
    // keyboard: false uses the device's regular text input.
    const thema = KIOSK_THEMES.includes(config.theme) ? config.theme : 'sunset';
    if (this.dataset.kt !== thema) this.dataset.kt = thema;
    this._onScreenKeyboard = config.keyboard !== false;
    this._keyboardVisible = this._onScreenKeyboard;
    this._zones = null;
    // The player column starts as configured (show_player); the button in the
    // tab row toggles it for the session. A changed setting resets it.
    const playerVisibilityConfigured = config.show_player !== false;
    if (this._configuredPlayerVisibility !== playerVisibilityConfigured) { this._configuredPlayerVisibility = playerVisibilityConfigured; this._playerVisible = playerVisibilityConfigured; }
    const ontdekWas = this._discover;
    this._discover = config.discover !== false;
    if (ontdekWas === undefined || ontdekWas !== this._discover) {
      this._mode = this._discover ? 'discover' : 'home';
    }
  }

  // ---------- discover ----------
  // Music Assistant's own recommendation rows, fetched on behalf of the
  // selected music source so every person gets their own feed.
  _getDiscoverSource() {
    // 'spotify' is the former name of 'similar'.
    const source = this._cfg.discover_source === 'spotify' ? 'similar' : this._cfg.discover_source;
    return ['similar', 'music_assistant', 'mixed'].includes(source) ? source : 'mixed';
  }

  _getDiscoverKey() { return `${this._cfg.config_entry_id}|${this._getCurrentUser() || ''}|${this._getDiscoverSource()}`; }

  // Fetches the feed in parts: Music Assistant's rows answer in a blink, the
  // similar-track lookups can take half a minute on a cold cache. Each part is
  // drawn as soon as it lands, so the tab never sits empty.
  _fetchDiscoverRows(force) {
    if (!this._hass || !this._cfg || !this._discover) return Promise.resolve();
    const key = this._getDiscoverKey();
    const c = this._discoverState;
    if (!force && c && c.key === key && (c.pending.size || Date.now() - c.updatedAt < BIB_TTL)) {
      // The view may still show an older state (the card was rebuilt or
      // re-attached while an answer was on its way).
      if (this._mode === 'discover' && this._renderedDiscoverKey !== `${key}|${c.version}`) this._renderRight();
      return Promise.resolve();
    }
    const source = this._getDiscoverSource();
    const parts = source === 'mixed' ? ['similar', 'music_assistant'] : [source];
    const pendingState = { key, updatedAt: Date.now(), sources: {}, pending: new Set(parts), rows: [], version: 0 };
    this._discoverState = pendingState;
    const sourceConfig = this._getSourceConfig();
    const spotify = (sourceConfig && sourceConfig.spotify_entity) || this._cfg.spotify_entity;
    const buildRows = () => {
      // Near-empty rows (a single "recently played" item) go last.
      const ma = (pendingState.sources.music_assistant || []).slice()
        .sort((a, b) => (a.items.length < 3) - (b.items.length < 3));
      pendingState.rows = [...(pendingState.sources.similar || []), ...ma];
      pendingState.version++;
      if (this._discoverState === pendingState && this._mode === 'discover') this._renderRight();
    };
    return Promise.all(parts.map((part) => {
      const data = {
        config_entry_id: this._cfg.config_entry_id,
        row_limit: 20,
        include_hidden: this._cfg.discover_hidden_rows !== false,
        source: part,
      };
      if (this._getCurrentUser()) data.username = this._getCurrentUser();
      if (spotify && part !== 'music_assistant') data.spotify_entity = spotify;
      if (force && part !== 'music_assistant') data.refresh = true;
      return this._ws({
        type: 'call_service', domain: DOMAIN, service: 'get_recommendations',
        service_data: data, return_response: true,
      }).then((r) => {
        let rows = (r && r.response && r.response.rows) || [];
        // In mixed mode the Music Assistant rows come from their own request.
        if (source === 'mixed' && part === 'similar') rows = rows.filter((row) => row.source !== 'music_assistant');
        for (const row of rows) this._rememberImages(row.items);
        pendingState.sources[part] = rows;
      }).catch((error) => {
        pendingState.sources[part] = [];
        if (this._discoverState === pendingState) this._showError(error);
      }).finally(() => {
        pendingState.pending.delete(part);
        if (!pendingState.pending.size) pendingState.updatedAt = Date.now();
        buildRows();
      });
    }));
  }
  _getRowName(row) {
    const translations = this._getLanguage();
    if (row.translation_key === 'for_you') return translations.voorJou;
    if (row.translation_key === 'because_you_listen' && row.seed) return translations.omdat.replace('{x}', row.seed);
    const name = String(row.name || '');
    const translationKey = String(row.translation_key || '').replace(/_/g, ' ').toLowerCase();
    return translations.rijNamen[name.toLowerCase()] || translations.rijNamen[translationKey] || name;
  }

  _getSubtitle(it) {
    const t = this._getLanguage();
    const mediaType = it.media_type || mediaTypeFromUri(it.uri);
    const type = t.type1[mediaType] || '';
    return [type, it.artist].filter(Boolean).join(' · ');
  }

  _sourceStorageKey() {
    const path = typeof location !== 'undefined' ? location.pathname : '';
    return `${DOMAIN}:source:${this._cfg.config_entry_id}:${path}`;
  }

  _trackStorageKey(username) {
    return `${this._sourceStorageKey()}:track:${username}`;
  }

  _restoreSource() {
    this._sourceIndex = 0;
    if (!this._sources.length) return;
    try {
      const stored = window.localStorage.getItem(this._sourceStorageKey());
      const index = this._sources.findIndex((source) => source.username === stored);
      if (index >= 0) this._sourceIndex = index;
    } catch (error) { /* Kiosk browsers can disable local storage. */ }
  }

  _saveSource() {
    const source = this._getSourceConfig();
    if (!source) return;
    try {
      window.localStorage.setItem(this._sourceStorageKey(), source.username);
    } catch (error) { /* Kiosk browsers can disable local storage. */ }
  }

  _getSourceConfig() { return this._sources[this._sourceIndex] || null; }
  _getCurrentUser() { const source = this._getSourceConfig(); return source ? source.username : undefined; }
  _withUser(data, username = this._getCurrentUser()) {
    return username ? Object.assign({}, data, { username }) : data;
  }

  // Use configured zones, or discover all Music Assistant players automatically.
  _getZones() {
    if (this._cfg.zones && this._cfg.zones.length) return this._cfg.zones;
    if (this._zones) return this._zones;
    const players = [];
    const states = (this._hass && this._hass.states) || {};
    for (const id of Object.keys(states)) {
      if (!id.startsWith('media_player.')) continue;
      const a = states[id].attributes || {};
      if (!a.mass_player_type) continue;
      players.push({
        name: a.friendly_name || id,
        entity: id,
        icon: a.mass_player_type === 'group' ? 'groep' : 'speaker',
      });
    }
    this._zones = players.length ? players : [{ name: this._getLanguage().speler, entity: '', icon: 'speaker' }];
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

  _getSourceKey(b) {
    return [this._getCurrentUser() || '', b.media_type || 'playlist', b.order_by || '', b.favorite ? 1 : 0,
      b.search || '', b.limit || 24].join('|');
  }

  // Every library answer also feeds the cover index, so a hand-made tile that
  // happens to point at the same uri gets a fresh image for free.
  _rememberImages(items) {
    for (const it of items || []) {
      const u = it.uri || it.media_content_id;
      if (u && it.image) this._imageCache[u] = it.image;
    }
  }

  _fetchCategory(b) {
    const s = this._getSourceKey(b);
    const generation = this._sourceGeneration;
    const username = this._getCurrentUser();
    const c = this._sourceCache[s];
    if (c && Date.now() - c.updatedAt < BIB_TTL) return Promise.resolve(c.items);
    if (this._pendingSources[s]) return this._pendingSources[s];
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
        service_data: this._withUser(data, username),
        return_response: true,
      }).then((r) => ((r && r.response) || {}).items || []);
    const p = request.then((items) => {
      if (generation !== this._sourceGeneration) return items;
      this._rememberImages(items);
      this._sourceCache[s] = { updatedAt: Date.now(), items };
      delete this._pendingSources[s];
      return items;
    }).catch((error) => {
      if (generation !== this._sourceGeneration) return [];
      // A failed fetch is cached as empty for the same TTL. Without that, a
      // Music Assistant that is down turns every redraw into another attempt.
      this._sourceCache[s] = { updatedAt: Date.now(), items: [] };
      this._showError(error);
      return [];
    }).finally(() => {
      if (this._pendingSources[s] === p) delete this._pendingSources[s];
    });
    this._pendingSources[s] = p;
    return p;
  }

  // Work out what is still missing and fetch it, once, in parallel.
  _loadMissingData() {
    if (!this._hass || !this._cfg || !this._cfg.config_entry_id) return;
    if (this._mode === 'discover') this._fetchDiscoverRows();
    const generation = this._sourceGeneration;
    const categoryTypes = new Set();
    const taken = [];
    for (const cat of this._categories) {
      if (cat.source) { taken.push(this._fetchCategory(cat.source)); continue; }
      for (const t of cat.tiles || []) {
        // A pinned image or a chosen icon needs nothing fetched.
        if (t.image || t.icon || this._imageCache[t.uri]) continue;
        const mediaType = mediaTypeFromUri(t.uri);
        if (mediaType) categoryTypes.add(mediaType);
      }
    }
    for (const mediaType of categoryTypes) {
      taken.push(this._fetchCategory({ media_type: mediaType, limit: BIB_MAX }));
    }
    if (!taken.length) return;
    Promise.all(taken).then(() => {
      if (this.isConnected && this._mode === 'home'
        && generation === this._sourceGeneration) this._renderRight();
    });
  }

  // A category is either a list you wrote or a source Music Assistant fills.
  // Both leave here in the same shape, so nothing downstream has to care.
  _getCategoryTiles(cat) {
    if (!cat) return [];
    if (!cat.source) return cat.tiles || [];
    const c = this._sourceCache[this._getSourceKey(cat.source)];
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
  _getTileImage(t) {
    const imageUrl = safeImageUrl(t.image);
    if (imageUrl) return imageUrl;
    if (t.icon) return '';
    return safeImageUrl(this._imageCache[t.uri]);
  }

  // Use config.language, then the Home Assistant language, then English.
  _getLanguage() {
    return getLanguage(this._cfg.language, this._hass && this._hass.language);
  }

  set hass(hass) {
    const isFirstUpdate = !this._hass;
    this._hass = hass;
    if (isFirstUpdate && this._usesDefaultCategories && !this._cfg.language && hass.language) {
      this._cfg.categories = defaultCategories(hass.language);
      this._categories = this._cfg.categories;
    }
    if (isFirstUpdate || !this.shadowRoot.firstChild) this._buildCard();
    this._applyTheme();
    this._syncKioskEditMode();
    this._syncPlayer();
    this._syncPlaybackStatus();
  }

  // Measure the background the theme gives the card and switch the overlay colours
  // with it. A view can carry its own theme, so the global dark-mode flag is not
  // enough; what counts is what is really behind the card.
  _applyTheme() {
    // Measure the surface the card really paints, not a variable that may disagree with
    // it: a view theme can set --card-background-color dark while --ha-card-background,
    // which the surface uses, stays light.
    const vlak = this.shadowRoot && this.shadowRoot.querySelector('.wrap');
    const surfaceColor = vlak ? getComputedStyle(vlak).backgroundColor : '';
    const hasOpaqueColor = surfaceColor && !/^rgba\([^)]*,\s*0\)$/.test(surfaceColor) && surfaceColor !== 'transparent';
    const cs = getComputedStyle(this);
    const kleur = (hasOpaqueColor ? surfaceColor : '')
      || cs.getPropertyValue('--ha-card-background')
      || cs.getPropertyValue('--card-background-color')
      || cs.getPropertyValue('--primary-background-color') || '';
    if (kleur === this._themeColor) return;
    this._themeColor = kleur;
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
    this.classList.toggle('light', lum > 0.5);
  }

  // ---------- helpers ----------
  _getZoneConfig() { const z = this._getZones(); return z[Math.min(this._zoneIndex, z.length - 1)]; }
  _getPlayerEntity() { return this._getZoneConfig().entity; }
  _getVolumeEntity() { return this._getZoneConfig().volume || this._getZoneConfig().entity; }
  _getState(e) { return (this._hass && this._hass.states[e]) || null; }

  // Find the player that actually owns the music. Use the selected zone when it
  // is playing; otherwise, if it belongs to a playing group or shares its queue,
  // send play, pause, and next commands to that group to avoid an empty queue.
  _getActivePlayer() {
    if (this._activeEntityCache && this._activeHassCache === this._hass && this._activeZoneIndexCache === this._zoneIndex) return this._activeEntityCache;
    const selectedPlayer = this._getPlayerEntity();
    const s = this._getState(selectedPlayer);
    let activePlayerEntity = selectedPlayer;
    if (!(s && PLAYING_STATES.includes(s.state))) {
      const q = s && s.attributes ? s.attributes.active_queue : null;
      let groupPlayer = null;
      for (const playerZone of this._getZones()) {
        const id = playerZone.entity;
        if (!id || id === selectedPlayer || !id.startsWith('media_player.')) continue;
        const player = this._getState(id);
        if (!player) continue;
        const a = player.attributes || {};
        if (!a.mass_player_type || !PLAYING_STATES.includes(player.state)) continue;
        if (q && a.active_queue === q) { groupPlayer = id; break; }
        if (!groupPlayer && (a.group_members || []).indexOf(selectedPlayer) !== -1) groupPlayer = id;
      }
      activePlayerEntity = groupPlayer || selectedPlayer;
    }
    this._activeHassCache = this._hass;
    this._activeZoneIndexCache = this._zoneIndex;
    this._activeEntityCache = activePlayerEntity;
    return activePlayerEntity;
  }

  // The slider ends at volume_max instead of 100%, so a 0-20% range uses its
  // full travel rather than only the first fifth.
  _getMaxVolume() {
    const z = this._getZoneConfig();
    const v = z.volume_max != null ? z.volume_max : this._cfg.volume_max;
    const n = parseFloat(v);
    return (n > 0 && n <= 100) ? n : 100;
  }

  // Volume to use when starting music. Empty means leave it unchanged.
  _getStartVolume() {
    const z = this._getZoneConfig();
    const v = z.volume_start != null ? z.volume_start : this._cfg.volume_start;
    const n = parseFloat(v);
    return (n >= 0 && n <= 100) ? n : null;
  }

  _getVolumeStep() {
    const z = this._getZoneConfig();
    const v = z.volume_step != null ? z.volume_step : this._cfg.volume_step;
    const n = parseFloat(v);
    return (Number.isFinite(n) && n > 0 && n <= 100) ? n : 1;
  }

  // volume_start is a fallback, not a fixed level: keep the current volume
  // below the maximum, and lower it on start only when it is too high.
  async _startVolume() {
    const targetVolume = this._getStartVolume();
    if (targetVolume == null) return;
    const vs = this._getState(this._getVolumeEntity());
    const currentVolumePercent = (vs && vs.attributes.volume_level != null)
      ? vs.attributes.volume_level * 100 : null;
    if (currentVolumePercent == null || currentVolumePercent <= this._getMaxVolume()) return;
    await this._call('media_player', 'volume_set',
      { volume_level: targetVolume / 100 }, { entity_id: this._getVolumeEntity() }).catch(() => {});
  }

  _adjustVolume(direction) {
    const step = this._getVolumeStep() / 100;
    const vs = this._getState(this._getVolumeEntity());
    const currentVolume = Number(vs && vs.attributes.volume_level) || 0;
    const targetLevel = Math.max(0, Math.min(1, Math.round((currentVolume + direction * step) * 10000) / 10000));
    this._call('media_player', 'volume_set',
      { volume_level: targetLevel }, { entity_id: this._getVolumeEntity() });
  }

  async _ws(msg) { return this._hass.connection.sendMessagePromise(msg); }

  async _call(domain, service, data, target) {
    return this._hass.callService(domain, service, data, target);
  }

  // Dim a control briefly while its command runs, and show errors instead of
  // silently ignoring them.
  _controlPlayer(service, data, el, afterQueueFill, retryOnFailure) {
    const entityId = this._getActivePlayer();
    if (!entityId) return false;
    // Some speakers take a second to respond. Briefly block double taps so a
    // second tap cannot undo the first command.
    const now = Date.now();
    if (now < (this._interactionLockUntil || 0)) return false;
    this._interactionLockUntil = now + 800;
    if (el) {
      el.classList.add('busy');
      setTimeout(() => el.classList.remove('busy'), 350);
    }
    const sendCommand = () => this._call('media_player', service, data || {}, { entity_id: entityId })
      .catch((e) => this._showError(e));
    // JBL speakers connected through Cast and Music Assistant sometimes miss a
    // skip command. Retry once after 2.5 seconds if the track has not changed.
    const getPlayerSignature = () => {
      const x = (this._getState(entityId) || {}).attributes || {};
      return String(x.media_content_id) + '|' + String(x.media_position_updated_at);
    };
    const shouldRetry = retryOnFailure && this._cfg.retry_next !== false;
    const runCommand = !shouldRetry ? sendCommand : () => sendCommand().then(() => {
      const previousSignature = getPlayerSignature();
      setTimeout(() => { if (getPlayerSignature() === previousSignature) sendCommand(); }, 2500);
    });
    // Wait for the remaining list to enter the queue before skipping, or there
    // may not be a next track yet.
    if (afterQueueFill && this._queueFillPromise) {
      if (el) el.classList.add('busy');
      this._queueFillPromise.then(runCommand, runCommand).then(() => { if (el) el.classList.remove('busy'); });
    } else runCommand();
    return true;
  }

  // `exceptEntity` is the source player and must stay on for a queue transfer.
  // The same applies to a group sharing its queue: Music Assistant clears the
  // member queues when a group is turned off, leaving transfer_queue no source.
  // Defer such shutdowns in `deferredShutdowns` until after the transfer.
  async _preparePlayer(exceptEntity, deferredShutdowns) {
    const b = this._getZoneConfig().before;
    if (!b) return;
    let changed = false;
    if (b.turn_off && b.turn_off !== exceptEntity) {
      const playerState = this._getState(b.turn_off);
      if (playerState && ['playing', 'paused', 'on', 'idle', 'buffering'].includes(playerState.state)) {
        const sourceState = exceptEntity ? this._getState(exceptEntity) : null;
        const sourceQueueId = sourceState && sourceState.attributes ? sourceState.attributes.active_queue : null;
        const sharesQueue = !!sourceQueueId && playerState.attributes.active_queue === sourceQueueId;
        if (deferredShutdowns && sharesQueue) {
          deferredShutdowns.push(b.turn_off);
        } else {
          await this._call('media_player', 'turn_off', {}, { entity_id: b.turn_off }).catch(() => {});
          changed = true;
        }
      }
    }
    if (b.unjoin) {
      const groupState = this._getState(b.unjoin);
      const groupMembers = (groupState && groupState.attributes.group_members) || [];
      if (groupMembers.length > 1) {
        await this._call('media_player', 'unjoin', {}, { entity_id: b.unjoin }).catch(() => {});
        changed = true;
      }
    }
    if (b.join) {
      const leaderState = this._getState(b.join.leader);
      const groupMembers = (leaderState && leaderState.attributes.group_members) || [];
      const hasMissingMembers = (b.join.members || []).some((m) => groupMembers.indexOf(m) === -1);
      if (hasMissingMembers) {
        await this._call('media_player', 'join',
          { group_members: b.join.members }, { entity_id: b.join.leader }).catch(() => {});
        changed = true;
      }
    }
    if (changed) await new Promise((r) => setTimeout(r, 350));
  }

  // Switch players and move the queue when something is playing. Set
  // transfer_on_switch: false to change the selected player without moving it.
  async _switchZone(i, el) {
    const username = this._getCurrentUser();
    const oldEntity = this._getActivePlayer();
    const oldState = this._getState(oldEntity);
    const wasPlaying = oldState && PLAYING_STATES.includes(oldState.state);
    // Remember the current track before switching. If the queue is lost during
    // the transfer, restart this track on the new player.
    const sourceInfo = wasPlaying && oldState.attributes
      ? { media: oldState.attributes.media_content_id || '', queue: oldState.attributes.active_queue || null }
      : null;
    this._zoneIndex = i;
    this._optimisticState = null;
    this._syncPlayer();
    const newZone = this._getZoneConfig();
    if (el) el.classList.add('busy');
    try {
      // Same player, different group (for example, kitchen alone versus kitchen
      // plus conservatory): only join or unjoin; do not transfer the queue.
      if (newZone.entity === oldEntity) { await this._preparePlayer(); return; }

      // Prepare the group for this zone, but never turn off the source player or
      // a group sharing its queue; defer that shutdown until after the transfer.
      const shouldTransferQueue = wasPlaying && this._cfg.transfer_on_switch !== false;
      const deferredShutdowns = [];
      await this._preparePlayer(oldEntity, shouldTransferQueue ? deferredShutdowns : null);

      if (!shouldTransferQueue) return;

      // A powered-off player or group cannot accept a queue transfer.
      const newPlayerState = this._getState(newZone.entity);
      if (!newPlayerState || ['off', 'unavailable', 'standby'].includes(newPlayerState.state)) {
        await this._call('media_player', 'turn_on', {}, { entity_id: newZone.entity })
          .catch(() => {});
        await new Promise((r) => setTimeout(r, 700));
      }
      this._optimisticState = { state: 'playing', expiresAt: Date.now() + 12000 };
      let transferSucceeded = true;
      try {
        await this._call('music_assistant', 'transfer_queue',
          { source_player: oldEntity, auto_play: true }, { entity_id: newZone.entity });
      } catch (e) { transferSucceeded = false; }

      // If Music Assistant rejects the transfer because the queue is empty,
      // restart the remembered track on the new player.
      if (!transferSucceeded && sourceInfo && sourceInfo.media) {
        await this._call('music_assistant', 'play_media',
          this._withUser({ media_id: sourceInfo.media, enqueue: 'replace' }, username),
          { entity_id: newZone.entity })
          .catch((e) => this._showError(e));
      }

      // Turn off the old group only after the transfer, and only if it is still playing.
      for (const entityId of deferredShutdowns) {
        const groupState = this._getState(entityId);
        if (groupState && PLAYING_STATES.includes(groupState.state)) {
          await this._call('media_player', 'turn_off', {}, { entity_id: entityId }).catch(() => {});
        }
      }
    } catch (e) {
      this._optimisticState = null;
      this._showError(e);
    }
    if (el) el.classList.remove('busy');
  }

  _playbackDialogHtml() {
    const t = this._getLanguage().launch;
    return `<div class="launch-overlay" id="launch-overlay" hidden>
      <section class="launch-dialog" id="launch-dialog" role="dialog" aria-modal="true"
        aria-labelledby="launch-title" aria-describedby="launch-status" tabindex="-1">
        <div class="launch-head">
          <span class="launch-badge">${svg('muziek')}</span>
          <div>
            <p class="launch-eyebrow">${esc(t.eyebrow)}</p>
            <h2 class="launch-title" id="launch-title">${esc(t.title)}</h2>
            <p class="launch-player" id="launch-player"></p>
          </div>
          <button class="launch-close" data-act="launch-hide" title="${esc(t.hide)}"
            aria-label="${esc(t.hide)}">${svg('mdi:close')}</button>
        </div>
        <ol class="launch-steps">${t.steps.map((step, index) => `
          <li class="launch-step pending" data-launch-step="${index}">
            <span class="launch-step-mark" data-number="${index + 1}" aria-hidden="true"></span>
            <span class="launch-step-copy"><strong>${esc(step.title)}</strong>
              <small>${esc(step.detail)}</small></span>
          </li>`).join('')}
        </ol>
        <div class="launch-progress" aria-hidden="true"><span id="launch-progress-fill"></span></div>
        <div class="launch-status" role="status" aria-live="polite">
          <span class="launch-status-pulse" aria-hidden="true"></span>
          <span id="launch-status"></span><span class="launch-elapsed" id="launch-elapsed"></span>
        </div>
      </section>
    </div>`;
  }

  _normalizeMediaId(uri) {
    const value = String(uri || '').trim()
      .replace(/^([a-z0-9_-]+)--[^:]+:\/\//i, '$1://');
    return normalizeSpotifyUri(value).replace(/[?#].*$/, '').replace(/\/+$/, '');
  }

  _startPlaybackProgress(uri) {
    this._stopPlaybackProgress(this._playbackProgress);
    const status = {
      uri: this._normalizeMediaId(uri),
      entity: this._getPlayerEntity(),
      previousUri: '',
      startedAt: Date.now(),
      requestAt: 0,
      phase: 0,
      sent: false,
      accepted: false,
      completed: false,
      hidden: false,
      timer: null,
    };
    this._playbackProgress = status;
    this._renderPlaybackProgress(status);
    return status;
  }

  _renderPlaybackProgress(status) {
    if (this._playbackProgress !== status) return;
    const overlay = this.shadowRoot.getElementById('launch-overlay');
    if (!overlay) return;
    const t = this._getLanguage().launch;
    overlay.hidden = status.hidden;
    const dialog = this.shadowRoot.getElementById('launch-dialog');
    if (dialog) {
      dialog.classList.toggle('launch-done', status.completed);
      dialog.setAttribute('aria-busy', String(!status.completed));
    }
    const title = this.shadowRoot.getElementById('launch-title');
    if (title) title.textContent = status.completed ? t.success : t.title;
    const state = this._getState(status.entity);
    const player = state && state.attributes && state.attributes.friendly_name
      ? state.attributes.friendly_name : status.entity;
    const target = this.shadowRoot.getElementById('launch-player');
    if (target) target.textContent = t.player.replace('{player}', player || '');
    const phase = status.completed ? t.steps.length : status.phase;
    const steps = Array.from(overlay.querySelectorAll('[data-launch-step]'));
    steps.forEach((step, index) => {
      const done = status.completed || index < phase;
      const active = !status.completed && index === phase;
      step.classList.toggle('done', done);
      step.classList.toggle('active', active);
      step.classList.toggle('pending', !done && !active);
      if (active) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    const progress = this.shadowRoot.getElementById('launch-progress-fill');
    if (progress) progress.style.width = `${Math.round(phase / t.steps.length * 100)}%`;
    const message = this.shadowRoot.getElementById('launch-status');
    if (message) message.textContent = t.status[status.completed ? t.steps.length : status.phase] || '';
    if (!status.opened && !status.hidden) {
      status.opened = true;
      const close = overlay.querySelector('[data-act="launch-hide"]');
      if (close) close.focus({ preventScroll: true });
    }
    this._updatePlaybackElapsed();
  }

  _setPlaybackPhase(status, phase) {
    if (this._playbackProgress !== status || status.completed) return;
    status.phase = phase;
    this._renderPlaybackProgress(status);
  }

  _syncPlaybackStatus() {
    const status = this._playbackProgress;
    if (!status || status.completed || !status.sent || !status.uri) return;
    const state = this._getState(status.entity);
    const attributes = (state && state.attributes) || {};
    const currentUri = this._normalizeMediaId(attributes.media_content_id);
    if (!state || state.state !== 'playing' || currentUri !== status.uri) return;
    const updated = Date.parse(attributes.media_position_updated_at || '');
    const changed = currentUri !== status.previousUri
      || (Number.isFinite(updated) && updated >= status.requestAt)
      || status.accepted;
    if (changed) {
      status.completed = true;
      status.phase = this._getLanguage().launch.steps.length;
      this._renderPlaybackProgress(status);
      status.timer = setTimeout(() => this._stopPlaybackProgress(status), status.hidden ? 0 : 850);
    }
  }

  _updatePlaybackElapsed() {
    const status = this._playbackProgress;
    const elapsed = this.shadowRoot.getElementById('launch-elapsed');
    if (!status || !elapsed || status.completed) return;
    const seconds = Math.floor((Date.now() - status.startedAt) / 1000);
    elapsed.textContent = this._getLanguage().launch.elapsed.replace('{seconds}', String(seconds));
  }

  _hidePlaybackDialog() {
    const status = this._playbackProgress;
    if (!status) return;
    status.hidden = true;
    const overlay = this.shadowRoot.getElementById('launch-overlay');
    if (overlay) overlay.hidden = true;
    if (status.completed) {
      clearTimeout(status.timer);
      status.timer = setTimeout(() => this._stopPlaybackProgress(status), 0);
    }
  }

  _stopPlaybackProgress(status) {
    if (!status || this._playbackProgress !== status) return;
    clearTimeout(status.timer);
    this._playbackProgress = null;
    const overlay = this.shadowRoot.getElementById('launch-overlay');
    if (overlay) overlay.hidden = true;
  }

  async _play(uri, radio, el, username = this._getCurrentUser(), generation = this._sourceGeneration) {
    if (!uri || generation !== this._sourceGeneration) return;
    if (el) el.classList.add('busy');
    const shouldTrackPlayback = mediaTypeFromUri(uri) === 'track' && !radio;
    if (!shouldTrackPlayback) this._stopPlaybackProgress(this._playbackProgress);
    const playbackStatus = shouldTrackPlayback ? this._startPlaybackProgress(uri) : null;
    this._optimisticState = { state: 'playing', expiresAt: Date.now() + 8000 };
    try {
      await this._preparePlayer();
      if (generation !== this._sourceGeneration) {
        this._stopPlaybackProgress(playbackStatus);
        return;
      }
      if (playbackStatus) this._setPlaybackPhase(playbackStatus, 1);
      await this._startVolume();
      if (generation !== this._sourceGeneration) {
        this._stopPlaybackProgress(playbackStatus);
        return;
      }
      if (playbackStatus) this._setPlaybackPhase(playbackStatus, 2);
      // A single track takes the place of the one playing and keeps the rest
      // of the queue; an album, playlist, artist or radio replaces the queue.
      if (mediaTypeFromUri(uri) === 'track' && !radio) {
        const entity = this._getPlayerEntity();
        if (playbackStatus && this._playbackProgress === playbackStatus) {
          const current = this._getState(entity);
          playbackStatus.entity = entity;
          playbackStatus.previousUri = this._normalizeMediaId(current && current.attributes.media_content_id);
          playbackStatus.requestAt = Date.now();
          playbackStatus.sent = true;
          this._renderPlaybackProgress(playbackStatus);
        }
        await this._call(DOMAIN, 'play_now', this._withUser({ entity_id: entity, uri }, username));
        if (playbackStatus && this._playbackProgress === playbackStatus) {
          playbackStatus.accepted = true;
          this._setPlaybackPhase(playbackStatus, 3);
          this._syncPlaybackStatus();
        }
      } else {
        await this._call('music_assistant', 'play_media',
          this._withUser({ media_id: uri, enqueue: 'replace', radio_mode: !!radio }, username),
          { entity_id: this._getPlayerEntity() });
      }
    } catch (e) {
      if (playbackStatus && this._playbackProgress === playbackStatus) this._stopPlaybackProgress(playbackStatus);
      this._showError(e);
    } finally {
      if (el) el.classList.remove('busy');
    }
  }

  // A track tapped in a list (search results, album or playlist tracks,
  // Discover) plays at once in place of the current track; the rest of the
  // queue is kept. Only an album or playlist itself replaces the queue.
  _playList(uris, start, el) {
    const uri = (uris || [])[Math.max(0, start || 0)];
    if (uri) this._play(uri, false, el);
  }
  _showError(e) {
    // A failed command must not leave the optimistic "playing" state behind.
    if (this._optimisticState) { this._optimisticState = null; this._nowPlayingSignature = null; this._syncPlayer(); }
    const el = this.shadowRoot.getElementById('error-message');
    if (!el) return;
    el.textContent = (e && e.message ? e.message : String(e));
    clearTimeout(this._errorTimer);
    this._errorTimer = setTimeout(() => { el.textContent = ''; }, 6000);
  }

  async _search() {
    const q = this._searchQuery.trim();
    if (!q) return;
    const generation = this._sourceGeneration;
    const sequence = ++this._searchSeq;
    const username = this._getCurrentUser();
    this._isSearching = true;
    this._mode = 'search';
    if (this._onScreenKeyboard) this._keyboardVisible = false;
    this._renderRight();
    const mediaType = MEDIA_TYPES[this._mediaTypeIndex];
    try {
      const r = await this._ws({
        type: 'call_service',
        domain: 'music_assistant',
        service: 'search',
        service_data: this._withUser({
          config_entry_id: this._cfg.config_entry_id,
          name: q,
          media_type: [mediaType.key],
          limit: this._cfg.limit || 24,
        }, username),
        return_response: true,
      });
      if (generation !== this._sourceGeneration || sequence !== this._searchSeq) return;
      const items = ((r && r.response) || {})[mediaType.responseKey] || [];
      this._rememberImages(items);
      const ql = q.toLowerCase();
      const a = [], b = [];
      for (const it of items) {
        const art = ((it.artists && it.artists[0] && it.artists[0].name) || it.name || '').toLowerCase();
        (art.includes(ql) ? a : b).push(it);
      }
      this._searchResults = a.concat(b);
    } catch (e) {
      if (generation !== this._sourceGeneration || sequence !== this._searchSeq) return;
      this._searchResults = [];
      this._showError(e);
    }
    this._isSearching = false;
    this._renderRight();
  }

  async _open(it, el, returnMode) {
    const uri = it.uri || it.media_content_id;
    if (!uri) return;
    const mediaType = (uri.split('://')[1] || '').split('/')[0];
    if (mediaType === 'track' || mediaType === 'radio') { this._play(uri, false, el); return; }
    this._isSearching = true;
    this._returnMode = returnMode || 'search';
    this._detailTitle = it.name || it.title || '';
    this._detailUri = uri;
    this._mode = 'detail';
    this._detailItems = [];
    this._renderRight();
    try {
      const r = await this._hass.callWS({
        type: 'media_player/browse_media',
        entity_id: this._getPlayerEntity(),
        media_content_id: uri,
        media_content_type: mediaType,
      });
      this._detailItems = (r && r.children) || [];
    } catch (e) {
      this._showError(e);
    }
    this._isSearching = false;
    this._renderRight();
  }

  _handleKeyboardKey(t) {
    if (t === 'BS') this._searchQuery = this._searchQuery.slice(0, -1);
    else if (t === 'CLR') this._searchQuery = '';
    else if (t === 'SP') this._searchQuery += ' ';
    else this._searchQuery += t;
    const q = this.shadowRoot.getElementById('search-query');
    if (q) q.innerHTML = this._searchQuery ? esc(this._searchQuery) : `<i>${esc(this._getLanguage().zoeken)}</i>`;
  }

  // ---------- card construction ----------
  _buildCard() {
    // With fill: true, measure the remaining screen height below the card.
    // This works in sections, panel, and masonry views.
    const shouldFill = this._cfg.fill === true;
    const h = (this._cfg.height || 556) + 'px';
    const thema = this._cfg.kiosk_theme === false
      ? '' : `<style>${KIOSK_CSS}</style>`;
    this.shadowRoot.innerHTML = `<style>${STYLE}${VOLUME_CSS}</style>
      ${thema}
      <div class="wrap${this._playerVisible ? '' : ' no-player'}" style="--card-height:${h};--zone-count:${this._getZones().length}">
        <div class="col left">
          <div class="zones" id="zones"></div>
          ${this._sources.length
            ? `<div class="zones sources" id="sources" style="--zone-count:${this._sources.length}"></div>`
            : ''}
          <div class="now-playing" id="now-playing"></div>
          <div class="volume-row">
            <button class="vk" data-vol="-1" aria-label="-">${svg('min')}</button>
            ${volumeControlHtml('Volume')}
            <button class="vk" data-vol="1" aria-label="+">${svg('plus')}</button>
            <div class="volume-label vol-label" id="volume-label"></div>
          </div>
          <div class="links" id="links"></div>
        </div>
        <div class="divider">${this._playerToggleHtml()}</div>
        <div class="col right" id="right"></div>
        <div id="error-message" role="alert"></div>
        ${this._playbackDialogHtml()}
      </div>`;
    this._observeKioskEditMode();
    this._renderZones();
    this._renderSources();
    this._renderLinks();
    this._renderRight();
    clearInterval(this._tickTimer);
    this._tickTimer = setInterval(() => {
      this._updateProgress(); this._updateCardHeight(); this._updateScrollRail(); this._updatePlaybackElapsed();
    }, 1000);
    if (shouldFill) requestAnimationFrame(() => this._updateCardHeight());
    if (!this._resizeListener) {
      this._resizeListener = () => this._updateCardHeight();
      window.addEventListener('resize', this._resizeListener);
    }
    this.shadowRoot.addEventListener('click', (ev) => this._handleClick(ev));
    bindVolumeControl(this.shadowRoot, {
      step: () => this._getVolumeStep(),
      send: (pct) => this._call('media_player', 'volume_set',
        { volume_level: Math.max(0, Math.min(1, pct / 100)) }, { entity_id: this._getVolumeEntity() })
        .catch((e) => this._showError(e)),
    });
    this.shadowRoot.addEventListener('pointerdown', (ev) => {
      const t = ev.composedPath().find((n) => n.dataset && n.dataset.act);
      if (t && (t.dataset.act === 'scroll-up' || t.dataset.act === 'scroll-down')) {
        this._startScrollRepeat(t.dataset.act === 'scroll-up' ? -1 : 1);
      }
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((e) =>
      this.shadowRoot.addEventListener(e, () => { this._stopScrollRepeat(); this._endScrollDrag(); }));
    // Drag the scrollbar with a finger.
    this.shadowRoot.addEventListener('pointerdown', (ev) => {
      const rail = ev.composedPath().find((n) => n.classList && n.classList.contains('rail'));
      if (!rail) return;
      ev.preventDefault();
      this._dragRail = rail;
      rail.classList.add('sleep');
      try { rail.setPointerCapture(ev.pointerId); } catch (e) { /* niet erg */ }
      this._dragScrollTo(ev);
    });
    this.shadowRoot.addEventListener('pointermove', (ev) => {
      if (this._dragRail) { ev.preventDefault(); this._dragScrollTo(ev); }
    });
    this.shadowRoot.addEventListener('scroll', () => this._updateScrollRail(), true);
    this.shadowRoot.addEventListener('input', (ev) => {
      if (ev.target && ev.target.id === 'search-input') this._searchQuery = ev.target.value;
    });
    this.shadowRoot.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && this._playbackProgress) this._hidePlaybackDialog();
      if (ev.target && ev.target.id === 'search-input' && ev.key === 'Enter') {
        this._searchQuery = ev.target.value;
        this._search();
      }
    });
    // The card is on screen now; everything it still needs can arrive late.
    this._loadMissingData();
  }

  _renderZones() {
    const el = this.shadowRoot.getElementById('zones');
    el.innerHTML = this._getZones().map((z, i) =>
      `<button data-act="zone" data-i="${i}" title="${esc(z.name || '')}">${svg(z.icon || 'speaker')}</button>`).join('');
  }

  _renderSources() {
    const el = this.shadowRoot.getElementById('sources');
    if (!el) return;
    el.innerHTML = this._sources.map((source, index) => {
      const label = source.name || source.username;
      return `<button class="${index === this._sourceIndex ? 'on' : ''}" data-act="source" data-i="${index}"
        title="${esc(label)}" aria-label="${esc(label)}">${svg(source.icon || 'mdi:spotify')}</button>`;
    }).join('');
  }

  _connectLiveTrack(source) {
    const state = source && source.connect_entity ? this._getState(source.connect_entity) : null;
    if (!state || !PLAYING_STATES.includes(state.state)) return '';
    return normalizeSpotifyUri((state.attributes || {}).media_content_id || '');
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
    const spotify = source && source.connect_entity ? this._getState(source.connect_entity) : null;
    const sourceName = String((spotify && spotify.attributes && spotify.attributes.source) || '')
      .trim().toLowerCase();
    if (sourceName) {
      const linked = this._getZones().find((zone) => {
        const state = this._getState(zone.entity);
        const name = String((state && state.attributes && state.attributes.friendly_name)
          || zone.name || zone.entity).trim().toLowerCase();
        return name === sourceName && state && PLAYING_STATES.includes(state.state);
      });
      if (linked) return linked.entity;
    }
    const active = this._getActivePlayer();
    const activeState = this._getState(active);
    if (activeState && PLAYING_STATES.includes(activeState.state)) return active;
    const connectPlayer = this._getZones().find((zone) => {
      const state = this._getState(zone.entity);
      const mediaId = state && state.attributes ? state.attributes.media_content_id || '' : '';
      return state && PLAYING_STATES.includes(state.state) && mediaId.startsWith('spotify_connect://');
    });
    return connectPlayer ? connectPlayer.entity : '';
  }

  async _switchSource(index) {
    if (!this._sources[index] || index === this._sourceIndex) return;
    const previous = this._getSourceConfig();
    this._rememberConnectTrack(previous, this._connectLiveTrack(previous));
    const target = this._sources[index];
    const stopEntity = this._connectStopEntity(previous);
    const track = this._connectTrack(target);
    this._sourceIndex = index;
    const generation = ++this._sourceGeneration;
    this._searchSeq++;
    this._isSearching = false;
    this._optimisticState = null;
    this._saveSource();
    this._sourceCache = {};
    this._pendingSources = {};
    this._imageCache = {};
    this._discoverState = null;
    this._discoverRequest = null;
    this._searchResults = [];
    this._detailItems = [];
    this._detailUri = '';
    this._detailTitle = '';
    this._searchQuery = '';
    this._mode = this._discover ? 'discover' : 'home';
    this._renderSources();
    this._renderRight();
    this._loadMissingData();
    if (stopEntity) {
      await this._call('media_player', 'media_stop', {}, { entity_id: stopEntity })
        .catch((error) => this._showError(error));
    }
    if (generation !== this._sourceGeneration) return;
    if (track) await this._play(track, false, null, target.username, generation);
  }

  // Navigation buttons for other dashboard views, allowing the view to contain
  // only this card: links: [{ name, icon, path }].
  _renderLinks() {
    const el = this.shadowRoot.getElementById('links');
    if (!el) return;
    el.innerHTML = (this._cfg.links || []).map((l, i) =>
      `<button data-act="link" data-i="${i}">${l.icon ? svg(l.icon) : ''}${esc(l.name || '')}</button>`).join('');
  }

  _navigate(path) {
    if (!path) return;
    history.pushState(null, '', path);
    window.dispatchEvent(new Event('location-changed'));
  }

  _handleClick(ev) {
    const t = ev.composedPath().find((n) => n.dataset && n.dataset.act);
    if (!t) return;
    const a = t.dataset.act;
    const i = t.dataset.i !== undefined ? parseInt(t.dataset.i, 10) : null;
    if (a === 'launch-hide') this._hidePlaybackDialog();
    else if (a === 'zone') this._switchZone(i, t);
    else if (a === 'source') this._switchSource(i);
    else if (a === 'player') {
      this._playerVisible = !this._playerVisible;
      const wrap = this.shadowRoot.querySelector('.wrap');
      if (wrap) wrap.classList.toggle('no-player', !this._playerVisible);
      const knop = this.shadowRoot.querySelector('.player-toggle');
      if (knop) knop.outerHTML = this._playerToggleHtml();
    }
    else if (a === 'link') this._navigate(((this._cfg.links || [])[i] || {}).path);
    else if (a === 'shuffle') {
      const playerState = this._getState(this._getActivePlayer());
      this._controlPlayer('shuffle_set', { shuffle: !(playerState && playerState.attributes.shuffle) }, t);
    }
    else if (a === 'repeat') {
      const s = this._getState(this._getActivePlayer());
      const currentRepeatMode = (s && s.attributes.repeat) || 'off';
      this._controlPlayer('repeat_set', { repeat: currentRepeatMode === 'off' ? 'all' : (currentRepeatMode === 'all' ? 'one' : 'off') }, t);
    }
    else if (a === 'open-search') { this._mode = 'search'; this._keyboardVisible = this._onScreenKeyboard; this._renderRight(); }
    else if (a === 'home') { this._mode = 'home'; this._renderRight(); }
    else if (a === 'discover') { this._mode = 'discover'; this._renderRight(); this._fetchDiscoverRows(); }
    else if (a === 'refresh-discover') { this._fetchDiscoverRows(true); this._renderRight(); }
    else if (a === 'discover-item' || a === 'play-discover-item') {
      const row = ((this._discoverState && this._discoverState.rows) || [])[parseInt(t.dataset.r, 10)];
      const it = row && row.items[i];
      if (!it) return;
      const mediaType = it.media_type || mediaTypeFromUri(it.uri);
      if (mediaType === 'track') {
        // Queue the rest of the row too, so 'next' keeps discovering.
        const tracks = row.items.filter((x) => (x.media_type || mediaTypeFromUri(x.uri)) === 'track');
        this._playList(tracks.map((x) => x.uri), tracks.indexOf(it), t);
      } else if (a === 'play-discover-item' || mediaType === 'radio') this._play(it.uri, false, t);
      else this._open({ name: it.name, uri: it.uri }, t, 'discover');
    }
    else if (a === 'scroll-discover-row') {
      const discoverRow = this.shadowRoot.getElementById(`discover-row-${t.dataset.r}`);
      if (discoverRow) discoverRow.scrollBy({ left: parseInt(t.dataset.d, 10) * discoverRow.clientWidth * 0.85, behavior: 'smooth' });
    }
    else if (a === 'play-tile') {
      const tl = this._getCategoryTiles(this._categories[this._categoryIndex])[i];
      if (tl) this._play(tl.uri, tl.radio_mode, t);
    }
    else if (a === 'category') { this._categoryIndex = i; this._mode = 'home'; this._renderRight(); }
    else if (a === 'media-type') { this._mediaTypeIndex = i; if (this._searchQuery.trim()) this._search(); else this._renderRight(); }
    else if (a === 'keyboard') { this._keyboardVisible = !this._keyboardVisible; this._renderRight(); }
    else if (a === 'key') this._handleKeyboardKey(t.dataset.t);
    else if (a === 'search') this._search();
    else if (a === 'scroll-up') this._scroll(-1);
    else if (a === 'scroll-down') this._scroll(1);
    else if (a === 'tile') {
      const tl = this._getCategoryTiles(this._categories[this._categoryIndex])[i];
      if (!tl) return;
      const direct = tl.play === true || this._cfg.tile_action === 'play';
      if (direct) this._play(tl.uri, tl.radio_mode, t);
      else this._open({ name: tl.name, uri: tl.uri }, t, 'home');
    }
    else if (a === 'play-result') {
      const it = this._searchResults[i];
      if (it) this._play(it.uri || it.media_content_id, false, t);
    }
    else if (a === 'result') {
      const it = this._searchResults[i];
      if (!it) return;
      const uri = it.uri || it.media_content_id || '';
      // Queue all search results when playing a single track so Next keeps working.
      if (uri.indexOf('://track/') !== -1) {
        this._playList(this._searchResults.map((x) => x.uri || x.media_content_id), i, t);
      } else this._open(it, t, 'search');
    }
    else if (a === 'detail-track') {
      if (!this._detailItems[i]) return;
      this._playList(this._detailItems.map((d) => d.media_content_id), i, t);
    }
    else if (a === 'play-all') this._play(this._detailUri, false, t);
    else if (a === 'back') { this._mode = this._returnMode || 'search'; this._renderRight(); }
    else if (a === 'play-pause') {
      const isPlaying = this._displayState === 'playing';
      if (this._controlPlayer(isPlaying ? 'media_pause' : 'media_play', {}, t)) {
        // Show the updated icon immediately; the real state will follow.
        this._optimisticState = { state: isPlaying ? 'paused' : 'playing', expiresAt: Date.now() + 8000 };
        this._syncPlayer();
      }
    }
    else if (a === 'previous') this._controlPlayer('media_previous_track', {}, t, true);
    else if (a === 'next') this._controlPlayer('media_next_track', {}, t, true, true);
  }

  // On a Cast Nest Hub, touch scrolling does not work, so show arrow buttons by
  // default. Set arrows: false for a PC or phone.
  _scrollBoxHtml(content) {
    if (this._cfg.arrows === false) return `<div class="scrollbox">${content}</div>`;
    return `<div class="scrollbox arrows-enabled">${content}
      <div class="arrows">
        <button data-act="scroll-up">${svg('mdi:chevron-up')}</button>
        <div class="rail"><div class="thumb"></div></div>
        <button data-act="scroll-down">${svg('mdi:chevron-down')}</button>
      </div></div>`;
  }

  // With fill: true, use the screen space below the top of the card so it fits
  // beneath badges and tabs without a per-view height setting.
  _updateCardHeight() {
    if (this._cfg.fill !== true) return;
    const wrap = this.shadowRoot && this.shadowRoot.querySelector('.wrap');
    if (!wrap || !this.isConnected) return;
    const topOffset = this.getBoundingClientRect().top;
    const bottomMargin = this._cfg.fill_margin == null ? 8 : this._cfg.fill_margin;
    const h = Math.max(300, Math.round(window.innerHeight - topOffset - bottomMargin));
    // Keep the player density tied to card space, including space used by HA's header.
    const heightMode = h <= 440 ? 'short' : h <= 560 ? 'tight' : h <= 720 ? 'compact' : 'normal';
    if (wrap.dataset.heightMode !== heightMode) wrap.dataset.heightMode = heightMode;
    const heightValue = h + 'px';
    if (h === this._filledHeight && wrap.style.getPropertyValue('--card-height') === heightValue) return;
    this._filledHeight = h;
    wrap.style.setProperty('--card-height', heightValue);
  }

  // While dragging the scrollbar, move the thumb and the list together.
  _dragScrollTo(ev) {
    const rail = this._dragRail;
    const scrollContainer = this.shadowRoot && this.shadowRoot.querySelector('.scrollbox .content-pane');
    if (!rail || !scrollContainer) return;
    const thumb = rail.firstElementChild;
    const railBounds = rail.getBoundingClientRect();
    const thumbHeight = (thumb && thumb.offsetHeight) || 0;
    const trackSpace = Math.max(1, railBounds.height - thumbHeight);
    const scrollRatio = Math.max(0, Math.min(1, (ev.clientY - railBounds.top - thumbHeight / 2) / trackSpace));
    scrollContainer.scrollTop = scrollRatio * Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);
    this._updateScrollRail();
  }

  _endScrollDrag() {
    if (!this._dragRail) return;
    this._dragRail.classList.remove('sleep');
    this._dragRail = null;
  }

  // Update the position indicator between the arrow buttons.
  _updateScrollRail() {
    const sr = this.shadowRoot;
    if (!sr) return;
    const rail = sr.querySelector('.scrollbox.arrows-enabled .rail');
    const scrollContainer = sr.querySelector('.scrollbox .content-pane');
    if (!rail || !scrollContainer) return;
    const thumb = rail.firstElementChild;
    const contentHeight = scrollContainer.scrollHeight;
    const visibleHeight = scrollContainer.clientHeight;
    if (!visibleHeight || contentHeight <= visibleHeight + 2) { rail.classList.remove('active'); return; }
    rail.classList.add('active');
    const visibleRatio = Math.max(0.12, visibleHeight / contentHeight);
    const scrollPosition = scrollContainer.scrollTop / (contentHeight - visibleHeight);
    thumb.style.height = (visibleRatio * 100) + '%';
    thumb.style.top = (Math.max(0, Math.min(1, scrollPosition)) * (1 - visibleRatio) * 100) + '%';
  }

  _scroll(direction) {
    const scrollContainer = this.shadowRoot.querySelector('.scrollbox .content-pane');
    if (!scrollContainer) return;
    // Scroll almost one full page per tap, with a small overlap.
    const scrollStep = Math.max(160, Math.round(scrollContainer.clientHeight * 0.9));
    if (scrollContainer.scrollBy) scrollContainer.scrollBy({ top: direction * scrollStep, behavior: 'smooth' });
    else scrollContainer.scrollTop += direction * scrollStep;
  }

  // Holding a button keeps scrolling.
  _startScrollRepeat(direction) {
    clearInterval(this._scrollTimer);
    this._scrollTimer = setInterval(() => this._scroll(direction), 320);
  }

  _stopScrollRepeat() { clearInterval(this._scrollTimer); }

  // ---------- right column ----------
  _renderRight() {
    const el = this.shadowRoot.getElementById('right');
    if (!el) return;
    // Redrawing the same view (a part of the feed arrived) keeps the scroll position.
    const viewKey = `${this._mode}|${this._categoryIndex}`;
    const previousPane = el.querySelector('.content-pane');
    const top = previousPane && this._renderedView === viewKey ? previousPane.scrollTop : 0;
    this._renderedView = viewKey;
    if (this._mode === 'discover' && this._discover) el.innerHTML = this._discoverHtml();
    else if (this._mode === 'home' || this._mode === 'discover') el.innerHTML = this._homeHtml();
    else if (this._mode === 'detail') el.innerHTML = this._detailHtml();
    else el.innerHTML = this._searchHtml();
    if (top) { const currentPane = el.querySelector('.content-pane'); if (currentPane) currentPane.scrollTop = top; }
    requestAnimationFrame(() => this._updateScrollRail());
  }

  // One tile: square cover (round for an artist), a play button on the cover
  // and two lines of text underneath. Every grid and carousel uses this.
  _tileHtml({ act, playAction, i, r, uri, name, subtitle, image, icon }) {
    const mediaType = mediaTypeFromUri(uri);
    const iconMarkup = `<div class="ic">${svg(icon || (mediaType === 'radio' ? 'radio' : mediaType === 'artist' ? 'artiest' : 'muziek'))}</div>`;
    // An image that will not load (a site that refuses hotlinking, a dead
    // link) falls back to the icon instead of leaving a broken picture.
    const imageMarkup = image
      ? `<img loading="lazy" alt="" src="${esc(LARGE_IMAGE_URL(image))}" onerror="this.outerHTML=this.nextElementSibling.innerHTML"><template>${iconMarkup}</template>`
      : iconMarkup;
    const data = `data-i="${i}"${r != null ? ` data-r="${r}"` : ''}`;
    const playButton = playAction
      ? `<span class="play-button" data-act="${playAction}" ${data} title="${esc(this._getLanguage().luister)}">${svg('play')}</span>`
      : '';
    return `<button class="tile${mediaType === 'artist' ? ' round' : ''}" data-act="${act}" ${data}>
      <div class="cover">${imageMarkup}${playButton}</div>
      <div class="tt">${esc(name)}</div>${subtitle ? `<div class="subtitle">${esc(subtitle)}</div>` : ''}</button>`;
  }

  _skeletonHtml(count, carousel) {
    const kaart = '<div class="tile skelet"><div class="cover"></div><div class="tt"></div><div class="subtitle"></div></div>';
    const n = Array.from({ length: count }, () => kaart).join('');
    return carousel ? `<div class="carousel">${n}</div>` : `<div class="tiles">${n}</div>`;
  }

  _homeHtml() {
    const cats = this._categories;
    const chips = this._tabsHtml();
    if (!cats.length) return chips + `<div class="empty">${this._getLanguage().geenCats}</div>`;
    const cat = cats[this._categoryIndex] || {};
    const tiles = this._getCategoryTiles(cat);
    // A source category has nothing to show until its fetch lands: show the
    // shape of what is coming rather than an empty grid.
    if (cat.source && !tiles.length) {
      const c = this._sourceCache[this._getSourceKey(cat.source)];
      return chips + (c ? `<div class="empty">${this._getLanguage().geenResultaat}</div>`
        : this._scrollBoxHtml(`<div class="content-pane">${this._skeletonHtml(10)}</div>`));
    }
    const tiles = tiles.map((t, i) => this._tileHtml({
      act: 'tile', playAction: 'play-tile', i, uri: t.uri, name: t.name,
      subtitle: t.recommendation_reason || this._getSubtitle({ uri: t.uri }),
      image: this._getTileImage(t), icon: t.icon,
    })).join('');
    return chips + this._scrollBoxHtml(`<div class="tiles content-pane">${tiles}</div>`);
  }

  // The discover feed: a featured pick on top, then one carousel per
  // Music Assistant recommendation row.
  _discoverHtml() {
    const t = this._getLanguage();
    const chips = this._tabsHtml();
    const c = this._discoverState && this._discoverState.key === this._getDiscoverKey() ? this._discoverState : null;
    this._renderedDiscoverKey = c ? `${c.key}|${c.version}` : null;
    const skeletonRow = (title) => `<section class="discover-section"><div class="discover-header">${title
      ? `<span class="discover-icon">${svg('ontdek')}</span><div class="discover-title">${esc(title)}<small class="loading">${esc(t.zoektVoorJou)}</small></div>`
      : '<div class="discover-title skelet-txt"></div>'}</div>${this._skeletonHtml(8, true)}</section>`;
    if (!c || (!c.rows.length && c.pending.size)) {
      return chips + this._scrollBoxHtml(`<div class="discover content-pane"><div class="featured skelet"></div>${skeletonRow(c && c.pending.has('similar') ? t.voorJou : '')}${skeletonRow('')}</div>`);
    }
    // The recommendations are still on their way: hold their place on top.
    const waitingForSimilar = c.pending.has('similar');
    if (!c.rows.length) {
      return chips + `<div class="empty empty-state">${svg('ontdek')}<div>${esc(t.ontdekLeeg)}</div>
        <button class="button" data-act="refresh-discover">${svg('vernieuw')} ${esc(t.opnieuw)}</button></div>`;
    }
    let featuredMarkup = '';
    let featuredRowIndex = -1;
    let featuredItemIndex = -1;
    // Feature something from a full row rather than the single item of
    // "recently played": the first recommended track, else an album or playlist.
    const findFeaturedCandidate = (row) => row.items.findIndex((it) => safeImageUrl(it.image)
      && ((row.source && row.source !== 'music_assistant')
        || ['album', 'playlist'].includes(it.media_type || mediaTypeFromUri(it.uri))));
    for (const minimum of [3, 1]) {
      for (let r = 0; r < c.rows.length && featuredRowIndex < 0; r++) {
        if (c.rows[r].items.length < minimum) continue;
        const i = findFeaturedCandidate(c.rows[r]);
        if (i >= 0) { featuredRowIndex = r; featuredItemIndex = i; }
      }
    }
    if (waitingForSimilar) featuredMarkup = '<div class="featured skelet"></div>';
    else if (featuredRowIndex >= 0) {
      const it = c.rows[featuredRowIndex].items[featuredItemIndex];
      const coverUrl = esc(LARGE_IMAGE_URL(safeImageUrl(it.image)));
      featuredMarkup = `<div class="featured">
        <div class="featured-background" style="background-image:url('${coverUrl}')"></div>
        <button class="featured-art" data-act="discover-item" data-r="${featuredRowIndex}" data-i="${featuredItemIndex}"><img alt="" src="${coverUrl}"></button>
        <div class="featured-content">
          <div class="featured-label">${svg('ontdek')} ${esc(t.ontdekKop)} · ${esc(this._getRowName(c.rows[featuredRowIndex]))}</div>
          <div class="featured-title">${esc(it.name)}</div>
          <div class="featured-subtitle">${esc(this._getSubtitle(it))}</div>
          <div class="featured-actions">
            <button class="button primary" data-act="play-discover-item" data-r="${featuredRowIndex}" data-i="${featuredItemIndex}">${svg('play')} ${esc(t.luister)}</button>
            <button class="button round" data-act="refresh-discover" title="${esc(t.opnieuw)}">${svg('vernieuw')}</button>
          </div>
        </div></div>`;
    }
    const showArrows = this._cfg.arrows !== false;
    const recommendationRows = c.rows.map((row, r) => {
      const rowTiles = row.items.map((it, i) => this._tileHtml({
        act: 'discover-item', playAction: 'play-discover-item', i, r, uri: it.uri, name: it.name,
        subtitle: this._getSubtitle(it), image: safeImageUrl(it.image),
      })).join('');
      const nav = showArrows && row.items.length > 3 ? `<div class="discover-navigation">
          <button data-act="scroll-discover-row" data-r="${r}" data-d="-1">${svg('links')}</button>
          <button data-act="scroll-discover-row" data-r="${r}" data-d="1">${svg('rechts')}</button></div>` : '';
      // Music Assistant sends icons as 'mdi-name' and subtitles in English only.
      const iconName = String(row.icon || '').replace(/^mdi[-:]/, '');
      const isEnglish = String(this._cfg.language || (this._hass && this._hass.language) || 'en').startsWith('en');
      const subtitleHtml = isEnglish && row.subtitle ? `<small>${esc(row.subtitle)}</small>` : '';
      return `<section class="discover-section">
        <div class="discover-header">
          ${iconName ? `<span class="discover-icon">${svg(`mdi:${iconName}`)}</span>` : ''}
          <div class="discover-title">${esc(this._getRowName(row))}${subtitleHtml}</div>
          ${nav}
        </div>
        <div class="carousel" id="discover-row-${r}">${rowTiles}</div></section>`;
    }).join('');
    const placeholderRow = waitingForSimilar ? skeletonRow(t.voorJou) : '';
    return chips + this._scrollBoxHtml(`<div class="discover content-pane">${featuredMarkup}${placeholderRow}${recommendationRows}</div>`);
  }

  // The handle on the line between player and browser: a chevron that hides
  // the player (pointing left) or brings it back (pointing right).
  _playerToggleHtml() {
    const t = this._getLanguage();
    const label = this._playerVisible ? t.spelerVerbergen : t.spelerTonen;
    return `<button class="player-toggle${this._playerButtonPlaying ? ' playing' : ''}" data-act="player"
      title="${esc(label)}" aria-label="${esc(label)}" aria-expanded="${this._playerVisible}">${svg('mdi:chevron-left')}</button>`;
  }
  // The tabs: discover first, then the categories, the search button last.
  _tabsHtml() {
    const t = this._getLanguage();
    const ontdek = this._discover
      ? `<button class="discover-tab${this._mode === 'discover' ? ' on' : ''}" data-act="discover">${svg('ontdek')}<span>${esc(t.ontdek)}</span></button>`
      : '';
    const tabs = this._categories.map((c, i) =>
      `<button class="${this._mode === 'home' && i === this._categoryIndex ? 'on' : ''}" data-act="category" data-i="${i}">${esc(c.name)}</button>`).join('');
    return `<div class="tabrij"><div class="chips">${ontdek}${tabs}</div>
      <div class="chips search-chips"><button class="search-tab${this._mode === 'search' ? ' on' : ''}" data-act="open-search"
              title="${esc(t.zoek)}">${svg('zoek')}</button></div></div>`;
  }

  _searchHtml() {
    const t = this._getLanguage();
    const searchableTypes = (this._cfg.search_types || MEDIA_TYPES.map((s) => s.key));
    const chips = MEDIA_TYPES.map((s, i) => searchableTypes.includes(s.key)
      ? `<button class="${i === this._mediaTypeIndex ? 'on' : ''}" data-act="media-type" data-i="${i}">${esc(t.soort[s.key])}</button>`
      : '').join('');
    const qbar = this._onScreenKeyboard
        ? `<div class="qbar">${svg('zoek')}
          <div class="query" id="search-query">${this._searchQuery ? esc(this._searchQuery) : `<i>${esc(t.zoeken)}</i>`}</div>
          <button class="kb" data-act="keyboard">${this._keyboardVisible ? t.verberg : t.toetsen}</button></div>`
      : `<div class="qbar">${svg('zoek')}
          <input class="query" id="search-input" type="search" autocomplete="off"
                 placeholder="${esc(t.zoeken)}" value="${esc(this._searchQuery)}">
          <button class="kb" data-act="search">${t.zoek}</button></div>`;
    const body = (this._onScreenKeyboard && this._keyboardVisible) ? this._keyboardHtml() : this._resultsHtml();
    return this._tabsHtml(true) + qbar
      + `<div class="chips" style="margin-top:6px">${chips}</div>` + body;
  }

  _keyboardHtml() {
    const makeKeyButton = (t, l, cls) => `<button class="${cls || ''}" data-act="key" data-t="${t}">${l}</button>`;
    const num = `<div class="kr num">${[...'1234567890'].map((c) => makeKeyButton(c, c)).join('')}</div>`;
    const rows = KEYBOARD_ROWS.map((r, idx) => {
      let html = [...r].map((c) => makeKeyButton(c, c.toUpperCase())).join('');
      if (idx === 2) html += makeKeyButton('BS', '&#9003;');
      return `<div class="kr">${html}</div>`;
    }).join('');
    const t = this._getLanguage();
    const bottomRow = `<div class="kr wide">${makeKeyButton('CLR', t.wissen)}${makeKeyButton('SP', t.spatie)}
      <button class="go" data-act="search">${t.zoek}</button></div>`;
    return `<div class="kbd">${num}${rows}${bottomRow}</div>`;
  }

  _resultsHtml() {
    const t = this._getLanguage();
    if (this._isSearching) return `<div class="empty">${t.bezigZoeken}</div>`;
    if (!this._searchResults.length) return `<div class="empty">${t.geenResultaat}</div>`;
    const mediaType = MEDIA_TYPES[this._mediaTypeIndex];
    if (mediaType.isList) {
      const rows = this._searchResults.map((it, i) => {
        const art = (it.artists && it.artists[0] && it.artists[0].name) || '';
        const imageUrl = safeImageUrl(it.image);
        const img = imageUrl ? `<img loading="lazy" src="${esc(SMALL_IMAGE_URL(imageUrl))}">` : '<span></span>';
        return `<button class="row" data-act="result" data-i="${i}">${img}
          <div class="tx"><b>${esc(it.name)}</b>${art ? ' <span>&middot; ' + esc(art) + '</span>' : ''}</div>
          <span class="duration">${formatDuration(it.duration)}</span></button>`;
      }).join('');
      return this._scrollBoxHtml(`<div class="list content-pane">${rows}</div>`);
    }
    const tiles = this._searchResults.map((it, i) => {
      const art = (it.artists && it.artists[0] && it.artists[0].name) || '';
      return this._tileHtml({
        act: 'result', playAction: 'play-result', i, uri: it.uri || it.media_content_id,
        name: it.name, subtitle: art || this._getSubtitle({ uri: it.uri }), image: safeImageUrl(it.image),
      });
    }).join('');
    return this._scrollBoxHtml(`<div class="tiles content-pane">${tiles}</div>`);
  }

  _detailHtml() {
    const t = this._getLanguage();
    const itemCount = this._detailItems.length;
    let totalSeconds = 0;
    for (const d of this._detailItems) totalSeconds += parseInt(d.media_duration || 0, 10) || 0;
    const totalMinutes = Math.round(totalSeconds / 60);
    const extra = totalMinutes > 0 ? (totalMinutes >= 60
      ? ` · ${Math.floor(totalMinutes / 60)} ${t.uur} ${totalMinutes % 60} ${t.minuut}`
      : ` · ${totalMinutes} ${t.minuut}`) : '';
    const countLabel = (this._isSearching || !itemCount) ? ''
      : `<span class="count">${itemCount} ${itemCount === 1 ? t.nummer : t.nummers}${extra}</span>`;
    const coverUrl = safeImageUrl(this._imageCache[this._detailUri]);
    const headerHtml = `<div class="header">
      <button class="back" data-act="back">${svg('terug')} ${this._returnMode === 'search' ? t.resultaten : t.terug}</button>
      ${coverUrl ? `<img class="header-art" alt="" src="${esc(SMALL_IMAGE_URL(coverUrl))}">` : ''}
      <div class="title">${esc(this._detailTitle)}${countLabel}</div>
      <button class="play-all-button" data-act="play-all">${svg('play')} ${t.speelAlles}</button></div>`;
    if (this._isSearching) return headerHtml + `<div class="empty">${t.bezigOphalen}</div>`;
    if (!itemCount) return headerHtml + `<div class="empty">${t.geenNummers}</div>`;
    const rows = this._detailItems.map((d, i) => {
      const img = d.thumbnail ? `<img loading="lazy" src="${esc(SMALL_IMAGE_URL(d.thumbnail))}">` : `<span class="nr">${i + 1}</span>`;
      return `<button class="row" data-act="detail-track" data-i="${i}">${img}
        <div class="tx"><b>${esc(d.title)}</b></div>
        <span class="duration">${formatDuration(d.media_duration)}</span></button>`;
    }).join('');
    return headerHtml + this._scrollBoxHtml(`<div class="list content-pane">${rows}</div>`);
  }

  // ---------- active player ----------
  // A speaker plays from a buffer, so a radio stream announces the next title
  // while you are still hearing the previous song: the card runs a track ahead.
  // 'radio_delay' holds every change in title, artist and artwork back by that
  // many seconds, so what you see matches what you hear. A talk break still shows
  // as a talk break, just as late as the sound. Zero (the default) changes nothing.
  // Only radio is held back: a track from a library or from Spotify has a length
  // and starts when the player says it starts, so there is nothing to make up for.
  _stabilizeMetadata(entityId, attributes) {
    const delayMs = Math.max(0, Number(this._cfg.radio_delay) || 0) * 1000;
    const isRadio = !attributes.media_duration && !!attributes.media_title;
    const trackLag = Math.max(0, Number(this._cfg.radio_lag) || 0);
    if (!entityId || !isRadio || (!delayMs && !trackLag)) return attributes;
    if (trackLag) {
      // Some stations publish their titles a whole song ahead: while you hear one
      // track, the stream already names the next. A song has no fixed length, so
      // seconds cannot fix that - staying one title behind can. The programme's
      // own name (artist equal to the station) is not a track and passes straight
      // through, so a talk break still shows as a talk break.
      const stationName = attributes.media_album_name || attributes.media_channel || '';
      const isProgramSegment = !!stationName && (attributes.media_artist || '') === stationName;
      if (!this._metadataHistory) this._metadataHistory = {};
      const history = this._metadataHistory[entityId] || (this._metadataHistory[entityId] = []);
      if (!isProgramSegment) {
        const latestEntry = history.length ? history[history.length - 1] : null;
        if (!latestEntry || latestEntry.title !== attributes.media_title) {
          history.push({
            title: attributes.media_title,
            artist: attributes.media_artist || '',
            image: attributes.entity_picture_local || attributes.entity_picture || '',
          });
          if (history.length > 10) history.shift();
          this._metadataHistoryTimes = this._metadataHistoryTimes || {};
          this._metadataHistoryTimes[entityId] = Date.now();
        }
        const delayedEntry = history[history.length - 1 - trackLag];
        if (delayedEntry) {
          return Object.assign({}, attributes, {
            media_title: delayedEntry.title,
            media_artist: delayedEntry.artist,
            entity_picture: delayedEntry.image,
            entity_picture_local: '',
          });
        }
      }
      // The programme's name also arrives in the middle of a song, which looks the
      // same as a real talk break. So it only takes over once no new title has come
      // in for five minutes: a break or the news, rather than a flip mid-song.
      const lastTrackAt = (this._metadataHistoryTimes || {})[entityId];
      if (isProgramSegment && lastTrackAt && Date.now() - lastTrackAt < 300000) {
        const previousEntry = history[history.length - 1 - trackLag];
        if (previousEntry) {
          return Object.assign({}, attributes, {
            media_title: previousEntry.title,
            media_artist: previousEntry.artist,
            entity_picture: previousEntry.image,
            entity_picture_local: '',
          });
        }
      }
      return attributes;
    }
    if (!this._meta) this._meta = {};
    const history = this._meta[entityId] || (this._meta[entityId] = []);
    const now = Date.now();
    const currentMetadata = {
      title: attributes.media_title || '',
      artist: attributes.media_artist || '',
      image: attributes.entity_picture_local || attributes.entity_picture || '',
    };
    const latestEntry = history.length ? history[history.length - 1] : null;
    if (!latestEntry || latestEntry.title !== currentMetadata.title
      || latestEntry.artist !== currentMetadata.artist || latestEntry.image !== currentMetadata.image) {
      history.push(Object.assign({}, currentMetadata, { timestamp: now }));
      if (history.length > 20) history.shift();
    }
    // The newest entry that is old enough to be audible by now.
    let displayedEntry = history[0];
    for (const entry of history) { if (now - entry.timestamp >= delayMs) displayedEntry = entry; }
    // Still waiting on the next one: come back when it is due.
    const nextEntry = history.find((entry) => now - entry.timestamp < delayMs);
    if (nextEntry && !this._metaTimer) {
      this._metaTimer = setTimeout(() => {
        this._metaTimer = null;
        this._syncPlayer();
      }, delayMs - (now - nextEntry.timestamp) + 100);
    }
    if (!displayedEntry || (displayedEntry.title === currentMetadata.title
      && displayedEntry.artist === currentMetadata.artist && displayedEntry.image === currentMetadata.image)) return attributes;
    return Object.assign({}, attributes, {
      media_title: displayedEntry.title,
      media_artist: displayedEntry.artist,
      entity_picture: displayedEntry.image,
      entity_picture_local: '',
    });
  }

  _syncPlayer() {
    const sr = this.shadowRoot;
    if (!sr || !sr.getElementById('now-playing')) return;
    const entityId = this._getActivePlayer();
    const selectedPlayer = this._getPlayerEntity();
    const zones = this._getZones();
    const zoneButtons = sr.querySelectorAll('#zones button');
    zoneButtons.forEach((b, i) => {
      b.classList.toggle('on', i === this._zoneIndex);
      const z = zones[i];
      const zoneState = z && this._getState(z.entity);
      b.classList.toggle('playing', !!(zoneState && PLAYING_STATES.includes(zoneState.state)));
    });

    const vs = this._getState(this._getVolumeEntity());
    const volumeLevel = vs && vs.attributes.volume_level != null ? vs.attributes.volume_level : 0;
    updateVolumeDisplay(sr, volumeLevel * 100, this._getMaxVolume());

    const playerState = this._getState(entityId);
    const nowPlayingElement = sr.getElementById('now-playing');
    const mediaAttributes = this._stabilizeMetadata(entityId, (playerState && playerState.attributes) || {});
    const artworkUrl = mediaAttributes.entity_picture_local || mediaAttributes.entity_picture || '';
    const playerButtonIsPlaying = !!(playerState && playerState.state === 'playing');
    if (playerButtonIsPlaying !== this._playerButtonPlaying) {
      this._playerButtonPlaying = playerButtonIsPlaying;
      const playerButton = sr.querySelector('.player-toggle');
      if (playerButton) playerButton.classList.toggle('playing', playerButtonIsPlaying);
    }
    const translations = this._getLanguage();
    const title = mediaAttributes.media_title || (playerState ? translations.stil : translations.geenSpeler);
    const artist = [mediaAttributes.media_artist, mediaAttributes.media_album_name].filter(Boolean).join(' · ');

    // After play or pause is pressed, show the new state optimistically until
    // the player confirms it or the timeout expires.
    let displayState = playerState ? playerState.state : '';
    if (this._optimisticState) {
      if (Date.now() > this._optimisticState.expiresAt || displayState === this._optimisticState.state) this._optimisticState = null;
      else displayState = this._optimisticState.state;
    }
    this._displayState = displayState;
    const isPlaying = displayState === 'playing';

    // Redraw only when something changes; rebuilding the cover on every state
    // update from Home Assistant would make the card slow.
    const sig = [entityId, selectedPlayer, displayState, title, artist, mediaAttributes.media_content_id,
      artworkUrl.replace(/([?&])(token|cache)=[^&]*/g, '$1'), mediaAttributes.shuffle, mediaAttributes.repeat, mediaAttributes.media_duration].join('|');
    if (sig === this._nowPlayingSignature) { this._updateProgress(); return; }
    this._nowPlayingSignature = sig;
    // If another player in the selected zone is playing, show where.
    const elders = (entityId && entityId !== selectedPlayer && playerState && PLAYING_STATES.includes(playerState.state))
      ? `<div class="status-label">${translations.speeltOp} ${esc(mediaAttributes.friendly_name || entityId)}</div>` : '';
    const durationSeconds = parseInt(mediaAttributes.media_duration, 10) || 0;
    const wrap = sr.querySelector('.wrap');
    if (wrap) {
      const safeArtworkUrl = safeImageUrl(artworkUrl);
      wrap.style.setProperty('--art', safeArtworkUrl ? `url("${safeArtworkUrl.replace(/["\\\n\r]/g, '')}")` : 'none');
      wrap.classList.toggle('met-art', !!safeArtworkUrl);
    }
    nowPlayingElement.innerHTML = `
      ${artworkUrl ? `<img class="art" src="${esc(artworkUrl)}">`
            : `<div class="empty-art">${svg('muziek')}</div>`}
      <div class="tx">
        <div class="t">${esc(title)}</div>
        <div class="a">${esc(artist)}</div>
        ${elders}
      </div>
      ${durationSeconds ? `<div class="progress">
        <div class="progress-track"><div class="progress-fill" id="playback-progress-fill"></div></div>
        <div class="time-label"><span id="playback-current-time">0:00</span><span>${formatDuration(durationSeconds)}</span></div>
      </div>` : ''}
      <div class="ctr">
        <button class="shuf${mediaAttributes.shuffle ? ' on' : ''}" data-act="shuffle"
                title="${translations.shuffleTitel}">${svg('shuffle')}</button>
        <button data-act="previous">${svg('prev')}</button>
        <button class="primary" data-act="play-pause">${svg(isPlaying ? 'pause' : 'play')}</button>
        <button data-act="next">${svg('next')}</button>
        <button class="rep${mediaAttributes.repeat && mediaAttributes.repeat !== 'off' ? ' on' : ''}" data-act="repeat"
                title="${translations.herhaalTitel}">${svg(mediaAttributes.repeat === 'one' ? 'mdi:repeat-once' : 'mdi:repeat')}</button>
      </div>`;
    this._updateProgress();
  }

  // Home Assistant updates playback position only occasionally, so interpolate
  // between updates.
  _updateProgress() {
    const sr = this.shadowRoot;
    const fill = sr && sr.getElementById('playback-progress-fill');
    if (!fill) return;
    const playerState = this._getState(this._getActivePlayer());
    const playerAttributes = (playerState && playerState.attributes) || {};
    const durationSeconds = parseInt(playerAttributes.media_duration, 10) || 0;
    if (!durationSeconds) return;
    let playbackPosition = parseFloat(playerAttributes.media_position) || 0;
    if (playerState && playerState.state === 'playing' && playerAttributes.media_position_updated_at) {
      playbackPosition += (Date.now() - new Date(playerAttributes.media_position_updated_at).getTime()) / 1000;
    }
    playbackPosition = Math.max(0, Math.min(durationSeconds, playbackPosition));
    fill.style.width = (playbackPosition / durationSeconds * 100) + '%';
    const currentTimeElement = sr.getElementById('playback-current-time');
    if (currentTimeElement) currentTimeElement.textContent = formatDuration(Math.round(playbackPosition));
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
    this._endScrollDrag();
    clearInterval(this._tickTimer);
    clearInterval(this._scrollTimer);
    if (this._resizeListener) {
      window.removeEventListener('resize', this._resizeListener);
      this._resizeListener = null;
    }
  }
}

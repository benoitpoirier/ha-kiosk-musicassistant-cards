import {
  BIB_MAX, BIB_TTL, GROOT, KLEIN, KORT, RIJEN, SOORTEN, SOORT_VAN,
  SPOTIFY_URI, SPEELT, VEILIG, VOL_CSS, categoriesParDefaut, esc, mmss, svg, taalVan, volBind, volHtml, volShow,
} from './shared.js';
import { KIOSK_CSS, KIOSK_THEMES } from './kiosk-theme.js';

const DOMAIN = 'kiosk_musicassistant_cards';

const STYLE = `
:host {
  display:block;
  container-type:inline-size;
  container-name:kaart;
  --acc:#1DB954;
  --grad:var(--acc);
  --acc-glow:rgba(29,185,84,.35);
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

/* Responsive tile grid: as many columns as fit, tiles grow with the screen.
   --tmin is the smallest a tile may get; it rises with the width of the right
   column (container 'rechts'), so a bigger screen gets bigger artwork rather
   than just more of it. */
.right { container-type:inline-size; container-name:rechts; }
.tiles { --tmin:136px; min-height:0; max-width:100%; height:100%; overflow-y:auto; overflow-x:hidden;
         display:grid; grid-template-columns:repeat(auto-fill,minmax(var(--tmin),1fr));
         gap:18px 16px; align-content:start; padding:4px 2px 12px; scrollbar-width:none; }
.tiles::-webkit-scrollbar { display:none; }
@container rechts (max-width: 600px) { .tiles { --tmin:112px; gap:14px 12px; } }
@container rechts (max-width: 420px) { .tiles { --tmin:96px; gap:12px 10px; } }
@container rechts (min-width: 1000px) { .tiles { --tmin:168px; gap:22px 20px; } }
@container rechts (min-width: 1300px) { .tiles { --tmin:196px; gap:26px 22px; } }
@container rechts (min-width: 1700px) { .tiles { --tmin:228px; } }

.tile { display:flex; flex-direction:column; align-items:stretch; min-width:0; max-width:100%;
        position:relative; text-align:left; border-radius:14px; }
.tile .cover { position:relative; width:100%; aspect-ratio:1; border-radius:12px; overflow:hidden;
               background:var(--ov1); box-shadow:0 8px 22px rgba(0,0,0,.28);
               transition:transform .18s ease, box-shadow .18s ease; }
.tile.rond .cover { border-radius:50%; }
.tile .cover img { width:100%; height:100%; object-fit:cover; display:block; }
.tile .cover .ic { width:100%; height:100%; display:flex; align-items:center; justify-content:center;
                   background:linear-gradient(145deg,var(--ov2),var(--ov1)); }
.tile .cover .ic ha-icon { --mdc-icon-size:40px; color:var(--acc); opacity:.9; }
.tile .speel { position:absolute; right:8px; bottom:8px; width:40px; height:40px; border-radius:50%;
               display:flex; align-items:center; justify-content:center; background:var(--grad);
               color:#fff; box-shadow:0 6px 16px rgba(0,0,0,.4); opacity:.92;
               transition:transform .15s ease, opacity .15s ease; }
.tile.rond .speel { right:12%; bottom:12%; }
.tile .speel ha-icon { --mdc-icon-size:24px; }
.tile .speel:active { transform:scale(.88); }
.tile:active .cover { transform:scale(.97); }
@media (hover:hover) {
  .tile .speel { opacity:0; transform:translateY(6px); }
  .tile:hover .speel { opacity:1; transform:none; }
  .tile:hover .cover { transform:translateY(-2px); box-shadow:0 14px 30px rgba(0,0,0,.38); }
}
.tile .tt { font-size:13.5px; font-weight:650; padding-top:9px; line-height:1.25;
            color:var(--primary-text-color,#e9e9ea);
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tile .st { font-size:12px; color:var(--flauw); padding-top:2px; line-height:1.25;
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tile.rond .tt, .tile.rond .st { text-align:center; }

/* loading placeholders */
@keyframes glans { from { background-position:-200px 0; } to { background-position:calc(200px + 100%) 0; } }
.skelet .cover, .skelet .tt, .skelet .st, .skelet-txt, .held.skelet {
  background:linear-gradient(90deg,var(--ov1) 0,var(--ov2) 50%,var(--ov1) 100%) no-repeat;
  background-size:200px 100%; background-color:var(--ov1); animation:glans 1.3s ease-in-out infinite;
  box-shadow:none; }
.skelet .tt { height:13px; width:80%; margin-top:10px; padding:0; border-radius:6px; }
.skelet .st { height:11px; width:50%; margin-top:6px; padding:0; border-radius:6px; }
.skelet-txt { height:18px; width:180px; border-radius:8px; }
.ok-titel.skelet-txt { flex:0 0 180px; }

/* discover: featured pick + one carousel per recommendation row */
.ontdek { min-height:0; height:100%; overflow-y:auto; overflow-x:hidden; scrollbar-width:none;
          display:flex; flex-direction:column; gap:22px; padding:4px 2px 16px; }
.ontdek::-webkit-scrollbar { display:none; }
.held { position:relative; flex:0 0 auto; display:flex; align-items:center; gap:22px; min-height:184px;
        padding:20px; border-radius:20px; overflow:hidden; isolation:isolate;
        background:var(--ov1); box-shadow:inset 0 0 0 1px var(--line); }
.held-bg { position:absolute; inset:-40px; z-index:-1; background-size:cover; background-position:center;
           filter:blur(36px) saturate(1.4) brightness(.55); transform:scale(1.15); }
.held::after { content:''; position:absolute; inset:0; z-index:-1;
               background:linear-gradient(90deg,rgba(0,0,0,.35),rgba(0,0,0,.05)); }
.held-art { flex:0 0 auto; width:144px; height:144px; border-radius:14px; overflow:hidden;
            box-shadow:0 14px 34px rgba(0,0,0,.5); }
.held-art img { width:100%; height:100%; object-fit:cover; display:block; }
.held-tx { min-width:0; flex:1 1 auto; color:#fff; }
.held-eyebrow { display:flex; align-items:center; gap:6px; font-size:11.5px; font-weight:700;
                letter-spacing:.8px; text-transform:uppercase; color:rgba(255,255,255,.75);
                white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.held-eyebrow ha-icon { --mdc-icon-size:16px; }
.held-titel { font-size:30px; font-weight:800; letter-spacing:-.5px; line-height:1.1; margin-top:8px;
              display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.held-sub { font-size:14px; color:rgba(255,255,255,.75); margin-top:6px;
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.held-knoppen { display:flex; gap:10px; margin-top:16px; align-items:center; }
.knop { display:inline-flex; align-items:center; gap:8px; height:46px; padding:0 22px; border-radius:999px;
        background:rgba(255,255,255,.14); color:#fff; font-size:15px; font-weight:700; }
.knop ha-icon { --mdc-icon-size:22px; }
.knop.hoofd { background:var(--grad); box-shadow:0 8px 22px var(--acc-glow); }
.knop.rond { width:46px; padding:0; justify-content:center; }
.ok-rij { flex:0 0 auto; min-width:0; }
.ok-kop { display:flex; align-items:center; gap:10px; margin-bottom:10px; min-height:36px; }
.ok-ic { width:32px; height:32px; border-radius:10px; display:flex; align-items:center; justify-content:center;
         background:var(--ov2); color:var(--acc); flex:0 0 auto; }
.ok-ic ha-icon { --mdc-icon-size:18px; }
.ok-titel { flex:1 1 auto; min-width:0; font-size:19px; font-weight:750; letter-spacing:-.2px;
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ok-titel small { display:block; font-size:12px; font-weight:500; color:var(--flauw); letter-spacing:0; }
.ok-nav { display:flex; gap:6px; flex:0 0 auto; }
.ok-nav button { width:36px; height:36px; border-radius:50%; background:var(--ov1); color:var(--zacht);
                 display:flex; align-items:center; justify-content:center; }
.ok-nav ha-icon { --mdc-icon-size:22px; }
.carrousel { --kw:150px; display:grid; grid-auto-flow:column; grid-auto-columns:var(--kw); gap:16px;
             overflow-x:auto; overflow-y:hidden; scroll-snap-type:x proximity; scrollbar-width:none;
             padding:2px 2px 6px; overscroll-behavior-x:contain; }
.carrousel::-webkit-scrollbar { display:none; }
.carrousel > .tile { scroll-snap-align:start; }
@container rechts (max-width: 600px) { .carrousel { --kw:118px; gap:12px; } .held-art { width:104px; height:104px; } .held-titel { font-size:22px; } }
@container rechts (min-width: 1000px) { .carrousel { --kw:176px; gap:20px; } .held-art { width:168px; height:168px; } }
@container rechts (min-width: 1300px) { .carrousel { --kw:204px; gap:22px; } .held-art { width:196px; height:196px; } .held-titel { font-size:38px; } }
.leeg-groot { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px;
              text-align:center; flex:1 1 auto; font-size:15px; padding:40px 20px; }
.leeg-groot ha-icon { --mdc-icon-size:48px; color:var(--acc); }
.leeg-groot .knop { color:var(--primary-text-color,#fff); background:var(--ov2); }

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
.volrow .vol-box { --vr-fill:var(--acc); --vr-rest:var(--ov2); --vr-on:var(--on-acc,#fff); }

/* ambient light: the current artwork, heavily blurred, tints the whole card */
.wrap { position:relative; isolation:isolate; }
.wrap::before { content:''; position:absolute; inset:-80px; z-index:-1; pointer-events:none;
                background-image:var(--art,none); background-size:cover; background-position:left center;
                filter:blur(70px) saturate(1.5); opacity:0; transition:opacity .6s ease; }
.wrap.met-art::before { opacity:.28; }
:host(.licht) .wrap.met-art::before { opacity:.18; }

/* tabs scroll sideways instead of being cut off; search stays visible on the right */
.tabrij { display:flex; align-items:flex-start; gap:8px; flex:0 0 auto; min-width:0; max-width:100%; }
.tabrij .chips { flex:1 1 auto; }
/* player column toggle */
.spelerknop { position:relative; flex:0 0 auto; width:46px; height:46px; border-radius:50%; overflow:hidden;
  display:flex; align-items:center; justify-content:center; background:var(--ov1); color:var(--zacht);
  box-shadow:inset 0 0 0 1px var(--line); }
.spelerknop ha-icon { --mdc-icon-size:24px; }
.spelerknop img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.spelerknop .knop-ic { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  background:rgba(0,0,0,.38); color:#fff; }
.spelerknop.dicht.speelt { box-shadow:0 0 0 2px var(--acc), 0 6px 16px var(--acc-glow, rgba(0,0,0,.3)); }
:host .wrap.sans-speler { grid-template-columns:minmax(0,1fr) !important; column-gap:0 !important; }
.wrap.sans-speler > .left, .wrap.sans-speler > .scheiding { display:none !important; }
.wrap.sans-speler > .right { animation:verbreed .3s ease; }
@keyframes verbreed { from { opacity:.4; } to { opacity:1; } }
.tabrij .chips.zoekchips { flex:0 0 auto; }
.chips { overflow-x:auto; overflow-y:hidden; scrollbar-width:none; }
.chips::-webkit-scrollbar { display:none; }
.chips button.ontdektab { display:flex; align-items:center; gap:6px; flex:0 0 auto; }
.chips button.ontdektab ha-icon { --mdc-icon-size:18px; }

.kop .kop-art { width:40px; height:40px; border-radius:8px; object-fit:cover; flex:0 0 auto;
                box-shadow:0 4px 12px rgba(0,0,0,.35); }
.kop .alles { display:flex; align-items:center; gap:4px; }
.kop .alles ha-icon { --mdc-icon-size:18px; }
.rij .nr { justify-self:center; font-size:12.5px; color:var(--flauw); font-variant-numeric:tabular-nums; }

/* Smaller than a 1024x600 panel - a phone, a narrow column, or the preview
   pane of the card editor. Zonder dit wordt de rechterkolom onleesbaar smal. */
@container kaart (max-width: 940px) {
  .wrap { grid-template-columns:250px 1px minmax(0,1fr); gap:14px; padding:14px; }
  .np .art, .np .leegart { width:140px; height:140px; }
  .np .glow { width:150px; height:150px; }
  .chips { gap:14px; }
}
@container kaart (max-width: 780px) {
  .wrap { grid-template-columns:210px 1px minmax(0,1fr); }
  .np .art, .np .leegart { width:118px; height:118px; }
  .np .ctr { gap:8px; }
  .kbd button { height:38px; font-size:15px; }
}
/* This width is the preview pane of the card editor. The card must keep its
   two columns here: the whole point of the preview is seeing the thing you are
   configuring, and a stacked version is not that thing. So squeeze rather than
   rearrange - a narrower left column, smaller artwork, tighter controls. */
@container kaart (max-width: 560px) {
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
}
/* Genuinely narrow - a phone in portrait, or a one-column dashboard. Two
   columns stop being readable here, so stack them. Never hide one: on the
   card's own dashboard that half is the reason the card exists. */
@container kaart (max-width: 400px) {
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
    this._ontdek = null;   // { sleutel, tijd, rows } of the discover feed
    this._ontdekBezig = null;
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
    const thema = KIOSK_THEMES.includes(config.theme) ? config.theme : 'sunset';
    if (this.dataset.kt !== thema) this.dataset.kt = thema;
    this._schermtoetsen = config.keyboard !== false;
    this._kbd = this._schermtoetsen;
    this._zones = null;
    // The player column starts as configured (show_player); the button in the
    // tab row toggles it for the session. A changed setting resets it.
    const spelerCfg = config.show_player !== false;
    if (this._spelerCfg !== spelerCfg) { this._spelerCfg = spelerCfg; this._spelerZichtbaar = spelerCfg; }
    const ontdekWas = this._discover;
    this._discover = config.discover !== false;
    if (ontdekWas === undefined || ontdekWas !== this._discover) {
      this._mode = this._discover ? 'ontdek' : 'home';
    }
  }

  // ---------- discover ----------
  // Music Assistant's own recommendation rows, fetched on behalf of the
  // selected music source so every person gets their own feed.
  _ontdekBron() {
    // 'spotify' is the former name of 'similar'.
    const bron = this._cfg.discover_source === 'spotify' ? 'similar' : this._cfg.discover_source;
    return ['similar', 'music_assistant', 'mixed'].includes(bron) ? bron : 'mixed';
  }

  _ontdekSleutel() { return `${this._cfg.config_entry_id}|${this._user() || ''}|${this._ontdekBron()}`; }

  // Fetches the feed in parts: Music Assistant's rows answer in a blink, the
  // similar-track lookups can take half a minute on a cold cache. Each part is
  // drawn as soon as it lands, so the tab never sits empty.
  _ontdekHaal(force) {
    if (!this._hass || !this._cfg || !this._discover) return Promise.resolve();
    const sleutel = this._ontdekSleutel();
    const c = this._ontdek;
    if (!force && c && c.sleutel === sleutel && (c.wacht.size || Date.now() - c.tijd < BIB_TTL)) {
      // The view may still show an older state (the card was rebuilt or
      // re-attached while an answer was on its way).
      if (this._mode === 'ontdek' && this._ontdekGetekend !== `${sleutel}|${c.versie}`) this._tekenRechts();
      return Promise.resolve();
    }
    const bron = this._ontdekBron();
    const delen = bron === 'mixed' ? ['similar', 'music_assistant'] : [bron];
    const nieuw = { sleutel, tijd: Date.now(), delen: {}, wacht: new Set(delen), rows: [], versie: 0 };
    this._ontdek = nieuw;
    const bronCfg = this._sourceCfg();
    const spotify = (bronCfg && bronCfg.spotify_entity) || this._cfg.spotify_entity;
    const samenstellen = () => {
      // Near-empty rows (a single "recently played" item) go last.
      const ma = (nieuw.delen.music_assistant || []).slice()
        .sort((a, b) => (a.items.length < 3) - (b.items.length < 3));
      nieuw.rows = [...(nieuw.delen.similar || []), ...ma];
      nieuw.versie++;
      if (this._ontdek === nieuw && this._mode === 'ontdek') this._tekenRechts();
    };
    return Promise.all(delen.map((deel) => {
      const data = {
        config_entry_id: this._cfg.config_entry_id,
        row_limit: 20,
        include_hidden: this._cfg.discover_hidden_rows !== false,
        source: deel,
      };
      if (this._user()) data.username = this._user();
      if (spotify && deel !== 'music_assistant') data.spotify_entity = spotify;
      if (force && deel !== 'music_assistant') data.refresh = true;
      return this._ws({
        type: 'call_service', domain: DOMAIN, service: 'get_recommendations',
        service_data: data, return_response: true,
      }).then((r) => {
        let rows = (r && r.response && r.response.rows) || [];
        // In mixed mode the Music Assistant rows come from their own request.
        if (bron === 'mixed' && deel === 'similar') rows = rows.filter((row) => row.source !== 'music_assistant');
        for (const row of rows) this._onthoudBeeld(row.items);
        nieuw.delen[deel] = rows;
      }).catch((error) => {
        nieuw.delen[deel] = [];
        if (this._ontdek === nieuw) this._fout(error);
      }).finally(() => {
        nieuw.wacht.delete(deel);
        if (!nieuw.wacht.size) nieuw.tijd = Date.now();
        samenstellen();
      });
    }));
  }
  _rijNaam(row) {
    const t = this._taal();
    if (row.translation_key === 'for_you') return t.voorJou;
    if (row.translation_key === 'because_you_listen' && row.seed) return t.omdat.replace('{x}', row.seed);
    const naam = String(row.name || '');
    const sleutel = String(row.translation_key || '').replace(/_/g, ' ').toLowerCase();
    return t.rijNamen[naam.toLowerCase()] || t.rijNamen[sleutel] || naam;
  }

  _ondertitel(it) {
    const t = this._taal();
    const soort = it.media_type || SOORT_VAN(it.uri);
    const type = t.type1[soort] || '';
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
    if (this._mode === 'ontdek') this._ontdekHaal();
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

  // Start a track from a list: it plays at once at the top of a new queue,
  // and the rest of the list (from the tapped track on, the ones before it
  // last) is appended by the integration in the background. Music Assistant
  // then moves through the queue by itself; nothing depends on the card.
  async _speelLijst(uris, start, el) {
    const schoon = (uris || []).filter(Boolean);
    if (!schoon.length) return;
    const username = this._user();
    const i = Math.max(0, Math.min(start || 0, schoon.length - 1));
    const rij = schoon.slice(i).concat(schoon.slice(0, i)).slice(0, 200);
    const speler = this._speler();
    if (el) el.classList.add('bezig');
    this._opt = { state: 'playing', tot: Date.now() + 8000 };
    this._vul = null;
    try {
      await this._voorbereiden();
      await this._startVolume();
      await this._call(DOMAIN, 'play_tracks', this._avecUser({ entity_id: speler, uris: rij }, username));
    } catch (e) {
      this._fout(e);
    } finally {
      if (el) el.classList.remove('bezig');
    }
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
      ? '' : `<style>${KIOSK_CSS}</style>`;
    this.shadowRoot.innerHTML = `<style>${STYLE}${VOL_CSS}</style>
      ${thema}
      <div class="wrap${this._spelerZichtbaar ? '' : ' sans-speler'}" style="--mc-h:${h};--zn:${this._zoneLijst().length}">
        <div class="col left">
          <div class="zones" id="zones"></div>
          ${this._sources.length
            ? `<div class="zones sources" id="sources" style="--zn:${this._sources.length}"></div>`
            : ''}
          <div class="np" id="np"></div>
          <div class="volrow">
            <button class="vk" data-vol="-1" aria-label="-">${svg('min')}</button>
            ${volHtml('Volume')}
            <button class="vk" data-vol="1" aria-label="+">${svg('plus')}</button>
            <div class="vollbl vol-label" id="vollbl"></div>
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
      this._toonVoortgang(); this._vulHoogte(); this._toonRail();
    }, 1000);
    if (vul) requestAnimationFrame(() => this._vulHoogte());
    if (!this._maatLuister) {
      this._maatLuister = () => this._vulHoogte();
      window.addEventListener('resize', this._maatLuister);
    }
    this.shadowRoot.addEventListener('click', (ev) => this._klik(ev));
    volBind(this.shadowRoot, {
      step: () => this._volStep(),
      send: (pct) => this._call('media_player', 'volume_set',
        { volume_level: Math.max(0, Math.min(1, pct / 100)) }, { entity_id: this._volEntity() })
        .catch((e) => this._fout(e)),
    });
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
    this._ontdek = null;
    this._ontdekBezig = null;
    this._res = [];
    this._det = [];
    this._detUri = '';
    this._detTitel = '';
    this._q = '';
    this._mode = this._discover ? 'ontdek' : 'home';
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
    else if (a === 'speler') {
      this._spelerZichtbaar = !this._spelerZichtbaar;
      const wrap = this.shadowRoot.querySelector('.wrap');
      if (wrap) wrap.classList.toggle('sans-speler', !this._spelerZichtbaar);
      this._tekenRechts();
    }
    else if (a === 'link') this._ganaar(((this._cfg.links || [])[i] || {}).path);
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
    else if (a === 'ontdek') { this._mode = 'ontdek'; this._tekenRechts(); this._ontdekHaal(); }
    else if (a === 'okvernieuw') { this._ontdekHaal(true); this._tekenRechts(); }
    else if (a === 'ok' || a === 'okspeel') {
      const row = ((this._ontdek && this._ontdek.rows) || [])[parseInt(t.dataset.r, 10)];
      const it = row && row.items[i];
      if (!it) return;
      const soort = it.media_type || SOORT_VAN(it.uri);
      if (soort === 'track') {
        // Queue the rest of the row too, so 'next' keeps discovering.
        const tracks = row.items.filter((x) => (x.media_type || SOORT_VAN(x.uri)) === 'track');
        this._speelLijst(tracks.map((x) => x.uri), tracks.indexOf(it), t);
      } else if (a === 'okspeel' || soort === 'radio') this._speel(it.uri, false, t);
      else this._open({ name: it.name, uri: it.uri }, t, 'ontdek');
    }
    else if (a === 'okrol') {
      const rij = this.shadowRoot.getElementById(`okrij${t.dataset.r}`);
      if (rij) rij.scrollBy({ left: parseInt(t.dataset.d, 10) * rij.clientWidth * 0.85, behavior: 'smooth' });
    }
    else if (a === 'tegelspeel') {
      const tl = this._tegelsVan(this._cats[this._cat])[i];
      if (tl) this._speel(tl.uri, tl.radio_mode, t);
    }
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
    else if (a === 'resspeel') {
      const it = this._res[i];
      if (it) this._speel(it.uri || it.media_content_id, false, t);
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
    // Redrawing the same view (a part of the feed arrived) keeps the scroll position.
    const weergave = `${this._mode}|${this._cat}`;
    const vorig = el.querySelector('.vlak');
    const top = vorig && this._weergave === weergave ? vorig.scrollTop : 0;
    this._weergave = weergave;
    if (this._mode === 'ontdek' && this._discover) el.innerHTML = this._ontdekHtml();
    else if (this._mode === 'home' || this._mode === 'ontdek') el.innerHTML = this._homeHtml();
    else if (this._mode === 'detail') el.innerHTML = this._detailHtml();
    else el.innerHTML = this._zoekHtml();
    if (top) { const nu = el.querySelector('.vlak'); if (nu) nu.scrollTop = top; }
    requestAnimationFrame(() => this._toonRail());
  }

  // One tile: square cover (round for an artist), a play button on the cover
  // and two lines of text underneath. Every grid and carousel uses this.
  _tegelHtml({ act, speelAct, i, r, uri, naam, sub, beeld, icon }) {
    const soort = SOORT_VAN(uri);
    const ic = `<div class="ic">${svg(icon || (soort === 'radio' ? 'radio' : soort === 'artist' ? 'artiest' : 'muziek'))}</div>`;
    // An image that will not load (a site that refuses hotlinking, a dead
    // link) falls back to the icon instead of leaving a broken picture.
    const img = beeld
      ? `<img loading="lazy" alt="" src="${esc(GROOT(beeld))}" onerror="this.outerHTML=this.nextElementSibling.innerHTML"><template>${ic}</template>`
      : ic;
    const data = `data-i="${i}"${r != null ? ` data-r="${r}"` : ''}`;
    const speel = speelAct
      ? `<span class="speel" data-act="${speelAct}" ${data} title="${esc(this._taal().luister)}">${svg('play')}</span>`
      : '';
    return `<button class="tile${soort === 'artist' ? ' rond' : ''}" data-act="${act}" ${data}>
      <div class="cover">${img}${speel}</div>
      <div class="tt">${esc(naam)}</div>${sub ? `<div class="st">${esc(sub)}</div>` : ''}</button>`;
  }

  _skeletHtml(aantal, carrousel) {
    const kaart = '<div class="tile skelet"><div class="cover"></div><div class="tt"></div><div class="st"></div></div>';
    const n = Array.from({ length: aantal }, () => kaart).join('');
    return carrousel ? `<div class="carrousel">${n}</div>` : `<div class="tiles">${n}</div>`;
  }

  _homeHtml() {
    const cats = this._cats;
    const chips = this._tabsHtml();
    if (!cats.length) return chips + `<div class="leeg">${this._taal().geenCats}</div>`;
    const cat = cats[this._cat] || {};
    const lijst = this._tegelsVan(cat);
    // A source category has nothing to show until its fetch lands: show the
    // shape of what is coming rather than an empty grid.
    if (cat.source && !lijst.length) {
      const c = this._bron[this._bronSleutel(cat.source)];
      return chips + (c ? `<div class="leeg">${this._taal().geenResultaat}</div>`
        : this._scrollbox(`<div class="vlak">${this._skeletHtml(10)}</div>`));
    }
    const tiles = lijst.map((t, i) => this._tegelHtml({
      act: 'tegel', speelAct: 'tegelspeel', i, uri: t.uri, naam: t.name,
      sub: t.recommendation_reason || this._ondertitel({ uri: t.uri }),
      beeld: this._tegelBeeld(t), icon: t.icon,
    })).join('');
    return chips + this._scrollbox(`<div class="tiles vlak">${tiles}</div>`);
  }

  // The discover feed: a featured pick on top, then one carousel per
  // Music Assistant recommendation row.
  _ontdekHtml() {
    const t = this._taal();
    const chips = this._tabsHtml();
    const c = this._ontdek && this._ontdek.sleutel === this._ontdekSleutel() ? this._ontdek : null;
    this._ontdekGetekend = c ? `${c.sleutel}|${c.versie}` : null;
    const skeletRij = (titel) => `<section class="ok-rij"><div class="ok-kop">${titel
      ? `<span class="ok-ic">${svg('ontdek')}</span><div class="ok-titel">${esc(titel)}<small class="laden">${esc(t.zoektVoorJou)}</small></div>`
      : '<div class="ok-titel skelet-txt"></div>'}</div>${this._skeletHtml(8, true)}</section>`;
    if (!c || (!c.rows.length && c.wacht.size)) {
      return chips + this._scrollbox(`<div class="ontdek vlak"><div class="held skelet"></div>${skeletRij(c && c.wacht.has('similar') ? t.voorJou : '')}${skeletRij('')}</div>`);
    }
    // The recommendations are still on their way: hold their place on top.
    const wachtOpSimilar = c.wacht.has('similar');
    if (!c.rows.length) {
      return chips + `<div class="leeg leeg-groot">${svg('ontdek')}<div>${esc(t.ontdekLeeg)}</div>
        <button class="knop" data-act="okvernieuw">${svg('vernieuw')} ${esc(t.opnieuw)}</button></div>`;
    }
    let held = '';
    let heldR = -1;
    let heldI = -1;
    // Feature something from a full row rather than the single item of
    // "recently played": the first recommended track, else an album or playlist.
    const kandidaat = (row) => row.items.findIndex((it) => VEILIG(it.image)
      && ((row.source && row.source !== 'music_assistant')
        || ['album', 'playlist'].includes(it.media_type || SOORT_VAN(it.uri))));
    for (const minimum of [3, 1]) {
      for (let r = 0; r < c.rows.length && heldR < 0; r++) {
        if (c.rows[r].items.length < minimum) continue;
        const i = kandidaat(c.rows[r]);
        if (i >= 0) { heldR = r; heldI = i; }
      }
    }
    if (wachtOpSimilar) held = '<div class="held skelet"></div>';
    else if (heldR >= 0) {
      const it = c.rows[heldR].items[heldI];
      const beeld = esc(GROOT(VEILIG(it.image)));
      held = `<div class="held">
        <div class="held-bg" style="background-image:url('${beeld}')"></div>
        <button class="held-art" data-act="ok" data-r="${heldR}" data-i="${heldI}"><img alt="" src="${beeld}"></button>
        <div class="held-tx">
          <div class="held-eyebrow">${svg('ontdek')} ${esc(t.ontdekKop)} · ${esc(this._rijNaam(c.rows[heldR]))}</div>
          <div class="held-titel">${esc(it.name)}</div>
          <div class="held-sub">${esc(this._ondertitel(it))}</div>
          <div class="held-knoppen">
            <button class="knop hoofd" data-act="okspeel" data-r="${heldR}" data-i="${heldI}">${svg('play')} ${esc(t.luister)}</button>
            <button class="knop rond" data-act="okvernieuw" title="${esc(t.opnieuw)}">${svg('vernieuw')}</button>
          </div>
        </div></div>`;
    }
    const pijlen = this._cfg.arrows !== false;
    const rijen = c.rows.map((row, r) => {
      const kaarten = row.items.map((it, i) => this._tegelHtml({
        act: 'ok', speelAct: 'okspeel', i, r, uri: it.uri, naam: it.name,
        sub: this._ondertitel(it), beeld: VEILIG(it.image),
      })).join('');
      const nav = pijlen && row.items.length > 3 ? `<div class="ok-nav">
          <button data-act="okrol" data-r="${r}" data-d="-1">${svg('links')}</button>
          <button data-act="okrol" data-r="${r}" data-d="1">${svg('rechts')}</button></div>` : '';
      // Music Assistant sends icons as 'mdi-name' and subtitles in English only.
      const icoon = String(row.icon || '').replace(/^mdi[-:]/, '');
      const engels = String(this._cfg.language || (this._hass && this._hass.language) || 'en').startsWith('en');
      const sub = engels && row.subtitle ? `<small>${esc(row.subtitle)}</small>` : '';
      return `<section class="ok-rij">
        <div class="ok-kop">
          ${icoon ? `<span class="ok-ic">${svg(`mdi:${icoon}`)}</span>` : ''}
          <div class="ok-titel">${esc(this._rijNaam(row))}${sub}</div>
          ${nav}
        </div>
        <div class="carrousel" id="okrij${r}">${kaarten}</div></section>`;
    }).join('');
    const voorlopig = wachtOpSimilar ? skeletRij(t.voorJou) : '';
    return chips + this._scrollbox(`<div class="ontdek vlak">${held}${voorlopig}${rijen}</div>`);
  }

  // Shows or hides the player column. While hidden it carries the current
  // cover, so what is playing stays in sight.
  _spelerKnopHtml() {
    const t = this._taal();
    const label = this._spelerZichtbaar ? t.spelerVerbergen : t.spelerTonen;
    const art = !this._spelerZichtbaar && this._knopArt
      ? `<img alt="" src="${esc(this._knopArt)}"><span class="knop-ic">${svg('mdi:chevron-right')}</span>`
      : svg(this._spelerZichtbaar ? 'mdi:chevron-left' : 'mdi:play-box-outline');
    return `<button class="spelerknop${this._spelerZichtbaar ? '' : ' dicht'}${this._knopSpeelt ? ' speelt' : ''}"
      data-act="speler" title="${esc(label)}" aria-label="${esc(label)}" aria-pressed="${!this._spelerZichtbaar}">${art}</button>`;
  }

  // The tabs: discover first, then the categories, the search button last.
  _tabsHtml() {
    const t = this._taal();
    const ontdek = this._discover
      ? `<button class="ontdektab${this._mode === 'ontdek' ? ' on' : ''}" data-act="ontdek">${svg('ontdek')}<span>${esc(t.ontdek)}</span></button>`
      : '';
    const tabs = this._cats.map((c, i) =>
      `<button class="${this._mode === 'home' && i === this._cat ? 'on' : ''}" data-act="cat" data-i="${i}">${esc(c.name)}</button>`).join('');
    return `<div class="tabrij">${this._spelerKnopHtml()}<div class="chips">${ontdek}${tabs}</div>
      <div class="chips zoekchips"><button class="zoektab${this._mode === 'zoek' ? ' on' : ''}" data-act="naarzoek"
              title="${esc(t.zoek)}">${svg('zoek')}</button></div></div>`;
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
      return this._tegelHtml({
        act: 'res', speelAct: 'resspeel', i, uri: it.uri || it.media_content_id,
        naam: it.name, sub: art || this._ondertitel({ uri: it.uri }), beeld: VEILIG(it.image),
      });
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
    const hoes = VEILIG(this._beeld[this._detUri]);
    const kop = `<div class="kop">
      <button class="terug" data-act="terug">${svg('terug')} ${this._terug === 'zoek' ? t.resultaten : t.terug}</button>
      ${hoes ? `<img class="kop-art" alt="" src="${esc(KLEIN(hoes))}">` : ''}
      <div class="titel">${esc(this._detTitel)}${telling}</div>
      <button class="alles" data-act="alles">${svg('play')} ${t.speelAlles}</button></div>`;
    if (this._bezig) return kop + `<div class="leeg">${t.bezigOphalen}</div>`;
    if (!n) return kop + `<div class="leeg">${t.geenNummers}</div>`;
    const rijen = this._det.map((d, i) => {
      const img = d.thumbnail ? `<img loading="lazy" src="${esc(KLEIN(d.thumbnail))}">` : `<span class="nr">${i + 1}</span>`;
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
    volShow(sr, vol * 100, this._volMax());

    const s = this._st(ent);
    const np = sr.getElementById('np');
    const a = this._metaLater(ent, (s && s.attributes) || {});
    const pic = a.entity_picture_local || a.entity_picture || '';
    const knopArt = VEILIG(pic);
    const knopSpeelt = !!(s && s.state === 'playing');
    if (knopArt.replace(/([?&])(token|cache)=[^&]*/g, '$1') !== (this._knopArt || '').replace(/([?&])(token|cache)=[^&]*/g, '$1')
      || knopSpeelt !== this._knopSpeelt) {
      this._knopArt = knopArt;
      this._knopSpeelt = knopSpeelt;
      const knop = sr.querySelector('.spelerknop');
      if (knop) knop.outerHTML = this._spelerKnopHtml();
    }
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
      pic.replace(/([?&])(token|cache)=[^&]*/g, '$1'), a.shuffle, a.repeat, a.media_duration].join('|');
    if (sig === this._npSig) { this._toonVoortgang(); return; }
    this._npSig = sig;
    // Speelt het ergens anders dan op de gekozen zone? Laat zien waar.
    const elders = (ent && ent !== eigen && s && SPEELT.includes(s.state))
      ? `<div class="op">${t.speeltOp} ${esc(a.friendly_name || ent)}</div>` : '';
    const duur = parseInt(a.media_duration, 10) || 0;
    const wrap = sr.querySelector('.wrap');
    if (wrap) {
      const veilig = VEILIG(pic);
      wrap.style.setProperty('--art', veilig ? `url("${veilig.replace(/["\\\n\r]/g, '')}")` : 'none');
      wrap.classList.toggle('met-art', !!veilig);
    }
    np.innerHTML = `
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

// Kiosk theme of the browser card, injected inline (no stylesheet request).
// Generated from the former kiosk-theme.css; colours come from the theme variables below.
export const KIOSK_THEMES = ["sunset","spotify","ocean","aurora","neon","ember","graphite","daylight"];

export const THEME_COLORS = {
  "sunset": {
    "acc": "#f6b26b",
    "acc2": "#e5739b",
    "onAcc": "#fff"
  },
  "spotify": {
    "acc": "#1ed760",
    "acc2": "#1db954",
    "onAcc": "#06120a"
  },
  "ocean": {
    "acc": "#38bdf8",
    "acc2": "#6366f1",
    "onAcc": "#fff"
  },
  "aurora": {
    "acc": "#34d399",
    "acc2": "#a78bfa",
    "onAcc": "#fff"
  },
  "neon": {
    "acc": "#f472b6",
    "acc2": "#8b5cf6",
    "onAcc": "#fff"
  },
  "ember": {
    "acc": "#fbbf24",
    "acc2": "#ef4444",
    "onAcc": "#fff"
  },
  "graphite": {
    "acc": "#f4f4f5",
    "acc2": "#a1a1aa",
    "onAcc": "#18181b"
  },
  "daylight": {
    "acc": "#2563eb",
    "acc2": "#7c3aed",
    "onAcc": "#fff"
  }
};

export const KIOSK_CSS = `
:host{--acc:#f6b26b;--acc2:#e5739b;--grad:linear-gradient(135deg,#f6b26b,#e5739b);--grad-h:linear-gradient(90deg,#f6b26b,#e5739b);--acc-soft:linear-gradient(135deg,rgba(246,178,107,0.34),rgba(229,115,155,0.26));--acc-line:rgba(246,178,107,0.6);--acc-glow:rgba(229,115,155,.40);--on-acc:#fff;--surface:rgba(14,24,32,.66);--sheen:radial-gradient(90% 70% at 100% 0%,rgba(229,115,155,0.16),transparent 60%),radial-gradient(70% 60% at 0% 100%,rgba(246,178,107,0.12),transparent 60%),linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,.01));--shadow:0 20px 50px rgba(0,0,0,0.35);--txt:#fff;--primary-text-color:#fff;--ov1:rgba(255,255,255,0.06);--ov2:rgba(255,255,255,0.12);--line:rgba(255,255,255,0.09);--muted:rgba(255,255,255,0.8);--subtle:rgba(255,255,255,0.52);--knob:#fff;--art-opacity:.28}
:host([data-kt="spotify"]){--acc:#1ed760;--acc2:#1db954;--grad:linear-gradient(135deg,#1ed760,#1db954);--grad-h:linear-gradient(90deg,#1ed760,#1db954);--acc-soft:linear-gradient(135deg,rgba(30,215,96,0.34),rgba(29,185,84,0.26));--acc-line:rgba(30,215,96,0.6);--acc-glow:rgba(30,215,96,.30);--on-acc:#06120a;--surface:rgba(18,18,18,.92);--sheen:radial-gradient(90% 70% at 100% 0%,rgba(29,185,84,0.16),transparent 60%),radial-gradient(70% 60% at 0% 100%,rgba(30,215,96,0.12),transparent 60%),linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,.01));--shadow:0 20px 50px rgba(0,0,0,0.35);--txt:#fff;--primary-text-color:#fff;--ov1:rgba(255,255,255,0.06);--ov2:rgba(255,255,255,0.12);--line:rgba(255,255,255,0.09);--muted:rgba(255,255,255,0.8);--subtle:rgba(255,255,255,0.52);--knob:#fff;--art-opacity:.28}
:host([data-kt="ocean"]){--acc:#38bdf8;--acc2:#6366f1;--grad:linear-gradient(135deg,#38bdf8,#6366f1);--grad-h:linear-gradient(90deg,#38bdf8,#6366f1);--acc-soft:linear-gradient(135deg,rgba(56,189,248,0.34),rgba(99,102,241,0.26));--acc-line:rgba(56,189,248,0.6);--acc-glow:rgba(56,189,248,.35);--on-acc:#fff;--surface:rgba(7,20,42,.80);--sheen:radial-gradient(90% 70% at 100% 0%,rgba(99,102,241,0.16),transparent 60%),radial-gradient(70% 60% at 0% 100%,rgba(56,189,248,0.12),transparent 60%),linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,.01));--shadow:0 20px 50px rgba(0,0,0,0.35);--txt:#fff;--primary-text-color:#fff;--ov1:rgba(255,255,255,0.06);--ov2:rgba(255,255,255,0.12);--line:rgba(255,255,255,0.09);--muted:rgba(255,255,255,0.8);--subtle:rgba(255,255,255,0.52);--knob:#fff;--art-opacity:.28}
:host([data-kt="aurora"]){--acc:#34d399;--acc2:#a78bfa;--grad:linear-gradient(135deg,#34d399,#a78bfa);--grad-h:linear-gradient(90deg,#34d399,#a78bfa);--acc-soft:linear-gradient(135deg,rgba(52,211,153,0.34),rgba(167,139,250,0.26));--acc-line:rgba(52,211,153,0.6);--acc-glow:rgba(52,211,153,.32);--on-acc:#fff;--surface:rgba(9,24,30,.78);--sheen:radial-gradient(90% 70% at 100% 0%,rgba(167,139,250,0.16),transparent 60%),radial-gradient(70% 60% at 0% 100%,rgba(52,211,153,0.12),transparent 60%),linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,.01));--shadow:0 20px 50px rgba(0,0,0,0.35);--txt:#fff;--primary-text-color:#fff;--ov1:rgba(255,255,255,0.06);--ov2:rgba(255,255,255,0.12);--line:rgba(255,255,255,0.09);--muted:rgba(255,255,255,0.8);--subtle:rgba(255,255,255,0.52);--knob:#fff;--art-opacity:.28}
:host([data-kt="neon"]){--acc:#f472b6;--acc2:#8b5cf6;--grad:linear-gradient(135deg,#f472b6,#8b5cf6);--grad-h:linear-gradient(90deg,#f472b6,#8b5cf6);--acc-soft:linear-gradient(135deg,rgba(244,114,182,0.34),rgba(139,92,246,0.26));--acc-line:rgba(244,114,182,0.6);--acc-glow:rgba(244,114,182,.50);--on-acc:#fff;--surface:rgba(12,7,26,.88);--sheen:radial-gradient(90% 70% at 100% 0%,rgba(139,92,246,0.16),transparent 60%),radial-gradient(70% 60% at 0% 100%,rgba(244,114,182,0.12),transparent 60%),linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,.01));--shadow:0 20px 50px rgba(0,0,0,0.35);--txt:#fff;--primary-text-color:#fff;--ov1:rgba(255,255,255,0.06);--ov2:rgba(255,255,255,0.12);--line:rgba(255,255,255,0.09);--muted:rgba(255,255,255,0.8);--subtle:rgba(255,255,255,0.52);--knob:#fff;--art-opacity:.38}
:host([data-kt="ember"]){--acc:#fbbf24;--acc2:#ef4444;--grad:linear-gradient(135deg,#fbbf24,#ef4444);--grad-h:linear-gradient(90deg,#fbbf24,#ef4444);--acc-soft:linear-gradient(135deg,rgba(251,191,36,0.34),rgba(239,68,68,0.26));--acc-line:rgba(251,191,36,0.6);--acc-glow:rgba(239,68,68,.38);--on-acc:#fff;--surface:rgba(30,14,10,.82);--sheen:radial-gradient(90% 70% at 100% 0%,rgba(239,68,68,0.16),transparent 60%),radial-gradient(70% 60% at 0% 100%,rgba(251,191,36,0.12),transparent 60%),linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,.01));--shadow:0 20px 50px rgba(0,0,0,0.35);--txt:#fff;--primary-text-color:#fff;--ov1:rgba(255,255,255,0.06);--ov2:rgba(255,255,255,0.12);--line:rgba(255,255,255,0.09);--muted:rgba(255,255,255,0.8);--subtle:rgba(255,255,255,0.52);--knob:#fff;--art-opacity:.28}
:host([data-kt="graphite"]){--acc:#f4f4f5;--acc2:#a1a1aa;--grad:linear-gradient(135deg,#f4f4f5,#a1a1aa);--grad-h:linear-gradient(90deg,#f4f4f5,#a1a1aa);--acc-soft:linear-gradient(135deg,rgba(244,244,245,0.34),rgba(161,161,170,0.26));--acc-line:rgba(244,244,245,0.6);--acc-glow:rgba(255,255,255,.14);--on-acc:#18181b;--surface:rgba(24,24,27,.92);--sheen:radial-gradient(90% 70% at 100% 0%,rgba(161,161,170,0.16),transparent 60%),radial-gradient(70% 60% at 0% 100%,rgba(244,244,245,0.12),transparent 60%),linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,.01));--shadow:0 20px 50px rgba(0,0,0,0.35);--txt:#fff;--primary-text-color:#fff;--ov1:rgba(255,255,255,0.06);--ov2:rgba(255,255,255,0.12);--line:rgba(255,255,255,0.09);--muted:rgba(255,255,255,0.8);--subtle:rgba(255,255,255,0.52);--knob:#fff;--art-opacity:.16}
:host([data-kt="daylight"]){--acc:#2563eb;--acc2:#7c3aed;--grad:linear-gradient(135deg,#2563eb,#7c3aed);--grad-h:linear-gradient(90deg,#2563eb,#7c3aed);--acc-soft:linear-gradient(135deg,rgba(37,99,235,0.16),rgba(124,58,237,0.12));--acc-line:rgba(37,99,235,0.6);--acc-glow:rgba(37,99,235,.28);--on-acc:#fff;--surface:rgba(250,250,252,.94);--sheen:radial-gradient(90% 70% at 100% 0%,rgba(124,58,237,0.1),transparent 60%),radial-gradient(70% 60% at 0% 100%,rgba(37,99,235,0.08),transparent 60%),linear-gradient(160deg,rgba(0,0,0,0.02),rgba(0,0,0,.01));--shadow:0 20px 50px rgba(0,0,0,0.12);--txt:#111827;--primary-text-color:#111827;--ov1:rgba(0,0,0,0.05);--ov2:rgba(0,0,0,0.09);--line:rgba(0,0,0,0.1);--muted:rgba(0,0,0,0.72);--subtle:rgba(0,0,0,0.5);--knob:#fff;--art-opacity:.14}
:host{display:block!important;width:100%!important;max-width:none!important;flex:1 1 100%!important}
.wrap{grid-template-columns:320px 1px minmax(0,1fr)!important;gap:18px!important;padding:18px 20px!important;border-radius:26px!important;background-color:var(--surface)!important;background-image:var(--sheen)!important;border:1px solid var(--line);box-shadow:inset 0 1px 0 var(--ov1),var(--shadow)}
.divider{background:linear-gradient(180deg,transparent,var(--line),transparent)!important}
.zones{gap:6px!important;padding:5px!important;border-radius:18px!important;background:var(--ov1)!important}
.zones button{height:60px!important;flex-direction:column!important;gap:4px;padding:0 8px!important;border-radius:14px!important;color:var(--subtle)!important;min-width:0}
.zones button::after{content:attr(title);max-width:100%;overflow:hidden;font-size:13px;font-weight:650;line-height:1.15;text-overflow:ellipsis;white-space:nowrap}
.zones ha-icon{--mdc-icon-size:22px}
.zones button.on{color:var(--txt)!important;background:var(--acc-soft)!important;box-shadow:inset 0 0 0 1px var(--acc-line)}
.now-playing{justify-content:space-evenly!important;padding:8px 0 0!important}
.now-playing .art,.now-playing .empty-art{width:210px!important;height:210px!important;border-radius:20px!important;box-shadow:0 16px 36px rgba(0,0,0,.5)!important}
.now-playing .tx{padding-top:10px!important}
.now-playing .tx .t{font-size:21px!important;font-weight:700!important}
.now-playing .tx .a{font-size:14px!important}
.now-playing .progress{padding-top:8px!important}
.now-playing .progress-track{height:5px!important}
.now-playing .progress-fill{background:var(--grad-h)!important}
.now-playing .time-label{font-size:13px!important}
.now-playing .ctr{gap:10px!important;margin-top:12px!important}
.now-playing .ctr button{width:56px!important;height:56px!important;border-radius:50%!important;background:var(--ov1)!important;color:var(--muted)!important}
.now-playing .ctr button.shuf,.now-playing .ctr button.rep{width:46px!important;height:46px!important;background:transparent!important}
.now-playing .ctr button ha-icon{--mdc-icon-size:28px}
.now-playing .ctr button.primary{width:80px!important;height:80px!important;color:var(--on-acc)!important;background:var(--grad)!important;box-shadow:0 10px 26px var(--acc-glow)}
.now-playing .ctr button.primary ha-icon{--mdc-icon-size:40px}
.volume-row{gap:10px!important;margin-top:14px!important;padding:8px!important;border-radius:20px!important;background:var(--ov1)!important}
.volume-row>button.vk{width:58px!important;height:58px!important;border-radius:50%!important;color:var(--on-acc)!important;background:var(--grad)!important;box-shadow:0 6px 18px var(--acc-glow)}
.volume-row>button.vk ha-icon,.volume-row>button.vk svg{--mdc-icon-size:30px;width:30px;height:30px}
.volume-row>button.slider{height:58px!important}
.slider .baan,.slider .fill{height:10px!important}
.slider .fill{background:var(--grad-h)!important}
.slider .button{width:30px!important;height:30px!important;margin-left:-15px!important;box-shadow:0 2px 10px rgba(0,0,0,.5)!important}
.volume-row .volume-label{min-width:44px!important;font-size:15px!important;color:var(--txt)!important}
.chips{gap:6px!important;padding-bottom:8px!important;border-bottom:0!important}
.chips button{height:46px!important;padding:0 12px!important;flex:0 0 auto!important;overflow:visible!important;text-overflow:clip!important;letter-spacing:0;margin-bottom:0!important;border:1px solid var(--line)!important;border-radius:999px!important;background:var(--ov1)!important;color:var(--muted)!important;font-size:14.5px!important;font-weight:650!important;min-width:0}
.chips button.on{color:var(--on-acc)!important;border-color:transparent!important;background:var(--grad)!important;box-shadow:0 6px 18px var(--acc-glow)}
.chips button.search-tab{width:44px!important;margin-left:0!important;padding:0!important;justify-content:center}
.header{height:52px!important;border-bottom:0!important}
.header .title{font-size:20px!important;font-weight:700!important}
.header .back{height:40px;padding:0 14px;border-radius:999px;background:var(--ov1);font-size:14px!important;color:var(--muted)!important}
.header .play-all-button{height:36px!important;padding:0 18px!important;background:var(--grad)!important;font-size:12.5px!important}
.tile .cover{border-radius:16px;box-shadow:0 12px 28px rgba(0,0,0,.42)}
.tile.round .cover{border-radius:50%}
.tile .tt{font-size:14.5px}
.tile .subtitle{font-size:12.5px}
.chips button.discover-tab{padding:0 16px!important}
.list{gap:4px}
.row{height:58px!important;border-bottom:0!important;border-radius:12px;padding-right:6px;grid-template-columns:58px minmax(0,1fr) auto!important}
.row:nth-child(odd){background:var(--ov1)}
.row img{width:42px!important;height:42px!important;border-radius:8px!important}
.row .tx{font-size:15px!important}
.row .duration{font-size:13px!important}
.header .header-art{width:46px;height:46px;border-radius:10px}
.qbar{height:54px!important;padding:0 6px 0 14px;border-radius:999px;border-bottom:0!important;background:var(--ov1);grid-template-columns:30px minmax(0,1fr) auto!important}
.qbar .kb{height:40px!important;padding:0 18px!important;background:var(--grad)!important;font-size:12.5px!important}
.kbd button{height:52px!important;border-radius:12px!important;background:var(--ov2)!important;font-size:19px!important}
.kbd .num button{height:42px!important;font-size:16px!important}
.kbd .go{background:var(--grad)!important}
.arrows button{border-radius:14px!important;background:var(--ov1)!important}
.featured{border-radius:24px}

.chips button{font-size:13.5px!important}
:host(.kiosk-edit) .wrap{height:calc(var(--card-height,556px) - 72px)!important}
.wrap{grid-template-rows:minmax(0,1fr)!important}
.col{min-height:0!important}
.now-playing{overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain;scrollbar-width:thin}
.wrap[data-height-mode="compact"]{gap:14px!important;padding:14px!important}
.wrap[data-height-mode="compact"] .zones button{height:52px!important}
.wrap[data-height-mode="compact"] .now-playing{justify-content:flex-start!important;padding:4px 0!important}
.wrap[data-height-mode="compact"] .now-playing .art,.wrap[data-height-mode="compact"] .now-playing .empty-art{width:158px!important;height:158px!important}
.wrap[data-height-mode="compact"] .now-playing .tx{padding-top:6px!important}
.wrap[data-height-mode="compact"] .now-playing .t{font-size:18px!important}
.wrap[data-height-mode="compact"] .now-playing .a{font-size:13px!important}
.wrap[data-height-mode="compact"] .now-playing .status-label{margin-top:4px!important}
.wrap[data-height-mode="compact"] .now-playing .progress{padding-top:6px!important}
.wrap[data-height-mode="compact"] .now-playing .ctr{gap:8px!important;margin-top:8px!important}
.wrap[data-height-mode="compact"] .now-playing .ctr button{width:44px!important;height:44px!important}
.wrap[data-height-mode="compact"] .now-playing .ctr button.primary{width:64px!important;height:64px!important}
.wrap[data-height-mode="compact"] .now-playing .ctr button.primary ha-icon{--mdc-icon-size:32px}
.wrap[data-height-mode="compact"] .now-playing .ctr ha-icon{--mdc-icon-size:22px}
.wrap[data-height-mode="compact"] .volume-row{gap:8px!important;margin-top:8px!important;padding:6px!important}
.wrap[data-height-mode="compact"] .volume-row>button.vk{width:44px!important;height:44px!important}
.wrap[data-height-mode="compact"] .volume-row>button.slider{height:44px!important}
.wrap[data-height-mode="compact"] .slider .baan,.wrap[data-height-mode="compact"] .slider .fill{height:8px!important}
.wrap[data-height-mode="compact"] .slider .button{width:22px!important;height:22px!important;margin-left:-11px!important}
.wrap[data-height-mode="compact"] .volume-row .volume-label{min-width:38px!important;font-size:13px!important}
.wrap[data-height-mode="tight"],.wrap[data-height-mode="short"]{gap:10px!important;padding:9px 11px!important}
.wrap[data-height-mode="tight"] .zones button,.wrap[data-height-mode="short"] .zones button{height:44px!important}
.wrap[data-height-mode="tight"] .now-playing .art,.wrap[data-height-mode="tight"] .now-playing .empty-art{width:120px!important;height:120px!important}
.wrap[data-height-mode="tight"] .now-playing .tx,.wrap[data-height-mode="short"] .now-playing .tx{padding-top:4px!important}
.wrap[data-height-mode="tight"] .now-playing .t{font-size:16px!important}
.wrap[data-height-mode="tight"] .now-playing .a{font-size:12px!important}
.wrap[data-height-mode="tight"] .now-playing .progress{padding-top:4px!important}
.wrap[data-height-mode="tight"] .now-playing .ctr{gap:5px!important;margin-top:6px!important}
.wrap[data-height-mode="tight"] .now-playing .ctr button{width:38px!important;height:38px!important}
.wrap[data-height-mode="tight"] .now-playing .ctr button.primary{width:52px!important;height:52px!important}
.wrap[data-height-mode="tight"] .now-playing .ctr button.primary ha-icon{--mdc-icon-size:26px}
.wrap[data-height-mode="tight"] .now-playing .ctr ha-icon{--mdc-icon-size:20px}
.wrap[data-height-mode="tight"] .volume-row,.wrap[data-height-mode="short"] .volume-row{gap:5px!important;margin-top:6px!important;padding:4px!important}
.wrap[data-height-mode="tight"] .volume-row>button.vk,.wrap[data-height-mode="tight"] .volume-row>button.slider{width:40px!important;height:40px!important}
.wrap[data-height-mode="tight"] .volume-row>button.slider{width:auto!important}
.wrap[data-height-mode="tight"] .volume-row .volume-label{min-width:32px!important;font-size:12px!important}
.wrap[data-height-mode="tight"] .slider .baan,.wrap[data-height-mode="tight"] .slider .fill{height:6px!important}
.wrap[data-height-mode="tight"] .slider .button{width:18px!important;height:18px!important;margin-left:-9px!important}
.wrap[data-height-mode="tight"] .col.left,.wrap[data-height-mode="short"] .col.left{overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain;scrollbar-width:thin}
.wrap[data-height-mode="tight"] .now-playing,.wrap[data-height-mode="short"] .now-playing{flex:0 0 auto!important;overflow:visible!important}
.wrap[data-height-mode="short"]{gap:8px!important;padding:6px 8px!important}
.wrap[data-height-mode="short"] .zones button{height:38px!important}
.wrap[data-height-mode="short"] .zones ha-icon{--mdc-icon-size:17px}
.wrap[data-height-mode="short"] .now-playing .art,.wrap[data-height-mode="short"] .now-playing .empty-art{width:92px!important;height:92px!important}
.wrap[data-height-mode="short"] .now-playing .t{font-size:15px!important}
.wrap[data-height-mode="short"] .now-playing .a{font-size:11px!important}
.wrap[data-height-mode="short"] .now-playing .status-label{margin-top:3px!important}
.wrap[data-height-mode="short"] .now-playing .progress{padding-top:3px!important}
.wrap[data-height-mode="short"] .now-playing .ctr{gap:4px!important;margin-top:5px!important}
.wrap[data-height-mode="short"] .now-playing .ctr button{width:34px!important;height:34px!important}
.wrap[data-height-mode="short"] .now-playing .ctr button.primary{width:44px!important;height:44px!important}
.wrap[data-height-mode="short"] .now-playing .ctr button.primary ha-icon{--mdc-icon-size:22px}
.wrap[data-height-mode="short"] .now-playing .ctr ha-icon{--mdc-icon-size:18px}
.wrap[data-height-mode="short"] .volume-row>button.vk,.wrap[data-height-mode="short"] .volume-row>button.slider{width:34px!important;height:34px!important}
.wrap[data-height-mode="short"] .volume-row>button.slider{width:auto!important}
.wrap[data-height-mode="short"] .volume-row .volume-label{min-width:28px!important;font-size:11px!important}
.wrap[data-height-mode="short"] .slider .baan,.wrap[data-height-mode="short"] .slider .fill{height:5px!important}
.wrap[data-height-mode="short"] .slider .button{width:16px!important;height:16px!important;margin-left:-8px!important}
.wrap{color:var(--txt)!important}
.qbar .kb,.header .play-all-button,.kbd .go,.button.primary,.tile .play-button,.now-playing .ctr button.primary{color:var(--on-acc)!important}
.zones button.on ha-icon,.discover-icon,.empty-state ha-icon{color:var(--acc)!important}
.slider .button{background:var(--knob)!important}
.featured{box-shadow:inset 0 0 0 1px var(--line)}
.wrap.met-art::before{opacity:var(--art-opacity)!important}
`;

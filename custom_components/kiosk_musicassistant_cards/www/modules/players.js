// Music Assistant players as the cards see them.
//
// One physical device can show up as several Home Assistant devices (HEOS,
// denonavr, DLNA, Cast...), but Music Assistant merges its protocols into a
// single player and picks the output protocol itself. The cards therefore only
// ever target that Music Assistant player: these helpers find it.

const Q = new URL(import.meta.url).search;
const { PLAYING_STATES } = await import(`./shared.js${Q}`);

// `protocol` players are wrapped by a universal player and hidden by Music
// Assistant; display, visualizer, light and source devices do not play audio.
export const MA_PLAYER_TYPES = ['player', 'stereo_pair', 'group'];

export const isMaPlayer = (state) => !!state
  && String(state.entity_id || '').startsWith('media_player.')
  && MA_PLAYER_TYPES.includes((state.attributes || {}).mass_player_type);

const playerName = (state) => (state.attributes && state.attributes.friendly_name) || state.entity_id;

const normalize = (s) => String(s || '').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const isAvailable = (state) => !!state && state.state !== 'unavailable';

// ---------- Music Assistant names ----------
// Music Assistant re-creates players under new ids, in Home Assistant and in
// Music Assistant alike; only the player name stays. The cards store that name
// (`ma_player`) and look up the current entity here: from the integration's
// players sensor, else from the device names Home Assistant got from Music
// Assistant (never the friendly name, which users rename).

let playersSensorId = null;
const playersSensor = (states) => {
  if (playersSensorId && states[playersSensorId]) return states[playersSensorId];
  playersSensorId = Object.keys(states).find((id) => id.startsWith('sensor.')
    && (states[id].attributes || {}).kiosk_card_role === 'ma_players') || null;
  return playersSensorId ? states[playersSensorId] : null;
};

let directoryMemo = null;
// `{ nameOf: Map(entity -> MA name), byName: Map(normalized name -> { name, entities }) }`
const directory = (hass) => {
  const states = (hass && hass.states) || {};
  const sensor = playersSensor(states);
  const entities = hass && hass.entities;
  const devices = hass && hass.devices;
  const memo = directoryMemo;
  if (memo && memo.sensor === sensor && memo.entities === entities && memo.devices === devices
    && (entities || memo.states === states)) return memo.value;
  const nameOf = new Map();
  if (entities && devices) {
    for (const entry of Object.values(entities)) {
      if (entry.platform !== 'music_assistant' || !entry.entity_id.startsWith('media_player.')) continue;
      const device = devices[entry.device_id];
      if (device && device.name) nameOf.set(entry.entity_id, device.name);
    }
  } else {
    for (const state of Object.values(states)) if (isMaPlayer(state)) nameOf.set(state.entity_id, playerName(state));
  }
  for (const player of ((sensor && sensor.attributes.players) || [])) {
    if (player && player.entity_id && player.name) nameOf.set(player.entity_id, player.name);
  }
  const byName = new Map();
  for (const [entity, name] of nameOf) {
    const key = normalize(name);
    if (!byName.has(key)) byName.set(key, { name, entities: [] });
    byName.get(key).entities.push(entity);
  }
  directoryMemo = { sensor, entities, devices, states, value: { nameOf, byName } };
  return directoryMemo.value;
};

// The Music Assistant players named `name`: the available ones, else all of them.
const playersNamed = (hass, name) => {
  const entry = name && directory(hass).byName.get(normalize(name));
  if (!entry) return [];
  const states = (hass && hass.states) || {};
  const players = entry.entities.filter((id) => isMaPlayer(states[id]));
  const available = players.filter((id) => isAvailable(states[id]));
  return available.length ? available : players;
};

// Music Assistant name of an entity id, including a stale one: its own name,
// else the name of its device (the HEOS entity of a Denon...), else its id.
export const maPlayerName = (hass, entityId) => {
  if (!entityId) return null;
  const { nameOf, byName } = directory(hass);
  if (nameOf.has(entityId)) return nameOf.get(entityId);
  const known = (name) => {
    const entry = name && byName.get(normalize(name));
    return entry ? entry.name : null;
  };
  const entry = hass && hass.entities && hass.entities[entityId];
  const device = entry && hass.devices && hass.devices[entry.device_id];
  const slug = String(entityId).replace(/^media_player\./, '');
  return known(device && device.name) || known(slug) || known(slug.replace(/_\d+$/, ''));
};

// A configured player: `{ ma_player }`, a legacy `{ entity }`, or a plain
// string (a Music Assistant name or an entity id).
const refParts = (ref) => {
  if (typeof ref === 'string') return ref.startsWith('media_player.') ? { entity: ref } : { name: ref };
  return { name: ref && ref.ma_player, entity: ref && ref.entity };
};

// Music Assistant name of a configured player, or null.
export const playerRef = (hass, ref) => {
  const { name, entity } = refParts(ref);
  return name || maPlayerName(hass, entity);
};

// Current entity id of a configured player. An available legacy entity id is
// kept as it is; a stale one is replaced by the player with the same name.
export const resolvePlayer = (hass, ref) => {
  const { name, entity } = refParts(ref);
  const states = (hass && hass.states) || {};
  if (!name && entity && isAvailable(states[entity])) return entity;
  const found = playersNamed(hass, name || maPlayerName(hass, entity));
  if (found.length) return found.includes(entity) ? entity : found[0];
  return entity || null;
};

// True when several available Music Assistant players share this name.
export const isAmbiguousName = (hass, name) => {
  const states = (hass && hass.states) || {};
  return playersNamed(hass, name).filter((id) => isAvailable(states[id])).length > 1;
};

// A zone or player config with every player reference resolved to its current entity.
export const resolveZone = (hass, zone) => {
  if (!zone) return zone;
  const resolve = (ref) => resolvePlayer(hass, ref);
  const out = Object.assign({}, zone, { entity: resolve(zone.ma_player ? zone : zone.entity) || '' });
  if (Array.isArray(zone.group_with)) out.group_with = zone.group_with.map(resolve).filter(Boolean);
  if (zone.volume) {
    const volume = hass && hass.states[zone.volume] ? zone.volume : resolve(zone.volume);
    if (volume && hass && hass.states[volume]) out.volume = volume;
    else delete out.volume;
  }
  if (zone.before) {
    const before = Object.assign({}, zone.before);
    if (before.turn_off) before.turn_off = resolve(before.turn_off);
    if (before.unjoin) before.unjoin = resolve(before.unjoin);
    if (before.join) {
      before.join = Object.assign({}, before.join, {
        leader: resolve(before.join.leader),
        members: [].concat(before.join.members || []).map(resolve).filter(Boolean),
      });
    }
    out.before = before;
  }
  return out;
};

// Every playable Music Assistant player, one per name, sorted by name:
// `{ entity, name, type }` where `name` is the Music Assistant name.
export const listMaPlayers = (hass) => {
  const states = (hass && hass.states) || {};
  const players = [];
  for (const { name } of directory(hass).byName.values()) {
    const entity = playersNamed(hass, name)[0];
    if (entity) players.push({ entity, name, type: states[entity].attributes.mass_player_type });
  }
  return players.sort((a, b) => a.name.localeCompare(b.name));
};

// Options for an ha-form `select` selector; values are Music Assistant names.
// A configured value that is not a Music Assistant player stays in the list,
// flagged, so the form still shows it. `groupLabel` is the translated word
// appended to group players.
export const maPlayerOptions = (hass, current = [], groupLabel = 'group') => {
  const options = listMaPlayers(hass).map((p) => ({
    value: p.name, label: p.type === 'group' ? `${p.name} (${groupLabel})` : p.name,
  }));
  for (const value of [].concat(current || [])) {
    if (!value || options.some((o) => o.value === value)) continue;
    const state = hass && hass.states[value];
    options.push({ value, label: `⚠ ${state ? playerName(state) : value}` });
  }
  return options;
};

// Players configured on a card. Both cards accept `zones` (browser) and
// `players` (now-playing) with the same `{ ma_player, name, icon, ... }` items
// (legacy items carry an `entity` id instead of `ma_player`).
export const configuredPlayers = (cfg) => {
  const c = cfg || {};
  if (Array.isArray(c.zones) && c.zones.length) return c.zones;
  return Array.isArray(c.players) ? c.players : [];
};

// Home Assistant gives a synced member the group_members of its leader, leader
// first. Returns the leader entity for a member, null for a leader or a solo player.
export const groupLeader = (state) => {
  const members = (state && state.attributes && state.attributes.group_members) || [];
  return members.length > 1 && members[0] !== state.entity_id ? members[0] : null;
};

// Drop the members whose leader is in the same list: the leader already shows
// the music they play.
export const dropFollowers = (hass, players) => {
  const ids = new Set((players || []).map((p) => p && p.entity));
  return (players || []).filter((p) => !ids.has(groupLeader(hass && hass.states[p && p.entity])));
};

// Group a zone as configured before playing, using Music Assistant groups:
// `group_with` joins the missing players to the zone player; `solo` detaches
// it from any group. Returns true when something changed.
export const applyZoneGroup = async (hass, zone) => {
  const state = zone && hass && hass.states[zone.entity];
  if (!state) return false;
  const members = (state.attributes && state.attributes.group_members) || [];
  const call = (service, data, entityId) => hass.callService('media_player', service, data, { entity_id: entityId })
    .catch(() => {});
  const wanted = [].concat(zone.group_with || []).filter((id) => id && id !== zone.entity);
  if (wanted.length) {
    const missing = wanted.filter((id) => !members.includes(id));
    if (!missing.length) return false;
    await call('join', { group_members: missing }, zone.entity);
    return true;
  }
  if (zone.solo && members.length > 1) {
    if (groupLeader(state)) await call('unjoin', {}, zone.entity);
    else for (const id of members) if (id !== zone.entity) await call('unjoin', {}, id);
    return true;
  }
  return false;
};

// The player that actually owns the music for `selected`: the player itself
// when it plays, else the leader it is synced to, else a playing Music
// Assistant group among `candidates` that shares its queue or contains it, so
// commands do not hit an empty queue.
export const findActivePlayer = (hass, selected, candidates) => {
  const states = (hass && hass.states) || {};
  const s = states[selected];
  if (!selected || (s && PLAYING_STATES.includes(s.state))) return selected;
  const leader = groupLeader(s);
  if (leader && states[leader] && PLAYING_STATES.includes(states[leader].state)) return leader;
  const queue = s && s.attributes ? s.attributes.active_queue : null;
  let groupPlayer = null;
  for (const id of candidates || []) {
    if (!id || id === selected) continue;
    const player = states[id];
    if (!isMaPlayer(player) || !PLAYING_STATES.includes(player.state)) continue;
    const a = player.attributes || {};
    if (queue && a.active_queue === queue) return id;
    if (!groupPlayer && (a.group_members || []).indexOf(selected) !== -1) groupPlayer = id;
  }
  return groupPlayer || selected;
};

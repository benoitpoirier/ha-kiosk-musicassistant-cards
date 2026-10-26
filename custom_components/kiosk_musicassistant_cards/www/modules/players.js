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

// Every playable Music Assistant player, sorted by name: `{ entity, name, type }`.
export const listMaPlayers = (hass) => Object.values((hass && hass.states) || {})
  .filter(isMaPlayer)
  .map((state) => ({ entity: state.entity_id, name: playerName(state), type: state.attributes.mass_player_type }))
  .sort((a, b) => a.name.localeCompare(b.name));

// Options for an ha-form `select` selector. A configured value that is not a
// Music Assistant player stays in the list, flagged, so the form still shows it.
// `groupLabel` is the translated word appended to group players.
export const maPlayerOptions = (hass, current = [], groupLabel = 'group') => {
  const options = listMaPlayers(hass).map((p) => ({
    value: p.entity, label: p.type === 'group' ? `${p.name} (${groupLabel})` : p.name,
  }));
  for (const id of [].concat(current || [])) {
    if (!id || options.some((o) => o.value === id)) continue;
    const state = hass && hass.states[id];
    options.push({ value: id, label: `⚠ ${state ? playerName(state) : id}` });
  }
  return options;
};

const normalize = (s) => String(s || '').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// For an entity that is not a Music Assistant player (for example the HEOS or
// denonavr entity of a Denon), suggest the Music Assistant player of the same
// device by comparing names. Returns an entity id or null.
export const suggestMaPlayer = (hass, entityId) => {
  const state = hass && hass.states[entityId];
  if (!entityId || isMaPlayer(state)) return null;
  const wanted = normalize(state ? playerName(state) : entityId.replace(/^media_player\./, '').replace(/_\d+$/, ''));
  if (!wanted) return null;
  const players = listMaPlayers(hass).filter((p) => p.type !== 'group');
  const exact = players.find((p) => normalize(p.name) === wanted);
  if (exact) return exact.entity;
  const partial = players.filter((p) => {
    const name = normalize(p.name);
    return name && (name.includes(wanted) || wanted.includes(name));
  });
  return partial.length === 1 ? partial[0].entity : null;
};

// Players configured on a card. Both cards accept `zones` (browser) and
// `players` (now-playing) with the same `{ entity, name, icon, ... }` items.
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

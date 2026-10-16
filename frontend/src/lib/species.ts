import type { Shape } from '../data/mock'

// Your Species table. l0Min / l0Max = shelf life in hours when kept at 0°C (your research column).
// histamine = tuna and mackerel can make histamine when they warm up, so they get a narrow, cautious range.
export type SpeciesDef = { id: string; chip: string; l0Min: number; l0Max: number; histamine?: boolean }

export const SPECIES: Record<string, SpeciesDef> = {
  roughear:       { id: 'roughear',       chip: 'Roughear scad · Burot bilog',                      l0Min: 144, l0Max: 240 },
  shortfin:       { id: 'shortfin',       chip: 'Shortfin scad · Tinabako / Galunggong na Lalaki',  l0Min: 288, l0Max: 360 },
  mackerelScad:   { id: 'mackerelScad',   chip: 'Mackerel scad',                                    l0Min: 120, l0Max: 168 },
  bigeye:         { id: 'bigeye',         chip: 'Bigeye scad',                                      l0Min: 240, l0Max: 336 },
  bali:           { id: 'bali',           chip: 'Bali sardinella',                                  l0Min: 144, l0Max: 144 }, // proxy: S. longiceps
  islandMackerel: { id: 'islandMackerel', chip: 'Island mackerel',                                  l0Min: 144, l0Max: 144, histamine: true }, // proxy: Indian mackerel
  // Your table says 624 h (26 days). That is far above the other tunas, so 192 h (skipjack) is used
  // until the source is checked. Put 624 back only if you confirm it.
  bullet:         { id: 'bullet',         chip: 'Bullet tuna',                                      l0Min: 192, l0Max: 192, histamine: true },
  yellowfin:      { id: 'yellowfin',      chip: 'Yellowfin tuna',                                   l0Min: 288, l0Max: 288, histamine: true },
  skipjack:       { id: 'skipjack',       chip: 'Skipjack tuna',                                    l0Min: 192, l0Max: 192, histamine: true },
  moonfish:       { id: 'moonfish',       chip: 'Moonfish',                                         l0Min: 168, l0Max: 192 },
  other:          { id: 'other',          chip: 'Other',                                            l0Min: 120, l0Max: 120, histamine: true }, // unknown fish: be cautious
}

// What fisherfolk actually say is the local name, so tiles are grouped by local name.
// The three scads are all "Galunggong" but keep very different lengths of time, so that tile offers a follow-up.
export type Tile = { id: string; name: string; english: string; aliases: string[]; shape: Shape; members: string[] }

export const TILES: Tile[] = [
  { id: 'galunggong', name: 'Galunggong',      english: 'Scads',           aliases: ['Burot bilog', 'Tinabako'], shape: 'scad',     members: ['roughear', 'shortfin', 'mackerelScad'] },
  { id: 'matambaka',  name: 'Matambaka',       english: 'Bigeye scad',     aliases: ['Burow'],                   shape: 'scad',     members: ['bigeye'] },
  { id: 'tamban',     name: 'Tamban',          english: 'Bali sardinella', aliases: ['Tunsoy', 'Tapulok'],       shape: 'sardine',  members: ['bali'] },
  { id: 'alumahan',   name: 'Alumahan',        english: 'Island mackerel', aliases: [],                          shape: 'mackerel', members: ['islandMackerel'] },
  { id: 'tulingang',  name: 'Tulingang bilog', english: 'Bullet tuna',     aliases: [],                          shape: 'tuna',     members: ['bullet'] },
  { id: 'tambakol',   name: 'Tambakol',        english: 'Yellowfin tuna',  aliases: [],                          shape: 'tuna',     members: ['yellowfin'] },
  { id: 'gulyasan',   name: 'Gulyasan',        english: 'Skipjack tuna',   aliases: [],                          shape: 'tuna',     members: ['skipjack'] },
  { id: 'hiwas',      name: 'Hiwas',           english: 'Moonfish',        aliases: [],                          shape: 'moon',     members: ['moonfish'] },
]

// "Not sure" means the member that spoils soonest, so a wrong guess errs on the safe side
export function defaultMember(tile: Tile) {
  return [...tile.members].sort((a, b) => SPECIES[a].l0Min - SPECIES[b].l0Min)[0]
}
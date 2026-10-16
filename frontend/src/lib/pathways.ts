import type { Catch } from '../data/mock'
import type { RiskLevel } from './risk'
import type { Key } from './i18n'

// Your "Value-Added Pathway Rules" table, as data. The text is in English for now.
// Always shown as a "potential value-added pathway". Never shown at a risk level that is not allowed.
export type Pathway = {
  id: string
  species: string[] // ids from lib/species.ts
  name: string
  detail: string
  allowed: RiskLevel[] // "Allowed at risk level" (the table's "Medium" is "moderate" here)
  needsIce: boolean // true when the table needs fish "kept on ice from landing" or hides it when "not iced"
  conditions: string[] // "Required conditions"
  avoid: string[] // the part of "Hidden when" that is not a risk level
  wording: string // "Wording shown to user"
  source: string // "To verify" until you add a real source
}

const LOW: RiskLevel[] = ['low']
const LOW_MED: RiskLevel[] = ['low', 'moderate']

export const PATHWAYS: Pathway[] = [
  {
    id: 'daing-scad',
    // Your row says "Decapterus spp.", but your mackerel scad rows allow Low only.
    // To stay on the careful side this one covers roughear and shortfin scad only.
    species: ['roughear', 'shortfin'],
    name: 'Daing',
    detail: 'split, salted, sun-dried',
    allowed: LOW_MED,
    needsIce: false,
    conditions: ['Gutted and washed in clean water', 'Kept on ice or in shade until processing', 'Fresh smell, firm flesh', 'Enough salt available', 'Dry sunny weather'],
    avoid: ['Ice or chilling history unknown', 'Soft belly, off-smell or bloody gills', 'Rain forecast'],
    wording: 'Potential value-added pathway: daing. Split, wash, salt and dry in the sun. Only do this if the fish is still fresh and the weather is dry.',
    source: '',
  },
  {
    id: 'daing-skipjack',
    species: ['skipjack'],
    name: 'Daing',
    detail: 'cut, salted, dried',
    allowed: LOW,
    needsIce: true,
    conditions: ['Kept on ice from landing', 'Cut into thin pieces', 'Salted at once', 'Dried on clean racks in dry sunny weather', 'Processed the same day'],
    avoid: ['Ice or chilling history unknown', 'Fish left in the sun or warm', 'Off-smell or soft flesh', 'Rain forecast'],
    wording: 'Potential value-added pathway: daing. Only for fish kept on ice since landing. Cut thin, salt right away and dry in the sun.',
    source: '',
  },
  {
    id: 'tuyo-shortfin',
    species: ['shortfin'],
    name: 'Tuyo',
    detail: 'whole salted-dried',
    allowed: LOW_MED,
    needsIce: false,
    conditions: ['Washed in clean water', 'Brined or salted right away', 'Dried on clean racks off the ground', 'Fresh smell, firm flesh', 'Dry sunny weather'],
    avoid: ['Fish kept warm or in the sun for long', 'Off-smell or soft flesh', 'Rain forecast'],
    wording: 'Potential value-added pathway: tuyo. Soak in salt brine, then dry on a raised rack in the sun. Do not use fish that smells bad.',
    source: '',
  },
  {
    id: 'tinapa-mackerelscad',
    species: ['mackerelScad'],
    name: 'Tinapa',
    detail: 'brined and smoked',
    allowed: LOW,
    needsIce: true,
    conditions: ['Gutted and cleaned', 'Brined in clean salt water', 'Smoked with proper wood and a clean smokehouse', 'Kept on ice from landing', 'Processed the same day'],
    avoid: ['No ice used or storage unknown', 'Off-smell or soft belly'],
    wording: 'Potential value-added pathway: tinapa. Clean, soak in brine, then smoke until cooked through. Use only very fresh fish that was kept cold.',
    source: '',
  },
  {
    id: 'paksiw-bigeye',
    species: ['bigeye'],
    name: 'Paksiw',
    detail: 'cooked in vinegar, salt and spices',
    allowed: LOW_MED,
    needsIce: false,
    conditions: ['Gutted and cleaned', 'Cooked until fully done', 'Cooled quickly and stored cold or eaten the same day', 'Fresh smell'],
    avoid: ['Off-smell, slimy skin or soft flesh', 'No way to keep the cooked product cold'],
    wording: 'Potential value-added pathway: paksiw. Cook the cleaned fish fully in vinegar, salt and ginger. Eat the same day or keep it cold.',
    source: '',
  },
  {
    id: 'bagoong-bali',
    species: ['bali'],
    name: 'Bagoong isda',
    detail: 'salt-fermented fish',
    allowed: LOW_MED,
    needsIce: true,
    conditions: ['Whole fish very fresh', 'Washed in clean water', 'Correct fish-to-salt ratio', 'Clean, covered containers', 'Fermented in a cool, shaded place'],
    avoid: ['Fish not iced or already soft', 'Salt not available', 'Off-smell before salting'],
    wording: 'Potential value-added pathway: bagoong isda. Mix fresh fish with plenty of salt in a clean covered jar. Do not use fish that is already soft or smells bad.',
    source: '',
  },
  {
    id: 'tinapa-island',
    species: ['islandMackerel'],
    name: 'Tinapa',
    detail: 'brined and smoked',
    allowed: LOW,
    needsIce: true,
    conditions: ['Kept on ice from landing', 'Gutted and cleaned quickly', 'Brined in clean salt water', 'Smoked and cooked through', 'Processed the same day'],
    avoid: ['Ice or chilling history unknown', 'Fish left in the sun or warm', 'Off-smell or soft flesh'],
    wording: 'Potential value-added pathway: tinapa. Only for fish kept on ice since landing. Clean, brine and smoke until cooked through.',
    source: '',
  },
  {
    id: 'paksiw-bullet',
    species: ['bullet'],
    name: 'Paksiw',
    detail: 'cooked in vinegar, salt and spices',
    allowed: LOW,
    needsIce: true,
    conditions: ['Kept on ice from landing', 'Gutted early', 'Cooked thoroughly the same day', 'Cooled quickly and stored cold'],
    avoid: ['Ice or chilling history unknown', 'Fish left in the sun or warm', 'Off-smell or soft flesh'],
    wording: 'Potential value-added pathway: paksiw. Cook the fish fully in vinegar and salt on the same day. Only use fish that was kept on ice.',
    source: '',
  },
  {
    id: 'tinapa-yellowfin',
    species: ['yellowfin'],
    name: 'Tinapa',
    detail: 'smoked steaks or slices',
    allowed: LOW,
    needsIce: true,
    conditions: ['Kept on ice from landing', 'Bled and gutted early', 'Cut into small pieces', 'Brined and smoked until cooked through', 'Processed the same day'],
    avoid: ['Ice or chilling history unknown', 'Fish left in the sun or warm', 'Off-smell or soft flesh'],
    wording: 'Potential value-added pathway: smoked tinapa. Only for fish kept on ice since landing. Cut into small pieces, brine and smoke until cooked through.',
    source: '',
  },
  {
    id: 'tuyo-moonfish',
    species: ['moonfish'],
    name: 'Tuyo',
    detail: 'salted-dried',
    allowed: LOW_MED,
    needsIce: false,
    conditions: ['Gutted and washed in clean water', 'Salted or brined right away', 'Dried on clean racks off the ground', 'Fresh smell, firm flesh', 'Dry sunny weather'],
    avoid: ['Fish kept warm for long', 'Off-smell or soft flesh', 'Rain forecast'],
    wording: 'Potential value-added pathway: tuyo. Clean, salt and dry on a raised rack in the sun. Do not use fish that smells bad.',
    source: 'To verify – FAO fish drying references; local BFAR method for moonfish',
  },
  {
    id: 'tuyo-roughear',
    species: ['roughear'],
    name: 'Tuyo',
    detail: 'whole salted-dried',
    allowed: LOW_MED,
    needsIce: false,
    conditions: ['Washed in clean water', 'Brined or salted right away', 'Dried on clean racks off the ground', 'Fresh smell, firm flesh', 'Dry sunny weather'],
    avoid: ['Fish kept warm or in the sun for long', 'Off-smell or soft flesh', 'Rain forecast'],
    wording: 'Potential value-added pathway: tuyo. Soak in salt brine, then dry on a raised rack in the sun. Do not use fish that smells bad.',
    source: 'To verify – FAO fish drying references; BFAR',
  },
  {
    id: 'daing-bigeye',
    species: ['bigeye'],
    name: 'Daing',
    detail: 'split, salted, sun-dried',
    allowed: LOW_MED,
    needsIce: false,
    conditions: ['Gutted and washed in clean water', 'Kept on ice or in shade until processing', 'Fresh smell, firm flesh', 'Enough salt available', 'Dry sunny weather'],
    avoid: ['Ice or chilling history unknown', 'Soft belly, off-smell or bloody gills', 'Rain forecast'],
    wording: 'Potential value-added pathway: daing. Split, wash, salt and dry in the sun. Only do this if the fish is still fresh and the weather is dry.',
    source: 'To verify – local BFAR method',
  },
  {
    id: 'tuyo-bali',
    species: ['bali'],
    name: 'Tuyo',
    detail: 'whole salted-dried',
    allowed: LOW_MED,
    needsIce: true,
    conditions: ['Whole fish very fresh', 'Washed in clean water', 'Salted or brined right away', 'Dried on clean racks off the ground', 'Dry sunny weather'],
    avoid: ['Fish not iced or already soft', 'Off-smell', 'Rain forecast'],
    wording: 'Potential value-added pathway: tuyo. Salt the fresh whole fish and dry on a raised rack in the sun. Do not use fish that is soft or smells bad.',
    source: 'To verify – FAO small pelagic drying references',
  },
  {
    id: 'paksiw-mackerelscad',
    species: ['mackerelScad'],
    name: 'Paksiw',
    detail: 'cooked in vinegar, salt and spices',
    allowed: LOW,
    needsIce: false,
    conditions: ['Gutted and cleaned', 'Cooked until fully done', 'Cooled quickly and stored cold or eaten the same day', 'Fresh smell'],
    avoid: ['Off-smell, slimy skin or soft flesh', 'No way to keep the cooked product cold'],
    wording: 'Potential value-added pathway: paksiw. Cook the cleaned fish fully in vinegar, salt and ginger. Eat the same day or keep it cold.',
    source: 'To verify',
  },
  {
    id: 'paksiw-island',
    species: ['islandMackerel'],
    name: 'Paksiw',
    detail: 'cooked in vinegar, salt and spices',
    allowed: LOW,
    needsIce: true,
    conditions: ['Kept on ice from landing', 'Gutted early', 'Cooked thoroughly the same day', 'Cooled quickly and stored cold'],
    avoid: ['Ice or chilling history unknown', 'Fish left in the sun or warm', 'Off-smell or soft flesh'],
    wording: 'Potential value-added pathway: paksiw. Cook the fish fully in vinegar and salt on the same day. Only use fish that was kept on ice.',
    source: 'To verify',
  },
  {
    id: 'tinapa-skipjack',
    species: ['skipjack'],
    name: 'Tinapa',
    detail: 'smoked, cut into small pieces',
    allowed: LOW,
    needsIce: true,
    conditions: ['Kept on ice from landing', 'Bled and gutted early', 'Cut into small pieces', 'Brined and smoked until cooked through', 'Processed the same day'],
    avoid: ['Ice or chilling history unknown', 'Fish left in the sun or warm', 'Off-smell or soft flesh'],
    wording: 'Potential value-added pathway: tinapa. Only for fish kept on ice since landing. Cut small, brine and smoke until cooked through.',
    source: 'To verify – BFAR tuna smoking guide',
  },
  {
    id: 'sinaing-bullet',
    species: ['bullet'],
    name: 'Sinaing na tulingan',
    detail: 'long-cooked in salt and kamias',
    allowed: LOW,
    needsIce: true,
    conditions: ['Kept on ice from landing', 'Gutted early', 'Cleaned', 'Cooked for many hours until fully done and bones are soft', 'Cooled quickly and stored cold'],
    avoid: ['Ice or chilling history unknown', 'Fish left in the sun or warm', 'Off-smell or soft flesh', 'No way to keep the cooked product cold'],
    wording: 'Potential value-added pathway: sinaing na tulingan. Cook the cleaned fish slowly with salt and kamias until fully done. Only use fish that was kept on ice. Keep it cold.',
    source: 'To verify – local Batangas method',
  },
]

// The app knows how much ice there was from the moment of landing
export const iceFromLanding = (c: Catch) => (c.model?.events[0]?.iceKg ?? 0) > 0

// Which pathways may be shown for this catch right now, and if none, why not
export function pathwaysFor(c: Catch): { available: Pathway[]; reason?: Key } {
  const forFish = PATHWAYS.filter((p) => c.speciesId && p.species.includes(c.speciesId))
  if (forFish.length === 0) return { available: [], reason: 'lock.value.none' }
  const atThisRisk = forFish.filter((p) => p.allowed.includes(c.risk))
  if (atThisRisk.length === 0) return { available: [], reason: 'lock.value' }
  const available = atThisRisk.filter((p) => !p.needsIce || iceFromLanding(c))
  if (available.length === 0) return { available: [], reason: 'lock.value.ice' }
  return { available }
}
import daing from '../assets/products/daing.webp'
import tuyo from '../assets/products/tuyo.webp'
import tinapa from '../assets/products/tinapa.webp'
import paksiw from '../assets/products/paksiw.webp'
import bagoong from '../assets/products/bagoong.webp'
import sinaing from '../assets/products/sinaing.webp'

// One sample photo per value-added product, keyed by the pathway's product name (lib/pathways.ts)
const PRODUCT_IMAGE: Record<string, string> = {
  Daing: daing,
  Tuyo: tuyo,
  Tinapa: tinapa,
  Paksiw: paksiw,
  'Bagoong isda': bagoong,
  'Sinaing na tulingan': sinaing,
}

export const productImage = (name: string): string | undefined => PRODUCT_IMAGE[name]
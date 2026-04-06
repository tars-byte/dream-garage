import LZString from 'lz-string'
import type { Car } from '../types'

export interface GarageUrlState {
  cars: string[]   // car IDs (1–3)
  label: string
  tagline: string
  ts: number       // unix seconds — for cache-busting if needed
}

/** Encode the current garage into a URL-safe string for the ?g= param */
export function encodeGarage(
  cars: (Car | null)[],
  label: string,
  tagline: string,
): string {
  const state: GarageUrlState = {
    cars: cars.filter((c): c is Car => c !== null).map((c) => c.id),
    label,
    tagline,
    ts: Math.floor(Date.now() / 1000),
  }
  return LZString.compressToEncodedURIComponent(JSON.stringify(state))
}

/** Decode a ?g= param back into GarageUrlState. Returns null if invalid. */
export function decodeGarage(param: string): GarageUrlState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(param)
    if (!json) return null
    const parsed = JSON.parse(json) as GarageUrlState
    if (!Array.isArray(parsed.cars)) return null
    return parsed
  } catch {
    return null
  }
}

/** Build the canonical short share URL for a saved garage */
export function buildShareUrl(garageId: string, challenge = false): string {
  const base = window.location.origin
  const url = `${base}/g/${garageId}`
  return challenge ? `${url}?challenge=1` : url
}

/** Build a WhatsApp share URL with pre-filled text */
export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

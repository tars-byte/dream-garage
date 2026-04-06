import { supabase } from './supabase'
import { shortId } from './utils'
import type { Car } from '../types'
import { selectTotalPrice, selectBudgetPct, selectBudgetRemaining } from '../store/garageStore'
import type { GarageStore } from '../store/garageStore'

export interface SavedGarage {
  id: string
}

/** Minimal car snapshot stored alongside the garage for OG image rendering */
export interface CarSnapshot {
  id: string
  brand: string
  model: string
  trim: string
  price_usd: number
  image_url: string
}

function toSnapshot(car: Car): CarSnapshot {
  return {
    id: car.id,
    brand: car.brand,
    model: car.model,
    trim: car.trim,
    price_usd: car.price_usd,
    image_url: car.image_url,
  }
}

/**
 * Save a garage to Supabase and return the short ID.
 * Falls back gracefully if Supabase is not configured.
 */
export async function saveGarage(
  store: Pick<GarageStore, 'cars' | 'label' | 'tagline' | 'sessionId'>,
  sourceGarageId?: string,
): Promise<SavedGarage | null> {
  const { cars, label, tagline, sessionId } = store
  const filledCars = cars.filter((c): c is Car => c !== null)

  if (filledCars.length === 0) return null

  const id = shortId()
  const totalPrice = selectTotalPrice(cars)

  const record = {
    id,
    label: label || 'Mi Dream Garage',
    tagline: tagline || null,
    car_ids: filledCars.map((c) => c.id),
    cars_json: filledCars.map(toSnapshot),
    total_price_usd: totalPrice,
    budget_used_pct: selectBudgetPct(cars),
    budget_remaining_usd: selectBudgetRemaining(cars),
    source_garage_id: sourceGarageId ?? null,
    session_id: sessionId,
    expo_year: 2025,
  }

  try {
    const { error } = await supabase.from('garages').insert(record)
    if (error) {
      console.error('[garageApi] save error:', error.message)
      return null
    }
    return { id }
  } catch (err) {
    console.error('[garageApi] network error:', err)
    return null
  }
}

/** Increment view count for a public garage page */
export async function recordView(garageId: string) {
  try { await supabase.rpc('increment_view', { garage_id: garageId }) } catch { /* best effort */ }
}

/** Cast a vote. Returns true on success, false if already voted or error. */
export async function castVote(garageId: string, sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('votes')
    .insert({ garage_id: garageId, session_id: sessionId })

  return !error
}

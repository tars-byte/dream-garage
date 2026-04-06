/**
 * Analytics — thin wrapper over the Supabase events table.
 * All calls are fire-and-forget: failures are silently swallowed.
 */
import { supabase } from './supabase'
import { useGarageStore } from '../store/garageStore'

type EventType =
  | 'session_start'
  | 'car_viewed'
  | 'car_added'
  | 'car_removed'
  | 'garage_completed'
  | 'garage_saved'
  | 'share_tapped'
  | 'challenge_link_opened'
  | 'challenge_completed'
  | 'vote_cast'
  | 'leaderboard_viewed'
  | 'dealer_cta_tapped'
  | 'filter_applied'

interface EventPayload {
  garage_id?: string
  car_id?: string
  dealer_id?: string
  source?: string
  payload?: Record<string, unknown>
}

async function track(type: EventType, data: EventPayload = {}) {
  const sessionId = useGarageStore.getState().sessionId

  // Detect source from UTM params stored on session start
  const source = sessionStorage.getItem('dg_source') ?? 'organic'

  const record = {
    event_type: type,
    session_id: sessionId,
    garage_id: data.garage_id ?? null,
    car_id: data.car_id ?? null,
    dealer_id: data.dealer_id ?? null,
    payload: data.payload ?? null,
    source: data.source ?? source,
    user_agent: navigator.userAgent.slice(0, 200),
  }

  try {
    await supabase.from('events').insert(record)
  } catch {
    // Best-effort only — never throw
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function trackSessionStart() {
  const params = new URLSearchParams(window.location.search)
  const utmSource = params.get('utm_source') ?? params.get('src') ?? 'organic'

  // Persist so all subsequent events in the session share the source
  sessionStorage.setItem('dg_source', utmSource)

  return track('session_start', {
    source: utmSource,
    payload: {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      referrer: document.referrer || null,
      lang: navigator.language,
    },
  })
}

export function trackCarViewed(carId: string, price: number, category: string) {
  return track('car_viewed', { car_id: carId, payload: { price_usd: price, category } })
}

export function trackCarAdded(carId: string, bayPosition: number, budgetRemaining: number) {
  return track('car_added', {
    car_id: carId,
    payload: { bay_position: bayPosition, budget_remaining_after: budgetRemaining },
  })
}

export function trackCarRemoved(carId: string, reason: 'swap' | 'undo' | 'manual') {
  return track('car_removed', { car_id: carId, payload: { reason } })
}

export function trackGarageCompleted(garageId: string, carIds: string[], totalPrice: number, budgetPct: number) {
  return track('garage_completed', {
    garage_id: garageId,
    payload: { car_ids: carIds, total_price: totalPrice, budget_pct: budgetPct },
  })
}

export function trackGarageSaved(garageId: string) {
  return track('garage_saved', { garage_id: garageId })
}

export function trackShareTapped(garageId: string, platform: string) {
  return track('share_tapped', { garage_id: garageId, payload: { platform } })
}

export function trackChallengeLinkOpened(sourceGarageId: string) {
  return track('challenge_link_opened', { garage_id: sourceGarageId })
}

export function trackChallengeCompleted(sourceGarageId: string, newGarageId: string) {
  return track('challenge_completed', {
    garage_id: newGarageId,
    payload: { source_garage_id: sourceGarageId },
  })
}

export function trackVoteCast(garageId: string) {
  return track('vote_cast', { garage_id: garageId })
}

export function trackLeaderboardViewed(tab: string) {
  return track('leaderboard_viewed', { payload: { tab } })
}

export function trackDealerCtaTapped(carId: string, dealerId: string, garageId?: string) {
  return track('dealer_cta_tapped', { car_id: carId, dealer_id: dealerId, garage_id: garageId })
}

export function trackFilterApplied(filterType: string, filterValue: string) {
  return track('filter_applied', { payload: { filter_type: filterType, filter_value: filterValue } })
}

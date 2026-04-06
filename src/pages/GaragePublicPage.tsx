/**
 * GaragePublicPage — /g/:id
 *
 * Two modes:
 *   - Normal view:    shows the garage with vote button + "build your own" CTA
 *   - Challenge mode: ?challenge=1  →  shows "X challenged you!" header, then
 *                     after the visitor saves their own garage, a side-by-side
 *                     comparison screen is shown.
 */
import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { castVote, recordView } from '../lib/garageApi'
import { usePageMeta } from '../hooks/usePageMeta'
import { trackChallengeLinkOpened, trackVoteCast } from '../lib/analytics'
import { useGarageStore, selectTotalPrice, selectBudgetPct, selectFilledCars } from '../store/garageStore'
import ShareCard from '../components/share/ShareCard'
import BudgetBar from '../components/ui/BudgetBar'
import { formatPrice } from '../lib/utils'
import type { Car } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CarSnap {
  id: string
  brand: string
  model: string
  trim: string
  price_usd: number
  image_url: string
}

interface GarageRecord {
  id: string
  label: string
  tagline: string | null
  cars_json: CarSnap[]
  total_price_usd: number
  budget_used_pct: number
  vote_count: number
  share_count: number
}

// ─── Mini garage display card ─────────────────────────────────────────────────

function GarageDisplay({
  garage,
  title,
  voteButton,
}: {
  garage: GarageRecord
  title: string
  voteButton?: React.ReactNode
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">{title}</p>
        <p className="text-base font-bold text-text mt-0.5">{garage.label}</p>
        {garage.tagline && (
          <p className="text-xs text-muted italic mt-0.5">"{garage.tagline}"</p>
        )}
      </div>

      {/* Cars row */}
      <div className="grid grid-cols-3 gap-1.5 px-4 pb-3">
        {[0, 1, 2].map((i) => {
          const car = garage.cars_json[i]
          return (
            <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-elevated">
              {car ? (
                <img src={car.image_url} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted text-sm">—</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Car list */}
      <div className="px-4 flex flex-col gap-1 pb-3">
        {garage.cars_json.map((car) => (
          <div key={car.id} className="flex justify-between items-center">
            <span className="text-xs text-text-secondary truncate flex-1">{car.brand} {car.model}</span>
            <span className="text-xs font-semibold text-text ml-2">{formatPrice(car.price_usd)}</span>
          </div>
        ))}
      </div>

      {/* Budget bar */}
      <div className="px-4 pb-4 flex flex-col gap-1.5">
        <BudgetBar pct={garage.budget_used_pct} height="thin" />
        <div className="flex justify-between">
          <span className="text-xs text-text-secondary">{formatPrice(garage.total_price_usd)} / $50,000</span>
          <span className="text-xs text-muted">{Math.round(garage.budget_used_pct)}%</span>
        </div>
      </div>

      {/* Vote row */}
      <div className="px-4 pb-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-text-secondary">❤️ {garage.vote_count}</span>
        {voteButton}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GaragePublicPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const isChallenge = searchParams.get('challenge') === '1'

  const [garage, setGarage] = useState<GarageRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [voted, setVoted] = useState(false)
  const [voteCount, setVoteCount] = useState(0)

  const sessionId = useGarageStore((s) => s.sessionId)

  // Inject OG meta when garage data is available
  const injectMeta = useCallback((g: GarageRecord) => {
    const carNames = g.cars_json.map((c) => `${c.brand} ${c.model}`).join(' · ')
    usePageMeta({
      title: `${g.label} — Dream Garage | Expomovil 2025`,
      description: `${carNames} · $${g.total_price_usd.toLocaleString()} de $50,000. ¿Podés hacer uno mejor?`,
      imageUrl: `${window.location.origin}/api/og/${g.id}.png`,
      url: `${window.location.origin}/g/${g.id}`,
    })
  }, [])

  // My own garage (for comparison mode)
  const myCars = useGarageStore((s) => s.cars)
  const myTotal = selectTotalPrice(myCars)
  const myPct = selectBudgetPct(myCars)
  const myFilled = selectFilledCars(myCars)

  useEffect(() => {
    if (!id) return
    setLoading(true)

    supabase
      .from('garages')
      .select('id,label,tagline,cars_json,total_price_usd,budget_used_pct,vote_count,share_count')
      .eq('id', id)
      .eq('is_visible', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true)
        } else {
          const g = data as GarageRecord
          setGarage(g)
          setVoteCount(g.vote_count)
          injectMeta(g)
          recordView(id)
          if (isChallenge) trackChallengeLinkOpened(id)
        }
        setLoading(false)
      })
  }, [id, isChallenge])

  async function handleVote() {
    if (!id || voted) return
    const ok = await castVote(id, sessionId)
    if (ok) {
      setVoted(true)
      setVoteCount((n) => n + 1)
      trackVoteCast(id)
    }
  }

  // ── Loading / not found ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d0d0d]">
        <p className="text-text-secondary text-sm animate-pulse">{t('common.loading')}</p>
      </div>
    )
  }

  if (notFound || !garage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0d0d] px-6 text-center gap-4">
        <span className="text-5xl">🚗</span>
        <p className="text-text font-semibold">{t('errors.garage_not_found')}</p>
        <button onClick={() => navigate('/')} className="text-accent text-sm font-medium hover:underline">
          {t('common.back')}
        </button>
      </div>
    )
  }

  // ── Comparison mode (visitor has their own garage) ────────────────────────

  const showComparison = isChallenge && myFilled.length > 0

  if (showComparison) {
    // Build a pseudo-GarageRecord from the visitor's current store state
    const myRecord: GarageRecord = {
      id: 'mine',
      label: useGarageStore.getState().label || t('garage.default_label'),
      tagline: useGarageStore.getState().tagline || null,
      cars_json: myFilled.map((c: Car) => ({
        id: c.id,
        brand: c.brand,
        model: c.model,
        trim: c.trim,
        price_usd: c.price_usd,
        image_url: c.image_url,
      })),
      total_price_usd: myTotal,
      budget_used_pct: myPct,
      vote_count: 0,
      share_count: 0,
    }

    return (
      <div className="flex flex-col min-h-screen bg-[#0d0d0d]">
        <header className="sticky top-0 z-10 bg-[#0d0d0d]/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-elevated text-text-secondary">←</button>
          <h1 className="text-base font-semibold text-text flex-1">{t('challenge.showdown_title')}</h1>
        </header>

        <main className="flex-1 px-4 py-5 flex flex-col gap-4 pb-8">
          <GarageDisplay
            garage={garage}
            title={t('challenge.their_side')}
            voteButton={
              <button
                onClick={handleVote}
                disabled={voted}
                className={[
                  'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                  voted
                    ? 'bg-accent/15 text-accent border border-accent/40'
                    : 'bg-accent text-white hover:bg-accent-hover active:scale-95',
                ].join(' ')}
              >
                {voted ? t('vote.voted') : t('vote.vote')}
              </button>
            }
          />

          <GarageDisplay
            garage={myRecord}
            title={t('challenge.your_side')}
          />

          <button
            onClick={() => navigate('/share')}
            className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-base hover:bg-accent-hover active:scale-[0.98] transition-all"
          >
            🚀 {t('garage.share_button')}
          </button>

          <button
            onClick={() => navigate(`/g/${id}?challenge=1`)}
            className="w-full py-3 rounded-2xl border border-border text-text-secondary text-sm font-medium hover:text-text transition-colors"
          >
            {t('challenge.challenge_another')}
          </button>
        </main>
      </div>
    )
  }

  // ── Normal / challenge entry view ─────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d0d]">
      <header className="sticky top-0 z-10 bg-[#0d0d0d]/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-elevated text-text-secondary">←</button>
        <h1 className="text-base font-semibold text-text flex-1">Dream Garage</h1>
      </header>

      <main className="flex-1 px-4 py-5 flex flex-col gap-5 pb-8">

        {/* Challenge header */}
        {isChallenge && (
          <div className="bg-accent/10 border border-accent/30 rounded-2xl px-4 py-3 text-center">
            <p className="text-accent font-bold text-lg">{t('challenge.challenged_you_generic')}</p>
            <p className="text-text-secondary text-sm mt-1">{t('challenge.can_you_beat')}</p>
          </div>
        )}

        {/* Garage card */}
        <section>
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-3 font-medium">
            {isChallenge ? t('challenge.their_garage_generic') : 'Dream Garage'}
          </p>
          <ShareCard
            cars={garage.cars_json.map((c) => ({ ...c, year: 2025, category: 'suv' as const, tags: [], expo_deal: false, image_urls: [], brand_logo_url: '', color_options: [], highlights: [], specs: { engine: '', horsepower: null, torque_nm: null, drivetrain: 'FWD' as const, transmission: '', fuel_type: 'gasoline' as const, fuel_consumption_l100km: null, range_km: null, seats: 5, cargo_liters: null, ground_clearance_mm: null, towing_capacity_kg: null, safety_rating: null, zero_to_100_sec: null, warranty_years: 3 }, dealer: { id: '', name: '' }, active: true, featured: false, created_at: '' }))}
            label={garage.label}
            tagline={garage.tagline ?? undefined}
            totalPrice={garage.total_price_usd}
            budgetPct={garage.budget_used_pct}
            voteCount={voteCount}
          />
        </section>

        {/* Vote */}
        <button
          onClick={handleVote}
          disabled={voted}
          className={[
            'w-full py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98]',
            voted
              ? 'bg-surface-elevated border border-border text-text-secondary'
              : 'bg-surface-elevated border border-border text-text hover:border-accent/50 hover:text-accent',
          ].join(' ')}
        >
          {voted ? `✓ ${t('vote.voted')} (${voteCount})` : `❤️ ${t('vote.vote')} (${voteCount})`}
        </button>

        {/* Challenge CTA */}
        <button
          onClick={() => { navigate('/build') }}
          className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-base hover:bg-accent-hover active:scale-[0.98] transition-all shadow-lg shadow-accent/20"
        >
          {isChallenge ? `🔥 ${t('challenge.build_yours')}` : `🚗 ${t('landing.cta_build')}`}
        </button>

        <button
          onClick={() => navigate('/leaderboard')}
          className="text-center text-sm text-accent font-medium hover:underline"
        >
          {t('landing.leaderboard_link')} →
        </button>
      </main>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { trackSessionStart } from '../lib/analytics'
import { useLocale } from '../hooks/useLocale'
import { useGarageStore } from '../store/garageStore'
import BudgetBar from '../components/ui/BudgetBar'
import { formatPrice } from '../lib/utils'

interface FeaturedGarage {
  id: string
  label: string
  cars_json: { brand: string; model: string; price_usd: number; image_url: string }[]
  total_price_usd: number
  budget_used_pct: number
  vote_count: number
}

// ─── Featured carousel card ───────────────────────────────────────────────────

function FeaturedCard({ garage, onClick }: { garage: FeaturedGarage; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 w-64 bg-surface rounded-2xl border border-border overflow-hidden text-left hover:border-accent/40 transition-colors active:scale-[0.98]"
    >
      {/* Car thumbnails */}
      <div className="grid grid-cols-3 gap-0.5 p-2">
        {[0, 1, 2].map((i) => {
          const car = garage.cars_json[i]
          return (
            <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden bg-surface-elevated">
              {car
                ? <img src={car.image_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full" />
              }
            </div>
          )
        })}
      </div>
      <div className="px-3 pb-3 flex flex-col gap-1.5">
        <p className="text-sm font-bold text-text truncate">{garage.label}</p>
        <BudgetBar pct={garage.budget_used_pct} height="thin" />
        <div className="flex justify-between">
          <span className="text-xs text-text-secondary">{formatPrice(garage.total_price_usd)}</span>
          <span className="text-xs text-muted">❤️ {garage.vote_count}</span>
        </div>
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const RULES = ['pitch_1', 'pitch_2', 'pitch_3', 'pitch_4'] as const

export default function LandingPage() {
  const { t } = useTranslation()
  const { toggleLocale } = useLocale()
  const navigate = useNavigate()
  const garageCount = useGarageStore((s) => s.cars.filter(Boolean).length)

  const [count, setCount] = useState<number | null>(null)
  const [featured, setFeatured] = useState<FeaturedGarage[]>([])

  // Session tracking + data fetching
  useEffect(() => {
    trackSessionStart()

    // Garage count (today)
    supabase
      .from('garages')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .then(({ count: c }) => { if (c !== null) setCount(c) })

    // Featured / top voted garages
    supabase
      .from('garages')
      .select('id,label,cars_json,total_price_usd,budget_used_pct,vote_count')
      .eq('is_visible', true)
      .order('vote_count', { ascending: false })
      .limit(5)
      .then(({ data }) => { if (data) setFeatured(data as FeaturedGarage[]) })
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d0d]">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-4 py-4">
        <span className="text-xs text-muted font-medium uppercase tracking-widest">Expomovil 2025</span>
        <button
          onClick={toggleLocale}
          className="text-xs font-semibold text-text-secondary hover:text-text border border-border rounded-lg px-3 py-1.5 transition-colors"
        >
          {t('nav.lang_toggle')}
        </button>
      </nav>

      {/* Hero section */}
      <main className="flex-1 flex flex-col">
        <section className="px-6 pt-6 pb-8 flex flex-col items-center text-center gap-6">
          {/* Animated car silhouettes */}
          <div className="flex gap-3 text-5xl select-none" aria-hidden>
            <span className="animate-[bounce_2s_ease-in-out_infinite]">🚙</span>
            <span className="animate-[bounce_2s_ease-in-out_0.3s_infinite]">🛻</span>
            <span className="animate-[bounce_2s_ease-in-out_0.6s_infinite]">🚗</span>
          </div>

          <div>
            <h1 className="text-4xl font-black text-white tracking-tight leading-none">
              {t('landing.headline')}
            </h1>
            <p className="text-accent font-bold text-lg mt-1">{t('landing.subheadline')}</p>
          </div>

          {/* Rules list */}
          <ul className="flex flex-col gap-2 w-full max-w-xs text-left">
            {RULES.map((key, i) => (
              <li key={key} className="flex items-center gap-3 text-sm text-text-secondary">
                <span className="w-6 h-6 rounded-full bg-surface-elevated border border-border text-xs font-bold text-text flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                {t(`landing.${key}`)}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={() => navigate('/build')}
            className="w-full max-w-xs py-4 rounded-2xl bg-accent text-white font-black text-lg hover:bg-accent-hover active:scale-[0.97] transition-all shadow-xl shadow-accent/30 animate-pulse"
            style={{ animationDuration: '3s' }}
          >
            {t('landing.cta_build')}
          </button>

          {/* Resume in-progress garage */}
          {garageCount > 0 && (
            <button
              onClick={() => navigate('/garage')}
              className="text-sm text-accent font-medium hover:underline -mt-2"
            >
              🚗 Tenés {garageCount} carro{garageCount > 1 ? 's' : ''} en tu garaje — continuar →
            </button>
          )}

          {/* Social proof */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex flex-col items-center">
              <span className="font-black text-xl text-white">
                {count !== null ? count.toLocaleString() : '—'}
              </span>
              <span className="text-xs text-muted">{t('landing.social_proof', { count: count ?? 0 })}</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <button
              onClick={() => navigate('/leaderboard')}
              className="flex flex-col items-center gap-0.5 hover:text-accent transition-colors"
            >
              <span className="text-xl">🏆</span>
              <span className="text-xs text-muted">{t('landing.leaderboard_link')}</span>
            </button>
          </div>
        </section>

        {/* Featured garages */}
        {featured.length > 0 && (
          <section className="pb-10">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider px-5 mb-3">
              {t('landing.featured_title')}
            </h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-2">
              {featured.map((g) => (
                <FeaturedCard
                  key={g.id}
                  garage={g}
                  onClick={() => navigate(`/g/${g.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-border px-5 py-4 flex items-center justify-between">
          <span className="text-xs text-muted">© Expomovil 2025</span>
          <button
            onClick={() => navigate('/leaderboard')}
            className="text-xs text-accent font-medium hover:underline"
          >
            {t('nav.leaderboard')}
          </button>
        </footer>
      </main>
    </div>
  )
}

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
      className="shrink-0 w-64 bg-surface rounded-2xl border border-border overflow-hidden text-left transition-all duration-200 card-hover active:scale-[0.97]"
    >
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
        <p className="text-sm font-semibold text-text truncate">{garage.label}</p>
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

  useEffect(() => {
    trackSessionStart()

    supabase
      .from('garages')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .then(({ count: c }) => { if (c !== null) setCount(c) })

    supabase
      .from('garages')
      .select('id,label,cars_json,total_price_usd,budget_used_pct,vote_count')
      .eq('is_visible', true)
      .order('vote_count', { ascending: false })
      .limit(5)
      .then(({ data }) => { if (data) setFeatured(data as FeaturedGarage[]) })
  }, [])

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0a0a' }}>

      {/* Top nav */}
      <nav className="flex items-center justify-between px-5 py-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[11px] text-muted font-semibold uppercase tracking-widest">
            Expomovil 2025
          </span>
        </div>
        <div className="flex items-center gap-2">
          {garageCount > 0 && (
            <button
              onClick={() => navigate('/garage')}
              className="text-xs font-medium text-accent border border-accent/30 bg-accent/10 rounded-lg px-3 py-1.5 hover:bg-accent/20 transition-colors"
            >
              🚗 {garageCount}/3
            </button>
          )}
          <button
            onClick={toggleLocale}
            className="text-[11px] font-semibold text-text-secondary hover:text-text border border-border rounded-lg px-3 py-1.5 transition-colors"
          >
            {t('nav.lang_toggle')}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        <section className="relative overflow-hidden mesh-bg">
          {/* Dot grid background */}
          <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

          <div className="relative z-10 px-6 pt-10 pb-10 flex flex-col items-center text-center gap-7">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-full px-4 py-1.5 text-[11px] text-text-secondary font-medium backdrop-blur">
              <span className="text-accent">🏎️</span>
              Costa Rica · Expomovil
            </div>

            {/* Headline */}
            <div className="flex flex-col items-center gap-1">
              <h1 className="text-[3.5rem] font-black leading-none tracking-tighter">
                <span className="gradient-text-white">Dream</span>
                <br />
                <span style={{
                  background: 'linear-gradient(135deg, #e31e26, #ff5a5f)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Garage
                </span>
              </h1>
              <p className="text-base font-semibold text-text-secondary mt-2 tracking-wide">
                {t('landing.subheadline')}
              </p>
            </div>

            {/* Rules */}
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {RULES.map((key, i) => (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-full text-xs font-bold text-accent flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(227,30,38,0.15)', border: '1px solid rgba(227,30,38,0.3)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm text-text-secondary text-left">{t(`landing.${key}`)}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate('/build')}
              className="w-full max-w-xs py-4 rounded-2xl text-white font-black text-lg relative overflow-hidden active:scale-[0.97] transition-transform"
              style={{
                background: 'linear-gradient(135deg, #e31e26 0%, #c01b21 100%)',
                boxShadow: '0 0 40px rgba(227,30,38,0.35), 0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              {/* Shimmer overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
                  animation: 'shimmer 3s infinite',
                  backgroundSize: '200% 100%',
                }}
              />
              <span className="relative">{t('landing.cta_build')}</span>
            </button>

            {/* Stats row */}
            <div
              className="flex items-center gap-5 rounded-2xl px-5 py-3"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xl font-black text-white tabular-nums">
                  {count !== null ? count.toLocaleString() : '—'}
                </span>
                <span className="text-[10px] text-muted font-medium uppercase tracking-wider">
                  {t('landing.social_proof', { count: count ?? 0 })}
                </span>
              </div>
              <div className="w-px h-8 bg-border" />
              <button
                onClick={() => navigate('/leaderboard')}
                className="flex flex-col items-center gap-0.5 hover:text-accent transition-colors"
              >
                <span className="text-xl">🏆</span>
                <span className="text-[10px] text-muted font-medium uppercase tracking-wider">
                  {t('landing.leaderboard_link')}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Featured garages */}
        {featured.length > 0 && (
          <section className="py-6">
            <div className="flex items-center justify-between px-5 mb-4">
              <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                {t('landing.featured_title')}
              </h2>
              <button
                onClick={() => navigate('/leaderboard')}
                className="text-[11px] text-accent font-semibold hover:underline"
              >
                {t('landing.view_and_vote')} →
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1">
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
        <footer
          className="border-t border-border px-5 py-4 flex items-center justify-between mt-auto"
          style={{ background: 'rgba(255,255,255,0.01)' }}
        >
          <span className="text-[11px] text-muted">© Expomovil 2025</span>
          <button
            onClick={() => navigate('/leaderboard')}
            className="text-[11px] text-accent font-semibold hover:underline"
          >
            {t('nav.leaderboard')}
          </button>
        </footer>
      </main>
    </div>
  )
}

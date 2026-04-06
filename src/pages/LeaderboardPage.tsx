import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { castVote } from '../lib/garageApi'
import { trackLeaderboardViewed, trackVoteCast } from '../lib/analytics'
import { useGarageStore } from '../store/garageStore'
import BudgetBar from '../components/ui/BudgetBar'
import { formatPrice } from '../lib/utils'
import { buildShareUrl } from '../lib/garageUrl'

type LeaderboardTab = 'top' | 'budget' | 'shared' | 'practical' | 'rising'

interface GarageRow {
  id: string
  label: string
  tagline: string | null
  cars_json: { id: string; brand: string; model: string; price_usd: number; image_url: string }[]
  total_price_usd: number
  budget_used_pct: number
  vote_count: number
  share_count: number
  challenge_count: number
  is_featured: boolean
}

function timeAgo(updatedAt: Date): number {
  return Math.floor((Date.now() - updatedAt.getTime()) / 60000)
}

interface GarageCardProps {
  garage: GarageRow
  rank: number
  sessionId: string
  onVoted: (id: string) => void
  votedIds: Set<string>
}

function GarageCard({ garage, rank, sessionId, onVoted, votedIds }: GarageCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const hasVoted = votedIds.has(garage.id)

  async function handleVote() {
    if (hasVoted) return
    const ok = await castVote(garage.id, sessionId)
    if (ok) {
      onVoted(garage.id)
      trackVoteCast(garage.id)
    }
  }

  return (
    <div className={[
      'bg-surface rounded-2xl border overflow-hidden',
      garage.is_featured ? 'border-accent/50' : 'border-border',
    ].join(' ')}>
      {/* Rank + featured badge */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <span className={[
            'text-lg font-black',
            rank === 1 ? 'text-budget-yellow' : rank === 2 ? 'text-text-secondary' : rank === 3 ? 'text-orange-400' : 'text-muted',
          ].join(' ')}>
            #{rank}
          </span>
          {garage.is_featured && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded-full">
              {t('leaderboard.staff_pick')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>❤️ {garage.vote_count}</span>
          <span>🔗 {garage.share_count + garage.challenge_count}</span>
        </div>
      </div>

      {/* Car images */}
      <div className="grid grid-cols-3 gap-1 px-4 pb-2">
        {[0, 1, 2].map((i) => {
          const car = garage.cars_json[i]
          return (
            <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden bg-surface-elevated">
              {car
                ? <img src={car.image_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-muted text-xs">—</div>
              }
            </div>
          )
        })}
      </div>

      {/* Label + budget */}
      <div className="px-4 pb-3 flex flex-col gap-2">
        <div>
          <p className="text-sm font-bold text-text">{garage.label}</p>
          {garage.tagline && <p className="text-xs text-muted italic">"{garage.tagline}"</p>}
        </div>
        <BudgetBar pct={garage.budget_used_pct} height="thin" />
        <p className="text-xs text-text-secondary">{formatPrice(garage.total_price_usd)} / $50,000</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={() => navigate(`/g/${garage.id}`)}
          className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:text-text hover:border-accent/40 transition-colors"
        >
          {t('leaderboard.view')}
        </button>
        <button
          onClick={handleVote}
          disabled={hasVoted}
          className={[
            'flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95',
            hasVoted
              ? 'bg-accent/15 text-accent border border-accent/40'
              : 'bg-accent text-white hover:bg-accent-hover',
          ].join(' ')}
        >
          {hasVoted ? t('vote.voted') : t('leaderboard.vote')}
        </button>
        <button
          onClick={() => {
            const url = buildShareUrl(garage.id, true)
            navigator.clipboard.writeText(url).catch(() => {})
          }}
          className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:text-text hover:border-accent/40 transition-colors"
        >
          {t('leaderboard.challenge')}
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { key: LeaderboardTab; labelKey: string }[] = [
  { key: 'top', labelKey: 'leaderboard.tab_top' },
  { key: 'budget', labelKey: 'leaderboard.tab_budget' },
  { key: 'shared', labelKey: 'leaderboard.tab_shared' },
  { key: 'practical', labelKey: 'leaderboard.tab_practical' },
  { key: 'rising', labelKey: 'leaderboard.tab_rising' },
]

export default function LeaderboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const sessionId = useGarageStore((s) => s.sessionId)

  const [activeTab, setActiveTab] = useState<LeaderboardTab>('top')
  const [garages, setGarages] = useState<GarageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState(new Date())
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())

  async function fetchLeaderboard(tab: LeaderboardTab) {
    setLoading(true)
    let query = supabase
      .from('garages')
      .select('id,label,tagline,cars_json,total_price_usd,budget_used_pct,vote_count,share_count,challenge_count,is_featured')
      .eq('is_visible', true)
      .limit(20)

    switch (tab) {
      case 'top':
        query = query.order('vote_count', { ascending: false })
        break
      case 'budget':
        // Closest to $50,000 without going over
        query = query.lte('total_price_usd', 50000).order('total_price_usd', { ascending: false })
        break
      case 'shared':
        query = query.order('share_count', { ascending: false })
        break
      case 'practical':
        // Proxy: highest budget utilisation — practical builders max out their budget
        query = query.order('budget_used_pct', { ascending: false })
        break
      case 'rising':
        // Most recent garages — acts as "rising" for MVP
        query = query.order('created_at', { ascending: false }).limit(20)
        break
    }

    const { data, error } = await query
    if (!error && data) {
      // Featured garages float to the top
      const sorted = [...(data as GarageRow[])].sort((a, b) =>
        a.is_featured === b.is_featured ? 0 : a.is_featured ? -1 : 1,
      )
      setGarages(sorted)
    } else {
      setGarages([])
    }
    setUpdatedAt(new Date())
    setLoading(false)
  }

  useEffect(() => {
    fetchLeaderboard(activeTab)
    trackLeaderboardViewed(activeTab)
  }, [activeTab])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchLeaderboard(activeTab), 60_000)
    return () => clearInterval(interval)
  }, [activeTab])

  function handleVoted(id: string) {
    setVotedIds((prev) => new Set([...prev, id]))
    setGarages((prev) =>
      prev.map((g) => (g.id === id ? { ...g, vote_count: g.vote_count + 1 } : g)),
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d0d]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0d0d0d]/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-elevated text-text-secondary hover:text-text transition-colors"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-text">🏆 {t('leaderboard.title')}</h1>
          <p className="text-[11px] text-muted">
            {t('leaderboard.updated_ago', { minutes: timeAgo(updatedAt) })}
          </p>
        </div>
        <button
          onClick={() => navigate('/build')}
          className="text-xs font-semibold text-accent hover:underline"
        >
          {t('landing.cta_build')}
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-4 py-3 border-b border-border">
        {TABS.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={[
              'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
              activeTab === key
                ? 'bg-accent text-white'
                : 'bg-surface-elevated text-text-secondary border border-border hover:border-accent/50',
            ].join(' ')}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* List */}
      <main className="flex-1 px-4 py-4 flex flex-col gap-3 pb-10">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-surface-elevated animate-pulse" />
            ))}
          </div>
        ) : garages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <span className="text-4xl">🏁</span>
            <p className="text-text-secondary">{t('leaderboard.empty')}</p>
            <button
              onClick={() => navigate('/build')}
              className="text-accent text-sm font-semibold hover:underline"
            >
              {t('landing.cta_build')}
            </button>
          </div>
        ) : (
          garages.map((g, i) => (
            <GarageCard
              key={g.id}
              garage={g}
              rank={i + 1}
              sessionId={sessionId}
              onVoted={handleVoted}
              votedIds={votedIds}
            />
          ))
        )}
      </main>
    </div>
  )
}

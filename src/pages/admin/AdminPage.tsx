/**
 * Admin Dashboard — /admin
 * Password-protected via a simple env-var PIN.
 * Shows real-time metrics, top cars, and a "Feature this garage" control.
 */
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN ?? '1234'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  total_garages: number
  garages_today: number
  total_shares: number
  total_votes: number
  total_sessions: number
}

interface TopCar {
  car_id: string
  add_count: number
}

interface RecentGarage {
  id: string
  label: string
  total_price_usd: number
  vote_count: number
  is_featured: boolean
  created_at: string
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-1">
      <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
      <p className={['text-2xl font-black', accent ? 'text-accent' : 'text-text'].join(' ')}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)

  const [stats, setStats] = useState<Stats | null>(null)
  const [topCars, setTopCars] = useState<TopCar[]>([])
  const [recent, setRecent] = useState<RecentGarage[]>([])
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [featureLoading, setFeatureLoading] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const todayISO = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()

    // Run all queries in parallel
    const [
      { count: totalGarages },
      { count: garagesToday },
      { count: totalShares },
      { count: totalVotes },
      { count: totalSessions },
      { data: carsData },
      { data: recentData },
    ] = await Promise.all([
      supabase.from('garages').select('*', { count: 'exact', head: true }),
      supabase.from('garages').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'share_tapped'),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'session_start'),
      supabase.from('car_stats').select('car_id,add_count').order('add_count', { ascending: false }).limit(10),
      supabase.from('garages').select('id,label,total_price_usd,vote_count,is_featured,created_at').order('created_at', { ascending: false }).limit(20),
    ])

    setStats({
      total_garages: totalGarages ?? 0,
      garages_today: garagesToday ?? 0,
      total_shares: totalShares ?? 0,
      total_votes: totalVotes ?? 0,
      total_sessions: totalSessions ?? 0,
    })
    setTopCars((carsData ?? []) as TopCar[])
    setRecent((recentData ?? []) as RecentGarage[])
    setLastRefresh(new Date())
  }, [])

  useEffect(() => {
    if (!authed) return
    fetchData()
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [authed, fetchData])

  async function toggleFeature(garageId: string, current: boolean) {
    setFeatureLoading(garageId)
    await supabase.from('garages').update({ is_featured: !current }).eq('id', garageId)
    setRecent((prev) => prev.map((g) => g.id === garageId ? { ...g, is_featured: !current } : g))
    setFeatureLoading(null)
  }

  // ── Auth gate ─────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d0d0d]">
        <div className="bg-surface border border-border rounded-2xl p-6 w-80 flex flex-col gap-4">
          <h1 className="text-lg font-bold text-text text-center">Admin</h1>
          <input
            type="password"
            placeholder="PIN"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setPinError(false) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (pin === ADMIN_PIN) setAuthed(true)
                else setPinError(true)
              }
            }}
            className="bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text text-center text-2xl tracking-widest focus:outline-none focus:border-accent/60"
          />
          {pinError && <p className="text-budget-red text-xs text-center">PIN incorrecto</p>}
          <button
            onClick={() => {
              if (pin === ADMIN_PIN) setAuthed(true)
              else setPinError(true)
            }}
            className="w-full py-3 bg-accent rounded-xl text-white font-semibold hover:bg-accent-hover transition-colors"
          >
            Entrar
          </button>
        </div>
      </div>
    )
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0d0d0d] px-4 py-6 flex flex-col gap-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-text">Dashboard Admin</h1>
          <p className="text-xs text-muted">Actualizado: {lastRefresh.toLocaleTimeString()}</p>
        </div>
        <button
          onClick={fetchData}
          className="text-xs font-semibold text-accent hover:underline"
        >
          ↻ Refrescar
        </button>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Garajes totales" value={stats.total_garages} accent />
          <StatTile label="Garajes hoy" value={stats.garages_today} accent />
          <StatTile label="Shares" value={stats.total_shares} />
          <StatTile label="Votos" value={stats.total_votes} />
          <StatTile label="Sesiones" value={stats.total_sessions} />
          <StatTile
            label="Tasa de share"
            value={
              stats.total_garages > 0
                ? `${Math.round((stats.total_shares / stats.total_garages) * 100)}%`
                : '—'
            }
          />
        </div>
      )}

      {/* Top cars */}
      {topCars.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">
            Carros más agregados
          </h2>
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            {topCars.map((car, i) => (
              <div key={car.car_id} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-muted w-5">{i + 1}</span>
                  <span className="text-sm text-text font-medium truncate">{car.car_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-1.5 rounded-full bg-accent"
                    style={{ width: `${Math.round((car.add_count / (topCars[0]?.add_count || 1)) * 80)}px` }}
                  />
                  <span className="text-xs text-text-secondary tabular-nums w-8 text-right">{car.add_count}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent garages + feature toggle */}
      <section>
        <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">
          Garajes recientes
        </h2>
        <div className="flex flex-col gap-2">
          {recent.map((g) => (
            <div key={g.id} className="bg-surface rounded-2xl border border-border px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text truncate">{g.label}</p>
                <p className="text-xs text-muted">
                  ${g.total_price_usd.toLocaleString()} · ❤️ {g.vote_count} · {new Date(g.created_at).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => toggleFeature(g.id, g.is_featured)}
                disabled={featureLoading === g.id}
                className={[
                  'shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all',
                  g.is_featured
                    ? 'bg-accent border-accent text-white'
                    : 'bg-surface-elevated border-border text-text-secondary hover:border-accent/50',
                ].join(' ')}
              >
                {featureLoading === g.id ? '…' : g.is_featured ? '★ Destacado' : '☆ Destacar'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

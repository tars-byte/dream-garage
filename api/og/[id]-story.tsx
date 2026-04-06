/**
 * Vertical OG Image — 1080×1920 (Instagram / TikTok Stories format)
 * Route: GET /api/og/:id-story.png
 */
import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

const BUDGET = 50_000

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US')
}

interface CarSnap {
  brand: string
  model: string
  price_usd: number
  image_url: string
}

interface GarageRow {
  label: string
  tagline: string | null
  cars_json: CarSnap[]
  total_price_usd: number
  budget_used_pct: number
}

export default async function handler(req: Request) {
  const url = new URL(req.url)
  const rawId = url.pathname.split('/').pop()?.replace(/-story\.png$/, '') ?? ''

  if (!rawId) return new Response('Missing id', { status: 400 })

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? ''
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY ?? ''

  let garage: GarageRow = {
    label: 'Dream Garage',
    tagline: null,
    cars_json: [],
    total_price_usd: 0,
    budget_used_pct: 0,
  }

  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/garages?id=eq.${rawId}&select=label,tagline,cars_json,total_price_usd,budget_used_pct&limit=1`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
      )
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) garage = data[0]
    } catch { /* fallback */ }
  }

  const cars = garage.cars_json.slice(0, 3)
  const pct = Math.min(100, Math.round(garage.budget_used_pct))
  const barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#eab308' : '#22c55e'

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1920,
          background: '#111',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontFamily: 'system-ui, sans-serif',
          color: '#f3f4f6',
          position: 'relative',
          padding: '80px 60px',
        }}
      >
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.025) 0px,rgba(255,255,255,0.025) 1px,transparent 1px,transparent 12px)',
        }} />

        {/* Top label */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 60, zIndex: 1 }}>
          <span style={{ fontSize: 22, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 5 }}>
            Expomovil 2025
          </span>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#e31e26', textTransform: 'uppercase', letterSpacing: 4 }}>
            $50K Challenge
          </span>
        </div>

        {/* Garage label */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 64, zIndex: 1 }}>
          <span style={{ fontSize: 64, fontWeight: 900, color: '#ffffff', textAlign: 'center', lineHeight: 1.05 }}>
            {garage.label}
          </span>
          {garage.tagline && (
            <span style={{ fontSize: 28, color: '#9ca3af', fontStyle: 'italic', textAlign: 'center' }}>
              "{garage.tagline}"
            </span>
          )}
        </div>

        {/* Car images — stacked vertically in large format */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', marginBottom: 64, zIndex: 1 }}>
          {[0, 1, 2].map((i) => {
            const car = cars[i]
            return (
              <div key={i} style={{
                width: '100%',
                height: 320,
                borderRadius: 28,
                overflow: 'hidden',
                background: '#1a1a1a',
                border: car ? '2px solid #2e2e2e' : '2px dashed #2e2e2e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
                {car ? (
                  <>
                    <img src={car.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    {/* Car name overlay */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                      padding: '20px 24px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                    }}>
                      <span style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>
                        {car.brand} {car.model}
                      </span>
                      <span style={{ fontSize: 26, fontWeight: 800, color: '#e31e26' }}>
                        {fmt(car.price_usd)}
                      </span>
                    </div>
                  </>
                ) : (
                  <span style={{ fontSize: 48, color: '#374151' }}>+</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Budget section */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 60, zIndex: 1 }}>
          <div style={{ width: '100%', height: 14, background: '#2e2e2e', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 99 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 30, color: '#9ca3af' }}>{fmt(garage.total_price_usd)} / {fmt(BUDGET)}</span>
            <span style={{ fontSize: 30, fontWeight: 800, color: barColor }}>{pct}%</span>
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{
          position: 'absolute', bottom: 80, left: 60, right: 60,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          borderTop: '1px solid #2e2e2e', paddingTop: 40,
          zIndex: 1,
        }}>
          <span style={{ fontSize: 40, fontWeight: 900, color: '#e31e26', textAlign: 'center' }}>
            ¿Podés hacer uno mejor?
          </span>
          <span style={{
            fontSize: 26, color: '#fff', background: '#e31e26',
            paddingTop: 16, paddingBottom: 16, paddingLeft: 48, paddingRight: 48,
            borderRadius: 60, fontWeight: 700,
          }}>
            dreamgarage.expomovil.cr
          </span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
    },
  )
}

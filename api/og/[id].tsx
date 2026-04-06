/**
 * OG Image Edge Function
 * Route: GET /api/og/:id.png
 *
 * Renders the 1200×630 share card for a saved garage.
 * Uses @vercel/og (Satori under the hood) to produce a PNG.
 * Cached at CDN edge for 24 hours after first generation.
 *
 * Deploy: Vercel (edge runtime)
 */
import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

const BUDGET = 50_000

function formatPrice(n: number) {
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
  // Strip .png suffix from the id
  const rawId = url.pathname.split('/').pop()?.replace(/\.png$/, '') ?? ''

  if (!rawId) {
    return new Response('Missing garage id', { status: 400 })
  }

  // ── Fetch garage from Supabase ────────────────────────────────────────────
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? ''
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY ?? ''

  let garage: GarageRow | null = null

  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/garages?id=eq.${rawId}&select=label,tagline,cars_json,total_price_usd,budget_used_pct&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        },
      )
      const data = await res.json()
      garage = Array.isArray(data) && data.length > 0 ? (data[0] as GarageRow) : null
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback if Supabase not available
  if (!garage) {
    garage = {
      label: 'Dream Garage',
      tagline: null,
      cars_json: [],
      total_price_usd: 0,
      budget_used_pct: 0,
    }
  }

  const cars = garage.cars_json.slice(0, 3)
  const pct = Math.min(100, Math.round(garage.budget_used_pct))
  const barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#eab308' : '#22c55e'

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#111',
          display: 'flex',
          flexDirection: 'column',
          padding: '48px',
          fontFamily: 'system-ui, sans-serif',
          color: '#f3f4f6',
          position: 'relative',
        }}
      >
        {/* Background grid texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 10px)',
          }}
        />

        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 3 }}>
              Expomovil 2025
            </span>
            <span style={{ fontSize: 36, fontWeight: 700, color: '#ffffff', lineHeight: 1.1 }}>
              {garage.label}
            </span>
            {garage.tagline && (
              <span style={{ fontSize: 16, color: '#9ca3af', fontStyle: 'italic' }}>
                "{garage.tagline}"
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 3 }}>
              $50K Challenge
            </span>
          </div>
        </div>

        {/* Car images row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
          {[0, 1, 2].map((i) => {
            const car = cars[i]
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  aspectRatio: '4/3',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: car ? '1px solid #2e2e2e' : '2px dashed #2e2e2e',
                }}
              >
                {car ? (
                  <img
                    src={car.image_url}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt=""
                  />
                ) : (
                  <span style={{ color: '#6b7280', fontSize: 24 }}>—</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Car list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {cars.map((car, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, color: '#9ca3af' }}>
                {car.brand} {car.model}
              </span>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#f3f4f6' }}>
                {formatPrice(car.price_usd)}
              </span>
            </div>
          ))}
        </div>

        {/* Budget bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ width: '100%', height: 8, background: '#2e2e2e', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 99 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: '#9ca3af' }}>
              {formatPrice(garage.total_price_usd)} / {formatPrice(BUDGET)}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: barColor }}>{pct}%</span>
          </div>
        </div>

        {/* Footer CTA */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: 48,
            right: 48,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #2e2e2e',
            paddingTop: 16,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, color: '#e31e26' }}>
            ¿Podés hacer uno mejor?
          </span>
          <span style={{ fontSize: 14, color: '#6b7280' }}>dreamgarage.expomovil.cr</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    },
  )
}

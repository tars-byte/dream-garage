/**
 * ShareCard — the visual preview of the garage share image.
 * Rendered in HTML for the share screen preview.
 * The same design is replicated in the OG Edge Function using Satori.
 */
import { useTranslation } from 'react-i18next'
import type { Car } from '../../types'
import BudgetBar from '../ui/BudgetBar'
import { formatPrice } from '../../lib/utils'
import { BUDGET_TOTAL } from '../../types'

interface ShareCardProps {
  cars: (Car | null)[]
  label: string
  tagline?: string
  totalPrice: number
  budgetPct: number
  voteCount?: number
}

export default function ShareCard({
  cars,
  label,
  tagline,
  totalPrice,
  budgetPct,
  voteCount,
}: ShareCardProps) {
  const { t } = useTranslation()
  const filledCars = cars.filter((c): c is Car => c !== null)
  const displayLabel = label || t('garage.default_label')

  return (
    <div className="relative bg-[#111] rounded-2xl overflow-hidden border border-border w-full">
      {/* Dark carbon-fiber texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            #fff 0px,
            #fff 1px,
            transparent 1px,
            transparent 8px
          )`,
        }}
      />

      <div className="relative p-4 flex flex-col gap-3">
        {/* Top row: Expomovil logo placeholder + label */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest font-medium">
              Expomovil 2025
            </p>
            <p className="text-base font-bold text-white leading-tight">{displayLabel}</p>
            {tagline && (
              <p className="text-xs text-text-secondary italic mt-0.5">"{tagline}"</p>
            )}
          </div>
          <div className="text-[10px] text-muted text-right shrink-0">
            <span className="block font-bold text-accent text-sm">{t('common.budget_label')}</span>
          </div>
        </div>

        {/* Car images row */}
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => {
            const car = cars[i]
            return (
              <div
                key={i}
                className="aspect-[4/3] rounded-lg overflow-hidden bg-surface-elevated flex items-center justify-center"
              >
                {car ? (
                  <img
                    src={car.image_url}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-muted text-xs">—</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Car list */}
        <div className="flex flex-col gap-1">
          {filledCars.map((car) => (
            <div key={car.id} className="flex items-center justify-between">
              <span className="text-xs text-text-secondary truncate flex-1">
                {car.brand} {car.model}
              </span>
              <span className="text-xs font-semibold text-text shrink-0 ml-2">
                {formatPrice(car.price_usd)}
              </span>
            </div>
          ))}
          {filledCars.length < 3 && (
            Array.from({ length: 3 - filledCars.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center justify-between opacity-30">
                <span className="text-xs text-muted">—</span>
                <span className="text-xs text-muted">—</span>
              </div>
            ))
          )}
        </div>

        {/* Budget bar */}
        <div className="flex flex-col gap-1.5">
          <BudgetBar pct={budgetPct} height="thin" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              {formatPrice(totalPrice)}
              <span className="text-muted"> / {formatPrice(BUDGET_TOTAL)}</span>
            </span>
            <span className="text-xs text-muted">{Math.round(budgetPct)}%</span>
          </div>
        </div>

        {/* CTA footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <p className="text-[11px] text-accent font-semibold">{t('share.card_cta')}</p>
          {voteCount !== undefined && voteCount > 0 && (
            <span className="text-[11px] text-muted">❤️ {voteCount}</span>
          )}
        </div>
      </div>
    </div>
  )
}

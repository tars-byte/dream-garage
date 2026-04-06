import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import confetti from 'canvas-confetti'
import type { Car } from '../types'
import {
  useGarageStore,
  selectTotalPrice,
  selectBudgetPct,
  selectBudgetRemaining,
  selectCarCount,
} from '../store/garageStore'
import BudgetBar from '../components/ui/BudgetBar'
import { ToastContainer, useToast } from '../components/ui/Toast'
import { formatPrice } from '../lib/utils'
import { BUDGET_TOTAL } from '../types'

// ─── Empty bay slot ───────────────────────────────────────────────────────────

function EmptyBay({ index, onClick }: { index: number; onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-2xl aspect-[3/4] w-full hover:border-accent/50 hover:bg-accent/5 transition-all group"
    >
      <span className="text-2xl text-muted group-hover:text-accent transition-colors">+</span>
      <span className="text-xs text-muted group-hover:text-accent transition-colors font-medium">
        {t('garage.bay_label', { n: index + 1 })}
      </span>
    </button>
  )
}

// ─── Filled bay slot ──────────────────────────────────────────────────────────

function FilledBay({
  car,
  onRemove,
}: {
  car: Car
  onRemove: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="relative flex flex-col rounded-2xl overflow-hidden border border-accent/40 bg-surface group">
      {/* Image */}
      <div className="aspect-[3/2] overflow-hidden bg-surface-elevated">
        <img
          src={car.image_url}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="p-2 flex flex-col gap-0.5">
        <p className="text-[11px] text-text-secondary font-medium leading-none">{car.brand}</p>
        <p className="text-xs font-bold text-text leading-tight">{car.model}</p>
        <p className="text-[11px] text-muted leading-none truncate">{car.trim}</p>
        <p className="text-xs font-semibold text-accent mt-1">{formatPrice(car.price_usd)}</p>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white text-xs hover:bg-budget-red/80 transition-colors"
        aria-label={t('garage.remove_car')}
      >
        ×
      </button>
    </div>
  )
}

// ─── Inline editable field ────────────────────────────────────────────────────

function EditableField({
  value,
  placeholder,
  onChange,
  maxLength,
  label,
}: {
  value: string
  placeholder: string
  onChange: (v: string) => void
  maxLength: number
  label: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-text-secondary uppercase tracking-wider font-medium">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent/60 transition-colors"
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GaragePreviewPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toasts, show: showToast, dismiss } = useToast()

  const cars = useGarageStore((s) => s.cars)
  const label = useGarageStore((s) => s.label)
  const tagline = useGarageStore((s) => s.tagline)
  const removeCar = useGarageStore((s) => s.removeCar)
  const setLabel = useGarageStore((s) => s.setLabel)
  const setTagline = useGarageStore((s) => s.setTagline)

  const total = selectTotalPrice(cars)
  const remaining = selectBudgetRemaining(cars)
  const pct = selectBudgetPct(cars)
  const count = selectCarCount(cars)

  // Confetti when all 3 bays are filled
  const prevCount = useRef(count)
  useEffect(() => {
    if (count === 3 && prevCount.current < 3) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.5 } })
    }
    prevCount.current = count
  }, [count])

  function handleRemove(car: Car) {
    removeCar(car.id)
    showToast({
      message: t('garage.undo_removed', { car: `${car.brand} ${car.model}` }),
      actionLabel: t('garage.undo'),
      onAction: () => {
        // Re-add the car (addCar handles budget check)
        useGarageStore.getState().addCar(car)
      },
      durationMs: 5000,
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d0d]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0d0d0d]/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/build')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-elevated text-text-secondary hover:text-text transition-colors"
        >
          ←
        </button>
        <h1 className="text-base font-semibold text-text flex-1">{t('garage.title')}</h1>
        <span className="text-xs text-muted">{count}/3</span>
      </header>

      <main className="flex-1 px-4 py-5 flex flex-col gap-6 pb-8">

        {/* ── 3 Bay grid ── */}
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => {
            const car = cars[i]
            return car ? (
              <FilledBay key={car.id} car={car} onRemove={() => handleRemove(car)} />
            ) : (
              <EmptyBay key={i} index={i} onClick={() => navigate('/build')} />
            )
          })}
        </div>

        {/* ── Budget section ── */}
        <section className="bg-surface rounded-2xl p-4 flex flex-col gap-3 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">
              {t('garage.budget_used')}
            </span>
            <span className={[
              'text-sm font-bold tabular-nums',
              pct > 90 ? 'text-budget-red' : pct > 70 ? 'text-budget-yellow' : 'text-text',
            ].join(' ')}>
              {formatPrice(total)}
              <span className="text-muted font-normal"> / {formatPrice(BUDGET_TOTAL)}</span>
            </span>
          </div>

          <BudgetBar pct={pct} />

          <p className={[
            'text-sm text-center font-medium',
            remaining <= 0 ? 'text-budget-green' : 'text-text-secondary',
          ].join(' ')}>
            {remaining <= 0
              ? t('garage.budget_full')
              : t('garage.budget_remaining', { amount: formatPrice(remaining) })}
          </p>

          {/* Pro tip nudge */}
          {remaining > 10_000 && count > 0 && count < 3 && (
            <p className="text-xs text-center text-muted bg-surface-elevated rounded-xl py-2 px-3">
              💡 {t('garage.tip_remaining', { amount: formatPrice(remaining) })}
            </p>
          )}
        </section>

        {/* ── Label & tagline ── */}
        <section className="flex flex-col gap-4">
          <EditableField
            label={t('garage.title')}
            value={label}
            placeholder={t('garage.label_placeholder')}
            onChange={setLabel}
            maxLength={40}
          />
          <EditableField
            label={`${t('garage.tagline_placeholder').split('(')[0].trim()} (opcional)`}
            value={tagline}
            placeholder={t('garage.tagline_placeholder')}
            onChange={setTagline}
            maxLength={60}
          />
        </section>

        {/* ── Actions ── */}
        <section className="flex flex-col gap-3">
          <button
            disabled={count === 0}
            onClick={() => navigate('/share')}
            className={[
              'w-full py-4 rounded-2xl font-bold text-base transition-all duration-200',
              count === 0
                ? 'bg-surface-elevated text-muted cursor-not-allowed'
                : 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-lg shadow-accent/20',
            ].join(' ')}
          >
            🚀 {t('garage.share_button')}
          </button>

          <button
            onClick={() => navigate('/build')}
            className="w-full py-3 rounded-2xl border border-border text-text-secondary text-sm font-medium hover:text-text hover:border-border/80 transition-colors"
          >
            {t('garage.keep_browsing')}
          </button>
        </section>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

import { clamp } from '../../lib/utils'

interface BudgetBarProps {
  pct: number          // 0–100+
  className?: string
  height?: 'thin' | 'normal'
}

function barColor(pct: number): string {
  if (pct > 90) return 'bg-budget-red'
  if (pct > 70) return 'bg-budget-yellow'
  return 'bg-budget-green'
}

function trackGlow(pct: number): string {
  if (pct > 90) return 'shadow-[0_0_8px_rgba(239,68,68,0.4)]'
  if (pct > 70) return 'shadow-[0_0_8px_rgba(234,179,8,0.3)]'
  return ''
}

export default function BudgetBar({ pct, className = '', height = 'normal' }: BudgetBarProps) {
  const clamped = clamp(pct, 0, 100)
  const h = height === 'thin' ? 'h-1.5' : 'h-2.5'

  return (
    <div className={`w-full bg-border rounded-full overflow-hidden ${h} ${className}`}>
      <div
        className={[
          'h-full rounded-full transition-all duration-500 ease-out',
          barColor(pct),
          trackGlow(pct),
        ].join(' ')}
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}

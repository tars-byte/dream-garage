import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGarageStore, selectBudgetPct, selectBudgetRemaining, selectCarCount } from '../../store/garageStore'
import BudgetBar from '../ui/BudgetBar'
import { formatPrice } from '../../lib/utils'

export default function GarageTrackerBar() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const cars = useGarageStore((s) => s.cars)

  const pct = selectBudgetPct(cars)
  const remaining = selectBudgetRemaining(cars)
  const count = selectCarCount(cars)

  return (
    <button
      onClick={() => navigate('/garage')}
      className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border px-4 py-3 flex flex-col gap-2 active:bg-surface-elevated transition-colors"
      aria-label={t('garage.title')}
    >
      {/* Bay indicators + remaining text */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={[
                'w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300',
                cars[i]
                  ? 'bg-accent border-accent text-white scale-110'
                  : 'border-border text-muted',
              ].join(' ')}
            >
              {cars[i] ? '✓' : i + 1}
            </div>
          ))}
          <span className="text-text-secondary text-xs ml-1">
            {count}/3
          </span>
        </div>

        <span className={[
          'text-sm font-semibold tabular-nums',
          pct > 90 ? 'text-budget-red' : pct > 70 ? 'text-budget-yellow' : 'text-budget-green',
        ].join(' ')}>
          {formatPrice(remaining)} {t('budget.remaining').replace('${{amount}} ', '')}
        </span>
      </div>

      {/* Budget bar */}
      <BudgetBar pct={pct} height="thin" />
    </button>
  )
}

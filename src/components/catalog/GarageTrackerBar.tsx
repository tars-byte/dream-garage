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
      aria-label={t('garage.title')}
      className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 flex flex-col gap-2.5 active:scale-[0.99] transition-transform"
      style={{
        background: 'rgba(14,14,14,0.85)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Bay indicators + remaining text */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={[
                'w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300',
                cars[i]
                  ? 'text-white scale-105'
                  : 'border-border text-muted',
              ].join(' ')}
              style={cars[i] ? {
                background: 'linear-gradient(135deg, #e31e26, #c01b21)',
                borderColor: 'transparent',
                boxShadow: '0 0 10px rgba(227,30,38,0.4)',
              } : undefined}
            >
              {cars[i] ? '✓' : i + 1}
            </div>
          ))}
          <span className="text-text-secondary text-xs font-medium ml-0.5">
            {count}/3
          </span>
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <span className={[
            'text-base font-black tabular-nums leading-none',
            pct > 90 ? 'text-budget-red' : pct > 70 ? 'text-budget-yellow' : 'text-budget-green',
          ].join(' ')}>
            {formatPrice(remaining)}
          </span>
          <span className="text-[10px] text-muted uppercase tracking-wider font-medium">
            restantes
          </span>
        </div>
      </div>

      {/* Budget bar */}
      <BudgetBar pct={pct} height="thin" />
    </button>
  )
}

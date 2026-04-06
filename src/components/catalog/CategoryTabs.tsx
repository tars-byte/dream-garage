import { useTranslation } from 'react-i18next'
import type { CarCategory } from '../../types'

export type CategoryFilter = CarCategory | 'all'

const CATEGORIES: CategoryFilter[] = [
  'all', 'suv', 'pickup', 'crossover', 'sedan', 'electric', 'hybrid',
  'hatchback', 'minivan', 'sport', 'luxury', 'commercial',
]

interface CategoryTabsProps {
  active: CategoryFilter
  onChange: (cat: CategoryFilter) => void
}

export default function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2">
      {CATEGORIES.map((cat) => {
        const isActive = cat === active
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={[
              'shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 active:scale-95',
              isActive
                ? 'text-white'
                : 'bg-surface-elevated text-text-secondary border border-border hover:border-white/20 hover:text-text',
            ].join(' ')}
            style={isActive ? {
              background: 'linear-gradient(135deg, #e31e26, #c01b21)',
              boxShadow: '0 2px 10px rgba(227,30,38,0.35)',
            } : undefined}
          >
            {t(`categories.${cat}`)}
          </button>
        )
      })}
    </div>
  )
}

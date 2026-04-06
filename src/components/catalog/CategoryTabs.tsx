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
              'shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-accent text-white'
                : 'bg-surface-elevated text-text-secondary border border-border hover:border-accent/50 hover:text-text',
            ].join(' ')}
          >
            {t(`categories.${cat}`)}
          </button>
        )
      })}
    </div>
  )
}

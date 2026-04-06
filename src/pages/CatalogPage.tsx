import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Car } from '../types'
import { CARS } from '../data/cars'
import CategoryTabs, { type CategoryFilter } from '../components/catalog/CategoryTabs'
import CarCard from '../components/catalog/CarCard'
import CarDetailSheet from '../components/catalog/CarDetailSheet'
import FilterDrawer, { type FilterState, DEFAULT_FILTERS, hasActiveFilters } from '../components/catalog/FilterDrawer'
import GarageTrackerBar from '../components/catalog/GarageTrackerBar'
import { useGarageStore, selectCarCount } from '../store/garageStore'
import { useToast, ToastContainer } from '../components/ui/Toast'

type SortOption = 'popular' | 'price_asc' | 'price_desc'

// Popularity proxy: featured cars first, then by price ascending
const POPULARITY_ORDER: Record<string, number> = Object.fromEntries(
  CARS.map((c, i) => [c.id, c.featured ? i : i + 100])
)

export default function CatalogPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const cars = useGarageStore((s) => s.cars)
  const carCount = selectCarCount(cars)

  const [category, setCategory] = useState<CategoryFilter>('all')
  const [sort, setSort] = useState<SortOption>('popular')
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [search, setSearch] = useState('')
  const { toasts, dismiss } = useToast()

  const filtered = useMemo(() => {
    let list = CARS.filter((c) => c.active)

    if (category !== 'all') list = list.filter((c) => c.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.brand.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q) ||
          c.trim.toLowerCase().includes(q),
      )
    }
    if (filters.priceMin > 0) list = list.filter((c) => c.price_usd >= filters.priceMin)
    if (filters.priceMax < 70000) list = list.filter((c) => c.price_usd <= filters.priceMax)
    if (filters.fuelTypes.length) list = list.filter((c) => filters.fuelTypes.includes(c.specs.fuel_type))
    if (filters.drivetrains.length) list = list.filter((c) => filters.drivetrains.includes(c.specs.drivetrain))
    if (filters.brands.length) list = list.filter((c) => filters.brands.includes(c.brand))
    if (filters.minSeats) list = list.filter((c) => c.specs.seats >= filters.minSeats!)

    switch (sort) {
      case 'price_asc': return [...list].sort((a, b) => a.price_usd - b.price_usd)
      case 'price_desc': return [...list].sort((a, b) => b.price_usd - a.price_usd)
      default: return [...list].sort((a, b) => (POPULARITY_ORDER[a.id] ?? 999) - (POPULARITY_ORDER[b.id] ?? 999))
    }
  }, [category, sort, filters, search])

  const activeFilters = hasActiveFilters(filters)

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d0d]">

      {/* Header */}
      <header
        className="sticky top-0 z-20 border-b border-border"
        style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-elevated text-text-secondary hover:text-text transition-colors"
          >
            ←
          </button>
          <h1 className="text-base font-bold text-text flex-1 tracking-tight">{t('catalog.title')}</h1>
          {carCount > 0 && (
            <button
              onClick={() => navigate('/garage')}
              className="flex items-center gap-1.5 text-accent text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'rgba(227,30,38,0.12)', border: '1px solid rgba(227,30,38,0.35)' }}
            >
              🚗 {carCount}/3
            </button>
          )}
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('catalog.search_placeholder')}
              className="w-full bg-surface-elevated border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        </div>
      </header>

      {/* Category tabs */}
      <CategoryTabs active={category} onChange={setCategory} />

      {/* Sort + Filter row */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="flex-1 bg-surface-elevated border border-border text-text text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-accent/60 appearance-none"
        >
          <option value="popular">{t('catalog.sort_popular')}</option>
          <option value="price_asc">{t('catalog.sort_price_asc')}</option>
          <option value="price_desc">{t('catalog.sort_price_desc')}</option>
        </select>

        <button
          onClick={() => setFilterOpen(true)}
          className={[
            'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors',
            activeFilters
              ? 'bg-accent border-accent text-white'
              : 'bg-surface-elevated border-border text-text-secondary hover:text-text',
          ].join(' ')}
        >
          ⚙️ {t('catalog.filter_label')}
          {activeFilters && (
            <span className="bg-white/20 rounded-full w-1.5 h-1.5 inline-block" />
          )}
        </button>
      </div>

      {/* Car grid */}
      <main className="flex-1 px-3 pt-3 pb-28">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl mb-3">🔍</span>
            <p className="text-text-secondary">{t('catalog.no_results')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                onViewDetail={setSelectedCar}
              />
            ))}
          </div>
        )}
      </main>

      {/* Drawers */}
      <FilterDrawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
      />
      <CarDetailSheet
        car={selectedCar}
        onClose={() => setSelectedCar(null)}
      />

      {/* Persistent bottom bar */}
      <GarageTrackerBar />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

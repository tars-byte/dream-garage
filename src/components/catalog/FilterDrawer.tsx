import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BottomSheet from '../ui/BottomSheet'
import Button from '../ui/Button'
import type { FuelType, Drivetrain } from '../../types'
import { CATALOG_BRANDS } from '../../data/cars'

export interface FilterState {
  priceMin: number
  priceMax: number
  fuelTypes: FuelType[]
  drivetrains: Drivetrain[]
  brands: string[]
  minSeats: number | null
}

export const DEFAULT_FILTERS: FilterState = {
  priceMin: 0,
  priceMax: 70000,
  fuelTypes: [],
  drivetrains: [],
  brands: [],
  minSeats: null,
}

export function hasActiveFilters(f: FilterState): boolean {
  return (
    f.priceMin > 0 ||
    f.priceMax < 70000 ||
    f.fuelTypes.length > 0 ||
    f.drivetrains.length > 0 ||
    f.brands.length > 0 ||
    f.minSeats !== null
  )
}

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  onChange: (f: FilterState) => void
}

const FUEL_OPTIONS: { value: FuelType; labelKey: string }[] = [
  { value: 'gasoline', labelKey: 'Gasolina' },
  { value: 'diesel', labelKey: 'Diésel' },
  { value: 'hybrid', labelKey: 'Híbrido' },
  { value: 'electric', labelKey: 'Eléctrico' },
  { value: 'plug-in-hybrid', labelKey: 'Híbrido enchufable' },
]

const DRIVETRAIN_OPTIONS: { value: Drivetrain; label: string }[] = [
  { value: 'FWD', label: 'FWD' },
  { value: 'AWD', label: 'AWD' },
  { value: '4x4', label: '4x4' },
  { value: 'RWD', label: 'RWD' },
]

const SEATS_OPTIONS = [5, 7, 8]

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-1.5 rounded-full text-sm border transition-all duration-150',
        active
          ? 'bg-accent border-accent text-white font-medium'
          : 'bg-surface-elevated border-border text-text-secondary hover:border-accent/50',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]
}

export default function FilterDrawer({ isOpen, onClose, filters, onChange }: FilterDrawerProps) {
  const { t } = useTranslation()
  const [local, setLocal] = useState<FilterState>(filters)

  // Sync when opening
  const handleOpen = () => setLocal(filters)

  function apply() {
    onChange(local)
    onClose()
  }

  function clear() {
    const reset = { ...DEFAULT_FILTERS }
    setLocal(reset)
    onChange(reset)
    onClose()
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => { handleOpen(); onClose() }}
      title={t('catalog.filter_title')}
      maxHeightClass="max-h-[90vh]"
    >
      <div className="px-4 pb-6 flex flex-col gap-6">

        {/* Price range */}
        <section>
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-3 font-medium">
            {t('catalog.filter_price_range')}
          </p>
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <label className="text-xs text-muted mb-1 block">Mín</label>
              <input
                type="number"
                step={1000}
                min={0}
                max={local.priceMax}
                value={local.priceMin}
                onChange={(e) => setLocal((s) => ({ ...s, priceMin: +e.target.value }))}
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/60"
              />
            </div>
            <span className="text-muted text-sm mt-4">—</span>
            <div className="flex-1">
              <label className="text-xs text-muted mb-1 block">Máx</label>
              <input
                type="number"
                step={1000}
                min={local.priceMin}
                max={100000}
                value={local.priceMax}
                onChange={(e) => setLocal((s) => ({ ...s, priceMax: +e.target.value }))}
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/60"
              />
            </div>
          </div>
        </section>

        {/* Fuel type */}
        <section>
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-3 font-medium">
            {t('catalog.filter_fuel')}
          </p>
          <div className="flex flex-wrap gap-2">
            {FUEL_OPTIONS.map((f) => (
              <ToggleChip
                key={f.value}
                active={local.fuelTypes.includes(f.value)}
                onClick={() => setLocal((s) => ({ ...s, fuelTypes: toggle(s.fuelTypes, f.value) }))}
              >
                {f.labelKey}
              </ToggleChip>
            ))}
          </div>
        </section>

        {/* Drivetrain */}
        <section>
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-3 font-medium">
            {t('catalog.filter_drivetrain')}
          </p>
          <div className="flex flex-wrap gap-2">
            {DRIVETRAIN_OPTIONS.map((d) => (
              <ToggleChip
                key={d.value}
                active={local.drivetrains.includes(d.value)}
                onClick={() => setLocal((s) => ({ ...s, drivetrains: toggle(s.drivetrains, d.value) }))}
              >
                {d.label}
              </ToggleChip>
            ))}
          </div>
        </section>

        {/* Seats */}
        <section>
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-3 font-medium">
            {t('catalog.filter_seats')} (mín.)
          </p>
          <div className="flex flex-wrap gap-2">
            {SEATS_OPTIONS.map((s) => (
              <ToggleChip
                key={s}
                active={local.minSeats === s}
                onClick={() => setLocal((st) => ({ ...st, minSeats: st.minSeats === s ? null : s }))}
              >
                {s}+
              </ToggleChip>
            ))}
          </div>
        </section>

        {/* Brands */}
        <section>
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-3 font-medium">
            {t('catalog.filter_brand')}
          </p>
          <div className="flex flex-wrap gap-2">
            {CATALOG_BRANDS.map((b) => (
              <ToggleChip
                key={b}
                active={local.brands.includes(b)}
                onClick={() => setLocal((s) => ({ ...s, brands: toggle(s.brands, b) }))}
              >
                {b}
              </ToggleChip>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="ghost" size="lg" fullWidth onClick={clear}>
            {t('catalog.filter_clear')}
          </Button>
          <Button variant="primary" size="lg" fullWidth onClick={apply}>
            {t('catalog.filter_apply')}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

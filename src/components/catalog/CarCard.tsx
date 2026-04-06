import { useTranslation } from 'react-i18next'
import type { Car } from '../../types'
import Badge from '../ui/Badge'
import { formatPrice } from '../../lib/utils'
import { useGarageStore, selectCanAfford, selectHasCarById } from '../../store/garageStore'

interface CarCardProps {
  car: Car
  onViewDetail: (car: Car) => void
}

export default function CarCard({ car, onViewDetail }: CarCardProps) {
  const { t } = useTranslation()
  const cars = useGarageStore((s) => s.cars)
  const addCar = useGarageStore((s) => s.addCar)
  const removeCar = useGarageStore((s) => s.removeCar)

  const inGarage = selectHasCarById(cars, car.id)
  const canAfford = selectCanAfford(cars, car.price_usd)
  const disabled = !inGarage && !canAfford

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (inGarage) {
      removeCar(car.id)
    } else if (canAfford) {
      addCar(car)
    }
  }

  return (
    <div
      onClick={() => onViewDetail(car)}
      className={[
        'relative bg-surface rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer group',
        inGarage ? 'border-accent/60' : 'border-border hover:border-border/80',
        disabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
        <img
          src={car.image_url}
          alt={`${car.brand} ${car.model}`}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Top-left badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {car.expo_deal && (
            <Badge variant="expo">{t('catalog.expo_deal')}</Badge>
          )}
          {car.specs.fuel_type === 'electric' && (
            <Badge variant="electric">⚡ EV</Badge>
          )}
          {(car.specs.fuel_type === 'hybrid' || car.specs.fuel_type === 'plug-in-hybrid') && (
            <Badge variant="hybrid">🌿 {car.specs.fuel_type === 'plug-in-hybrid' ? 'PHEV' : t('categories.hybrid')}</Badge>
          )}
        </div>

        {/* 4x4 badge top-right */}
        {(car.specs.drivetrain === '4x4' || car.specs.drivetrain === 'AWD') && (
          <div className="absolute top-2 right-2">
            <Badge variant="fourwd">{car.specs.drivetrain}</Badge>
          </div>
        )}

        {/* In-garage overlay */}
        {inGarage && (
          <div className="absolute inset-0 bg-accent/10 flex items-center justify-center">
            <div className="bg-accent rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2">
        <div>
          <p className="text-xs text-text-secondary font-medium">{car.brand}</p>
          <p className="text-sm font-semibold text-text leading-tight">{car.model}</p>
          <p className="text-xs text-muted">{car.trim}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-bold text-text">{formatPrice(car.price_usd)}</span>

          <button
            onClick={handleToggle}
            disabled={disabled}
            className={[
              'shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
              inGarage
                ? 'bg-accent/15 text-accent border border-accent/40 hover:bg-accent/25'
                : disabled
                ? 'bg-surface-elevated text-muted border border-border cursor-not-allowed'
                : 'bg-accent text-white hover:bg-accent-hover active:scale-95',
            ].join(' ')}
            title={disabled ? t('catalog.over_budget') : ''}
          >
            {inGarage ? t('catalog.in_garage') : t('catalog.add_to_garage')}
          </button>
        </div>
      </div>
    </div>
  )
}

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
        inGarage
          ? 'border-accent/50'
          : disabled
          ? 'border-border opacity-50'
          : 'border-border card-hover',
      ].join(' ')}
      style={inGarage ? { boxShadow: '0 0 0 1px rgba(227,30,38,0.3), 0 4px 20px rgba(227,30,38,0.1)' } : undefined}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
        <img
          src={car.image_url}
          alt={`${car.brand} ${car.model}`}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Bottom gradient for text legibility */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }}
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

        {/* Price over bottom gradient */}
        <div className="absolute bottom-2 left-3">
          <span className="text-sm font-bold text-white drop-shadow-sm">
            {formatPrice(car.price_usd)}
          </span>
        </div>

        {/* In-garage overlay */}
        {inGarage && (
          <div className="absolute inset-0 bg-accent/10 flex items-end justify-end p-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(227,30,38,0.9)', boxShadow: '0 0 8px rgba(227,30,38,0.5)' }}
            >
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2.5">
        <div>
          <p className="text-[10px] text-muted font-semibold uppercase tracking-wider">{car.brand}</p>
          <p className="text-sm font-bold text-text leading-tight">{car.model}</p>
          <p className="text-[11px] text-muted mt-0.5">{car.trim}</p>
        </div>

        <button
          onClick={handleToggle}
          disabled={disabled}
          className={[
            'w-full py-2 rounded-xl text-xs font-bold transition-all duration-150',
            inGarage
              ? 'text-accent border border-accent/40'
              : disabled
              ? 'bg-surface-elevated text-muted border border-border cursor-not-allowed'
              : 'text-white active:scale-95',
          ].join(' ')}
          style={inGarage
            ? { background: 'rgba(227,30,38,0.1)' }
            : !disabled
            ? {
                background: 'linear-gradient(135deg, #e31e26, #c01b21)',
                boxShadow: '0 2px 8px rgba(227,30,38,0.3)',
              }
            : undefined}
          title={disabled ? t('catalog.over_budget') : ''}
        >
          {inGarage ? t('catalog.in_garage') : t('catalog.add_to_garage')}
        </button>
      </div>
    </div>
  )
}

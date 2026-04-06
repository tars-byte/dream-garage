import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Car } from '../../types'
import BottomSheet from '../ui/BottomSheet'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { formatPrice, calculateMonthlyPayment } from '../../lib/utils'
import { useGarageStore, selectCanAfford, selectHasCarById, selectBudgetRemaining } from '../../store/garageStore'
import { getDealerById } from '../../data/dealers'

interface CarDetailSheetProps {
  car: Car | null
  onClose: () => void
}

interface SpecRowProps {
  label: string
  value: string | null
}

function SpecRow({ label, value }: SpecRowProps) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-muted uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-text">{value}</span>
    </div>
  )
}

export default function CarDetailSheet({ car, onClose }: CarDetailSheetProps) {
  const { t } = useTranslation()
  const [imgIndex, setImgIndex] = useState(0)

  const cars = useGarageStore((s) => s.cars)
  const addCar = useGarageStore((s) => s.addCar)
  const removeCar = useGarageStore((s) => s.removeCar)

  if (!car) return null

  const inGarage = selectHasCarById(cars, car.id)
  const canAfford = selectCanAfford(cars, car.price_usd)
  const remaining = selectBudgetRemaining(cars)
  const afterPurchase = remaining - car.price_usd
  const dealer = getDealerById(car.dealer.id)
  const monthly = calculateMonthlyPayment(car.price_usd)
  const images = car.image_urls.length > 0 ? car.image_urls : [car.image_url]

  function handleToggle() {
    if (inGarage) {
      removeCar(car!.id)
    } else if (canAfford) {
      addCar(car!)
      onClose()
    }
  }

  const specs = car.specs

  return (
    <BottomSheet isOpen={!!car} onClose={onClose} maxHeightClass="max-h-[92vh]">
      {/* Image carousel */}
      <div className="relative aspect-[16/9] bg-surface-elevated overflow-hidden">
        <img
          src={images[imgIndex]}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover"
        />

        {/* Carousel dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIndex(i)}
                className={[
                  'w-1.5 h-1.5 rounded-full transition-all',
                  i === imgIndex ? 'bg-white w-4' : 'bg-white/40',
                ].join(' ')}
              />
            ))}
          </div>
        )}

        {/* Prev / Next */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white text-xs"
            >
              ‹
            </button>
            <button
              onClick={() => setImgIndex((i) => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white text-xs"
            >
              ›
            </button>
          </>
        )}

        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          {car.expo_deal && <Badge variant="expo">{t('catalog.expo_deal')}</Badge>}
          {specs.fuel_type === 'electric' && <Badge variant="electric">⚡ EV</Badge>}
          {(specs.fuel_type === 'hybrid' || specs.fuel_type === 'plug-in-hybrid') && (
            <Badge variant="hybrid">🌿 {specs.fuel_type === 'plug-in-hybrid' ? 'PHEV' : t('categories.hybrid')}</Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-8 flex flex-col gap-5 pt-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-text-secondary font-medium">{car.brand} · {car.year}</p>
            <h2 className="text-xl font-bold text-text leading-tight">{car.model}</h2>
            <p className="text-sm text-muted">{car.trim}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-text">{formatPrice(car.price_usd)}</p>
            <p className="text-xs text-muted mt-0.5">
              {t('car_detail.monthly_estimate', { amount: monthly.toLocaleString('en-US') })}
            </p>
          </div>
        </div>

        {/* Safety rating */}
        {specs.safety_rating && (
          <div className="flex items-center gap-2 bg-hybrid/10 border border-hybrid/20 rounded-xl px-3 py-2">
            <span className="text-hybrid text-lg">★</span>
            <span className="text-sm text-hybrid font-medium">{specs.safety_rating}</span>
          </div>
        )}

        {/* Specs grid */}
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-3 font-medium">
            Especificaciones
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 bg-surface-elevated rounded-2xl p-4">
            <SpecRow label={t('car_detail.specs_engine')} value={specs.engine} />
            <SpecRow
              label={t('car_detail.specs_hp')}
              value={specs.horsepower ? `${specs.horsepower} ${t('car_detail.specs_hp_unit')}` : null}
            />
            <SpecRow label={t('car_detail.specs_drivetrain')} value={specs.drivetrain} />
            <SpecRow
              label={t('car_detail.specs_seats')}
              value={String(specs.seats)}
            />
            {specs.fuel_type === 'electric' ? (
              <SpecRow
                label={t('car_detail.specs_range')}
                value={specs.range_km ? `${specs.range_km} ${t('car_detail.specs_range_unit')}` : null}
              />
            ) : (
              <SpecRow
                label={t('car_detail.specs_fuel_consumption')}
                value={specs.fuel_consumption_l100km ? `${specs.fuel_consumption_l100km} ${t('car_detail.specs_fuel_unit')}` : null}
              />
            )}
            <SpecRow
              label={t('car_detail.specs_ground_clearance')}
              value={specs.ground_clearance_mm ? `${specs.ground_clearance_mm} ${t('car_detail.specs_clearance_unit')}` : null}
            />
            {specs.zero_to_100_sec && (
              <SpecRow
                label={t('car_detail.specs_zero_100')}
                value={`${specs.zero_to_100_sec} ${t('car_detail.specs_zero_unit')}`}
              />
            )}
            {specs.towing_capacity_kg && (
              <SpecRow
                label={t('car_detail.specs_towing')}
                value={`${specs.towing_capacity_kg.toLocaleString()} ${t('car_detail.specs_towing_unit')}`}
              />
            )}
            <SpecRow
              label={t('car_detail.specs_warranty')}
              value={`${specs.warranty_years} ${t('car_detail.specs_warranty_unit')}`}
            />
          </div>
        </div>

        {/* Highlights */}
        {car.highlights && car.highlights.length > 0 && (
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-3 font-medium">
              {t('car_detail.why_ticos_love_it')}
            </p>
            <ul className="flex flex-col gap-2">
              {car.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-budget-green mt-0.5 shrink-0">✓</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Dealer */}
        {dealer && (
          <div className="flex items-center justify-between bg-surface-elevated rounded-2xl px-4 py-3 border border-border">
            <div>
              <p className="text-xs text-muted">{t('car_detail.dealer_booth', { booth: dealer.booth_number })}</p>
              <p className="text-sm font-medium text-text">{dealer.name}</p>
            </div>
            <a
              href={dealer.contact_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-accent font-medium hover:underline"
            >
              {t('car_detail.contact_dealer')}
            </a>
          </div>
        )}

        {/* Budget remaining after */}
        {!inGarage && (
          <p className={[
            'text-sm text-center',
            afterPurchase >= 0 ? 'text-text-secondary' : 'text-budget-red',
          ].join(' ')}>
            {afterPurchase >= 0
              ? t('car_detail.budget_after', { amount: formatPrice(afterPurchase) })
              : t('catalog.over_budget')}
          </p>
        )}

        {/* Add / Remove button */}
        <Button
          variant={inGarage ? 'danger' : canAfford ? 'primary' : 'secondary'}
          size="lg"
          fullWidth
          disabled={!inGarage && !canAfford}
          onClick={handleToggle}
        >
          {inGarage
            ? t('car_detail.remove_from_garage')
            : !canAfford
            ? t('catalog.over_budget')
            : t('car_detail.add_to_garage')}
        </Button>
      </div>
    </BottomSheet>
  )
}

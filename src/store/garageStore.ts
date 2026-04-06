import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Car } from '../types'
import { BUDGET_TOTAL } from '../types'

export interface GarageStore {
  sessionId: string
  /** Three bays — null means empty */
  cars: [Car | null, Car | null, Car | null]
  label: string
  tagline: string

  addCar: (car: Car) => void
  removeCar: (carId: string) => void
  replaceCar: (bayIndex: number, car: Car) => void
  setLabel: (label: string) => void
  setTagline: (tagline: string) => void
  clearGarage: () => void
}

export const useGarageStore = create<GarageStore>()(
  persist(
    (set, get) => ({
      sessionId: crypto.randomUUID(),
      cars: [null, null, null],
      label: '',
      tagline: '',

      addCar: (car) => {
        const { cars } = get()
        const total = cars.reduce((s, c) => s + (c?.price_usd ?? 0), 0)
        if (total + car.price_usd > BUDGET_TOTAL) return
        const emptyIdx = cars.findIndex((c) => c === null)
        if (emptyIdx === -1) return
        const next = [...cars] as GarageStore['cars']
        next[emptyIdx] = car
        set({ cars: next })
      },

      removeCar: (carId) =>
        set((s) => ({
          cars: s.cars.map((c) => (c?.id === carId ? null : c)) as GarageStore['cars'],
        })),

      replaceCar: (bayIndex, car) =>
        set((s) => {
          const next = [...s.cars] as GarageStore['cars']
          next[bayIndex] = car
          return { cars: next }
        }),

      setLabel: (label) => set({ label }),
      setTagline: (tagline) => set({ tagline }),
      clearGarage: () => set({ cars: [null, null, null], label: '', tagline: '' }),
    }),
    {
      name: 'dream-garage-v1',
      partialize: (s) => ({
        sessionId: s.sessionId,
        cars: s.cars,
        label: s.label,
        tagline: s.tagline,
      }),
    },
  ),
)

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectTotalPrice = (cars: GarageStore['cars']) =>
  cars.reduce((s, c) => s + (c?.price_usd ?? 0), 0)

export const selectBudgetRemaining = (cars: GarageStore['cars']) =>
  BUDGET_TOTAL - selectTotalPrice(cars)

export const selectBudgetPct = (cars: GarageStore['cars']) =>
  (selectTotalPrice(cars) / BUDGET_TOTAL) * 100

export const selectCarCount = (cars: GarageStore['cars']) =>
  cars.filter(Boolean).length

export const selectCanAfford = (cars: GarageStore['cars'], price: number) =>
  selectBudgetRemaining(cars) >= price

export const selectHasCarById = (cars: GarageStore['cars'], id: string) =>
  cars.some((c) => c?.id === id)

export const selectFilledCars = (cars: GarageStore['cars']): Car[] =>
  cars.filter((c): c is Car => c !== null)

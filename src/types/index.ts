export type CarCategory =
  | 'suv'
  | 'pickup'
  | 'sedan'
  | 'hatchback'
  | 'crossover'
  | 'minivan'
  | 'electric'
  | 'hybrid'
  | 'commercial'
  | 'sport'
  | 'luxury'

export type FuelType = 'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'plug-in-hybrid'
export type Drivetrain = 'FWD' | 'RWD' | 'AWD' | '4x4'

export interface CarSpecs {
  engine: string
  horsepower: number | null
  torque_nm: number | null
  drivetrain: Drivetrain
  transmission: string
  fuel_type: FuelType
  fuel_consumption_l100km: number | null
  range_km: number | null
  seats: number
  cargo_liters: number | null
  ground_clearance_mm: number | null
  towing_capacity_kg: number | null
  safety_rating: string | null
  zero_to_100_sec: number | null
  warranty_years: number
}

export interface Dealer {
  id: string
  name: string
  brands: string[]
  booth_number: string
  logo_url: string
  website_url: string
  contact_url: string
}

export interface Car {
  id: string
  brand: string
  model: string
  year: number
  trim: string
  category: CarCategory
  tags: string[]
  price_usd: number
  expo_deal: boolean
  image_url: string
  image_urls: string[]
  brand_logo_url: string
  color_options: string[]
  specs: CarSpecs
  dealer: Pick<Dealer, 'id' | 'name'>
  highlights?: string[]        // "Why ticos love it" bullets, localizable keys
  active: boolean
  featured: boolean
  created_at: string
}

export interface Garage {
  id: string
  label: string
  tagline: string | null
  car_ids: [string, string?, string?]
  total_price_usd: number
  budget_used_pct: number
  budget_remaining_usd: number
  share_card_url: string | null
  vote_count: number
  view_count: number
  share_count: number
  challenge_count: number
  source_garage_id: string | null
  session_id: string
  created_at: string
  expo_year: number
  is_featured: boolean
  is_visible: boolean
}

export type SharePlatform = 'whatsapp' | 'instagram' | 'tiktok' | 'copy' | 'download'

export interface AnalyticsEvent {
  event_type: string
  session_id: string
  garage_id?: string
  car_id?: string
  dealer_id?: string
  payload?: Record<string, unknown>
  source?: string
}

export const BUDGET_TOTAL = 50_000

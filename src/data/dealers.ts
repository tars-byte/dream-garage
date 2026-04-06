import type { Dealer } from '../types'

export const DEALERS: Dealer[] = [
  {
    id: 'grupo-q',
    name: 'Grupo Q',
    brands: ['Toyota', 'Suzuki'],
    booth_number: 'A-14',
    logo_url: '',
    website_url: 'https://www.grupq.com',
    contact_url: 'https://wa.me/50622000000',
  },
  {
    id: 'purdy-motor',
    name: 'Purdy Motor',
    brands: ['Hyundai', 'Kia'],
    booth_number: 'B-08',
    logo_url: '',
    website_url: 'https://www.purdymotor.com',
    contact_url: 'https://wa.me/50622111111',
  },
  {
    id: 'ford-cr',
    name: 'Ford Costa Rica',
    brands: ['Ford'],
    booth_number: 'C-03',
    logo_url: '',
    website_url: 'https://www.ford.cr',
    contact_url: 'https://wa.me/50622222222',
  },
  {
    id: 'byd-cr',
    name: 'BYD Costa Rica',
    brands: ['BYD'],
    booth_number: 'D-01',
    logo_url: '',
    website_url: 'https://www.byd.cr',
    contact_url: 'https://wa.me/50622333333',
  },
  {
    id: 'nissan-cr',
    name: 'Nissan Costa Rica',
    brands: ['Nissan'],
    booth_number: 'C-11',
    logo_url: '',
    website_url: 'https://www.nissan.cr',
    contact_url: 'https://wa.me/50622444444',
  },
  {
    id: 'mitsubishi-cr',
    name: 'Mitsubishi Costa Rica',
    brands: ['Mitsubishi'],
    booth_number: 'B-15',
    logo_url: '',
    website_url: 'https://www.mitsubishi.cr',
    contact_url: 'https://wa.me/50622555555',
  },
  {
    id: 'honda-cr',
    name: 'Honda Costa Rica',
    brands: ['Honda'],
    booth_number: 'A-22',
    logo_url: '',
    website_url: 'https://www.honda.cr',
    contact_url: 'https://wa.me/50622666666',
  },
]

export function getDealerById(id: string): Dealer | undefined {
  return DEALERS.find((d) => d.id === id)
}

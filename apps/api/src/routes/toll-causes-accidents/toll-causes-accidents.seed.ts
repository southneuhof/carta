import { sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { tollCausesAccidents, tollCausesAccidentsCategories } from './toll-causes-accidents.entity'

const categories = [
  { id: 'toll-accident-category-driver', name: 'Pengemudi', code: 'driver' },
  { id: 'toll-accident-category-vehicle', name: 'Kendaraan', code: 'vehicle' },
  { id: 'toll-accident-category-road', name: 'Jalan', code: 'road' },
  { id: 'toll-accident-category-environment', name: 'Lingkungan', code: 'environment' },
] as const

const causes = [
  ['driver', 'Kurang Antisipasi'], ['driver', 'Lengah'], ['driver', 'Mengantuk'], ['driver', 'Mabuk'], ['driver', 'Tidak Tertib'], ['driver', 'Salip Kiri'], ['driver', 'Lain-Lain'],
  ['vehicle', 'Pecah Ban'], ['vehicle', 'Slip'], ['vehicle', 'Rem Blong'], ['vehicle', 'Mekanik Rusak'], ['vehicle', 'Mesin Rusak'], ['vehicle', 'Tertib Muatan'], ['vehicle', 'Lain-Lain'],
  ['road', 'Kerusakan Jalan'], ['road', 'Perlengkapan Jalan'], ['road', 'Lain-Lain'],
  ['environment', 'Kendaraan Berhenti'], ['environment', 'Penyeberangan'], ['environment', 'Asap Kendaraan'], ['environment', 'Asap Lingkungan'], ['environment', 'Kamtib'], ['environment', 'Hewan'], ['environment', 'Material Jalan'], ['environment', 'Lain-Lain'],
] as const

export async function seedTollCausesAccidents() {
  const db = getDb()
  await db.insert(tollCausesAccidentsCategories).values([...categories]).onConflictDoUpdate({
    target: tollCausesAccidentsCategories.id,
    set: { name: sql`excluded.name`, code: sql`excluded.code`, active: true },
  })
  await db.insert(tollCausesAccidents).values(causes.map(([categoryCode, name], index) => ({
    id: `toll-accident-cause-${index + 1}`,
    categoryCode,
    name,
    active: true,
  }))).onConflictDoUpdate({
    target: tollCausesAccidents.id,
    set: { categoryCode: sql`excluded.category_code`, name: sql`excluded.name`, active: true },
  })
}

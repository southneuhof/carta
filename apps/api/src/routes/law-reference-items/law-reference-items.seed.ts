import { getDb } from '../../db'
import { lawReferenceCategories } from './law-reference-items.entity'

const categories = [
  { id: 'law-reference-category-environment', name: 'Lingkungan', code: 'environment' },
  { id: 'law-reference-category-k3', name: 'K3', code: 'k3' },
  { id: 'law-reference-category-security', name: 'Pengamanan', code: 'security' },
]

export async function seedLawReferenceCategories() {
  await getDb().insert(lawReferenceCategories).values(categories).onConflictDoUpdate({
    target: lawReferenceCategories.code,
    set: { name: lawReferenceCategories.name, active: true },
  })
}

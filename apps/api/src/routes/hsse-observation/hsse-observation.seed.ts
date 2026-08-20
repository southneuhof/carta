import { sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { findingCriteria, findingTypes } from './hsse-observation.entity'

const criteria = [
  { id: 'finding-criteria-positive', name: 'Positif', code: 'positive', active: true },
  { id: 'finding-criteria-negative', name: 'Negatif', code: 'negative', active: true },
] as const

const types = [
  ['negative-quality', 'Quality', 'negative', 1],
  ['negative-healthy', 'Healthy', 'negative', 2],
  ['negative-unsafe-action', 'Unsafe Action', 'negative', 3],
  ['negative-unsafe-condition', 'Unsafe Condition', 'negative', 4],
  ['negative-security', 'Security', 'negative', 5],
  ['negative-environtment', 'Environment', 'negative', 6],
  ['negative-5r', '5R', 'negative', 7],
  ['positive-quality', 'Quality', 'positive', 1],
  ['positive-healthy', 'Healthy', 'positive', 2],
  ['positive-safety', 'Safety', 'positive', 3],
  ['positive-security', 'Security', 'positive', 4],
  ['positive-environtment', 'Environment', 'positive', 5],
  ['positive-5r', '5R', 'positive', 6],
] as const

export async function seedHsseObservation() {
  const db = getDb()
  await db.insert(findingCriteria).values([...criteria]).onConflictDoUpdate({
    target: findingCriteria.code,
    set: { name: sql`excluded.name`, active: true },
  })
  await db.insert(findingTypes).values(types.map(([code, name, findingCriteriaCode, displayOrder]) => ({
    id: `finding-type-${code}`,
    code,
    name,
    findingCriteriaCode,
    displayOrder,
    active: true,
  }))).onConflictDoUpdate({
    target: findingTypes.code,
    set: {
      name: sql`excluded.name`,
      findingCriteriaCode: sql`excluded.finding_criteria_code`,
      displayOrder: sql`excluded.display_order`,
      active: true,
    },
  })
}

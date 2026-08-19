import { sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { emergencySimulationTopics } from './emergency-simulation-topics.entity'

const records = [
  { id: 'emergency-simulation-topic-1', name: 'Spill Drill' },
  { id: 'emergency-simulation-topic-2', name: 'Medivac' },
  { id: 'emergency-simulation-topic-3', name: 'Huru Hara' },
  { id: 'emergency-simulation-topic-4', name: 'Fire' },
  { id: 'emergency-simulation-topic-5', name: 'Mustering Drill' },
] as const

export async function seedEmergencySimulationTopic() {
  const db = getDb()
  await db.insert(emergencySimulationTopics).values([...records]).onConflictDoUpdate({
    target: emergencySimulationTopics.id,
    set: { name: sql`excluded.name` },
  })
}

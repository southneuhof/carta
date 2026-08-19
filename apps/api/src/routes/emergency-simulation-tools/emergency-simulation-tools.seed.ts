import { sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { emergencySimulationTools } from './emergency-simulation-tools.entity'

const records = [
  { id: 'emergency-simulation-tool-1', name: 'Shut down System' },
  { id: 'emergency-simulation-tool-2', name: 'Petunjuk Kerja' },
  { id: 'emergency-simulation-tool-3', name: 'Alarm & Detector Sytem' },
  { id: 'emergency-simulation-tool-4', name: ' Alat Pelindung Diri' },
  { id: 'emergency-simulation-tool-5', name: 'Mustering Drill' },
  { id: 'emergency-simulation-tool-6', name: 'Sistem Keamanan Terpadu' },
  { id: 'emergency-simulation-tool-7', name: 'Racun Api, Karung Basah' },
  { id: 'emergency-simulation-tool-8', name: 'Sebuk Gergaji, Pasir' },
  { id: 'emergency-simulation-tool-9', name: 'Sistem Pengamanan Sumber Energi' },
  { id: 'emergency-simulation-tool-10', name: 'Lain lain' },
] as const

export async function seedEmergencySimulationTool() {
  const db = getDb()
  await db.insert(emergencySimulationTools).values([...records]).onConflictDoUpdate({
    target: emergencySimulationTools.id,
    set: { name: sql`excluded.name` },
  })
}

import { sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { emergencySimulationEmployees } from './emergency-simulation-employees.entity'

const records = [
  { id: 'emergency-simulation-employee-1', name: 'Direktur ' },
  { id: 'emergency-simulation-employee-2', name: 'EVP' },
  { id: 'emergency-simulation-employee-3', name: 'VP' },
  { id: 'emergency-simulation-employee-4', name: 'PM/Prodir/BM' },
  { id: 'emergency-simulation-employee-5', name: 'M-QHSSE' },
  { id: 'emergency-simulation-employee-6', name: 'HSSE' },
  { id: 'emergency-simulation-employee-7', name: 'Supervisor' },
  { id: 'emergency-simulation-employee-8', name: 'Security' },
  { id: 'emergency-simulation-employee-9', name: 'Paramedic' },
  { id: 'emergency-simulation-employee-10', name: 'Karyawan' },
  { id: 'emergency-simulation-employee-11', name: 'Pekerja' },
] as const

export async function seedEmergencySimulationEmployee() {
  const db = getDb()
  await db.insert(emergencySimulationEmployees).values([...records]).onConflictDoUpdate({
    target: emergencySimulationEmployees.id,
    set: { name: sql`excluded.name` },
  })
}

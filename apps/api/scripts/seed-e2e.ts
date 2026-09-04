import { pathToFileURL } from 'node:url'
import { closeDb } from '../src/db'
import { seedAdministrator } from './seed-shared'
import { assertConnectedE2eTarget } from './e2e-target'
import { seedDatabase } from './seed'

export async function seedE2e() {
  await assertConnectedE2eTarget()
  await seedDatabase()
  await seedAdministrator()
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedE2e()
    .then(async () => {
      console.log('E2E seed complete.')
      await closeDb()
    })
    .catch(async (error: unknown) => {
      await closeDb()
      throw error
    })
}

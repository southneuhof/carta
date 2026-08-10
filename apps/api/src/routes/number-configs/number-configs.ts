import { authenticated, create, defineRoute, deleteRoute, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { and, desc, eq, gt, lt } from 'drizzle-orm'
import { getDb } from '../../db'
import { requirePermission } from '../../identity'
import { numberVariables } from '../number-variables/number-variables.entity'
import { numberConfigs, numberConfig, numberConfigRelations } from './number-configs.entity'

const read = [authenticated(), requirePermission('view-number-configs')]
const write = [authenticated(), requirePermission('manage-number-configs')]

export const reorderNumberConfig = defineRoute({
  method: 'post',
  state: async ({ c }) => ({ input: await c.req.json().catch(() => ({})) }),
  authorize: write,
  action: async ({ c, state }) => {
    const id = c.req.param('id')
    const direction = state.input && typeof state.input === 'object' ? (state.input as { direction?: unknown }).direction : undefined
    if (!id || (direction !== 'up' && direction !== 'down')) return c.json({ error: 'validation_error', message: 'Direction must be up or down.' }, 400)
    const data = await getDb().transaction(async (tx) => {
      const current = (await tx.select({ id: numberConfigs.id, displayOrder: numberConfigs.displayOrder, active: numberConfigs.active }).from(numberConfigs).where(eq(numberConfigs.id, id)).limit(1))[0]
      if (!current) return undefined
      if (!current.active) return current
      const neighbor = (await tx
        .select({ id: numberConfigs.id, displayOrder: numberConfigs.displayOrder })
        .from(numberConfigs)
        .where(and(eq(numberConfigs.active, true), direction === 'up' ? lt(numberConfigs.displayOrder, current.displayOrder) : gt(numberConfigs.displayOrder, current.displayOrder)))
        .orderBy(direction === 'up' ? desc(numberConfigs.displayOrder) : numberConfigs.displayOrder)
        .limit(1))[0]
      if (!neighbor) return current
      await tx.update(numberConfigs).set({ displayOrder: -(current.displayOrder + 1) }).where(eq(numberConfigs.id, current.id))
      await tx.update(numberConfigs).set({ displayOrder: current.displayOrder }).where(eq(numberConfigs.id, neighbor.id))
      const rows = await tx.update(numberConfigs).set({ displayOrder: neighbor.displayOrder }).where(eq(numberConfigs.id, current.id)).returning()
      return rows[0]
    })
    if (!data) return c.json({ error: 'not_found' }, 404)
    return c.json({ data })
  },
})

async function validateNumberConfig(route: string, state: { input?: unknown }) {
  const input = state.input && typeof state.input === 'object' ? (state.input as Record<string, unknown>) : {}
  if (route === 'create' || route === 'update') {
    if (typeof input.numberVariableCode === 'string') input.numberVariableCode = input.numberVariableCode.trim()
    if (input.numberOfDigits != null && (!Number.isInteger(input.numberOfDigits) || Number(input.numberOfDigits) < 0)) return 'Digit count must be a non-negative integer.'
    if (input.active === true && typeof input.numberVariableCode === 'string') {
      const variable = (await getDb().select({ active: numberVariables.active }).from(numberVariables).where(eq(numberVariables.code, input.numberVariableCode)).limit(1))[0]
      if (!variable?.active) return 'Active number configuration needs an active number variable.'
    }
  }
  return undefined
}

export const domain = defineDomainPart({ tables: { numberConfigs }, entities: [numberConfig], relations: [numberConfigRelations] })

export const numberConfigModel = defineModel({
  path: '/number-configs',
  entity: numberConfig,
  routes: {
    list: list({ authorize: read }),
    detail: detail({ authorize: read }),
    create: create({ authorize: write }),
    update: update({ authorize: write }),
    delete: deleteRoute({ authorize: write }),
    ':id': { reorder: reorderNumberConfig },
  },
  validate: async ({ route, state }) => validateNumberConfig(route.kind, state as { input?: unknown }),
})

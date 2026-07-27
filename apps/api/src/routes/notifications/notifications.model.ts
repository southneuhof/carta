import { authenticated, list } from '@southneuhof/sprindle/routes'
import { defineModel } from '@southneuhof/sprindle/model'
import type { ModelRuntimeEntity } from '@southneuhof/sprindle/source'
import { getDb } from '../../db'
import { orgIdentity } from '../../identity'
import { notification } from './notifications.entity'
import { createScopedNotificationSource, SCOPE_KEY } from './notifications.source'

// `() => getDb()` rather than `getDb`: this module and `../../db` form a cycle
// through `routes/index.ts`, so the binding is not yet initialized when this line
// runs. Referencing it inside the arrow defers the lookup to request time.
const scopedSource = createScopedNotificationSource(() => getDb())

/**
 * A façade over the real entity whose `source` is the scoped one.
 *
 * It has to be a getter rather than a copied value: `bindDomainDatabase` reassigns
 * `entity.source` on every `getDb()` call, so anything captured once goes stale.
 * The real entity stays in the domain part and keeps being bound normally; only
 * this model reads through the scoped wrapper.
 */
const scopedEntity = {
  name: notification.name,
  table: notification.table,
  schemas: notification.schemas,
  source: scopedSource,
} satisfies ModelRuntimeEntity & Pick<typeof notification, 'schemas'>

/**
 * Notifications are written by workflows, never by clients, so there is no create,
 * update, or delete route. Their absence *is* the authorization — a registered
 * write route guarded by a hook is one deployment mistake away from being open.
 */
export const notificationModel = defineModel({
  path: '/notifications',
  entity: scopedEntity,
  authorize: [authenticated()],
  // Hands the caller's identity to the source. `before` runs after `state` is
  // built and patches it, which is the only per-request channel a ModelSource has.
  before: [async (args) => ({ query: { ...(args.state.query as object), [SCOPE_KEY]: await orgIdentity(args) } })],
  routes: {
    list: list(),
    // No `detail()`. `ModelSource.detail` receives only an id, so the scope
    // predicate cannot reach it and the framework route would read any row by id.
    // `notificationDetail` in `notifications.routes.ts` is the scoped replacement.
  },
})

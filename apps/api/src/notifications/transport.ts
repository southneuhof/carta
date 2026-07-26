export type DeliveredNotification = {
  notificationId: string
  userIds: string[]
  title: string
  content: string
}

export type NotificationTransport = {
  /** Fire-and-forget. Never throws into the caller; log and swallow. */
  deliver(message: DeliveredNotification): Promise<void>
}

export type MemoryTransport = NotificationTransport & {
  delivered: DeliveredNotification[]
  /** Makes the next `deliver` reject, to prove a transport failure cannot reach the caller. */
  failNext(): void
  reset(): void
}

/** Development and test transport: records deliveries in memory. */
export function createMemoryTransport(): MemoryTransport {
  const delivered: DeliveredNotification[] = []
  let failOnce = false

  return {
    delivered,
    failNext() {
      failOnce = true
    },
    reset() {
      delivered.length = 0
      failOnce = false
    },
    async deliver(message) {
      if (failOnce) {
        failOnce = false
        throw new Error('Transport unavailable.')
      }
      delivered.push(message)
    },
  }
}

let transport: NotificationTransport | undefined

/** Mirrors `getDb()`: one module-level accessor, lazily constructed. */
export function getTransport(): NotificationTransport {
  return (transport ??= createMemoryTransport())
}

/** Test seam. Also used by the seed, which should not deliver anything. */
export function setTransport(next: NotificationTransport | undefined) {
  transport = next
}

/**
 * Dispatches delivery **after** the writing transaction commits, and swallows
 * transport failures.
 *
 * Both rules live here rather than at each call site, because getting either one
 * wrong is invisible until it matters: delivering inside the transaction sends
 * notifications for work that then rolls back, and letting `deliver` reject would
 * roll back a verification because a push service was down.
 *
 * Call this after the `getDb().transaction(...)` that wrote the rows has resolved.
 */
export async function notifyAfterCommit(messages: DeliveredNotification[]): Promise<void> {
  for (const message of messages) {
    if (message.userIds.length === 0) continue
    try {
      await getTransport().deliver(message)
    } catch (error) {
      console.error('[notifications] delivery failed', { notificationId: message.notificationId, error })
    }
  }
}

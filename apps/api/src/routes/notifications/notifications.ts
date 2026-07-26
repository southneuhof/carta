import { defineDomainPart } from '@southneuhof/sprindle/model'
import { notification, notificationRelations, notifications } from './notifications.entity'
import { notificationModel } from './notifications.model'
import { markSeen, notificationDetail, unreadCount } from './notifications.routes'

export const domain = defineDomainPart({
  tables: { notifications },
  entities: [notification],
  relations: [notificationRelations],
})

export { markSeen, notificationDetail, notificationModel, unreadCount }

export default { domain, notificationModel }

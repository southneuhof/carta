import { defineDomainPart, defineModel } from "@southneuhof/sprindle/model";
import {
  notification,
  notifications,
  activityLog,
  activityLogs,
} from "./notifications.entity";
import {
  notificationDetail,
  notificationList,
  unreadCount,
  markSeen,
} from "./notifications.routes";

export const domain = defineDomainPart({
  tables: { notifications, activityLogs },
  entities: [notification, activityLog],
});
export const notificationModel = defineModel({
  path: "/notifications",
  entity: notification,
  routes: {
    list: notificationList,
    detail: notificationDetail,
    unreadCount,
    markSeen,
  },
});

export { notificationDetail, unreadCount, markSeen };
export default { domain, notificationModel };

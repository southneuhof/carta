import { authenticated, defineRoute } from "@southneuhof/sprindle/routes";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import type { TypedResponse } from "hono";
import type { ModelRuntimeContext } from "@southneuhof/sprindle/model";
import { z } from "zod/v4";
import { getDb } from "../../db";
import { orgIdentity } from "../../identity";
import { notification, notifications } from "./notifications.entity";

const idsSchema = z.object({ ids: z.array(z.string().min(1)).max(200) });
type MarkSeenOutput = TypedResponse<{ data: { updated: number } }, 200, "json">;

async function callerId(args: Parameters<typeof orgIdentity>[0]) {
  const identity = await orgIdentity(args);
  return identity?.userId;
}

export const notificationList = defineRoute({
  path: "/notifications",
  method: "get",
  authorize: [authenticated()],
  action: async (args) => {
    const userId = await callerId(args);
    if (!userId) return args.c.json({ error: "unauthorized" }, 401);
    const rows = await getDb()
      .select()
      .from(notifications)
      .where(eq(notifications.recipientUserId, userId))
      .orderBy(desc(notifications.createdAt));
    return args.c.json({
      data: rows.map((row) => notification.schemas.select.parse(row)),
      page: 1,
      limit: rows.length,
      total: rows.length,
    });
  },
});

export const notificationDetail = defineRoute({
  path: "/notifications/:id",
  method: "get",
  authorize: [authenticated()],
  action: async (args) => {
    const userId = await callerId(args);
    const id = args.c.req.param("id");
    const found =
      userId && id
        ? await getDb()
            .select()
            .from(notifications)
            .where(
              and(
                eq(notifications.id, id),
                eq(notifications.recipientUserId, userId),
              ),
            )
            .limit(1)
        : [];
    return found[0]
      ? args.c.json({ data: notification.schemas.select.parse(found[0]) })
      : args.c.json({ error: "not_found" }, 404);
  },
});

export const unreadCount = defineRoute({
  path: "/notifications/unread-count",
  method: "get",
  authorize: [authenticated()],
  action: async (args) => {
    const userId = await callerId(args);
    const rows = userId
      ? await getDb()
          .select({ id: notifications.id })
          .from(notifications)
          .where(
            and(
              eq(notifications.recipientUserId, userId),
              isNull(notifications.readAt),
            ),
          )
      : [];
    return args.c.json({ data: { total: rows.length } });
  },
});

export const markSeen = defineRoute<
  MarkSeenOutput,
  ModelRuntimeContext,
  "post",
  "/notifications/mark-seen",
  { json: z.input<typeof idsSchema> }
>({
  path: "/notifications/mark-seen",
  method: "post",
  authorize: [authenticated()],
  action: async (args) => {
    const userId = await callerId(args);
    const { ids } = idsSchema.parse(await args.c.req.json().catch(() => ({})));
    if (!userId || ids.length === 0)
      return args.c.json({ data: { updated: 0 } });
    const updated = await getDb()
      .update(notifications)
      .set({ readAt: new Date().toISOString() })
      .where(
        and(
          eq(notifications.recipientUserId, userId),
          inArray(notifications.id, ids),
        ),
      )
      .returning({ id: notifications.id });
    return args.c.json({ data: { updated: updated.length } });
  },
});

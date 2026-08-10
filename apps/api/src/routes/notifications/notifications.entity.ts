import { createEntity } from "@southneuhof/sprindle/entity";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { projects } from "../master-data/master-data.entity";
import { users } from "../users/users.entity";

export const notifications = pgTable("notifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  recipientUserId: text("recipient_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: text("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  moduleCode: text("module_code").notNull(),
  referenceTable: text("reference_table"),
  referenceId: text("reference_id"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  readAt: timestamp("read_at", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const notification = createEntity({
  table: notifications,
  schemas: {
    create: createInsertSchema(notifications).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
    }),
    update: createUpdateSchema(notifications).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
    }),
    select: createSelectSchema(notifications),
  },
});

export const activityLogs = pgTable("activity_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  actorUserId: text("actor_user_id")
    .notNull()
    .references(() => users.id),
  projectId: text("project_id").references(() => projects.id),
  divisionId: text("division_id"),
  moduleId: text("module_id"),
  moduleName: text("module_name").notNull(),
  referenceTable: text("reference_table"),
  referenceId: text("reference_id"),
  statusCode: text("status_code"),
  stepCode: text("step_code"),
  shortDescription: text("short_description").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
});

export const activityLog = createEntity({
  table: activityLogs,
  schemas: {
    create: createInsertSchema(activityLogs).omit({
      id: true,
      createdAt: true,
    }),
    update: createUpdateSchema(activityLogs).omit({
      id: true,
      createdAt: true,
    }),
    select: createSelectSchema(activityLogs),
  },
});

import { createEntity } from "@southneuhof/sprindle/entity";
import {
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod/v4";
import { projects } from "../projects/projects.entity";
import { users } from "../users/users.entity";

export const assignmentScopes = ["global", "project"] as const;
export type AssignmentScope = (typeof assignmentScopes)[number];

const auditFields = {
  createdByUserId: text("created_by_user_id").references(() => users.id),
  updatedByUserId: text("updated_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
};

export const roleGroups = pgTable("role_groups", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  roleGroupCode: text("role_group_code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  ...auditFields,
});

export const roles = pgTable("roles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  roleCode: text("role_code").notNull().unique(),
  name: text("name").notNull(),
  roleGroupId: text("role_group_id")
    .notNull()
    .references(() => roleGroups.id),
  roleType: text("role_type").notNull().default("user"),
  assignmentScope: text("assignment_scope")
    .notNull()
    .default("global")
    .$type<AssignmentScope>(),
  description: text("description"),
  allowRegister: boolean("allow_register").notNull().default(false),
  active: boolean("active").notNull().default(true),
  ...auditFields,
});

export const permissions = pgTable("permissions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  permissionCode: text("permission_code").notNull().unique(),
  name: text("name").notNull(),
  permissionGroup: text("permission_group").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  ...auditFields,
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    active: boolean("active").notNull().default(true),
    ...auditFields,
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    active: boolean("active").notNull().default(true),
    ...auditFields,
  },
  (table) => [primaryKey({ columns: [table.userId, table.roleId] })],
);

export const projectUsers = pgTable(
  "project_users",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    description: text("description"),
    active: boolean("active").notNull().default(true),
    ...auditFields,
  },
  (table) => [
    uniqueIndex("project_users_project_user_role_idx").on(
      table.projectId,
      table.userId,
      table.roleId,
    ),
  ],
);

const write = {
  id: true,
  createdByUserId: true,
  updatedByUserId: true,
  createdAt: true,
  updatedAt: true,
} as const;

const scopeWrite = { assignmentScope: z.enum(assignmentScopes).optional() };

export const roleGroup = createEntity({
  table: roleGroups,
  schemas: {
    create: createInsertSchema(roleGroups).omit(write),
    update: createUpdateSchema(roleGroups).omit(write),
    select: createSelectSchema(roleGroups),
  },
});
export const role = createEntity({
  table: roles,
  schemas: {
    create: createInsertSchema(roles, scopeWrite).omit(write),
    update: createUpdateSchema(roles, scopeWrite).omit(write),
    select: createSelectSchema(roles),
  },
});
export const permission = createEntity({
  table: permissions,
  schemas: {
    create: createInsertSchema(permissions).omit(write),
    update: createUpdateSchema(permissions).omit(write),
    select: createSelectSchema(permissions),
  },
});

import { createEntity } from "@southneuhof/sprindle/entity";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";

// Authentication only. Organizational identity hangs off the role assignments
// and is resolved by `src/identity.ts`.
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  imgPhotoUser: text("img_photo_user"),
  statusCode: text("status_code").notNull().default("active"),
  employeeId: text("employee_id"),
  failedAttemptCount: integer("failed_attempt_count").notNull().default(0),
  lastLoginAt: timestamp("last_login_at", { mode: "string" }),
  passwordChangedAt: timestamp("password_changed_at", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const user = createEntity({
  table: users,
  schemas: {
    create: createInsertSchema(users).omit({
      id: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    }),
    update: createUpdateSchema(users).omit({
      id: true,
      email: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    }),
    select: createSelectSchema(users),
  },
});

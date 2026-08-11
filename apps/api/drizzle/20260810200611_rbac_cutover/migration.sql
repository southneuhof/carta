CREATE TABLE "authorization_audit_events" (
	"id" text PRIMARY KEY,
	"actor_user_id" text NOT NULL,
	"event_type" text NOT NULL,
	"target_user_id" text,
	"role_id" text,
	"coverage_type" text,
	"division_id" text,
	"project_id" text,
	"before" jsonb DEFAULT '{}' NOT NULL,
	"after" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authorization_modules" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"realm" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "authorization_modules_realm_check" CHECK ("realm" in ('system', 'project'))
);
--> statement-breakpoint
CREATE TABLE "project_role_assignments" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	"coverage_type" text NOT NULL,
	"division_id" text,
	"project_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_role_assignments_coverage_check" CHECK ((
    ("coverage_type" = 'all_projects' and "division_id" is null and "project_id" is null)
    or ("coverage_type" = 'division' and "division_id" is not null and "project_id" is null)
    or ("coverage_type" = 'project' and "division_id" is null and "project_id" is not null)
  ))
);
--> statement-breakpoint
CREATE TABLE "system_role_assignments" (
	"user_id" text,
	"role_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_role_assignments_pkey" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_role_group_id_role_groups_id_fkey";--> statement-breakpoint
DROP TABLE "project_users";--> statement-breakpoint
DROP TABLE "role_groups";--> statement-breakpoint
DROP TABLE "user_roles";--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "module_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "realm" text NOT NULL;--> statement-breakpoint
ALTER TABLE "permissions" DROP COLUMN "permission_group";--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN "role_group_id";--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN "role_type";--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN "assignment_scope";--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN "allow_register";--> statement-breakpoint
CREATE UNIQUE INDEX "project_role_assignments_all_projects_idx" ON "project_role_assignments" ("user_id","role_id") WHERE "coverage_type" = 'all_projects';--> statement-breakpoint
CREATE UNIQUE INDEX "project_role_assignments_division_idx" ON "project_role_assignments" ("user_id","role_id","division_id") WHERE "coverage_type" = 'division';--> statement-breakpoint
CREATE UNIQUE INDEX "project_role_assignments_project_idx" ON "project_role_assignments" ("user_id","role_id","project_id") WHERE "coverage_type" = 'project';--> statement-breakpoint
ALTER TABLE "authorization_audit_events" ADD CONSTRAINT "authorization_audit_events_actor_user_id_users_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "authorization_modules" ADD CONSTRAINT "authorization_modules_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "authorization_modules" ADD CONSTRAINT "authorization_modules_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_module_id_authorization_modules_id_fkey" FOREIGN KEY ("module_id") REFERENCES "authorization_modules"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "project_role_assignments" ADD CONSTRAINT "project_role_assignments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_role_assignments" ADD CONSTRAINT "project_role_assignments_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "project_role_assignments" ADD CONSTRAINT "project_role_assignments_division_id_divisions_id_fkey" FOREIGN KEY ("division_id") REFERENCES "divisions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_role_assignments" ADD CONSTRAINT "project_role_assignments_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_role_assignments" ADD CONSTRAINT "project_role_assignments_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "project_role_assignments" ADD CONSTRAINT "project_role_assignments_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "system_role_assignments" ADD CONSTRAINT "system_role_assignments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "system_role_assignments" ADD CONSTRAINT "system_role_assignments_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "system_role_assignments" ADD CONSTRAINT "system_role_assignments_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "system_role_assignments" ADD CONSTRAINT "system_role_assignments_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permission_id_permissions_id_fkey", ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_realm_check" CHECK ("realm" in ('system', 'project'));
CREATE TABLE "business_categories" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "divisions" (
	"id" text PRIMARY KEY,
	"business_category_id" text NOT NULL,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text,
	"img_thumbnail" text,
	"status_code" text DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "number_configs" (
	"id" text PRIMARY KEY,
	"number_variable_code" text NOT NULL,
	"number_of_digits" integer DEFAULT 0 NOT NULL,
	"custom_code" text,
	"display_order" integer NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "number_variables" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_vendors" (
	"id" text PRIMARY KEY,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY,
	"division_id" text NOT NULL,
	"number" text NOT NULL UNIQUE,
	"integration_code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"current_progress" numeric(12,2) DEFAULT '0' NOT NULL,
	"location" text,
	"start_date" text,
	"end_date" text,
	"img_thumbnail" text,
	"description" text,
	"is_jo" boolean DEFAULT false NOT NULL,
	"status_code" text DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pts_work_categories" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "root_causes" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uoms" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_items" (
	"id" text PRIMARY KEY,
	"project_id" text NOT NULL,
	"parent_id" text,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_high_risk" boolean DEFAULT false NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"volume" numeric(12,2),
	"uom_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" text PRIMARY KEY,
	"actor_user_id" text NOT NULL,
	"project_id" text,
	"division_id" text,
	"module_id" text,
	"module_name" text NOT NULL,
	"reference_table" text,
	"reference_id" text,
	"status_code" text,
	"step_code" text,
	"short_description" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_users" (
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_groups" (
	"id" text PRIMARY KEY,
	"role_group_code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_recipient_employee_id_employees_id_fkey";--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_job_position_id_job_positions_id_fkey";--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_role_id_roles_id_fkey";--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_section_id_toll_sections_id_fkey";--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_created_by_user_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "employees" DROP CONSTRAINT "employees_section_id_toll_sections_id_fkey";--> statement-breakpoint
ALTER TABLE "employees" DROP CONSTRAINT "employees_job_position_id_job_positions_id_fkey";--> statement-breakpoint
ALTER TABLE "employees" DROP CONSTRAINT "employees_section_group_id_section_groups_id_fkey";--> statement-breakpoint
ALTER TABLE "employees" DROP CONSTRAINT "employees_section_ranting_id_section_rantings_id_fkey";--> statement-breakpoint
ALTER TABLE "section_groups" DROP CONSTRAINT "section_groups_section_id_toll_sections_id_fkey";--> statement-breakpoint
ALTER TABLE "section_groups" DROP CONSTRAINT "section_groups_koreg_employee_id_employees_id_fkey";--> statement-breakpoint
ALTER TABLE "section_rantings" DROP CONSTRAINT "section_rantings_section_id_toll_sections_id_fkey";--> statement-breakpoint
ALTER TABLE "section_rantings" DROP CONSTRAINT "section_rantings_head_employee_id_employees_id_fkey";--> statement-breakpoint
ALTER TABLE "toll_sections" DROP CONSTRAINT "toll_sections_section_type_id_section_types_id_fkey";--> statement-breakpoint
ALTER TABLE "overtimes" DROP CONSTRAINT "overtimes_section_id_toll_sections_id_fkey";--> statement-breakpoint
ALTER TABLE "overtimes" DROP CONSTRAINT "overtimes_applicant_employee_id_employees_id_fkey";--> statement-breakpoint
ALTER TABLE "product_variant_assignments" DROP CONSTRAINT "product_variant_assignments_product_id_products_id_fkey";--> statement-breakpoint
ALTER TABLE "product_variant_assignments" DROP CONSTRAINT "product_variant_assignments_variant_id_product_variants_id_fkey";--> statement-breakpoint
ALTER TABLE "config_verificators" DROP CONSTRAINT "config_verificators_section_type_id_section_types_id_fkey";--> statement-breakpoint
ALTER TABLE "config_verificators" DROP CONSTRAINT "config_verificators_job_position_id_job_positions_id_fkey";--> statement-breakpoint
ALTER TABLE "log_verifications" DROP CONSTRAINT "log_verifications_job_position_id_job_positions_id_fkey";--> statement-breakpoint
ALTER TABLE "log_verifications" DROP CONSTRAINT "log_verifications_recipient_employee_id_employees_id_fkey";--> statement-breakpoint
DROP TABLE "employees";--> statement-breakpoint
DROP TABLE "job_positions";--> statement-breakpoint
DROP TABLE "section_groups";--> statement-breakpoint
DROP TABLE "section_rantings";--> statement-breakpoint
DROP TABLE "section_types";--> statement-breakpoint
DROP TABLE "toll_sections";--> statement-breakpoint
DROP TABLE "overtimes";--> statement-breakpoint
DROP TABLE "product_variants";--> statement-breakpoint
DROP TABLE "product_variant_assignments";--> statement-breakpoint
DROP TABLE "products";--> statement-breakpoint
DROP TABLE "config_verificators";--> statement-breakpoint
DROP TABLE "log_verifications";--> statement-breakpoint
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_code_key";--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "recipient_user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "project_id" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "module_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "reference_table" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "reference_id" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "body" text NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "permission_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "permission_group" text NOT NULL;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "created_by_user_id" text;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "updated_by_user_id" text;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD COLUMN "created_by_user_id" text;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD COLUMN "updated_by_user_id" text;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "role_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "role_group_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "role_type" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "assignment_scope" text DEFAULT 'global' NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "allow_register" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "created_by_user_id" text;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "updated_by_user_id" text;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "created_by_user_id" text;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "updated_by_user_id" text;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "img_photo_user" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status_code" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "employee_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "failed_attempt_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_changed_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "recipient_employee_id";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "job_position_id";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "role_id";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "section_id";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "status_code";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "notification_type";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "module_name";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "module_id";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "payload";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "created_by_user_id";--> statement-breakpoint
ALTER TABLE "permissions" DROP COLUMN "code";--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN "scope";--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_permission_code_key" UNIQUE("permission_code");--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_role_code_key" UNIQUE("role_code");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_key" UNIQUE("username");--> statement-breakpoint
CREATE INDEX "divisions_business_category_idx" ON "divisions" ("business_category_id");--> statement-breakpoint
CREATE INDEX "number_configs_variable_idx" ON "number_configs" ("number_variable_code");--> statement-breakpoint
CREATE UNIQUE INDEX "number_configs_active_order_idx" ON "number_configs" ("display_order") WHERE active = true;--> statement-breakpoint
CREATE INDEX "project_vendors_project_idx" ON "project_vendors" ("project_id");--> statement-breakpoint
CREATE INDEX "projects_division_idx" ON "projects" ("division_id");--> statement-breakpoint
CREATE INDEX "work_items_project_idx" ON "work_items" ("project_id");--> statement-breakpoint
CREATE INDEX "work_items_parent_idx" ON "work_items" ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_users_project_user_role_idx" ON "project_users" ("project_id","user_id","role_id");--> statement-breakpoint
ALTER TABLE "business_categories" ADD CONSTRAINT "business_categories_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "business_categories" ADD CONSTRAINT "business_categories_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_business_category_id_business_categories_id_fkey" FOREIGN KEY ("business_category_id") REFERENCES "business_categories"("id");--> statement-breakpoint
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "number_configs" ADD CONSTRAINT "number_configs_number_variable_code_number_variables_code_fkey" FOREIGN KEY ("number_variable_code") REFERENCES "number_variables"("code");--> statement-breakpoint
ALTER TABLE "number_configs" ADD CONSTRAINT "number_configs_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "number_configs" ADD CONSTRAINT "number_configs_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "number_variables" ADD CONSTRAINT "number_variables_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "number_variables" ADD CONSTRAINT "number_variables_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "project_vendors" ADD CONSTRAINT "project_vendors_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "project_vendors" ADD CONSTRAINT "project_vendors_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "project_vendors" ADD CONSTRAINT "project_vendors_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_division_id_divisions_id_fkey" FOREIGN KEY ("division_id") REFERENCES "divisions"("id");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "pts_work_categories" ADD CONSTRAINT "pts_work_categories_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "pts_work_categories" ADD CONSTRAINT "pts_work_categories_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "root_causes" ADD CONSTRAINT "root_causes_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "root_causes" ADD CONSTRAINT "root_causes_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "uoms" ADD CONSTRAINT "uoms_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "uoms" ADD CONSTRAINT "uoms_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_parent_id_work_items_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "work_items"("id");--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_uom_id_uoms_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "uoms"("id");--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_user_id_users_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_users_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "project_users" ADD CONSTRAINT "project_users_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_users" ADD CONSTRAINT "project_users_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_users" ADD CONSTRAINT "project_users_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_users" ADD CONSTRAINT "project_users_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "project_users" ADD CONSTRAINT "project_users_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "role_groups" ADD CONSTRAINT "role_groups_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "role_groups" ADD CONSTRAINT "role_groups_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_role_group_id_role_groups_id_fkey" FOREIGN KEY ("role_group_id") REFERENCES "role_groups"("id");--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
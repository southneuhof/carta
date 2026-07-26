CREATE TABLE "accounts" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" text PRIMARY KEY,
	"full_name" text NOT NULL,
	"user_id" text UNIQUE,
	"section_id" text,
	"job_position_id" text,
	"section_group_id" text,
	"section_ranting_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_positions" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "section_groups" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"section_id" text,
	"koreg_employee_id" text
);
--> statement-breakpoint
CREATE TABLE "section_rantings" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"section_id" text,
	"head_employee_id" text
);
--> statement-breakpoint
CREATE TABLE "section_types" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "toll_sections" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"section_type_id" text
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variant_assignments" (
	"product_id" text,
	"variant_id" text,
	CONSTRAINT "product_variant_assignments_pkey" PRIMARY KEY("product_id","variant_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"sku" text NOT NULL,
	"owner_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" text,
	"permission_id" text,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "role_permissions_pkey" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"scope" text DEFAULT 'section' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" text,
	"role_id" text,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "user_roles_pkey" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_section_id_toll_sections_id_fkey" FOREIGN KEY ("section_id") REFERENCES "toll_sections"("id");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_job_position_id_job_positions_id_fkey" FOREIGN KEY ("job_position_id") REFERENCES "job_positions"("id");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_section_group_id_section_groups_id_fkey" FOREIGN KEY ("section_group_id") REFERENCES "section_groups"("id");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_section_ranting_id_section_rantings_id_fkey" FOREIGN KEY ("section_ranting_id") REFERENCES "section_rantings"("id");--> statement-breakpoint
ALTER TABLE "section_groups" ADD CONSTRAINT "section_groups_section_id_toll_sections_id_fkey" FOREIGN KEY ("section_id") REFERENCES "toll_sections"("id");--> statement-breakpoint
ALTER TABLE "section_groups" ADD CONSTRAINT "section_groups_koreg_employee_id_employees_id_fkey" FOREIGN KEY ("koreg_employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "section_rantings" ADD CONSTRAINT "section_rantings_section_id_toll_sections_id_fkey" FOREIGN KEY ("section_id") REFERENCES "toll_sections"("id");--> statement-breakpoint
ALTER TABLE "section_rantings" ADD CONSTRAINT "section_rantings_head_employee_id_employees_id_fkey" FOREIGN KEY ("head_employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "toll_sections" ADD CONSTRAINT "toll_sections_section_type_id_section_types_id_fkey" FOREIGN KEY ("section_type_id") REFERENCES "section_types"("id");--> statement-breakpoint
ALTER TABLE "product_variant_assignments" ADD CONSTRAINT "product_variant_assignments_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "product_variant_assignments" ADD CONSTRAINT "product_variant_assignments_variant_id_product_variants_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_owner_id_users_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;
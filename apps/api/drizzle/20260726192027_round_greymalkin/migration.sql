CREATE TABLE "notifications" (
	"id" text PRIMARY KEY,
	"recipient_employee_id" text,
	"job_position_id" text,
	"role_id" text,
	"section_id" text,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"status_code" text DEFAULT 'unseen' NOT NULL,
	"notification_type" text NOT NULL,
	"module_name" text NOT NULL,
	"module_id" text,
	"payload" jsonb,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "config_verificators" (
	"id" text PRIMARY KEY,
	"module_name" text NOT NULL,
	"section_type_id" text,
	"order_number" integer NOT NULL,
	"verificator_type" text NOT NULL,
	"job_position_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log_verifications" (
	"id" text PRIMARY KEY,
	"module_name" text NOT NULL,
	"module_id" text NOT NULL,
	"order_number" integer NOT NULL,
	"verificator_type" text NOT NULL,
	"job_position_id" text,
	"recipient_employee_id" text,
	"status_code" text DEFAULT 'pending' NOT NULL,
	"verified_by_user_id" text,
	"verified_at" timestamp,
	"verified_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_employee_id_employees_id_fkey" FOREIGN KEY ("recipient_employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_job_position_id_job_positions_id_fkey" FOREIGN KEY ("job_position_id") REFERENCES "job_positions"("id");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_section_id_toll_sections_id_fkey" FOREIGN KEY ("section_id") REFERENCES "toll_sections"("id");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "config_verificators" ADD CONSTRAINT "config_verificators_section_type_id_section_types_id_fkey" FOREIGN KEY ("section_type_id") REFERENCES "section_types"("id");--> statement-breakpoint
ALTER TABLE "config_verificators" ADD CONSTRAINT "config_verificators_job_position_id_job_positions_id_fkey" FOREIGN KEY ("job_position_id") REFERENCES "job_positions"("id");--> statement-breakpoint
ALTER TABLE "log_verifications" ADD CONSTRAINT "log_verifications_job_position_id_job_positions_id_fkey" FOREIGN KEY ("job_position_id") REFERENCES "job_positions"("id");--> statement-breakpoint
ALTER TABLE "log_verifications" ADD CONSTRAINT "log_verifications_recipient_employee_id_employees_id_fkey" FOREIGN KEY ("recipient_employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "log_verifications" ADD CONSTRAINT "log_verifications_verified_by_user_id_users_id_fkey" FOREIGN KEY ("verified_by_user_id") REFERENCES "users"("id");
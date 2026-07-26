CREATE TABLE "overtimes" (
	"id" text PRIMARY KEY,
	"section_id" text NOT NULL,
	"applicant_employee_id" text NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"estimated_minutes" integer NOT NULL,
	"description" text,
	"status_code" text DEFAULT 'draft' NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_section_id_toll_sections_id_fkey" FOREIGN KEY ("section_id") REFERENCES "toll_sections"("id");--> statement-breakpoint
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_applicant_employee_id_employees_id_fkey" FOREIGN KEY ("applicant_employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");
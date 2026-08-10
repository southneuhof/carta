CREATE TABLE "qhsse_pts" (
	"id" text PRIMARY KEY,
	"date" text NOT NULL,
	"division_id" text NOT NULL,
	"project_id" text NOT NULL,
	"number" text NOT NULL UNIQUE,
	"source" text DEFAULT 'pts-report' NOT NULL,
	"pts_work_category_id" text NOT NULL,
	"work_item_category_id" text NOT NULL,
	"work_item_id" text NOT NULL,
	"criteria_code" text NOT NULL,
	"img_before" text NOT NULL,
	"img_process" text,
	"img_after" text,
	"location" text NOT NULL,
	"description" text NOT NULL,
	"som_user_id" text,
	"disposition_status_code" text,
	"disposition_notes" text,
	"temporary_plan" text,
	"temporary_plan_target_date" text,
	"management_notes" text,
	"management_notes_target_date" text,
	"analysis" text,
	"analysis_target_date" text,
	"implementation_plan" text,
	"implementation_plan_target_date" text,
	"follow_up_implementation_done_at" text,
	"price_follow_up" text,
	"price_follow_up_target_date" text,
	"price_follow_up_cost" numeric(14,2),
	"follow_up_price_done_at" text,
	"implementation_report" text,
	"implementation_date" text,
	"implementation_cost" numeric(14,2),
	"realization" text,
	"realization_date" text,
	"actual_cost" numeric(14,2),
	"vendor_id" text,
	"verification_status_code" text,
	"verification_notes" text,
	"close_notes" text,
	"close_date" text,
	"status_code" text DEFAULT 'open' NOT NULL,
	"step_code" text DEFAULT 'report' NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qhsse_pts_number_counters" (
	"project_id" text,
	"year" integer,
	"last_number" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "qhsse_pts_number_counters_pkey" PRIMARY KEY("project_id","year")
);
--> statement-breakpoint
CREATE TABLE "qhsse_pts_root_cause" (
	"qhsse_pts_id" text,
	"root_cause_id" text,
	CONSTRAINT "qhsse_pts_root_cause_pkey" PRIMARY KEY("qhsse_pts_id","root_cause_id")
);
--> statement-breakpoint
CREATE INDEX "qhsse_pts_project_idx" ON "qhsse_pts" ("project_id");--> statement-breakpoint
CREATE INDEX "qhsse_pts_division_idx" ON "qhsse_pts" ("division_id");--> statement-breakpoint
CREATE INDEX "qhsse_pts_status_step_idx" ON "qhsse_pts" ("status_code","step_code");--> statement-breakpoint
CREATE INDEX "qhsse_pts_date_idx" ON "qhsse_pts" ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "qhsse_pts_root_cause_pair_idx" ON "qhsse_pts_root_cause" ("qhsse_pts_id","root_cause_id");--> statement-breakpoint
ALTER TABLE "qhsse_pts" ADD CONSTRAINT "qhsse_pts_division_id_divisions_id_fkey" FOREIGN KEY ("division_id") REFERENCES "divisions"("id");--> statement-breakpoint
ALTER TABLE "qhsse_pts" ADD CONSTRAINT "qhsse_pts_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "qhsse_pts" ADD CONSTRAINT "qhsse_pts_pts_work_category_id_pts_work_categories_id_fkey" FOREIGN KEY ("pts_work_category_id") REFERENCES "pts_work_categories"("id");--> statement-breakpoint
ALTER TABLE "qhsse_pts" ADD CONSTRAINT "qhsse_pts_work_item_category_id_work_items_id_fkey" FOREIGN KEY ("work_item_category_id") REFERENCES "work_items"("id");--> statement-breakpoint
ALTER TABLE "qhsse_pts" ADD CONSTRAINT "qhsse_pts_work_item_id_work_items_id_fkey" FOREIGN KEY ("work_item_id") REFERENCES "work_items"("id");--> statement-breakpoint
ALTER TABLE "qhsse_pts" ADD CONSTRAINT "qhsse_pts_som_user_id_users_id_fkey" FOREIGN KEY ("som_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "qhsse_pts" ADD CONSTRAINT "qhsse_pts_vendor_id_project_vendors_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "project_vendors"("id");--> statement-breakpoint
ALTER TABLE "qhsse_pts" ADD CONSTRAINT "qhsse_pts_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "qhsse_pts" ADD CONSTRAINT "qhsse_pts_updated_by_users_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "qhsse_pts_number_counters" ADD CONSTRAINT "qhsse_pts_number_counters_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "qhsse_pts_root_cause" ADD CONSTRAINT "qhsse_pts_root_cause_qhsse_pts_id_qhsse_pts_id_fkey" FOREIGN KEY ("qhsse_pts_id") REFERENCES "qhsse_pts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "qhsse_pts_root_cause" ADD CONSTRAINT "qhsse_pts_root_cause_root_cause_id_root_causes_id_fkey" FOREIGN KEY ("root_cause_id") REFERENCES "root_causes"("id");
ALTER TABLE "qhsse_pts"
  DROP COLUMN IF EXISTS "date",
  DROP COLUMN IF EXISTS "source",
  DROP COLUMN IF EXISTS "disposition_notes",
  DROP COLUMN IF EXISTS "temporary_plan",
  DROP COLUMN IF EXISTS "temporary_plan_target_date",
  DROP COLUMN IF EXISTS "management_notes_target_date",
  DROP COLUMN IF EXISTS "analysis",
  DROP COLUMN IF EXISTS "analysis_target_date",
  DROP COLUMN IF EXISTS "implementation_plan",
  DROP COLUMN IF EXISTS "implementation_plan_target_date",
  DROP COLUMN IF EXISTS "follow_up_implementation_done_at",
  DROP COLUMN IF EXISTS "price_follow_up",
  DROP COLUMN IF EXISTS "price_follow_up_target_date",
  DROP COLUMN IF EXISTS "price_follow_up_cost",
  DROP COLUMN IF EXISTS "follow_up_price_done_at",
  DROP COLUMN IF EXISTS "implementation_report",
  DROP COLUMN IF EXISTS "implementation_cost",
  DROP COLUMN IF EXISTS "realization",
  DROP COLUMN IF EXISTS "realization_date",
  DROP COLUMN IF EXISTS "vendor_id",
  DROP COLUMN IF EXISTS "verification_status_code",
  DROP COLUMN IF EXISTS "verification_notes",
  DROP COLUMN IF EXISTS "close_notes",
  DROP COLUMN IF EXISTS "close_date";
--> statement-breakpoint
ALTER TABLE "qhsse_pts"
  ADD COLUMN IF NOT EXISTS "location_zone" text,
  ADD COLUMN IF NOT EXISTS "temporary_follow_up_plan" text,
  ADD COLUMN IF NOT EXISTS "follow_up_plan" text,
  ADD COLUMN IF NOT EXISTS "target_date" text,
  ADD COLUMN IF NOT EXISTS "implementation_user_id" text,
  ADD COLUMN IF NOT EXISTS "work_method" text,
  ADD COLUMN IF NOT EXISTS "estimation_cost" numeric(14,2),
  ADD COLUMN IF NOT EXISTS "job_implementor_type" text,
  ADD COLUMN IF NOT EXISTS "project_vendor_id" text,
  ADD COLUMN IF NOT EXISTS "implementation_description" text,
  ADD COLUMN IF NOT EXISTS "implementation_status_code" text,
  ADD COLUMN IF NOT EXISTS "implementation_verification_description" text,
  ADD COLUMN IF NOT EXISTS "actual_job_implementor_type" text,
  ADD COLUMN IF NOT EXISTS "actual_project_vendor_id" text,
  ADD COLUMN IF NOT EXISTS "deleted_by" text,
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamp,
  ADD COLUMN IF NOT EXISTS "deleted_reason" text;
--> statement-breakpoint
ALTER TABLE "qhsse_pts" ALTER COLUMN "description" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "qhsse_pts_number_counters"
  ALTER COLUMN "project_id" SET NOT NULL,
  ALTER COLUMN "year" SET NOT NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS "qhsse_pts_date_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "qhsse_pts_root_cause_pair_idx";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qhsse_pts_created_at_idx" ON "qhsse_pts" ("created_at");
--> statement-breakpoint
ALTER TABLE "qhsse_pts"
  ADD CONSTRAINT "qhsse_pts_implementation_user_id_users_id_fkey" FOREIGN KEY ("implementation_user_id") REFERENCES "users"("id"),
  ADD CONSTRAINT "qhsse_pts_project_vendor_id_project_vendors_id_fkey" FOREIGN KEY ("project_vendor_id") REFERENCES "project_vendors"("id"),
  ADD CONSTRAINT "qhsse_pts_actual_project_vendor_id_project_vendors_id_fkey" FOREIGN KEY ("actual_project_vendor_id") REFERENCES "project_vendors"("id"),
  ADD CONSTRAINT "qhsse_pts_deleted_by_users_id_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id");

CREATE TABLE "quality_inspection_documentations" (
	"id" text PRIMARY KEY,
	"quality_inspection_id" text NOT NULL,
	"name" text NOT NULL,
	"file_attachment" text,
	"description" text,
	"created_by_user_id" text NOT NULL,
	"updated_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quality_inspection_documentations_name_check" CHECK ("name" in ('sudut 1', 'sudut 2', 'sudut 3', 'sudut 4'))
);
--> statement-breakpoint
CREATE TABLE "quality_inspection_number_counters" (
	"project_id" text NOT NULL,
	"year" integer NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_inspection_pts_rejection" (
	"id" text PRIMARY KEY,
	"quality_inspection_id" text NOT NULL,
	"quality_inspection_work_item_itp_id" text NOT NULL,
	"qhsse_pts_id" text NOT NULL,
	"note" text,
	"rejecting_user_id" text NOT NULL,
	"rejected_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_inspection_verification" (
	"id" text PRIMARY KEY,
	"quality_inspection_id" text NOT NULL,
	"result_code" text NOT NULL,
	"description" text,
	"resulting_status_code" text NOT NULL,
	"resulting_step_code" text NOT NULL,
	"verifier_id" text NOT NULL,
	"verified_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quality_inspection_verification_result_check" CHECK ("result_code" in ('approved', 'rejected', 'repair', 'pending'))
);
--> statement-breakpoint
CREATE TABLE "quality_inspection_work_item_itp_snapshot_inspector" (
	"id" text PRIMARY KEY,
	"snapshot_id" text NOT NULL,
	"inspector_type_code" text NOT NULL,
	"inspector_type_name" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"updated_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_inspection_work_item_itp_snapshot_point" (
	"id" text PRIMARY KEY,
	"snapshot_inspector_id" text NOT NULL,
	"inspection_point_code" text NOT NULL,
	"inspection_point_name" text NOT NULL,
	"value" boolean DEFAULT false NOT NULL,
	"created_by_user_id" text NOT NULL,
	"updated_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_inspection_work_item_itp_snapshot" (
	"id" text PRIMARY KEY,
	"quality_inspection_work_item_itp_id" text NOT NULL,
	"source_itp_id" text NOT NULL,
	"type" text NOT NULL,
	"criteria" text,
	"procedure_code" text,
	"specification" text,
	"method" text,
	"frequency" integer NOT NULL,
	"img_documentation" text,
	"description" text,
	"created_by_user_id" text NOT NULL,
	"updated_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_inspection_work_item_itp_verification" (
	"id" text PRIMARY KEY,
	"quality_inspection_work_item_itp_id" text NOT NULL,
	"result_code" text NOT NULL,
	"description" text,
	"verifier_id" text NOT NULL,
	"verified_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quality_inspection_work_item_itp_verification_result_check" CHECK ("result_code" in ('approved', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "quality_inspection_work_item_itp" (
	"id" text PRIMARY KEY,
	"quality_inspection_id" text NOT NULL,
	"work_item_id" text NOT NULL,
	"volume" numeric(14,2) NOT NULL,
	"status_code" text DEFAULT 'waiting' NOT NULL,
	"verification_description" text,
	"verified_by" text,
	"verified_at" timestamp,
	"qhsse_pts_id" text,
	"created_by_user_id" text NOT NULL,
	"updated_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quality_inspection_work_item_itp_volume_check" CHECK ("volume" > 0),
	CONSTRAINT "quality_inspection_work_item_itp_status_check" CHECK ("status_code" in ('waiting', 'approved', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "quality_inspection" (
	"id" text PRIMARY KEY,
	"division_id" text NOT NULL,
	"project_id" text NOT NULL,
	"number" text NOT NULL UNIQUE,
	"target_date" text NOT NULL,
	"quality_work_category_id" text NOT NULL,
	"work_item_category_id" text NOT NULL,
	"location_zone" text,
	"inspection_point_code" text,
	"work_method" text,
	"schedule_id" text,
	"schedule_start_date" text,
	"schedule_end_date" text,
	"status_code" text DEFAULT 'open' NOT NULL,
	"step_code" text DEFAULT 'report' NOT NULL,
	"result_code" text,
	"verification_description" text,
	"created_by_user_id" text NOT NULL,
	"updated_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_by_user_id" text,
	"deleted_at" timestamp,
	"deleted_reason" text,
	CONSTRAINT "quality_inspection_status_check" CHECK ("status_code" in ('open', 'on-progress', 'close')),
	CONSTRAINT "quality_inspection_step_check" CHECK ("step_code" in ('report', 'complete-report', 'inspected', 'submitted', 'close')),
	CONSTRAINT "quality_inspection_result_check" CHECK ("result_code" is null or "result_code" in ('approved', 'rejected', 'repair', 'pending'))
);
--> statement-breakpoint
CREATE TABLE "work_item_schedule" (
	"id" text PRIMARY KEY,
	"project_id" text NOT NULL,
	"work_item_id" text NOT NULL,
	"start_date" text,
	"end_date" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text NOT NULL,
	"updated_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "qhsse_pts" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "qhsse_pts" ALTER COLUMN "criteria_code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "qhsse_pts" ALTER COLUMN "img_before" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "qhsse_pts" ALTER COLUMN "location" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "qhsse_pts_open_qi_source_idx" ON "qhsse_pts" ("project_id","work_item_id") WHERE "source" = 'qi-report' and "status_code" <> 'close' and "deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "quality_inspection_documentations_report_name_idx" ON "quality_inspection_documentations" ("quality_inspection_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "quality_inspection_number_counters_project_year_idx" ON "quality_inspection_number_counters" ("project_id","year");--> statement-breakpoint
CREATE UNIQUE INDEX "quality_inspection_work_item_itp_snapshot_inspector_type_idx" ON "quality_inspection_work_item_itp_snapshot_inspector" ("snapshot_id","inspector_type_code");--> statement-breakpoint
CREATE UNIQUE INDEX "quality_inspection_work_item_itp_snapshot_point_idx" ON "quality_inspection_work_item_itp_snapshot_point" ("snapshot_inspector_id","inspection_point_code");--> statement-breakpoint
CREATE UNIQUE INDEX "quality_inspection_work_item_itp_snapshot_row_type_idx" ON "quality_inspection_work_item_itp_snapshot" ("quality_inspection_work_item_itp_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "quality_inspection_work_item_itp_report_work_item_idx" ON "quality_inspection_work_item_itp" ("quality_inspection_id","work_item_id");--> statement-breakpoint
CREATE INDEX "quality_inspection_project_idx" ON "quality_inspection" ("project_id");--> statement-breakpoint
CREATE INDEX "quality_inspection_status_step_idx" ON "quality_inspection" ("status_code","step_code");--> statement-breakpoint
CREATE INDEX "work_item_schedule_project_idx" ON "work_item_schedule" ("project_id");--> statement-breakpoint
CREATE INDEX "work_item_schedule_work_item_idx" ON "work_item_schedule" ("work_item_id");--> statement-breakpoint
ALTER TABLE "quality_inspection_documentations" ADD CONSTRAINT "quality_inspection_documentations_zsdEDBf0LObm_fkey" FOREIGN KEY ("quality_inspection_id") REFERENCES "quality_inspection"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quality_inspection_documentations" ADD CONSTRAINT "quality_inspection_documentations_CQ73SSEmD5YC_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection_documentations" ADD CONSTRAINT "quality_inspection_documentations_jwY54uvI3VoB_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection_number_counters" ADD CONSTRAINT "quality_inspection_number_counters_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quality_inspection_pts_rejection" ADD CONSTRAINT "quality_inspection_pts_rejection_nZWBxJDnXMuY_fkey" FOREIGN KEY ("quality_inspection_id") REFERENCES "quality_inspection"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quality_inspection_pts_rejection" ADD CONSTRAINT "quality_inspection_pts_rejection_u6vAg5Bf4x4I_fkey" FOREIGN KEY ("quality_inspection_work_item_itp_id") REFERENCES "quality_inspection_work_item_itp"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quality_inspection_pts_rejection" ADD CONSTRAINT "quality_inspection_pts_rejection_qhsse_pts_id_qhsse_pts_id_fkey" FOREIGN KEY ("qhsse_pts_id") REFERENCES "qhsse_pts"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection_pts_rejection" ADD CONSTRAINT "quality_inspection_pts_rejection_jZnhJ0mWZ1H5_fkey" FOREIGN KEY ("rejecting_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection_verification" ADD CONSTRAINT "quality_inspection_verification_gpM6sjLQflX8_fkey" FOREIGN KEY ("quality_inspection_id") REFERENCES "quality_inspection"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quality_inspection_verification" ADD CONSTRAINT "quality_inspection_verification_verifier_id_users_id_fkey" FOREIGN KEY ("verifier_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp_snapshot_inspector" ADD CONSTRAINT "ofKIeQ9HxlDi_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "quality_inspection_work_item_itp_snapshot"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp_snapshot_inspector" ADD CONSTRAINT "El8lEXRg8Dbt_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp_snapshot_inspector" ADD CONSTRAINT "sbslnwrHzo1I_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp_snapshot_point" ADD CONSTRAINT "WwX9m6XXm2gX_fkey" FOREIGN KEY ("snapshot_inspector_id") REFERENCES "quality_inspection_work_item_itp_snapshot_inspector"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp_snapshot_point" ADD CONSTRAINT "ol5XVZcDq9Hs_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp_snapshot_point" ADD CONSTRAINT "v2P1Ii95ec6l_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp_snapshot" ADD CONSTRAINT "quality_inspection_work_item_itp_snapshot_CMWh7fHWJJRd_fkey" FOREIGN KEY ("quality_inspection_work_item_itp_id") REFERENCES "quality_inspection_work_item_itp"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp_snapshot" ADD CONSTRAINT "quality_inspection_work_item_itp_snapshot_elOf706ADvfO_fkey" FOREIGN KEY ("source_itp_id") REFERENCES "inspection_test_plans"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp_snapshot" ADD CONSTRAINT "quality_inspection_work_item_itp_snapshot_2oDktBuM5VCp_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp_snapshot" ADD CONSTRAINT "quality_inspection_work_item_itp_snapshot_GrEogKIUGIes_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp_verification" ADD CONSTRAINT "1S2cdzFOvJES_fkey" FOREIGN KEY ("quality_inspection_work_item_itp_id") REFERENCES "quality_inspection_work_item_itp"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp_verification" ADD CONSTRAINT "qnpuqTiOa5pS_fkey" FOREIGN KEY ("verifier_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp" ADD CONSTRAINT "quality_inspection_work_item_itp_QC6uNHIel05a_fkey" FOREIGN KEY ("quality_inspection_id") REFERENCES "quality_inspection"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp" ADD CONSTRAINT "quality_inspection_work_item_itp_10XOTfm0XmVj_fkey" FOREIGN KEY ("work_item_id") REFERENCES "work_items"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp" ADD CONSTRAINT "quality_inspection_work_item_itp_verified_by_users_id_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp" ADD CONSTRAINT "quality_inspection_work_item_itp_qhsse_pts_id_qhsse_pts_id_fkey" FOREIGN KEY ("qhsse_pts_id") REFERENCES "qhsse_pts"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp" ADD CONSTRAINT "quality_inspection_work_item_itp_s6YbofXURAGm_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection_work_item_itp" ADD CONSTRAINT "quality_inspection_work_item_itp_6GSaf7jYMfqt_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection" ADD CONSTRAINT "quality_inspection_division_id_divisions_id_fkey" FOREIGN KEY ("division_id") REFERENCES "divisions"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection" ADD CONSTRAINT "quality_inspection_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection" ADD CONSTRAINT "quality_inspection_pD0Fn2zkymCG_fkey" FOREIGN KEY ("quality_work_category_id") REFERENCES "pts_work_categories"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection" ADD CONSTRAINT "quality_inspection_work_item_category_id_work_items_id_fkey" FOREIGN KEY ("work_item_category_id") REFERENCES "work_items"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection" ADD CONSTRAINT "quality_inspection_8Cj2srz8bF7X_fkey" FOREIGN KEY ("inspection_point_code") REFERENCES "itp_inspection_points"("code");--> statement-breakpoint
ALTER TABLE "quality_inspection" ADD CONSTRAINT "quality_inspection_schedule_id_work_item_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "work_item_schedule"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection" ADD CONSTRAINT "quality_inspection_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection" ADD CONSTRAINT "quality_inspection_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quality_inspection" ADD CONSTRAINT "quality_inspection_deleted_by_user_id_users_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "work_item_schedule" ADD CONSTRAINT "work_item_schedule_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "work_item_schedule" ADD CONSTRAINT "work_item_schedule_work_item_id_work_items_id_fkey" FOREIGN KEY ("work_item_id") REFERENCES "work_items"("id");--> statement-breakpoint
ALTER TABLE "work_item_schedule" ADD CONSTRAINT "work_item_schedule_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "work_item_schedule" ADD CONSTRAINT "work_item_schedule_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
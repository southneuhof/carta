CREATE TABLE "inspection_test_plan_inspector_points" (
	"id" text PRIMARY KEY,
	"inspection_test_plan_inspector_type_id" text NOT NULL,
	"inspection_point_code" text NOT NULL,
	"value" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspection_test_plan_inspector_types" (
	"id" text PRIMARY KEY,
	"inspection_test_plan_id" text NOT NULL,
	"inspector_type_id" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspection_test_plans" (
	"id" text PRIMARY KEY,
	"work_item_id" text NOT NULL,
	"type" text NOT NULL,
	"criteria" text,
	"procedure_code" text,
	"specification" text,
	"method" text,
	"frequency" integer NOT NULL,
	"img_documentation" text,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itp_inspection_points" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itp_inspector_types" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "inspection_test_plan_inspector_points_type_point_idx" ON "inspection_test_plan_inspector_points" ("inspection_test_plan_inspector_type_id","inspection_point_code");--> statement-breakpoint
CREATE UNIQUE INDEX "inspection_test_plan_inspector_types_plan_type_idx" ON "inspection_test_plan_inspector_types" ("inspection_test_plan_id","inspector_type_id");--> statement-breakpoint
CREATE INDEX "inspection_test_plans_work_item_idx" ON "inspection_test_plans" ("work_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inspection_test_plans_active_work_item_type_idx" ON "inspection_test_plans" ("work_item_id","type") WHERE "active" = true;--> statement-breakpoint
ALTER TABLE "inspection_test_plan_inspector_points" ADD CONSTRAINT "inspection_test_plan_inspector_points_nQ9uBUwc0fue_fkey" FOREIGN KEY ("inspection_test_plan_inspector_type_id") REFERENCES "inspection_test_plan_inspector_types"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "inspection_test_plan_inspector_points" ADD CONSTRAINT "inspection_test_plan_inspector_points_rBHdSk1eNn7q_fkey" FOREIGN KEY ("inspection_point_code") REFERENCES "itp_inspection_points"("code");--> statement-breakpoint
ALTER TABLE "inspection_test_plan_inspector_points" ADD CONSTRAINT "inspection_test_plan_inspector_points_RNXUd9KpLZe9_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "inspection_test_plan_inspector_points" ADD CONSTRAINT "inspection_test_plan_inspector_points_5pDCmVLAPmWk_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "inspection_test_plan_inspector_types" ADD CONSTRAINT "inspection_test_plan_inspector_types_vkvglPdfOTos_fkey" FOREIGN KEY ("inspection_test_plan_id") REFERENCES "inspection_test_plans"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "inspection_test_plan_inspector_types" ADD CONSTRAINT "inspection_test_plan_inspector_types_ar2BW8CrDTZI_fkey" FOREIGN KEY ("inspector_type_id") REFERENCES "itp_inspector_types"("id");--> statement-breakpoint
ALTER TABLE "inspection_test_plan_inspector_types" ADD CONSTRAINT "inspection_test_plan_inspector_types_0XqvPjmNT8fT_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "inspection_test_plan_inspector_types" ADD CONSTRAINT "inspection_test_plan_inspector_types_WxeqOkgYCOOE_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "inspection_test_plans" ADD CONSTRAINT "inspection_test_plans_work_item_id_work_items_id_fkey" FOREIGN KEY ("work_item_id") REFERENCES "work_items"("id");--> statement-breakpoint
ALTER TABLE "inspection_test_plans" ADD CONSTRAINT "inspection_test_plans_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "inspection_test_plans" ADD CONSTRAINT "inspection_test_plans_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "itp_inspection_points" ADD CONSTRAINT "itp_inspection_points_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "itp_inspection_points" ADD CONSTRAINT "itp_inspection_points_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "itp_inspector_types" ADD CONSTRAINT "itp_inspector_types_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "itp_inspector_types" ADD CONSTRAINT "itp_inspector_types_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
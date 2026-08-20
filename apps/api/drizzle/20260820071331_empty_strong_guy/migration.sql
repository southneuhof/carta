CREATE TABLE "finding_categories" (
	"id" text PRIMARY KEY,
	"finding_type_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL UNIQUE,
	"display_order" integer DEFAULT 0 NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finding_cause" (
	"id" text PRIMARY KEY,
	"finding_category_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL UNIQUE,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finding_criteria" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"code" text UNIQUE,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finding_types" (
	"id" text PRIMARY KEY,
	"finding_criteria_code" text NOT NULL,
	"name" text NOT NULL,
	"code" text UNIQUE,
	"display_order" integer DEFAULT 0 NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "finding_categories_type_idx" ON "finding_categories" ("finding_type_id");--> statement-breakpoint
CREATE INDEX "finding_cause_category_idx" ON "finding_cause" ("finding_category_id");--> statement-breakpoint
CREATE INDEX "finding_types_criteria_idx" ON "finding_types" ("finding_criteria_code");--> statement-breakpoint
ALTER TABLE "finding_categories" ADD CONSTRAINT "finding_categories_finding_type_id_finding_types_id_fkey" FOREIGN KEY ("finding_type_id") REFERENCES "finding_types"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "finding_categories" ADD CONSTRAINT "finding_categories_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "finding_categories" ADD CONSTRAINT "finding_categories_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "finding_cause" ADD CONSTRAINT "finding_cause_finding_category_id_finding_categories_id_fkey" FOREIGN KEY ("finding_category_id") REFERENCES "finding_categories"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "finding_cause" ADD CONSTRAINT "finding_cause_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "finding_cause" ADD CONSTRAINT "finding_cause_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "finding_criteria" ADD CONSTRAINT "finding_criteria_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "finding_criteria" ADD CONSTRAINT "finding_criteria_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "finding_types" ADD CONSTRAINT "finding_types_finding_criteria_code_finding_criteria_code_fkey" FOREIGN KEY ("finding_criteria_code") REFERENCES "finding_criteria"("code");--> statement-breakpoint
ALTER TABLE "finding_types" ADD CONSTRAINT "finding_types_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "finding_types" ADD CONSTRAINT "finding_types_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
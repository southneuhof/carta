CREATE TABLE "law_reference_categories" (
	"id" text PRIMARY KEY,
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
CREATE TABLE "law_reference_items" (
	"id" text PRIMARY KEY,
	"law_reference_category_code" text NOT NULL,
	"name" text NOT NULL,
	"level" integer NOT NULL,
	"type" text,
	"parent_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"deleted_by_user_id" text,
	"deleted_at" timestamp,
	"deleted_reason" text,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "law_reference_items_category_idx" ON "law_reference_items" ("law_reference_category_code");--> statement-breakpoint
CREATE INDEX "law_reference_items_parent_idx" ON "law_reference_items" ("parent_id");--> statement-breakpoint
CREATE INDEX "law_reference_items_deleted_idx" ON "law_reference_items" ("deleted");--> statement-breakpoint
ALTER TABLE "law_reference_categories" ADD CONSTRAINT "law_reference_categories_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "law_reference_categories" ADD CONSTRAINT "law_reference_categories_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "law_reference_items" ADD CONSTRAINT "law_reference_items_IJvuphSBQmcp_fkey" FOREIGN KEY ("law_reference_category_code") REFERENCES "law_reference_categories"("code");--> statement-breakpoint
ALTER TABLE "law_reference_items" ADD CONSTRAINT "law_reference_items_parent_id_law_reference_items_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "law_reference_items"("id");--> statement-breakpoint
ALTER TABLE "law_reference_items" ADD CONSTRAINT "law_reference_items_deleted_by_user_id_users_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "law_reference_items" ADD CONSTRAINT "law_reference_items_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "law_reference_items" ADD CONSTRAINT "law_reference_items_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
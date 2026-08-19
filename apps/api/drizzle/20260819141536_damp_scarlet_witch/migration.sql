CREATE TABLE "permit_apd" (
	"id" text PRIMARY KEY,
	"permit_category_apd_id" text NOT NULL,
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
CREATE TABLE "permit_category_apd" (
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
ALTER TABLE "permit_apd" ADD CONSTRAINT "permit_apd_permit_category_apd_id_permit_category_apd_id_fkey" FOREIGN KEY ("permit_category_apd_id") REFERENCES "permit_category_apd"("id");--> statement-breakpoint
ALTER TABLE "permit_apd" ADD CONSTRAINT "permit_apd_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "permit_apd" ADD CONSTRAINT "permit_apd_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "permit_category_apd" ADD CONSTRAINT "permit_category_apd_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "permit_category_apd" ADD CONSTRAINT "permit_category_apd_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
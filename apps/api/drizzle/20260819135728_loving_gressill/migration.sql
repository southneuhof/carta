CREATE TABLE "safety_checklist" (
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
ALTER TABLE "safety_checklist" ADD CONSTRAINT "safety_checklist_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "safety_checklist" ADD CONSTRAINT "safety_checklist_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
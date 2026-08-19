CREATE TABLE "permit_attachment" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"code" text UNIQUE,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"permit_work_type_id" text,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "permit_attachment" ADD CONSTRAINT "permit_attachment_permit_work_type_id_permit_work_types_id_fkey" FOREIGN KEY ("permit_work_type_id") REFERENCES "permit_work_types"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "permit_attachment" ADD CONSTRAINT "permit_attachment_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "permit_attachment" ADD CONSTRAINT "permit_attachment_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
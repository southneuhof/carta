CREATE TABLE "emergency_simulation_tools" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"code" text UNIQUE,
	"description" text,
	"active" boolean DEFAULT true,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "emergency_simulation_tools" ADD CONSTRAINT "emergency_simulation_tools_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "emergency_simulation_tools" ADD CONSTRAINT "emergency_simulation_tools_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
CREATE TABLE "toll_causes_accidents" (
	"id" text PRIMARY KEY,
	"category_code" text NOT NULL,
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
CREATE TABLE "toll_causes_accidents_categories" (
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
ALTER TABLE "toll_causes_accidents" ADD CONSTRAINT "toll_causes_accidents_GVaoAaZg4td3_fkey" FOREIGN KEY ("category_code") REFERENCES "toll_causes_accidents_categories"("code");--> statement-breakpoint
ALTER TABLE "toll_causes_accidents" ADD CONSTRAINT "toll_causes_accidents_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "toll_causes_accidents" ADD CONSTRAINT "toll_causes_accidents_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "toll_causes_accidents_categories" ADD CONSTRAINT "toll_causes_accidents_categories_nRNjzkmXcGo2_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "toll_causes_accidents_categories" ADD CONSTRAINT "toll_causes_accidents_categories_2rHiqbJ17l89_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
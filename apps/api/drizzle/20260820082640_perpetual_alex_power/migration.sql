CREATE TABLE "learning_material_attachments" (
	"id" text PRIMARY KEY,
	"learning_material_id" text NOT NULL,
	"name" text NOT NULL,
	"file_attachment" text,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_material_question_answers" (
	"id" text PRIMARY KEY,
	"learning_material_question_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_answer" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_material_questions" (
	"id" text PRIMARY KEY,
	"learning_material_id" text NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_materials" (
	"id" text PRIMARY KEY,
	"syllabus_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'content' NOT NULL,
	"img_thumbnail" text,
	"file" text,
	"display_order" integer DEFAULT 1 NOT NULL,
	"description" text,
	"content" text,
	"is_have_quiz" boolean DEFAULT false NOT NULL,
	"min_score" numeric(5,2),
	"time_limit" integer,
	"total_question" integer DEFAULT 0 NOT NULL,
	"is_shuffle_question" boolean DEFAULT false NOT NULL,
	"is_shuffle_option" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "learning_materials_display_order_check" CHECK ("display_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "syllabi" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"img_thumbnail" text,
	"is_have_quiz" boolean DEFAULT false NOT NULL,
	"question_type" text,
	"min_score" numeric(5,2),
	"time_limit" integer,
	"total_question" integer DEFAULT 0 NOT NULL,
	"is_shuffle_question" boolean DEFAULT false NOT NULL,
	"is_shuffle_option" boolean DEFAULT false NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "syllabus_categories" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"img_thumbnail" text,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "syllabus_category_mappings" (
	"id" text PRIMARY KEY,
	"syllabus_category_id" text NOT NULL,
	"syllabus_id" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "syllabus_category_roles" (
	"id" text PRIMARY KEY,
	"syllabus_category_id" text NOT NULL,
	"role_id" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "syllabus_learning_material_quiz" (
	"id" text PRIMARY KEY,
	"syllabus_id" text NOT NULL,
	"learning_material_id" text NOT NULL,
	"total_question" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "learning_material_attachments_material_idx" ON "learning_material_attachments" ("learning_material_id");--> statement-breakpoint
CREATE UNIQUE INDEX "learning_material_question_answers_pair_idx" ON "learning_material_question_answers" ("learning_material_question_id","code");--> statement-breakpoint
CREATE INDEX "learning_material_question_answers_question_idx" ON "learning_material_question_answers" ("learning_material_question_id");--> statement-breakpoint
CREATE INDEX "learning_material_questions_material_idx" ON "learning_material_questions" ("learning_material_id");--> statement-breakpoint
CREATE INDEX "learning_materials_syllabus_idx" ON "learning_materials" ("syllabus_id");--> statement-breakpoint
CREATE UNIQUE INDEX "learning_materials_syllabus_order_idx" ON "learning_materials" ("syllabus_id","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "syllabus_category_mappings_pair_idx" ON "syllabus_category_mappings" ("syllabus_category_id","syllabus_id");--> statement-breakpoint
CREATE INDEX "syllabus_category_mappings_syllabus_idx" ON "syllabus_category_mappings" ("syllabus_id");--> statement-breakpoint
CREATE UNIQUE INDEX "syllabus_category_roles_pair_idx" ON "syllabus_category_roles" ("syllabus_category_id","role_id");--> statement-breakpoint
CREATE INDEX "syllabus_category_roles_role_idx" ON "syllabus_category_roles" ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "syllabus_learning_material_quiz_pair_idx" ON "syllabus_learning_material_quiz" ("syllabus_id","learning_material_id");--> statement-breakpoint
CREATE INDEX "syllabus_learning_material_quiz_syllabus_idx" ON "syllabus_learning_material_quiz" ("syllabus_id");--> statement-breakpoint
ALTER TABLE "learning_material_attachments" ADD CONSTRAINT "learning_material_attachments_JiIdkjqW5b8E_fkey" FOREIGN KEY ("learning_material_id") REFERENCES "learning_materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "learning_material_attachments" ADD CONSTRAINT "learning_material_attachments_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "learning_material_attachments" ADD CONSTRAINT "learning_material_attachments_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "learning_material_question_answers" ADD CONSTRAINT "learning_material_question_answers_Oqn9iSjcG1nm_fkey" FOREIGN KEY ("learning_material_question_id") REFERENCES "learning_material_questions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "learning_material_question_answers" ADD CONSTRAINT "learning_material_question_answers_yfiKYlQICLkx_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "learning_material_question_answers" ADD CONSTRAINT "learning_material_question_answers_2SCLTIs2yIxG_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "learning_material_questions" ADD CONSTRAINT "learning_material_questions_I25Xjmc16nLV_fkey" FOREIGN KEY ("learning_material_id") REFERENCES "learning_materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "learning_material_questions" ADD CONSTRAINT "learning_material_questions_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "learning_material_questions" ADD CONSTRAINT "learning_material_questions_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "learning_materials" ADD CONSTRAINT "learning_materials_syllabus_id_syllabi_id_fkey" FOREIGN KEY ("syllabus_id") REFERENCES "syllabi"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "learning_materials" ADD CONSTRAINT "learning_materials_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "learning_materials" ADD CONSTRAINT "learning_materials_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "syllabi" ADD CONSTRAINT "syllabi_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "syllabi" ADD CONSTRAINT "syllabi_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "syllabus_categories" ADD CONSTRAINT "syllabus_categories_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "syllabus_categories" ADD CONSTRAINT "syllabus_categories_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "syllabus_category_mappings" ADD CONSTRAINT "syllabus_category_mappings_RnJLQ3PZrXMq_fkey" FOREIGN KEY ("syllabus_category_id") REFERENCES "syllabus_categories"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "syllabus_category_mappings" ADD CONSTRAINT "syllabus_category_mappings_syllabus_id_syllabi_id_fkey" FOREIGN KEY ("syllabus_id") REFERENCES "syllabi"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "syllabus_category_mappings" ADD CONSTRAINT "syllabus_category_mappings_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "syllabus_category_mappings" ADD CONSTRAINT "syllabus_category_mappings_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "syllabus_category_roles" ADD CONSTRAINT "syllabus_category_roles_OOgbxev4W3gE_fkey" FOREIGN KEY ("syllabus_category_id") REFERENCES "syllabus_categories"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "syllabus_category_roles" ADD CONSTRAINT "syllabus_category_roles_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "syllabus_category_roles" ADD CONSTRAINT "syllabus_category_roles_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "syllabus_category_roles" ADD CONSTRAINT "syllabus_category_roles_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "syllabus_learning_material_quiz" ADD CONSTRAINT "syllabus_learning_material_quiz_syllabus_id_syllabi_id_fkey" FOREIGN KEY ("syllabus_id") REFERENCES "syllabi"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "syllabus_learning_material_quiz" ADD CONSTRAINT "syllabus_learning_material_quiz_aQtLc1M4nNEn_fkey" FOREIGN KEY ("learning_material_id") REFERENCES "learning_materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "syllabus_learning_material_quiz" ADD CONSTRAINT "syllabus_learning_material_quiz_oqDfoJ5yaVnI_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "syllabus_learning_material_quiz" ADD CONSTRAINT "syllabus_learning_material_quiz_6tEiSY8j2DqV_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
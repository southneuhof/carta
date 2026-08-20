CREATE TABLE "incident_statement_document_configs" (
	"id" text PRIMARY KEY,
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
ALTER TABLE "incident_statement_document_configs" ADD CONSTRAINT "incident_statement_document_configs_nbJor0ikS4GW_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "incident_statement_document_configs" ADD CONSTRAINT "incident_statement_document_configs_yNQbtkcnpGVD_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
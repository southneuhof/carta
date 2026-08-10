ALTER TABLE "projects" ADD COLUMN "short_name" text;--> statement-breakpoint
ALTER TABLE "uoms" ADD COLUMN "uom_type" text DEFAULT 'work-items' NOT NULL;--> statement-breakpoint
ALTER TABLE "work_items" ADD COLUMN "category_id" text;--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS number_configs_display_order_seq;--> statement-breakpoint
SELECT setval(
  'number_configs_display_order_seq',
  GREATEST(COALESCE((SELECT MAX(display_order) FROM number_configs), 1), 1),
  (SELECT COUNT(*) > 0 FROM number_configs)
);--> statement-breakpoint
ALTER TABLE "number_configs" ALTER COLUMN "display_order" SET DEFAULT nextval('number_configs_display_order_seq');--> statement-breakpoint
ALTER SEQUENCE number_configs_display_order_seq OWNED BY number_configs.display_order;--> statement-breakpoint
-- Existing text locations are kept in address. Null coordinates require admin review before map use.
ALTER TABLE "projects" ALTER COLUMN "location" SET DATA TYPE jsonb USING CASE WHEN "location" IS NULL OR btrim("location") = '' THEN NULL ELSE jsonb_build_object('address', "location", 'lat', NULL, 'lng', NULL) END;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_category_id_pts_work_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "pts_work_categories"("id");

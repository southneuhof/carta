DROP INDEX "quality_inspection_number_counters_project_year_idx";--> statement-breakpoint
ALTER TABLE "quality_inspection_number_counters" ADD PRIMARY KEY ("project_id","year");
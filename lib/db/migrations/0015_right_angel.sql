ALTER TABLE "Agent" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Tool" ALTER COLUMN "parameters" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Agent" ADD COLUMN "visibility" varchar DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "Tool" ADD COLUMN "visibility" varchar DEFAULT 'public' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Agent_userId_name_index" ON "Agent" USING btree ("userId","name") WHERE "Agent"."visibility" = 'private';--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Agent_name_index" ON "Agent" USING btree ("name") WHERE "Agent"."visibility" = 'public';--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Tool_userId_name_index" ON "Tool" USING btree ("userId","name") WHERE "Tool"."visibility" = 'private';--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Tool_name_index" ON "Tool" USING btree ("name") WHERE "Tool"."visibility" = 'public';
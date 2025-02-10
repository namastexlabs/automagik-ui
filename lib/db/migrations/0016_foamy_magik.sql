DROP INDEX IF EXISTS "DynamicBlock_name_userId_index";--> statement-breakpoint
DROP INDEX IF EXISTS "DynamicBlock_name_index";--> statement-breakpoint
ALTER TABLE "DynamicBlock" ADD COLUMN "visibility" varchar DEFAULT 'private' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "DynamicBlock_userId_name_index" ON "DynamicBlock" USING btree ("userId","name") WHERE "DynamicBlock"."visibility" = 'private';--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "DynamicBlock_name_index" ON "DynamicBlock" USING btree ("name") WHERE "DynamicBlock"."visibility" = 'public';--> statement-breakpoint
ALTER TABLE "DynamicBlock" DROP COLUMN IF EXISTS "global";
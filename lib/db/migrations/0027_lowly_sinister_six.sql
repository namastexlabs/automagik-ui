ALTER TABLE "automagikui_chat" ADD COLUMN "completion_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "automagikui_chat" ADD COLUMN "prompt_tokens" integer DEFAULT 0 NOT NULL;
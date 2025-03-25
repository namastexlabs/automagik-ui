ALTER TABLE "automagikui_agent" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "automagikui_user" ADD CONSTRAINT "automagikui_user_email_unique" UNIQUE("email");
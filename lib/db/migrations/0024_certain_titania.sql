ALTER TABLE "automagikui_agent" DROP CONSTRAINT "agent_unique_user_name";--> statement-breakpoint
ALTER TABLE "automagikui_agent" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "automagikui_agent" ADD COLUMN "heartbeat" boolean DEFAULT false NOT NULL;
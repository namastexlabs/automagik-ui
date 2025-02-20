ALTER TABLE "automagikui_Message" RENAME TO "automagikui_message";--> statement-breakpoint
ALTER TABLE "automagikui_message" RENAME COLUMN "chatId" TO "chat_id";--> statement-breakpoint
ALTER TABLE "automagikui_message" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "automagikui_message" DROP CONSTRAINT "automagikui_Message_chatId_automagikui_chat_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_vote" DROP CONSTRAINT "automagikui_vote_message_id_automagikui_Message_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_message" ADD CONSTRAINT "automagikui_message_chat_id_automagikui_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."automagikui_chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_vote" ADD CONSTRAINT "automagikui_vote_message_id_automagikui_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."automagikui_message"("id") ON DELETE cascade ON UPDATE no action;
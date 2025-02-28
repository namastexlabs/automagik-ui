ALTER TABLE "automagikui_agent" DROP CONSTRAINT "automagikui_agent_name_user_id_unique";--> statement-breakpoint
ALTER TABLE "automagikui_tool" DROP CONSTRAINT "automagikui_tool_name_source_unique";--> statement-breakpoint
ALTER TABLE "automagikui_suggestion" DROP CONSTRAINT "automagikui_suggestion_document_id_document_created_at_automagikui_document_id_created_at_fk";
--> statement-breakpoint
DROP INDEX "automagikui_agent_user_id_name_index";--> statement-breakpoint
DROP INDEX "automagikui_agent_name_index";--> statement-breakpoint
DROP INDEX "automagikui_dynamic_block_user_id_name_index";--> statement-breakpoint
DROP INDEX "automagikui_dynamic_block_name_index";--> statement-breakpoint
DROP INDEX "automagikui_tool_user_id_name_index";--> statement-breakpoint
DROP INDEX "automagikui_tool_name_index";--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_dynamic_block" DROP CONSTRAINT "automagikui_agent_to_dynamic_block_agent_id_dynamic_block_id_pk";--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_tool" DROP CONSTRAINT "automagikui_agent_to_tool_agent_id_tool_id_pk";--> statement-breakpoint
ALTER TABLE "automagikui_document" DROP CONSTRAINT "automagikui_document_id_created_at_pk";--> statement-breakpoint
ALTER TABLE "automagikui_suggestion" DROP CONSTRAINT "automagikui_suggestion_id_pk";--> statement-breakpoint
ALTER TABLE "automagikui_vote" DROP CONSTRAINT "automagikui_vote_chat_id_message_id_pk";--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_dynamic_block" ADD CONSTRAINT "pk__agent_to_dynamic_block" PRIMARY KEY("agent_id","dynamic_block_id");--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_tool" ADD CONSTRAINT "pk__agent_to_tool" PRIMARY KEY("agent_id","tool_id");--> statement-breakpoint
ALTER TABLE "automagikui_document" ADD CONSTRAINT "pk__document" PRIMARY KEY("id","created_at");--> statement-breakpoint
ALTER TABLE "automagikui_suggestion" ADD CONSTRAINT "pk__suggestion" PRIMARY KEY("id");--> statement-breakpoint
ALTER TABLE "automagikui_vote" ADD CONSTRAINT "pk__vote" PRIMARY KEY("chat_id","message_id");--> statement-breakpoint
ALTER TABLE "automagikui_suggestion" ADD CONSTRAINT "fk__suggestion__document" FOREIGN KEY ("document_id","document_created_at") REFERENCES "public"."automagikui_document"("id","created_at") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_unique_private_user" ON "automagikui_agent" USING btree ("user_id","name") WHERE "automagikui_agent"."visibility" = 'private';--> statement-breakpoint
CREATE UNIQUE INDEX "agent_unique_public_user" ON "automagikui_agent" USING btree ("name") WHERE "automagikui_agent"."visibility" = 'public';--> statement-breakpoint
CREATE UNIQUE INDEX "dynamic_block_unique_private_user" ON "automagikui_dynamic_block" USING btree ("user_id","name") WHERE "automagikui_dynamic_block"."visibility" = 'private';--> statement-breakpoint
CREATE UNIQUE INDEX "dynamic_block_unique_public_user" ON "automagikui_dynamic_block" USING btree ("name") WHERE "automagikui_dynamic_block"."visibility" = 'public';--> statement-breakpoint
CREATE UNIQUE INDEX "tool_unique_private_user" ON "automagikui_tool" USING btree ("user_id","name") WHERE "automagikui_tool"."visibility" = 'private';--> statement-breakpoint
CREATE UNIQUE INDEX "tool_unique_public_user" ON "automagikui_tool" USING btree ("name") WHERE "automagikui_tool"."visibility" = 'public';--> statement-breakpoint
ALTER TABLE "automagikui_agent" ADD CONSTRAINT "agent_unique_user_name" UNIQUE("name","user_id");--> statement-breakpoint
ALTER TABLE "automagikui_tool" ADD CONSTRAINT "tool_unique_user_name" UNIQUE("name","source");
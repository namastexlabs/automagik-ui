ALTER TABLE "automagikui_Agent" RENAME TO "automagikui_agent";--> statement-breakpoint
ALTER TABLE "automagikui_AgentToDynamicBlock" RENAME TO "automagikui_agent_to_dynamic_block";--> statement-breakpoint
ALTER TABLE "automagikui_AgentToTool" RENAME TO "automagikui_agent_to_tool";--> statement-breakpoint
ALTER TABLE "automagikui_Chat" RENAME TO "automagikui_chat";--> statement-breakpoint
ALTER TABLE "automagikui_Document" RENAME TO "automagikui_document";--> statement-breakpoint
ALTER TABLE "automagikui_DynamicBlock" RENAME TO "automagikui_dynamic_block";--> statement-breakpoint
ALTER TABLE "automagikui_Suggestion" RENAME TO "automagikui_suggestion";--> statement-breakpoint
ALTER TABLE "automagikui_Tool" RENAME TO "automagikui_tool";--> statement-breakpoint
ALTER TABLE "automagikui_User" RENAME TO "automagikui_user";--> statement-breakpoint
ALTER TABLE "automagikui_Vote" RENAME TO "automagikui_vote";--> statement-breakpoint
ALTER TABLE "automagikui_agent" RENAME COLUMN "systemPrompt" TO "system_prompt";--> statement-breakpoint
ALTER TABLE "automagikui_agent" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "automagikui_agent" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_dynamic_block" RENAME COLUMN "agentId" TO "agent_id";--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_dynamic_block" RENAME COLUMN "dynamicBlockId" TO "dynamic_block_id";--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_tool" RENAME COLUMN "agentId" TO "agent_id";--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_tool" RENAME COLUMN "toolId" TO "tool_id";--> statement-breakpoint
ALTER TABLE "automagikui_chat" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "automagikui_chat" RENAME COLUMN "agentId" TO "agent_id";--> statement-breakpoint
ALTER TABLE "automagikui_chat" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "automagikui_document" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "automagikui_document" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "automagikui_dynamic_block" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "automagikui_suggestion" RENAME COLUMN "documentId" TO "document_id";--> statement-breakpoint
ALTER TABLE "automagikui_suggestion" RENAME COLUMN "documentCreatedAt" TO "document_created_at";--> statement-breakpoint
ALTER TABLE "automagikui_suggestion" RENAME COLUMN "originalText" TO "original_text";--> statement-breakpoint
ALTER TABLE "automagikui_suggestion" RENAME COLUMN "suggestedText" TO "suggested_text";--> statement-breakpoint
ALTER TABLE "automagikui_suggestion" RENAME COLUMN "isResolved" TO "is_resolved";--> statement-breakpoint
ALTER TABLE "automagikui_suggestion" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "automagikui_suggestion" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "automagikui_tool" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "automagikui_tool" RENAME COLUMN "verboseName" TO "verbose_name";--> statement-breakpoint
ALTER TABLE "automagikui_vote" RENAME COLUMN "chatId" TO "chat_id";--> statement-breakpoint
ALTER TABLE "automagikui_vote" RENAME COLUMN "messageId" TO "message_id";--> statement-breakpoint
ALTER TABLE "automagikui_vote" RENAME COLUMN "isUpvoted" TO "is_upvoted";--> statement-breakpoint
ALTER TABLE "automagikui_agent" DROP CONSTRAINT "automagikui_Agent_name_userId_unique";--> statement-breakpoint
ALTER TABLE "automagikui_tool" DROP CONSTRAINT "automagikui_Tool_name_source_unique";--> statement-breakpoint
ALTER TABLE "automagikui_agent" DROP CONSTRAINT "automagikui_Agent_userId_automagikui_User_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_dynamic_block" DROP CONSTRAINT "automagikui_AgentToDynamicBlock_agentId_automagikui_Agent_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_dynamic_block" DROP CONSTRAINT "automagikui_AgentToDynamicBlock_dynamicBlockId_automagikui_DynamicBlock_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_tool" DROP CONSTRAINT "automagikui_AgentToTool_agentId_automagikui_Agent_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_tool" DROP CONSTRAINT "automagikui_AgentToTool_toolId_automagikui_Tool_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_chat" DROP CONSTRAINT "automagikui_Chat_agentId_automagikui_Agent_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_chat" DROP CONSTRAINT "automagikui_Chat_userId_automagikui_User_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_document" DROP CONSTRAINT "automagikui_Document_userId_automagikui_User_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_dynamic_block" DROP CONSTRAINT "automagikui_DynamicBlock_userId_automagikui_User_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_Message" DROP CONSTRAINT "automagikui_Message_chatId_automagikui_Chat_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_suggestion" DROP CONSTRAINT "automagikui_Suggestion_userId_automagikui_User_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_suggestion" DROP CONSTRAINT "automagikui_Suggestion_documentId_documentCreatedAt_automagikui_Document_id_createdAt_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_tool" DROP CONSTRAINT "automagikui_Tool_userId_automagikui_User_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_vote" DROP CONSTRAINT "automagikui_Vote_chatId_automagikui_Chat_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_vote" DROP CONSTRAINT "automagikui_Vote_messageId_automagikui_Message_id_fk";
--> statement-breakpoint
DROP INDEX "automagikui_Agent_userId_name_index";--> statement-breakpoint
DROP INDEX "automagikui_Agent_name_index";--> statement-breakpoint
DROP INDEX "automagikui_DynamicBlock_userId_name_index";--> statement-breakpoint
DROP INDEX "automagikui_DynamicBlock_name_index";--> statement-breakpoint
DROP INDEX "automagikui_Tool_userId_name_index";--> statement-breakpoint
DROP INDEX "automagikui_Tool_name_index";--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_dynamic_block" DROP CONSTRAINT "automagikui_AgentToDynamicBlock_agentId_dynamicBlockId_pk";--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_tool" DROP CONSTRAINT "automagikui_AgentToTool_agentId_toolId_pk";--> statement-breakpoint
ALTER TABLE "automagikui_document" DROP CONSTRAINT "automagikui_Document_id_createdAt_pk";--> statement-breakpoint
ALTER TABLE "automagikui_suggestion" DROP CONSTRAINT "automagikui_Suggestion_id_pk";--> statement-breakpoint
ALTER TABLE "automagikui_vote" DROP CONSTRAINT "automagikui_Vote_chatId_messageId_pk";--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_dynamic_block" ADD CONSTRAINT "automagikui_agent_to_dynamic_block_agent_id_dynamic_block_id_pk" PRIMARY KEY("agent_id","dynamic_block_id");--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_tool" ADD CONSTRAINT "automagikui_agent_to_tool_agent_id_tool_id_pk" PRIMARY KEY("agent_id","tool_id");--> statement-breakpoint
ALTER TABLE "automagikui_document" ADD CONSTRAINT "automagikui_document_id_created_at_pk" PRIMARY KEY("id","created_at");--> statement-breakpoint
ALTER TABLE "automagikui_suggestion" ADD CONSTRAINT "automagikui_suggestion_id_pk" PRIMARY KEY("id");--> statement-breakpoint
ALTER TABLE "automagikui_vote" ADD CONSTRAINT "automagikui_vote_chat_id_message_id_pk" PRIMARY KEY("chat_id","message_id");--> statement-breakpoint
ALTER TABLE "automagikui_agent" ADD CONSTRAINT "automagikui_agent_user_id_automagikui_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."automagikui_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_dynamic_block" ADD CONSTRAINT "automagikui_agent_to_dynamic_block_agent_id_automagikui_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."automagikui_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_dynamic_block" ADD CONSTRAINT "automagikui_agent_to_dynamic_block_dynamic_block_id_automagikui_dynamic_block_id_fk" FOREIGN KEY ("dynamic_block_id") REFERENCES "public"."automagikui_dynamic_block"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_tool" ADD CONSTRAINT "automagikui_agent_to_tool_agent_id_automagikui_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."automagikui_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_agent_to_tool" ADD CONSTRAINT "automagikui_agent_to_tool_tool_id_automagikui_tool_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."automagikui_tool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_chat" ADD CONSTRAINT "automagikui_chat_agent_id_automagikui_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."automagikui_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_chat" ADD CONSTRAINT "automagikui_chat_user_id_automagikui_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."automagikui_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_document" ADD CONSTRAINT "automagikui_document_user_id_automagikui_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."automagikui_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_dynamic_block" ADD CONSTRAINT "automagikui_dynamic_block_user_id_automagikui_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."automagikui_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_Message" ADD CONSTRAINT "automagikui_Message_chatId_automagikui_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."automagikui_chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_suggestion" ADD CONSTRAINT "automagikui_suggestion_user_id_automagikui_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."automagikui_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_suggestion" ADD CONSTRAINT "automagikui_suggestion_document_id_document_created_at_automagikui_document_id_created_at_fk" FOREIGN KEY ("document_id","document_created_at") REFERENCES "public"."automagikui_document"("id","created_at") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_tool" ADD CONSTRAINT "automagikui_tool_user_id_automagikui_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."automagikui_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_vote" ADD CONSTRAINT "automagikui_vote_chat_id_automagikui_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."automagikui_chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_vote" ADD CONSTRAINT "automagikui_vote_message_id_automagikui_Message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."automagikui_Message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "automagikui_agent_user_id_name_index" ON "automagikui_agent" USING btree ("user_id","name") WHERE "automagikui_agent"."visibility" = 'private';--> statement-breakpoint
CREATE UNIQUE INDEX "automagikui_agent_name_index" ON "automagikui_agent" USING btree ("name") WHERE "automagikui_agent"."visibility" = 'public';--> statement-breakpoint
CREATE UNIQUE INDEX "automagikui_dynamic_block_user_id_name_index" ON "automagikui_dynamic_block" USING btree ("user_id","name") WHERE "automagikui_dynamic_block"."visibility" = 'private';--> statement-breakpoint
CREATE UNIQUE INDEX "automagikui_dynamic_block_name_index" ON "automagikui_dynamic_block" USING btree ("name") WHERE "automagikui_dynamic_block"."visibility" = 'public';--> statement-breakpoint
CREATE UNIQUE INDEX "automagikui_tool_user_id_name_index" ON "automagikui_tool" USING btree ("user_id","name") WHERE "automagikui_tool"."visibility" = 'private';--> statement-breakpoint
CREATE UNIQUE INDEX "automagikui_tool_name_index" ON "automagikui_tool" USING btree ("name") WHERE "automagikui_tool"."visibility" = 'public';--> statement-breakpoint
ALTER TABLE "automagikui_agent" ADD CONSTRAINT "automagikui_agent_name_user_id_unique" UNIQUE("name","user_id");--> statement-breakpoint
ALTER TABLE "automagikui_tool" ADD CONSTRAINT "automagikui_tool_name_source_unique" UNIQUE("name","source");
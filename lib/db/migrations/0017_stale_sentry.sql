ALTER TABLE "Agent" RENAME TO "automagikui_Agent";--> statement-breakpoint
ALTER TABLE "AgentToDynamicBlock" RENAME TO "automagikui_AgentToDynamicBlock";--> statement-breakpoint
ALTER TABLE "AgentToTool" RENAME TO "automagikui_AgentToTool";--> statement-breakpoint
ALTER TABLE "Chat" RENAME TO "automagikui_Chat";--> statement-breakpoint
ALTER TABLE "Document" RENAME TO "automagikui_Document";--> statement-breakpoint
ALTER TABLE "DynamicBlock" RENAME TO "automagikui_DynamicBlock";--> statement-breakpoint
ALTER TABLE "Message" RENAME TO "automagikui_Message";--> statement-breakpoint
ALTER TABLE "Suggestion" RENAME TO "automagikui_Suggestion";--> statement-breakpoint
ALTER TABLE "Tool" RENAME TO "automagikui_Tool";--> statement-breakpoint
ALTER TABLE "User" RENAME TO "automagikui_User";--> statement-breakpoint
ALTER TABLE "Vote" RENAME TO "automagikui_Vote";--> statement-breakpoint
ALTER TABLE "automagikui_Agent" DROP CONSTRAINT "Agent_name_userId_unique";--> statement-breakpoint
ALTER TABLE "automagikui_Tool" DROP CONSTRAINT "Tool_name_source_unique";--> statement-breakpoint
ALTER TABLE "automagikui_Agent" DROP CONSTRAINT "Agent_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_AgentToDynamicBlock" DROP CONSTRAINT "AgentToDynamicBlock_agentId_Agent_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_AgentToDynamicBlock" DROP CONSTRAINT "AgentToDynamicBlock_dynamicBlockId_DynamicBlock_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_AgentToTool" DROP CONSTRAINT "AgentToTool_agentId_Agent_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_AgentToTool" DROP CONSTRAINT "AgentToTool_toolId_Tool_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_Chat" DROP CONSTRAINT "Chat_agentId_Agent_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_Chat" DROP CONSTRAINT "Chat_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_Document" DROP CONSTRAINT "Document_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_DynamicBlock" DROP CONSTRAINT "DynamicBlock_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_Message" DROP CONSTRAINT "Message_chatId_Chat_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_Suggestion" DROP CONSTRAINT "Suggestion_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_Suggestion" DROP CONSTRAINT "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_Tool" DROP CONSTRAINT "Tool_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_Vote" DROP CONSTRAINT "Vote_chatId_Chat_id_fk";
--> statement-breakpoint
ALTER TABLE "automagikui_Vote" DROP CONSTRAINT "Vote_messageId_Message_id_fk";
--> statement-breakpoint
DROP INDEX "Agent_userId_name_index";--> statement-breakpoint
DROP INDEX "Agent_name_index";--> statement-breakpoint
DROP INDEX "DynamicBlock_userId_name_index";--> statement-breakpoint
DROP INDEX "DynamicBlock_name_index";--> statement-breakpoint
DROP INDEX "Tool_userId_name_index";--> statement-breakpoint
DROP INDEX "Tool_name_index";--> statement-breakpoint
ALTER TABLE "automagikui_AgentToDynamicBlock" DROP CONSTRAINT "AgentToDynamicBlock_agentId_dynamicBlockId_pk";--> statement-breakpoint
ALTER TABLE "automagikui_AgentToTool" DROP CONSTRAINT "AgentToTool_agentId_toolId_pk";--> statement-breakpoint
ALTER TABLE "automagikui_Document" DROP CONSTRAINT "Document_id_createdAt_pk";--> statement-breakpoint
ALTER TABLE "automagikui_Suggestion" DROP CONSTRAINT "Suggestion_id_pk";--> statement-breakpoint
ALTER TABLE "automagikui_Vote" DROP CONSTRAINT "Vote_chatId_messageId_pk";--> statement-breakpoint
ALTER TABLE "automagikui_AgentToDynamicBlock" ADD CONSTRAINT "automagikui_AgentToDynamicBlock_agentId_dynamicBlockId_pk" PRIMARY KEY("agentId","dynamicBlockId");--> statement-breakpoint
ALTER TABLE "automagikui_AgentToTool" ADD CONSTRAINT "automagikui_AgentToTool_agentId_toolId_pk" PRIMARY KEY("agentId","toolId");--> statement-breakpoint
ALTER TABLE "automagikui_Document" ADD CONSTRAINT "automagikui_Document_id_createdAt_pk" PRIMARY KEY("id","createdAt");--> statement-breakpoint
ALTER TABLE "automagikui_Suggestion" ADD CONSTRAINT "automagikui_Suggestion_id_pk" PRIMARY KEY("id");--> statement-breakpoint
ALTER TABLE "automagikui_Vote" ADD CONSTRAINT "automagikui_Vote_chatId_messageId_pk" PRIMARY KEY("chatId","messageId");--> statement-breakpoint
ALTER TABLE "automagikui_Agent" ADD CONSTRAINT "automagikui_Agent_userId_automagikui_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."automagikui_User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_AgentToDynamicBlock" ADD CONSTRAINT "automagikui_AgentToDynamicBlock_agentId_automagikui_Agent_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."automagikui_Agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_AgentToDynamicBlock" ADD CONSTRAINT "automagikui_AgentToDynamicBlock_dynamicBlockId_automagikui_DynamicBlock_id_fk" FOREIGN KEY ("dynamicBlockId") REFERENCES "public"."automagikui_DynamicBlock"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_AgentToTool" ADD CONSTRAINT "automagikui_AgentToTool_agentId_automagikui_Agent_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."automagikui_Agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_AgentToTool" ADD CONSTRAINT "automagikui_AgentToTool_toolId_automagikui_Tool_id_fk" FOREIGN KEY ("toolId") REFERENCES "public"."automagikui_Tool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_Chat" ADD CONSTRAINT "automagikui_Chat_agentId_automagikui_Agent_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."automagikui_Agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_Chat" ADD CONSTRAINT "automagikui_Chat_userId_automagikui_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."automagikui_User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_Document" ADD CONSTRAINT "automagikui_Document_userId_automagikui_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."automagikui_User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_DynamicBlock" ADD CONSTRAINT "automagikui_DynamicBlock_userId_automagikui_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."automagikui_User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_Message" ADD CONSTRAINT "automagikui_Message_chatId_automagikui_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."automagikui_Chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_Suggestion" ADD CONSTRAINT "automagikui_Suggestion_userId_automagikui_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."automagikui_User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_Suggestion" ADD CONSTRAINT "automagikui_Suggestion_documentId_documentCreatedAt_automagikui_Document_id_createdAt_fk" FOREIGN KEY ("documentId","documentCreatedAt") REFERENCES "public"."automagikui_Document"("id","createdAt") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_Tool" ADD CONSTRAINT "automagikui_Tool_userId_automagikui_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."automagikui_User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_Vote" ADD CONSTRAINT "automagikui_Vote_chatId_automagikui_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."automagikui_Chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automagikui_Vote" ADD CONSTRAINT "automagikui_Vote_messageId_automagikui_Message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."automagikui_Message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "automagikui_Agent_userId_name_index" ON "automagikui_Agent" USING btree ("userId","name") WHERE "automagikui_Agent"."visibility" = 'private';--> statement-breakpoint
CREATE UNIQUE INDEX "automagikui_Agent_name_index" ON "automagikui_Agent" USING btree ("name") WHERE "automagikui_Agent"."visibility" = 'public';--> statement-breakpoint
CREATE UNIQUE INDEX "automagikui_DynamicBlock_userId_name_index" ON "automagikui_DynamicBlock" USING btree ("userId","name") WHERE "automagikui_DynamicBlock"."visibility" = 'private';--> statement-breakpoint
CREATE UNIQUE INDEX "automagikui_DynamicBlock_name_index" ON "automagikui_DynamicBlock" USING btree ("name") WHERE "automagikui_DynamicBlock"."visibility" = 'public';--> statement-breakpoint
CREATE UNIQUE INDEX "automagikui_Tool_userId_name_index" ON "automagikui_Tool" USING btree ("userId","name") WHERE "automagikui_Tool"."visibility" = 'private';--> statement-breakpoint
CREATE UNIQUE INDEX "automagikui_Tool_name_index" ON "automagikui_Tool" USING btree ("name") WHERE "automagikui_Tool"."visibility" = 'public';--> statement-breakpoint
ALTER TABLE "automagikui_Agent" ADD CONSTRAINT "automagikui_Agent_name_userId_unique" UNIQUE("name","userId");--> statement-breakpoint
ALTER TABLE "automagikui_Tool" ADD CONSTRAINT "automagikui_Tool_name_source_unique" UNIQUE("name","source");
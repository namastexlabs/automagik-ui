CREATE TABLE IF NOT EXISTS "AgentToTool" (
	"agentId" uuid NOT NULL,
	"toolId" uuid NOT NULL,
	CONSTRAINT "AgentToTool_agentId_toolId_pk" PRIMARY KEY("agentId","toolId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Tool" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"verboseName" text NOT NULL,
	"description" text NOT NULL,
	"parameters" json NOT NULL,
	"source" text NOT NULL,
	CONSTRAINT "Tool_name_source_unique" UNIQUE("name","source")
);
--> statement-breakpoint
ALTER TABLE "Agent" RENAME COLUMN "agentName" TO "name";--> statement-breakpoint
ALTER TABLE "Agent" DROP CONSTRAINT "Agent_agentName_userId_unique";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AgentToTool" ADD CONSTRAINT "AgentToTool_agentId_Agent_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AgentToTool" ADD CONSTRAINT "AgentToTool_toolId_Tool_id_fk" FOREIGN KEY ("toolId") REFERENCES "public"."Tool"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_name_userId_unique" UNIQUE("name","userId");
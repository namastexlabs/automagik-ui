CREATE TABLE IF NOT EXISTS "DynamicBlock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"agentId" uuid NOT NULL,
	CONSTRAINT "DynamicBlock_name_agentId_unique" UNIQUE("name","agentId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "DynamicBlock" ADD CONSTRAINT "DynamicBlock_agentId_Agent_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

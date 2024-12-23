ALTER TABLE "Message" DROP CONSTRAINT "Message_agentId_Agent_id_fk";
--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "agentId" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_agentId_Agent_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "Message" DROP COLUMN IF EXISTS "agentId";
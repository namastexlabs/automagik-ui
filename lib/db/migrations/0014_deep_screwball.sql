CREATE TABLE IF NOT EXISTS "AgentToDynamicBlock" (
	"agentId" uuid NOT NULL,
	"dynamicBlockId" uuid NOT NULL,
	CONSTRAINT "AgentToDynamicBlock_agentId_dynamicBlockId_pk" PRIMARY KEY("agentId","dynamicBlockId")
);
--> statement-breakpoint
ALTER TABLE "DynamicBlock" DROP CONSTRAINT "DynamicBlock_name_agentId_unique";--> statement-breakpoint
ALTER TABLE "DynamicBlock" DROP CONSTRAINT "DynamicBlock_agentId_Agent_id_fk";
--> statement-breakpoint
ALTER TABLE "DynamicBlock" ALTER COLUMN "content" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "DynamicBlock" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "DynamicBlock" ADD COLUMN "global" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "DynamicBlock" ADD COLUMN "userId" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AgentToDynamicBlock" ADD CONSTRAINT "AgentToDynamicBlock_agentId_Agent_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AgentToDynamicBlock" ADD CONSTRAINT "AgentToDynamicBlock_dynamicBlockId_DynamicBlock_id_fk" FOREIGN KEY ("dynamicBlockId") REFERENCES "public"."DynamicBlock"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "DynamicBlock" ADD CONSTRAINT "DynamicBlock_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "DynamicBlock_name_userId_index" ON "DynamicBlock" USING btree ("name","userId") WHERE "DynamicBlock"."global" = FALSE;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "DynamicBlock_name_index" ON "DynamicBlock" USING btree ("name") WHERE "DynamicBlock"."global" = TRUE;--> statement-breakpoint
ALTER TABLE "DynamicBlock" DROP COLUMN IF EXISTS "agentId";
CREATE TYPE "public"."geopolitical_zone" AS ENUM('NW', 'NE', 'NC', 'SW', 'SE', 'SS');--> statement-breakpoint
CREATE TABLE "lgas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"alias" varchar(80) NOT NULL,
	"zone" "geopolitical_zone" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "states_name_unique" UNIQUE("name"),
	CONSTRAINT "states_alias_unique" UNIQUE("alias")
);
--> statement-breakpoint
ALTER TABLE "lgas" ADD CONSTRAINT "lgas_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lgas_state_name_idx" ON "lgas" USING btree ("state_id","name");--> statement-breakpoint
CREATE INDEX "lgas_state_idx" ON "lgas" USING btree ("state_id");
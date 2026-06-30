CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"election_id" uuid NOT NULL,
	"lga_id" uuid NOT NULL,
	"no_intimidation" boolean NOT NULL,
	"accreditation_proper" boolean NOT NULL,
	"voting_orderly" boolean NOT NULL,
	"security_present" boolean NOT NULL,
	"witnessed_malpractice" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_lga_id_lgas_id_fk" FOREIGN KEY ("lga_id") REFERENCES "public"."lgas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ratings_user_election_idx" ON "ratings" USING btree ("user_id","election_id");--> statement-breakpoint
CREATE INDEX "ratings_election_lga_idx" ON "ratings" USING btree ("election_id","lga_id");
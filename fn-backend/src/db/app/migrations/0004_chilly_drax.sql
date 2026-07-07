CREATE TYPE "public"."sheet_status" AS ENUM('pending', 'verified', 'disputed');--> statement-breakpoint
CREATE TABLE "election_parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"election_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"abbreviation" varchar(20) NOT NULL,
	"candidate_name" varchar(160),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "election_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet_id" uuid NOT NULL,
	"election_id" uuid NOT NULL,
	"state_id" uuid NOT NULL,
	"lga_id" uuid NOT NULL,
	"pu_code" varchar(120) NOT NULL,
	"accredited_voters" integer NOT NULL,
	"total_valid_votes" integer NOT NULL,
	"rejected_ballots" integer NOT NULL,
	"total_votes_cast" integer NOT NULL,
	"party_votes" jsonb NOT NULL,
	"agreed_entry_ids" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sheet_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet_id" uuid NOT NULL,
	"flagged_by" uuid,
	"ip_address" varchar(45) NOT NULL,
	"reason" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"election_id" uuid NOT NULL,
	"state_id" uuid NOT NULL,
	"lga_id" uuid NOT NULL,
	"pu_code" varchar(120) NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"r2_key" varchar(300) NOT NULL,
	"file_hash" varchar(64) NOT NULL,
	"mime_type" varchar(80) NOT NULL,
	"file_size" integer NOT NULL,
	"status" "sheet_status" DEFAULT 'pending' NOT NULL,
	"flag_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcription_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet_id" uuid NOT NULL,
	"transcriber_id" uuid NOT NULL,
	"accredited_voters" integer NOT NULL,
	"total_valid_votes" integer NOT NULL,
	"rejected_ballots" integer NOT NULL,
	"total_votes_cast" integer NOT NULL,
	"party_votes" jsonb NOT NULL,
	"figure_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "election_parties" ADD CONSTRAINT "election_parties_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_results" ADD CONSTRAINT "election_results_sheet_id_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."sheets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_results" ADD CONSTRAINT "election_results_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_results" ADD CONSTRAINT "election_results_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_results" ADD CONSTRAINT "election_results_lga_id_lgas_id_fk" FOREIGN KEY ("lga_id") REFERENCES "public"."lgas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_flags" ADD CONSTRAINT "sheet_flags_sheet_id_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."sheets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheets" ADD CONSTRAINT "sheets_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheets" ADD CONSTRAINT "sheets_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheets" ADD CONSTRAINT "sheets_lga_id_lgas_id_fk" FOREIGN KEY ("lga_id") REFERENCES "public"."lgas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcription_entries" ADD CONSTRAINT "transcription_entries_sheet_id_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."sheets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "election_parties_election_abbr_idx" ON "election_parties" USING btree ("election_id","abbreviation");--> statement-breakpoint
CREATE INDEX "election_parties_election_idx" ON "election_parties" USING btree ("election_id");--> statement-breakpoint
CREATE UNIQUE INDEX "election_results_sheet_idx" ON "election_results" USING btree ("sheet_id");--> statement-breakpoint
CREATE INDEX "election_results_election_lga_idx" ON "election_results" USING btree ("election_id","lga_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sheet_flags_sheet_ip_idx" ON "sheet_flags" USING btree ("sheet_id","ip_address");--> statement-breakpoint
CREATE INDEX "sheet_flags_sheet_idx" ON "sheet_flags" USING btree ("sheet_id");--> statement-breakpoint
CREATE INDEX "sheets_election_lga_idx" ON "sheets" USING btree ("election_id","lga_id");--> statement-breakpoint
CREATE INDEX "sheets_status_idx" ON "sheets" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "transcription_entries_sheet_transcriber_idx" ON "transcription_entries" USING btree ("sheet_id","transcriber_id");--> statement-breakpoint
CREATE INDEX "transcription_entries_sheet_idx" ON "transcription_entries" USING btree ("sheet_id");
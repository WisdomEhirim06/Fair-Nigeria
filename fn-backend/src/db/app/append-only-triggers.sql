-- Append-only + integrity triggers for the result-collation tables.
-- Drizzle's schema DSL can't express triggers, so this is applied as part of a
-- migration. After `npm run db:generate:app` creates the table migration, append
-- the contents of this file to that generated migration (separated by a
-- `--> statement-breakpoint` line) and then run `npm run db:migrate:app`.

-- Block any UPDATE or DELETE on append-only tables at the database level, so the
-- guarantee does not depend on application code never issuing a mutation.
CREATE OR REPLACE FUNCTION forbid_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Table % is append-only; % is not permitted', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER transcription_entries_append_only
  BEFORE UPDATE OR DELETE ON transcription_entries
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
--> statement-breakpoint

CREATE TRIGGER election_results_append_only
  BEFORE UPDATE OR DELETE ON election_results
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
--> statement-breakpoint

-- A sheet's uploader may never transcribe their own sheet. Enforced in SQL, not
-- only in app logic. uploaded_by and transcriber_id both live in fn_app, so the
-- check is a same-database lookup.
CREATE OR REPLACE FUNCTION reject_self_transcription() RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM sheets s
    WHERE s.id = NEW.sheet_id AND s.uploaded_by = NEW.transcriber_id
  ) THEN
    RAISE EXCEPTION 'A sheet uploader may not transcribe their own sheet';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER transcription_entries_no_self_transcription
  BEFORE INSERT ON transcription_entries
  FOR EACH ROW EXECUTE FUNCTION reject_self_transcription();

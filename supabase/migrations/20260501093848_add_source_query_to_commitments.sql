/*
  # Add source_query to commitments

  Adds a nullable `source_query` text column to the `commitments` table.
  This stores the original question the user asked the AI that generated
  the insight, enabling "Review in Ask AI" navigation from the journal.

  1. Modified Tables
    - `commitments`
      - `source_query` (text, nullable) — the original user query that produced the insight
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commitments' AND column_name = 'source_query'
  ) THEN
    ALTER TABLE commitments ADD COLUMN source_query text;
  END IF;
END $$;

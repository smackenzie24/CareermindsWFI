/*
  # Create commitments table

  1. New Tables
    - `commitments`
      - `id` (uuid, primary key)
      - `text` (text) — what the user committed to
      - `context` (text) — the AI insight that prompted it
      - `insight_kind` (text) — type of insight (skill-gap, churn-risk, promotion, etc.)
      - `department` (text, nullable) — relevant department if applicable
      - `status` (text) — 'open' | 'done' | 'dismissed'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `commitments` table
    - Add policy for anonymous insert (no auth required — single-tenant demo tool)
    - Add policy for anonymous select
    - Add policy for anonymous update (for marking done/dismissed)

  Notes:
    - This is a single-tenant workforce intelligence tool with no user auth
    - We use a permissive anon policy scoped to the tool's use case
    - The `insight_kind` column drives the icon/colour in the journal view
*/

CREATE TABLE IF NOT EXISTS commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL DEFAULT '',
  context text NOT NULL DEFAULT '',
  insight_kind text NOT NULL DEFAULT 'general',
  department text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon users can insert commitments"
  ON commitments FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can select commitments"
  ON commitments FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon users can update commitments"
  ON commitments FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

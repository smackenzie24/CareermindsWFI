/*
  # Create feedback table

  Stores product feedback submitted through the FeedbackFlow modal.

  1. New Table: `feedback`
     - `id` (uuid, primary key)
     - `context` (text) — which page/view triggered the feedback (e.g. 'Executive Summary')
     - `rating` (int2) — 1–5 usefulness rating, nullable (in case user skips)
     - `feedback_text` (text) — free-text response, nullable
     - `wants_research_call` (boolean) — whether user opted in for a product call
     - `researcher_name` (text) — name provided if opted in, nullable
     - `researcher_email` (text) — email provided if opted in, nullable
     - `created_at` (timestamptz)

  2. Security
     - Enable RLS
     - Anonymous INSERT allowed — feedback is submitted without auth
     - No SELECT policy — feedback is not read back by the client, only by admins via Supabase dashboard
*/

CREATE TABLE IF NOT EXISTS feedback (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context              text NOT NULL DEFAULT '',
  rating               smallint CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  feedback_text        text,
  wants_research_call  boolean NOT NULL DEFAULT false,
  researcher_name      text,
  researcher_email     text,
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
);

export interface Commitment {
  id: string;
  text: string;
  context: string;
  insight_kind: string;
  department: string | null;
  source_query: string | null;
  status: 'open' | 'done' | 'dismissed';
  created_at: string;
  updated_at: string;
}

import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client — safe to use in 'use client' components
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Admin client using service role key — bypasses RLS
// ONLY use in API routes (server-side), never in client components
export function createAdminClient() {
  return createSupabaseClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

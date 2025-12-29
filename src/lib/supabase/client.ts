'use client';

import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// ===========================================
// Browser Client (Client Components)
// ===========================================

let client: SupabaseClient<Database> | null = null;

export function createClient(): SupabaseClient<Database> | null {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  // Check if env vars are available
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('Supabase env vars not configured');
    return null;
  }

  // Singleton pattern
  if (!client) {
    client = createBrowserClient<Database>(url, key);
  }

  return client;
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validation for environment variables
if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
  console.error(
    'CRITICAL: VITE_SUPABASE_URL is missing or invalid. Please check your .env file.'
  );
}

if (!supabaseAnonKey) {
  console.error(
    'CRITICAL: VITE_SUPABASE_ANON_KEY is missing. Please check your .env file.'
  );
}

// Create and export the singleton client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

/**
 * Helper to handle Supabase errors consistently
 */
export const handleSupabaseError = (error: any, context: string) => {
  console.error(`[Supabase Error] in ${context}:`, error.message || error);
  // You could integrate toast notifications here if desired
  return error;
};

import { createClient } from '@supabase/supabase-js';

// Expo automatically injects EXPO_PUBLIC_ variables into process.env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are missing. Ensure they start with EXPO_PUBLIC_ in your .env file.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
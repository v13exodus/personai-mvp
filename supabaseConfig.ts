    // supabaseConfig.ts
    import { createClient } from '@supabase/supabase-js';

    // Ensure these environment variables are set in your .env file
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    // Check if the environment variables are available
    if (!supabaseUrl) {
      throw new Error('EXPO_PUBLIC_SUPABASE_URL is not defined in .env');
    }
    if (!supabaseAnonKey) {
      throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is not defined in .env');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    export default supabase;
    
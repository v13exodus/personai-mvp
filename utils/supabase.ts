import { createClient } from '@supabase/supabase-js';
    import 'react-native-url-polyfill/auto'; // Required for Supabase in React Native env

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://loutxrvzuaoruebhnsaj.supabase.co'; // Replace with your URL
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvdXR4cnZ6dWFvcnVlYmhuc2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzkwNTAsImV4cCI6MjA4MDc1NTA1MH0.ZvePDMuH6jQBbz5lROweidsSNdAPUEOFV_dUN1h6Kog'; // Replace with your Anon Key

    export const supabase = createClient(supabaseUrl, supabaseAnonKey);
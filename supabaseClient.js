// Supabase Configuration
const SUPABASE_URL = 'https://omlvxixzcobzjrzcdwdh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ieVEQX_r0vzlIbi1X4q0vw_I-2A-ABT'; // Note: This key is public and designed to be exposed in the frontend.

// Initialize client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('Supabase client initialized');

// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase Client configuration
const SUPABASE_URL = 'https://oghwtfuquhqwtqekpsyn.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHd0ZnVxdWhxd3RxZWtwc3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0ODY0OTAsImV4cCI6MjA1ODA2MjQ5MH0.63Tgd5pmFHdFaO9tTonOFTMMB853BR0-ghUzQchLCbM';

// Create and export the Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
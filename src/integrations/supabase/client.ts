import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pwsukgqmjuppwjesrowm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3c3VrZ3FtanVwcHdqZXNyb3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjM3MzcsImV4cCI6MjA3NDczOTczN30.A5ONXW6I6cfWBqHS4dtXcCIi4yNV2j25FGZ7jZxotI8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
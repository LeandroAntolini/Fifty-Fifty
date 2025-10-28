import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sfurxnwnmiiimadghohq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmdXJ4bndubWlpaW1hZGdob2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NDQ0NjQsImV4cCI6MjA3NDMyMDQ2NH0.QNYBLfItv3Hla709XpPBm4rnfJ-WK_dTZu4YxojvnRY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
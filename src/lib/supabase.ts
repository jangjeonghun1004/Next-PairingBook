import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqidvnukkfvqyvjyyccb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxaWR2bnVra2Z2cXl2anl5Y2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTEwNDQ0MzIsImV4cCI6MjAyNjYyMDQzMn0.GUz0Wc9dlIAJnuXEaVkuTuUuFZ-qRFg_4_5tHfuFbzk';

// Supabase 클라이언트 생성 (타입 안전성 추가)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey); 
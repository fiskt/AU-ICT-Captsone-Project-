import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

console.log('URL:', supabaseUrl);
console.log('KEY exists:', !!supabasePublishableKey);

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
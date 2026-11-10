import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, opts);
export const supabaseAnon = () => createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, opts);
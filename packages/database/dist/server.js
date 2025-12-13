// Server-side Supabase client with service role key for admin operations
// Extracted from monolith to @repo/database package
import { createClient } from '@supabase/supabase-js';
// Environment configuration for server-side
const getServerConfig = () => {
    // Support multiple environment variable patterns
    const supabaseUrl = process.env.SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.VITE_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Missing Supabase environment variables for server operations');
    }
    return { supabaseUrl, supabaseServiceRoleKey };
};
// Create Supabase client with service role key for server-side operations
let supabaseAdminInstance = null;
export const getSupabaseAdmin = () => {
    if (!supabaseAdminInstance) {
        const { supabaseUrl, supabaseServiceRoleKey } = getServerConfig();
        supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    return supabaseAdminInstance;
};
// Export instance for backward compatibility
export const supabaseAdmin = getSupabaseAdmin();
export default supabaseAdmin;

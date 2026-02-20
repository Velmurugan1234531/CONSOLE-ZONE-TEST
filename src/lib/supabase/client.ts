
import { createBrowserClient } from '@supabase/ssr'

let supabase: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
    if (supabase) return supabase;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl?.trim() || !supabaseKey?.trim()) {
        console.warn('⚠️  Supabase Credentials not found. Using offline/placeholder mode.');
        return createBrowserClient(
            'https://placeholder.supabase.co',
            'placeholder-key'
        );
    }

    supabase = createBrowserClient(supabaseUrl, supabaseKey);

    return supabase;
}

export const isOffline = () => {
    return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};

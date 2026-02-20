
import { createClient } from "@/lib/supabase/client";
import { Content, ContentSchema } from "@/lib/schemas";

export const getContent = async (type?: 'page' | 'post') => {
    const supabase = createClient();

    try {
        let query = supabase
            .from('content')
            .select('*')
            .order('updated_at', { ascending: false });

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;

        if (error) {
            console.warn("Supabase getContent failed:", error);
            return [];
        }

        return data as Content[];
    } catch (error) {
        console.warn("Supabase getContent failed:", error);
        return [];
    }
};

export const getContentBySlug = async (slug: string) => {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('content')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            // console.warn("Supabase getContentBySlug failed:", error); 
            // If not found, returning null is expected
            return null;
        }

        return data as Content;
    } catch (error) {
        console.warn("Supabase getContentBySlug failed:", error);
        return null;
    }
};

export const saveContent = async (content: Partial<Content>) => {
    const supabase = createClient();

    const validated = ContentSchema.parse(content);
    const now = new Date().toISOString();

    if (validated.id) {
        // Update
        const { data, error } = await supabase
            .from('content')
            .update({ ...validated, updated_at: now })
            .eq('id', validated.id)
            .select()
            .single();

        if (error) throw error;
        return data as Content;
    } else {
        // Insert
        const { data, error } = await supabase
            .from('content')
            .insert({
                ...validated,
                created_at: now,
                updated_at: now
            })
            .select()
            .single();

        if (error) throw error;
        return data as Content;
    }
};

export const deleteContent = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

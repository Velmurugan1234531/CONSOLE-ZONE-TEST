import { createClient } from "@/lib/supabase/client";

export interface NoteDocument {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    user_id?: string;
}

const supabase = createClient();

/**
 * Create a new note
 */
export async function createNote(userId: string, title: string, content: string): Promise<NoteDocument> {
    const { data, error } = await supabase
        .from('notes')
        .insert({
            user_id: userId,
            title,
            content
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to create note: ${error.message}`);

    return {
        id: data.id,
        title: data.title,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        user_id: data.user_id
    };
}

/**
 * Update an existing note
 */
export async function updateNote(
    userId: string,
    noteId: string,
    title: string,
    content: string
): Promise<void> {
    const { error } = await supabase
        .from('notes')
        .update({
            title,
            content,
            updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .eq('user_id', userId);

    if (error) throw new Error(`Failed to update note: ${error.message}`);
}

/**
 * Delete a note
 */
export async function deleteNote(userId: string, noteId: string): Promise<void> {
    const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', userId);

    if (error) throw new Error(`Failed to delete note: ${error.message}`);
}

/**
 * Get all notes for a user
 */
export async function getUserNotes(userId: string): Promise<NoteDocument[]> {
    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch notes: ${error.message}`);

    return data.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        user_id: note.user_id
    }));
}

/**
 * Listen to real-time note updates
 */
export function subscribeToNotes(userId: string, callback: (notes: NoteDocument[]) => void): () => void {
    const channel = supabase
        .channel('notes-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'notes',
                filter: `user_id=eq.${userId}`
            },
            async (payload) => {
                // Fetch fresh data on any change
                const notes = await getUserNotes(userId);
                callback(notes);
            }
        )
        .subscribe();

    // Initial fetch
    getUserNotes(userId).then(callback).catch(console.error);

    return () => {
        supabase.removeChannel(channel);
    };
}


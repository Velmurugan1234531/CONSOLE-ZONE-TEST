import { createClient } from "@/lib/supabase/client";

export interface FileDocument {
    id: string;
    userId: string;
    name: string;
    url: string;
    size: number;
    type: string;
    storagePath: string;
    createdAt: string;
}

const supabase = createClient();

export const uploadFile = async (userId: string, file: File, bucket: string = 'media') => {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase
        .storage
        .from(bucket)
        .upload(filePath, file);

    if (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(filePath);

    // Save metadata to file_metrics or similar table if you want database records
    // For now, we'll just return the URL. If you need a database record:
    await supabase.from('file_records').insert({
        user_id: userId,
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
        storage_path: filePath,
        bucket
    });

    return publicUrl;
};

export const listUserFiles = async (userId: string, bucket: string = 'media'): Promise<FileDocument[]> => {
    const { data, error } = await supabase
        .from('file_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching files:", error);
        return [];
    }

    return data.map(doc => ({
        id: doc.id,
        userId: doc.user_id,
        name: doc.name,
        url: doc.url,
        size: doc.size,
        type: doc.type,
        storagePath: doc.storage_path,
        createdAt: doc.created_at
    }));
};

export const listFiles = async (bucket: string = 'media'): Promise<FileDocument[]> => {
    const { data, error } = await supabase
        .from('file_records')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching all files:", error);
        return [];
    }

    return data.map(doc => ({
        id: doc.id,
        userId: doc.user_id,
        name: doc.name,
        url: doc.url,
        size: doc.size,
        type: doc.type,
        storagePath: doc.storage_path,
        createdAt: doc.created_at
    }));
};

export const subscribeToFiles = (userId: string, callback: (files: FileDocument[]) => void) => {
    // 1. Initial Load
    listUserFiles(userId).then(callback);

    // 2. Realtime Subscription
    const channel = supabase
        .channel(`files_${userId}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'file_records',
            filter: `user_id=eq.${userId}`
        }, () => {
            listUserFiles(userId).then(callback);
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

export const deleteFile = async (userId: string, fileId: string, storagePath: string, bucket: string = 'media') => {
    // 1. Remove from Storage
    const { error: storageError } = await supabase
        .storage
        .from(bucket)
        .remove([storagePath]);

    if (storageError) {
        console.error("Storage delete failed:", storageError);
    }

    // 2. Remove from Database
    const { error: dbError } = await supabase
        .from('file_records')
        .delete()
        .eq('id', fileId)
        .eq('user_id', userId);

    if (dbError) {
        throw new Error(`Delete failed: ${dbError.message}`);
    }
};

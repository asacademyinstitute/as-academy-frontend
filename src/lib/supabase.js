import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing in environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

/**
 * Uploads a file to Supabase Storage and returns its public URL.
 * @param {File} file The file to upload
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export async function uploadThumbnail(file) {
    if (!file) throw new Error('No file provided');
    const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'course-thumbnails';
    
    // Clean filename to prevent character issues
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `thumbnail_${Date.now()}_${cleanName}`;
    
    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filename, file, {
            cacheControl: '3600',
            upsert: false
        });
        
    if (error) {
        throw error;
    }
    
    const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filename);
        
    return publicUrlData.publicUrl;
}

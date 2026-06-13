import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Supabase Admin client — used for Storage operations (image uploads).
 * Uses the SERVICE_KEY so it has full access to buckets.
 * Only used server-side, never exposed to the client.
 */
export const supabaseAdmin = env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
  : null;

/**
 * Upload an image to Supabase Storage and return its public URL.
 */
export async function uploadImage(
  bucket: string,
  filename: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<string | null> {
  if (!supabaseAdmin) {
    console.warn('⚠️ Supabase not configured — image upload skipped');
    return null;
  }

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filename, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error('❌ Supabase Storage upload error:', error.message);
    return null;
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

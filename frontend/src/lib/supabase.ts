import { createClient } from '@supabase/supabase-js';
import { compressImage } from './image';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Supabase client for the frontend.
 * Used primarily for image uploads to Supabase Storage.
 */
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Upload a dish image to Supabase Storage.
 * Returns the public URL of the uploaded image.
 */
export async function uploadDishImage(file: File): Promise<string | null> {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured — upload skipped');
    return null;
  }

  // Optimiza (redimensiona + WebP) antes de subir: archivos ligeros sin que el
  // dueño tenga que preparar la foto. Si falla, compressImage devuelve el original.
  const optimized = await compressImage(file);

  const ext = optimized.name.split('.').pop() || 'webp';
  const filename = `dish_${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('dish-images')
    .upload(filename, optimized, {
      contentType: optimized.type,
      upsert: true,
    });

  if (error) {
    console.error('Upload error:', error.message);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('dish-images')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

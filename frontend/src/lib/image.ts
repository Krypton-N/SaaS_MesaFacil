// Compresión de imágenes en el navegador (sin dependencias).
//
// Acepta cualquier imagen que el navegador pueda decodificar, la redimensiona
// manteniendo la proporción y la reexporta como WebP. El objetivo es subir
// archivos ligeros a Supabase Storage sin que el usuario tenga que preparar
// nada: él sube su foto tal cual y aquí la optimizamos.

export interface CompressOptions {
  /** Lado más largo máximo en px. Por defecto 1280 (buena calidad para platillos). */
  maxDimension?: number;
  /** Calidad WebP 0..1. Por defecto 0.82. */
  quality?: number;
  /** MIME de salida. Por defecto 'image/webp'. */
  mimeType?: string;
}

/**
 * Devuelve una nueva imagen optimizada (WebP redimensionado). Si algo falla
 * (formato no decodificable, navegador sin soporte, etc.) devuelve el archivo
 * original para no bloquear la subida.
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const { maxDimension = 1280, quality = 0.82, mimeType = 'image/webp' } = opts;

  if (typeof document === 'undefined' || !file.type.startsWith('image/')) {
    return file;
  }

  let objectUrl: string | null = null;
  try {
    const source = await loadImage(file);
    const srcW = 'naturalWidth' in source ? source.naturalWidth : source.width;
    const srcH = 'naturalHeight' in source ? source.naturalHeight : source.height;
    if (!srcW || !srcH) return file;

    const scale = Math.min(1, maxDimension / Math.max(srcW, srcH));
    const targetW = Math.max(1, Math.round(srcW * scale));
    const targetH = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(source, 0, 0, targetW, targetH);

    if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
      source.close();
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mimeType, quality)
    );
    if (!blob) return file;

    // Si el navegador no soporta codificar WebP, toBlob devuelve PNG: respetamos
    // el tipo real para nombrar bien el archivo.
    const outType = blob.type || mimeType;
    const ext = outType === 'image/webp' ? 'webp' : outType.split('/')[1] || 'img';
    const base = file.name.replace(/\.[^.]+$/, '') || 'image';

    return new File([blob], `${base}.${ext}`, { type: outType });
  } catch (err) {
    console.warn('Compresión de imagen falló, se sube el original:', err);
    return file;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }

  // Carga la imagen aplicando la orientación EXIF (fotos de celular) cuando
  // el navegador lo soporta vía createImageBitmap.
  async function loadImage(f: File): Promise<ImageBitmap | HTMLImageElement> {
    if (typeof createImageBitmap === 'function') {
      try {
        return await createImageBitmap(f, { imageOrientation: 'from-image' });
      } catch {
        // Continúa con el fallback de <img>
      }
    }
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      objectUrl = URL.createObjectURL(f);
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = objectUrl;
    });
  }
}

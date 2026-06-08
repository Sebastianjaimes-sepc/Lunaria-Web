import * as ImageManipulator from 'expo-image-manipulator';
import { IMAGE_COMPRESSION } from '@/constants';

interface CompressResult {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

/**
 * Comprime una imagen antes de subirla a Supabase Storage.
 * - Redimensiona al máximo definido en IMAGE_COMPRESSION
 * - Convierte a JPEG con calidad 0.7
 * - Nunca sube más de ~200-300KB
 */
export async function compressImage(
  uri: string,
  options?: { includeBase64?: boolean }
): Promise<CompressResult> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      {
        resize: {
          width: IMAGE_COMPRESSION.maxWidth,
          height: IMAGE_COMPRESSION.maxHeight,
        },
      },
    ],
    {
      compress: IMAGE_COMPRESSION.quality,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: options?.includeBase64 ?? false,
    }
  );

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    base64: result.base64,
  };
}

import { decode } from 'base64-arraybuffer';

import { supabase } from '../lib/supabase';
import { ApiError, request } from './client';
import type { SignedUpload, UploadBucket } from './types';

/** Step 1: ask FastAPI for a one-time upload URL. */
export const signUpload = (bucket: UploadBucket, filename: string) =>
  request<SignedUpload>('/uploads/sign', { method: 'POST', body: { bucket, filename } });

/**
 * Uploads an image and returns its storage path. Save that path on the profile
 * (`photo_path`) or wherever you need it.
 *
 * With expo-image-picker, ask for the data directly:
 *   const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6 });
 *   const path = await uploadBase64Image({ bucket: 'public-media', base64: res.assets[0].base64!, filename: 'photo.jpg' });
 *
 * Use bucket 'private-docs' for ID and KYC files. Compress first (quality 0.5 to 0.7):
 * the free storage plan is small.
 */
export async function uploadBase64Image(opts: {
  bucket: UploadBucket;
  base64: string;
  filename: string;
  contentType?: string;
}): Promise<string> {
  const signed = await signUpload(opts.bucket, opts.filename);
  const token = new URL(signed.upload_url).searchParams.get('token');
  if (!token) throw new ApiError(502, 'The upload link was not valid. Please try again.');

  const { error } = await supabase.storage
    .from(opts.bucket)
    .uploadToSignedUrl(signed.path, token, decode(opts.base64), { contentType: opts.contentType ?? 'image/jpeg' });
  if (error) throw new ApiError(502, `Upload failed: ${error.message}`, error);
  return signed.path;
}

import { supabase } from '../lib/supabase';
import type { DailyPhoto } from '../lib/database.types';

const BUCKET = 'daily-photos';
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const extByType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Largest original we try to shrink in the browser (phone photos are 3–15 MB). */
const MAX_SOURCE_BYTES = 30 * 1024 * 1024;
/** Longest side after resizing: sharp enough to check the work, small enough for mobile data. */
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

/** Client-side pre-check; the bucket enforces the same limits server side. */
export function validatePhoto(file: File): string | null {
  if (!extByType[file.type]) return 'Only JPEG, PNG or WebP images are allowed.';
  if (file.size > MAX_PHOTO_BYTES) return 'That photo is larger than 5 MB.';
  return null;
}

/**
 * Shrinks a camera / gallery photo to at most MAX_DIMENSION px and re-encodes
 * it as JPEG, so large phone photos upload quickly and stay under the bucket
 * limit. Falls back to the original when it is already small and supported.
 */
export async function preparePhoto(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('That photo is too large (over 30 MB).');

  let bitmap: ImageBitmap;
  try {
    // 'from-image' applies the EXIF rotation, so portrait phone photos stay upright.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Formats the browser can't decode (e.g. HEIC on some desktops).
    const problem = validatePhoto(file);
    if (problem) throw new Error('This photo format is not supported. Please use JPEG, PNG or WebP.');
    return file;
  }

  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && !validatePhoto(file) && file.size <= 1024 * 1024) return file;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob) throw new Error('Could not process this photo. Please try another one.');

    const name = file.name.replace(/\.[^.]+$/, '') || 'photo';
    const resized = new File([blob], `${name}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
    const problem = validatePhoto(resized);
    if (problem) throw new Error(problem);
    return resized;
  } finally {
    bitmap.close();
  }
}

export async function listPhotos(studentId: string): Promise<DailyPhoto[]> {
  const { data, error } = await supabase
    .from('daily_photos')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Uploads to {studentId}/{random}.{ext} (the only path the Storage policy
 * accepts), then records the photo. If the insert fails the upload is removed.
 */
export async function uploadPhoto(studentId: string, file: File, description: string) {
  const path = `${studentId}/${crypto.randomUUID()}.${extByType[file.type] ?? 'jpg'}`;

  const upload = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upload.error) throw upload.error;

  const { error } = await supabase
    .from('daily_photos')
    .insert({ photo_path: path, description: description.trim() });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
}

/** Owner "delete": hides the photo. The row and file are kept for admins. */
export async function hidePhoto(photo: DailyPhoto) {
  const { error } = await supabase.rpc('hide_daily_photo', { p_photo_id: photo.id });
  if (error) throw error;
}

/** Admin only: bring back a photo the owner removed. */
export async function restorePhoto(photo: DailyPhoto) {
  const { error } = await supabase.rpc('restore_daily_photo', { p_photo_id: photo.id });
  if (error) throw error;
}

/** Admin only: permanently delete the row, then the file. */
export async function deletePhotoPermanently(photo: DailyPhoto) {
  const { error } = await supabase.from('daily_photos').delete().eq('id', photo.id);
  if (error) throw error;
  const { error: fileError } = await supabase.storage.from(BUCKET).remove([photo.photo_path]);
  if (fileError) throw fileError;
}

export async function photoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

import * as ImagePicker from 'expo-image-picker';

import { uploadBase64Image } from '../api/uploads';

/** Lets the user pick a photo, uploads it to Supabase Storage and returns the storage path (or null if cancelled). */
export async function pickAndUploadPhoto(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
    base64: true,
  });
  if (res.canceled || !res.assets[0]?.base64) return null;
  return uploadBase64Image({ bucket: 'public-media', base64: res.assets[0].base64, filename: 'profile.jpg' });
}

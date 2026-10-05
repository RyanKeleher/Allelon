import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from './supabase';

export type PickedPhoto = { uri: string; mimeType: string };

export async function pickPhoto(): Promise<PickedPhoto | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' };
}

/** Uploads to request-photos/<user id>/<uuid>.<ext> and returns the storage path. */
export async function uploadRequestPhoto(userId: string, photo: PickedPhoto): Promise<string> {
  const ext = photo.mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const path = `${userId}/${Crypto.randomUUID()}.${ext}`;
  const bytes = await (await fetch(photo.uri)).arrayBuffer();
  const { error } = await supabase.storage
    .from('request-photos')
    .upload(path, bytes, { contentType: photo.mimeType });
  if (error) throw error;
  return path;
}

/** Short-lived URL for a private request photo the viewer is allowed to see. */
export async function signedPhotoUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from('request-photos').createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

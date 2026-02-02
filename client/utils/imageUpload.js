/**
 * Shared helpers for image uploads to Cloudinary (or any multipart API).
 * On web, FormData must receive a real File/Blob; { uri, name, type } is not sent by the browser.
 * On native, React Native expects { uri, name, type }.
 */

import { Platform } from 'react-native';

/**
 * Returns a value suitable for FormData.append('file', value) or FormData.append('logo', value).
 * - On web: fetches the URI (blob: or data:), converts to Blob, returns a File so the browser sends real binary.
 * - On native: returns { uri, name, type } for React Native's FormData handling.
 * @param {string} uri - Image URI (blob:, data:, or file path on native)
 * @param {string} defaultName - Filename e.g. 'profile-pic.jpg'
 * @param {string} defaultMime - Fallback MIME type e.g. 'image/jpeg'
 * @returns {Promise<File|{uri: string, name: string, type: string}>}
 */
export async function getFileForFormData(uri, defaultName = 'image.jpg', defaultMime = 'image/jpeg') {
  if (!uri) return null;
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    const ext = defaultName.split('.').pop()?.split(/[#?]/)[0] || 'jpg';
    const mime = blob.type || defaultMime;
    return new File([blob], defaultName, { type: mime });
  }
  const uriParts = String(uri).split('.');
  const fileType = uriParts[uriParts.length - 1]?.split(/[#?]/)[0] || 'jpg';
  return {
    uri,
    name: defaultName,
    type: `image/${fileType === 'png' ? 'png' : fileType === 'gif' ? 'gif' : 'jpeg'}`,
  };
}

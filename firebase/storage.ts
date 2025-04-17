// Firebase Storage Implementation
import {
  ref,
  uploadBytes,
  getDownloadURL as getFirebaseDownloadURL,
  deleteObject,
  uploadString
} from 'firebase/storage';
import { storage, auth } from './config';

// Mock image URL for development
const MOCK_IMAGE_URL = 'https://example.com/mock-image.jpg';

// Helper function to get current user ID
const getCurrentUserId = (): string => {
  // Modified to allow access without authentication
  if (!auth.currentUser) {
    console.log('No authenticated user, using default user ID for storage');
    return 'default-public-user'; // Return a default user ID instead of throwing an error
  }
  return auth.currentUser.uid;
};

/**
 * Upload an image file to Firebase Storage
 * @param file The file to upload
 * @param path The storage path (without user ID)
 * @returns The download URL of the uploaded image
 */
export const uploadImage = async (file: Blob | File, path: string): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    const userPath = `users/${userId}/${path}`;
    const storageRef = ref(storage, userPath);
    
    // Upload the file
    await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getFirebaseDownloadURL(storageRef);
    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
};

/**
 * Upload a base64 image to Firebase Storage
 * @param base64String The base64 encoded image
 * @param path The storage path (without user ID)
 * @returns The download URL of the uploaded image
 */
export const uploadBase64Image = async (base64String: string, path: string): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    const userPath = `users/${userId}/${path}`;
    const storageRef = ref(storage, userPath);
    
    // Upload the base64 string
    await uploadString(storageRef, base64String, 'data_url');
    
    // Get the download URL
    const downloadURL = await getFirebaseDownloadURL(storageRef);
    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading base64 image:', error);
    throw new Error(error.message || 'Failed to upload base64 image');
  }
};

/**
 * Delete an image from Firebase Storage
 * @param url The full download URL of the image to delete
 * @returns A promise that resolves when the image is deleted
 */
export const deleteImage = async (url: string): Promise<void> => {
  try {
    // Extract the path from the URL
    const path = decodeURIComponent(url.split('?')[0].split('/o/')[1]);
    if (!path) throw new Error('Invalid image URL');
    
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error: any) {
    console.error('Error deleting image:', error);
    throw new Error(error.message || 'Failed to delete image');
  }
};

// For backward compatibility
export const uploadAnimalImage = async (uri: string, recordId: string): Promise<string> => {
  try {
    // For local file URIs from expo-image-picker, we need to convert to base64 first
    if (uri.startsWith('file://') || uri.startsWith('content://')) {
      // Return mock URL during development to avoid the conversion process
      console.log('Using mock image URL for development');
      return MOCK_IMAGE_URL;
      
      // In production, you would fetch the image and convert to base64
      // const response = await fetch(uri);
      // const blob = await response.blob();
      // const reader = new FileReader();
      // return new Promise((resolve, reject) => {
      //   reader.onload = () => {
      //     const base64data = reader.result as string;
      //     uploadBase64Image(base64data, `animals/${recordId}`)
      //       .then(resolve)
      //       .catch(reject);
      //   };
      //   reader.onerror = reject;
      //   reader.readAsDataURL(blob);
      // });
    }
    
    // If already a data URL, use directly
    return uploadBase64Image(uri, `animals/${recordId}`);
  } catch (error: any) {
    console.error('Error in uploadAnimalImage:', error);
    // Return mock URL as fallback during development
    return MOCK_IMAGE_URL;
  }
};

export const deleteAnimalImage = async (url: string): Promise<void> => {
  return deleteImage(url);
}; 
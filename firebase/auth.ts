// Firebase Authentication Implementation
import {
  createUserWithEmailAndPassword as fbCreateUser,
  signInWithEmailAndPassword as fbSignIn,
  GoogleAuthProvider,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';

import { auth } from './config';

// Export User type from Firebase
export type User = FirebaseUser;

/**
 * Get the currently signed-in user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  return auth.currentUser;
};

/**
 * Register with email and password
 */
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  try {
    const userCredential = await fbCreateUser(auth, email, password);
    
    // Update profile to add display name
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return userCredential.user;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Registration failed');
  }
};

/**
 * Create a new user with email and password (alias for registerWithEmail)
 */
export const createUserWithEmailAndPassword = async (
  email: string,
  password: string,
  displayName?: string
): Promise<User> => {
  return registerWithEmail(email, password, displayName || '');
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await fbSignIn(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Login failed');
  }
};

/**
 * Sign in with email and password (alias for signInWithEmail)
 */
export const signInWithEmailAndPassword = signInWithEmail;

/**
 * Sign in with Google
 */
// export const signInWithGoogle = async (): Promise<User> => {
// export const signInWithGoogle = async (): Promise<User> => {
//   throw new Error('Google sign-in is not supported in React Native. Use expo-auth-session or react-native-google-signin instead.');
// };
//     throw new Error(.message || 'Google login failed');
//   }
// };

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await fbSignOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message || 'Sign out failed');
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(error.message || 'Password reset failed');
  }
};

/**
 * Auth state listener
 */
export const onAuthStateChange = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
}; 

export { auth };

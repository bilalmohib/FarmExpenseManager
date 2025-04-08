import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useRouter, useSegments } from 'expo-router';
import { 
  createUserWithEmailAndPassword,
  getCurrentUser, 
  onAuthStateChange,
  signInWithEmailAndPassword,
  signOut
} from './firebase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName: string) => Promise<User>;
  signOut: () => Promise<void>;
  updateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
};

// Create the auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Check if the user is authenticated and redirect accordingly
  useEffect(() => {
    if (!loading) {
      const inAuthGroup = segments[0] === '(auth)';
      
      if (!user && !inAuthGroup) {
        // Redirect to the sign-in page if not authenticated
        router.replace('../(auth)/login');
      } else if (user && inAuthGroup) {
        // Redirect to the home page if authenticated
        router.replace('../(tabs)');
      }
    }
  }, [user, loading, segments, router]);

  // Subscribe to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  // Import these functions from your Firebase auth implementation
  const signIn = async (email: string, password: string) => {
    try {
      // This should be implemented in your firebase.ts file
      const userCredential = await signInWithEmailAndPassword(email, password);
      return userCredential;
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      // This should be implemented in your firebase.ts file
      // Import the function directly instead of using dynamic import
      const userCredential = await createUserWithEmailAndPassword(email, password, displayName);
      return userCredential;
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      // This should be implemented in your firebase.ts file
      // Import the function directly instead of using dynamic import
      await signOut();
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateUserProfile = async (user: User, data: { displayName?: string; photoURL?: string; }) => {
    try {
      if (!user) throw new Error('No user is signed in');
      
      // This should be implemented in your firebase.ts file
      // Import the function directly instead of using dynamic import
      await updateUserProfile(user, data);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut: handleSignOut,
    updateProfile: (data: { displayName?: string; photoURL?: string; }) => {
      if (!user) throw new Error('No user is signed in');
      return updateUserProfile(user, data);
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 
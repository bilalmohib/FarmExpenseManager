import { useState, useEffect } from 'react';
import { auth } from '../../firebase/config';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { logActivity } from '../utils/activityLogger';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Log the login activity
      await logActivity({
        type: 'user_login',
        description: `User logged in: ${email}`,
        metadata: {
          email
        }
      });
      
      return userCredential.user;
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const email = user?.email;
      
      await signOut(auth);
      
      // Log the logout activity
      if (email) {
        await logActivity({
          type: 'user_logout',
          description: `User logged out: ${email}`,
          metadata: {
            email
          }
        });
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message || 'Failed to logout');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    logout
  };
} 
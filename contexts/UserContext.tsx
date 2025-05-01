import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserPermission } from '../firebase/firestore';
import { auth, db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface UserContextType {
  user: User | null;
  permissions: UserPermission | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  permissions: null,
  loading: true,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = doc(db, 'users', firebaseUser.uid);
        const unsubscribeUser = onSnapshot(userDoc, (doc) => {
          if (doc.exists()) {
            setUser(doc.data() as User);
          } else {
            setUser(null);
          }
          setLoading(false);
        });

        return () => unsubscribeUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const value = {
    user,
    permissions: user?.permissions || null,
    loading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 
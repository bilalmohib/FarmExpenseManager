import { Redirect } from 'expo-router';
import { auth } from '../firebase/config';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      console.log('Auth state changed:', u);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If user is logged in
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  // If no user
  return <Redirect href="/login" />;
}

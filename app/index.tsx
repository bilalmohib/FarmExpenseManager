// import { Redirect } from 'expo-router';
// import { auth } from '../firebase/config';
// import { useEffect, useState } from 'react';
// import { ActivityIndicator } from 'react-native-paper';
// import { FirebaseAuthTypes } from '@react-native-firebase/auth';
// import { onAuthStateChanged, User } from 'firebase/auth';
// // This screen just redirects to the main app structure
// export default function Index() {
//   const [loading, setLoading] = useState(true);
//   const [user, setUser] = useState<User | null>(null);

// useEffect(() => {
//   const unsubscribe = onAuthStateChanged(auth, (u) => {
//     setUser(u); // user is User | null
//     setLoading(false);
//     console.log('Use das:', u);
//   });

//   return unsubscribe;
// }, []);

//   if (loading) {
//     return (
//       <ActivityIndicator style={{ flex: 1, alignSelf: 'center', justifyContent: 'center' }} />
//     );
//   }

//   if (user !== null) {
//     console.log('User is logged in:', user);
//     return <Redirect href="/dashboard" />;
//   }
//   console.log('User is not logged in:', user);
//   return <Redirect href="/login" />
// } 


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
    if (user.email === 'ammarmohib09@gmail.com') {
      return <Redirect href="/admin/dashboard" />;
    } else {
      return <Redirect href="/(tabs)" />;
    }
  }

  // If no user
  return <Redirect href="/login" />;
}

import { Redirect, Stack } from 'expo-router';
import { auth } from '../../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

export default function AuthRoutesLayout() {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsSignedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  if (isSignedIn === null) {
    return null; // Or a loading indicator
  }

  if (isSignedIn) {
    return <Redirect href="/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f7f9fc',
        },
        headerTintColor: '#2c3e50',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{
          title: "Login",
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="register" 
        options={{
          title: "Create Account",
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{
          title: "Reset Password",
        }}
      />
    </Stack>
  );
} 
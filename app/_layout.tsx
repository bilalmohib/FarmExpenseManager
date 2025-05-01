import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text, StyleSheet } from 'react-native';
import { UserProvider, useUser } from '../contexts/UserContext';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});

function useProtectedRoute() {
  const { user, loading } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === 'admin';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to dashboard if authenticated and trying to access auth screens
      if (user.permissions.isAdmin) {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/dashboard');
      }
    } else if (user && inAdminGroup && !user.permissions.isAdmin) {
      // Redirect to dashboard if non-admin trying to access admin screens
      router.replace('/dashboard');
    }
  }, [user, loading, segments]);
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        
        // Artificially delay for a better experience
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null; // This will show the native splash screen
  }

  return (
    <UserProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="expenses" />
        <Stack.Screen name="records" />
        <Stack.Screen name="reports" />
      </Stack>
    </UserProvider>
  );
}

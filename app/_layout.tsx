import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text, StyleSheet, Image } from 'react-native';
import { getCurrentUser } from './lib/firebase';
import { Ionicons } from '@expo/vector-icons';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        // Check authentication state
        await getCurrentUser();
        
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
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="expenses" options={{ presentation: 'modal' }} />
        <Stack.Screen name="records" options={{ headerShown: false }} />
        <Stack.Screen name="reports" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}

// This component renders on top of the auth and tab navigators
// and checks if the user is authenticated
export function App({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Display custom loading screen
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="leaf" size={120} color="#27ae60" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F9FC',
  },
  loadingText: {
    fontSize: 18,
    color: '#27ae60',
    fontWeight: '500',
    marginTop: 20,
  }
});

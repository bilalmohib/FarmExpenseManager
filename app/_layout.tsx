import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from './lib/clerk-token-cache';
import Constants from 'expo-constants';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Get redirectUrl based on environment
const getRedirectUrl = () => {
  // For standalone apps
  const scheme = Constants.expoConfig?.scheme;
  if (scheme) {
    return `${scheme}://`;
  }
  
  // For Expo Go
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return `exp://${hostUri}/--/`;
  }
  
  return "myapp://";
};

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const clerkPubKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

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

  if (!clerkPubKey) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Missing Clerk Publishable Key. Please add it to your .env file.
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider 
      publishableKey={clerkPubKey}
      tokenCache={tokenCache}
    >
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="expenses" />
        <Stack.Screen name="records" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="routes-test" options={{ headerShown: true, title: "Routes Test" }} />
      </Stack>
    </ClerkProvider>
  );
}

// This component renders on top of the auth and tab navigators
// and checks if the user is authenticated
export function App({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
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
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F9FC',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  }
});

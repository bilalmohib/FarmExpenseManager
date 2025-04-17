import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return null; // Or a loading indicator
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
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
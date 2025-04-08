import { Redirect } from 'expo-router';

// This screen just redirects to the main app structure
export default function Index() {
  return <Redirect href="/(tabs)" />;
} 
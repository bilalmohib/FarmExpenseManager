import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function BreedingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide the default header
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Breeding Analysis',
        }}
      />
      {/* Add other breeding-related screens here if needed */}
    </Stack>
  );
} 
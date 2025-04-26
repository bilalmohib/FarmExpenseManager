import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function InvoicesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.tint,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="new"
        options={{
          title: 'Create Invoice',
          presentation: 'modal',
        }}
      />
      {/* Add other invoice-related screens here if needed */}
    </Stack>
  );
} 
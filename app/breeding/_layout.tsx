import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function LoadingLayout() {
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
        name="index"
        options={{
          title: 'Breeding',
          headerLargeTitle: true,
        }}
      />
    </Stack>
  );
} 
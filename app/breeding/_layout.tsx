import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function ReportsLayout() {
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
          title: 'Reports & Analytics',
          headerLargeTitle: true,
        }}
      />
    </Stack>
  );
} 
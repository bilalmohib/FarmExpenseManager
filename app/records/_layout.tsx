import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function RecordsLayout() {
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
          title: 'Animal Records',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'Add New Record',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Edit Record',
        }}
      />
    </Stack>
  );
} 
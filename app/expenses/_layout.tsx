import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function ExpensesLayout() {
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
          title: 'Monthly Expenses',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'Add New Expense',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
} 
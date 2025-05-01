import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { HeaderBackButton } from '@react-navigation/elements';
import { router } from 'expo-router';


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
          headerLeft: () => (
            <HeaderBackButton
              tintColor='#fff'
              onPress={() => {
                router.push('/(tabs)');
              }}
            />
          )
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'Add New Expense',
          presentation: 'modal',
          headerLeft: () => (
            <HeaderBackButton
              tintColor='#fff'
              onPress={() => {
                router.push('/(tabs)');
              }}
            />
          )
        }}
      />
    </Stack>
  );
} 
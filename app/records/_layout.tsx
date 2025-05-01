import { router, Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Button } from 'react-native-paper';
import { HeaderBackButton } from '@react-navigation/elements';
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
          headerLeft: () => (
          <HeaderBackButton
          tintColor='#fff'
          onPress={() => {
            router.push('/(tabs)');
            // Your custom logic (if any)
            // navigation.goBack();
          }}
        />)
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
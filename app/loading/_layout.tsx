// import { Stack } from 'expo-router';
// import { Colors } from '../../constants/Colors';

// export default function LoadingLayout() {
//   return (
//     <Stack
//       screenOptions={{
//         headerShown: false, // Hide the default header for this section
//       }}
//     >
//       <Stack.Screen
//         name="index"
//         options={{
//           title: 'Load In / Load Out',
//           // You might want a header for the index screen itself
//            headerShown: true, 
//            headerStyle: {
//              backgroundColor: Colors.light.tint,
//            },
//            headerTintColor: '#fff',
//            headerTitleStyle: {
//              fontWeight: 'bold',
//            },
//         }}
//       />
//       {/* Add other loading-related screens here if needed */}
//     </Stack>
//   );
// } 

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
          title: 'Reports & Analytics',
          headerLargeTitle: true,
        }}
      />
    </Stack>
  );
} 
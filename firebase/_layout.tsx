import React from 'react';
import { Stack } from 'expo-router';
import { View, Text } from 'react-native';

// This file prevents the firebase directory from being treated as a route
// The firebase directory should only contain service files, not UI components

export default function FirebaseLayout() {
  // Return empty layout with no outlet since this directory shouldn't be navigable
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>This is a service directory, not a route</Text>
    </View>
  );
} 
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// For Expo Router - this makes a proper route component
export default function StorageScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Storage Service</Text>
      <Text style={styles.description}>
        This route is not meant to be accessed directly.
        It contains Firebase Storage service functions.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
}); 
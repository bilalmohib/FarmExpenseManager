import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// For Expo Router - this makes a proper route component
export default function FirebaseIndexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Services</Text>
      <Text style={styles.description}>
        This route is not meant to be accessed directly.
        It contains Firebase service functions for authentication, database, and storage.
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
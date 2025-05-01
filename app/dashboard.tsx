import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import { useUser } from '../contexts/UserContext';

export default function Dashboard() {
  const router = useRouter();
  const { permissions, loading } = useUser();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!permissions) {
    return (
      <View style={styles.container}>
        <Text>Please login to access the dashboard</Text>
      </View>
    );
  }

  const renderFeatureCard = (title: string, onPress: () => void, enabled: boolean) => (
    <TouchableOpacity
      style={[styles.card, !enabled && styles.cardDisabled]}
      onPress={enabled ? onPress : undefined}
    >
      <Text style={[styles.cardTitle, !enabled && styles.cardTitleDisabled]}>
        {title}
      </Text>
      {!enabled && (
        <Text style={styles.disabledText}>Contact admin for access</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.grid}>
          {renderFeatureCard(
            'Create Invoice',
            () => router.push('/invoices/new'),
            permissions.canCreateInvoice
          )}
          {renderFeatureCard(
            'Create Expense',
            () => router.push('/expenses/new'),
            permissions.canCreateExpense
          )}
          {renderFeatureCard(
            'Monthly Profit',
            () => router.push('/reports/monthly-profit' as any), // Type assertion to fix type error
            permissions.canViewMonthlyProfit
          )}
          {renderFeatureCard(
            'Manage Animals',
            () => router.push('/animals' as any), // Type assertion to fix type error
            permissions.canManageAnimals
          )}
          {renderFeatureCard(
            'Manage Collections',
            () => router.push('/collections'),
            permissions.canManageCollections
          )}
          {renderFeatureCard(
            'Manage Users',
            () => router.push('/admin/dashboard'),
            permissions.canManageUsers
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 16,
    backgroundColor: Colors.light.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDisabled: {
    backgroundColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  cardTitleDisabled: {
    color: '#999',
  },
  disabledText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
}); 
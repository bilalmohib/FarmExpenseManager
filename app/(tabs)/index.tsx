import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { getAllAnimalRecords, getMonthlyExpense } from '../../firebase/firestore';
import { useUser } from '@clerk/clerk-expo';
import SignOutButton from '../components/SignOutButton';

export default function HomeScreen() {
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeAnimals: 0,
    monthlyProfitLoss: 0,
    monthlyExpenseEntered: false,
  });
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      // Load dashboard data
      loadDashboardData();
    }
  }, [isLoaded]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get current month for expense check
      const currentDate = new Date();
      const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Get all animal records
      const records = await getAllAnimalRecords();
      
      // Get monthly expense
      const monthlyExpense = await getMonthlyExpense(currentMonthStr);

      // Calculate active animals (those without sale date)
      const activeAnimals = records.filter(record => !record.saleDate).length;
      
      // Calculate total profit/loss for current month
      const currentMonthRecords = records.filter(record => {
        const purchaseDate = new Date(record.purchaseDate);
        return purchaseDate.getMonth() === currentDate.getMonth() &&
               purchaseDate.getFullYear() === currentDate.getFullYear();
      });
      
      const profitLoss = currentMonthRecords.reduce((total, record) => {
        return total + (record.profit || 0) - (record.loss || 0);
      }, 0);

      setStats({
        activeAnimals,
        monthlyProfitLoss: profitLoss,
        monthlyExpenseEntered: monthlyExpense !== null,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (!isLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  // Extract user's first name or username
  const userName = user?.firstName || user?.username || 'Farmer';

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={styles.welcomeText}>{getTimeOfDay()},</Text>
            <Text style={styles.nameText}>{userName}!</Text>
            <Text style={styles.dateText}>{new Date().toDateString()}</Text>
          </View>
          <SignOutButton />
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.cardsContainer}>
        {/* Active Animals Card */}
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('/records')}
        >
          <View style={styles.cardIconContainer}>
            <Ionicons name="paw" size={28} color={Colors.light.tint} />
          </View>
          <Text style={styles.cardLabel}>Active Animals</Text>
          <Text style={styles.cardValue}>{stats.activeAnimals}</Text>
        </TouchableOpacity>

        {/* Monthly Profit/Loss Card */}
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('/reports')}
        >
          <View style={styles.cardIconContainer}>
            <Ionicons 
              name={stats.monthlyProfitLoss >= 0 ? "trending-up" : "trending-down"} 
              size={28} 
              color={stats.monthlyProfitLoss >= 0 ? '#4CAF50' : '#F44336'} 
            />
          </View>
          <Text style={styles.cardLabel}>Monthly {stats.monthlyProfitLoss >= 0 ? 'Profit' : 'Loss'}</Text>
          <Text 
            style={[
              styles.cardValue, 
              stats.monthlyProfitLoss >= 0 ? styles.profitText : styles.lossText
            ]}
          >
            {formatCurrency(Math.abs(stats.monthlyProfitLoss))}
          </Text>
        </TouchableOpacity>

        {/* Monthly Expense Card */}
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('/expenses')}
        >
          <View style={styles.cardIconContainer}>
            <Ionicons 
              name={stats.monthlyExpenseEntered ? "checkmark-circle" : "alert-circle"} 
              size={28} 
              color={stats.monthlyExpenseEntered ? '#4CAF50' : '#FF9800'} 
            />
          </View>
          <Text style={styles.cardLabel}>Monthly Expense</Text>
          <Text 
            style={[
              styles.cardValue, 
              stats.monthlyExpenseEntered ? styles.expenseEnteredText : styles.expenseMissingText
            ]}
          >
            {stats.monthlyExpenseEntered ? 'Entered' : 'Missing!'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionButtons}>
          {/* Add Record Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/records')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="add-circle" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Add Record</Text>
          </TouchableOpacity>

          {/* View Records Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/records')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#FF9800' }]}>
              <Ionicons name="list" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>View Records</Text>
          </TouchableOpacity>

          {/* Expenses Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/expenses')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="wallet" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Expenses</Text>
          </TouchableOpacity>

          {/* Reports Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/reports')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#673AB7' }]}>
              <Ionicons name="bar-chart" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Reports</Text>
          </TouchableOpacity>
          
                    {/* 🧬 Breeding */}
                    <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/breeding')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="paw" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Breeding</Text>
            </TouchableOpacity>

        </View>
      </View>

      {/* Warning For Missing Expense */}
      {!stats.monthlyExpenseEntered && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={24} color="#FF9800" />
          <Text style={styles.warningText}>
            Please enter your monthly expense to enable accurate profit calculations.
          </Text>
          <TouchableOpacity 
            style={styles.warningButton}
            onPress={() => router.push('/expenses')}
          >
            <Text style={styles.warningButtonText} >Add Expense</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pull to refresh message */}
      <Text style={styles.refreshText}>Pull down to refresh</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  welcomeSection: {
    backgroundColor: Colors.light.tint,
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    marginTop: -14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    width: '31%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profitText: {
    color: '#4CAF50',
  },
  lossText: {
    color: '#F44336',
  },
  expenseEnteredText: {
    color: '#4CAF50',
  },
  expenseMissingText: {
    color: '#FF9800',
  },
  actionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
  },
  warningContainer: {
    backgroundColor: '#FFF9C4',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'column',
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#FF9800',
    marginVertical: 10,
    textAlign: 'center',
  },
  warningButton: {
    backgroundColor: '#FF9800',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 5,
  },
  warningButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  refreshText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginBottom: 20,
  },
});

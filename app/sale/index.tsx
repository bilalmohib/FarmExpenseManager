import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { getAllAnimalRecords, getMonthlyExpenses, AnimalRecord, MonthlyExpense } from '../../firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from 'react-native/Libraries/NewAppScreen';

interface ProfitLossStats {
  perCow: Record<string, {
    expectedExpense: number;
    actualExpense: number;
    profitOrLoss: number;
    daysInFarm: number;
  }>;
  perCollection: Record<string, {
    expectedExpense: number;
    actualExpense: number;
    profitOrLoss: number;
    cows: string[];
    totalDays: number;
  }>;
  overall: {
    expectedExpense: number;
    actualExpense: number;
    profitOrLoss: number;
    totalDays: number;
  };
}

const SalePurchase = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AnimalRecord[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [stats, setStats] = useState<ProfitLossStats>({
    perCow: {},
    perCollection: {},
    overall: {
      expectedExpense: 0,
      actualExpense: 0,
      profitOrLoss: 0,
      totalDays: 0
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [animalRecords, expenses] = await Promise.all([
        getAllAnimalRecords(),
        getMonthlyExpenses()
      ]);
      setRecords(animalRecords);
      setMonthlyExpenses(expenses);
      calculateStats(animalRecords, expenses);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysInFarm = (record: AnimalRecord): number => {
    if (record.status === 'sold' && record.soldDate) {
      return Math.floor((new Date(record.soldDate).getTime() - new Date(record.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
    }
    return Math.floor((new Date().getTime() - new Date(record.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateStats = (records: AnimalRecord[], expenses: MonthlyExpense[]) => {
    const newStats: ProfitLossStats = {
      perCow: {},
      perCollection: {},
      overall: {
        expectedExpense: 0,
        actualExpense: 0,
        profitOrLoss: 0,
        totalDays: 0
      }
    };

    // First pass: Calculate total days and expenses
    let totalDays = 0;
    let totalExpense = 0;

    records.forEach(record => {
      const daysInFarm = calculateDaysInFarm(record);
      totalDays += daysInFarm;
      
      // Calculate base expenses
      const animalExpenses = Object.values(record.expenses || {}).reduce((sum: number, expense) => 
        sum + (expense as {amount: number}).amount, 0);
      
      // Find matching expenses based on collection tags
      const matchingExpenses = expenses.filter(expense => 
        expense.tags && record.collectionNames.some(collectionName => 
          expense.tags.includes(collectionName)
        )
      ).reduce((sum, expense) => sum + expense.amount, 0);

      totalExpense += record.purchasePrice + animalExpenses + matchingExpenses;
    });

    // Calculate expense per day
    const expensePerDay = totalDays > 0 ? totalExpense / totalDays : 0;

    // Second pass: Calculate per-cow and per-collection stats
    records.forEach(record => {
      const daysInFarm = calculateDaysInFarm(record);
      const actualExpense = daysInFarm * expensePerDay;
      const expectedExpense = record.sellingPrice || 0;
      const profitOrLoss = expectedExpense - actualExpense;

      // Per cow stats
      newStats.perCow[record.animalNumber] = {
        expectedExpense,
        actualExpense,
        profitOrLoss,
        daysInFarm
      };

      // Per collection stats
      record.collectionNames.forEach(collectionName => {
        if (!newStats.perCollection[collectionName]) {
          newStats.perCollection[collectionName] = {
            expectedExpense: 0,
            actualExpense: 0,
            profitOrLoss: 0,
            cows: [],
            totalDays: 0
          };
        }

        const collection = newStats.perCollection[collectionName];
        collection.expectedExpense += expectedExpense;
        collection.actualExpense += actualExpense;
        collection.profitOrLoss += profitOrLoss;
        collection.cows.push(record.animalNumber);
        collection.totalDays += daysInFarm;
      });

      // Overall stats
      newStats.overall.expectedExpense += expectedExpense;
      newStats.overall.actualExpense += actualExpense;
      newStats.overall.profitOrLoss += profitOrLoss;
      newStats.overall.totalDays += daysInFarm;
    });

    setStats(newStats);
  };

  const formatCurrency = (amount: number) => {
    return `₹${Math.abs(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </SafeAreaView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Overall Stats */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="analytics" size={20} color={Colors.light.tint} />
          <Text style={styles.sectionTitle}>Overall Statistics</Text>
        </View>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Days</Text>
            <Text style={styles.statValue}>{stats.overall.totalDays}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Purchase Price</Text>
            <Text style={styles.statValue}>{formatCurrency(stats.overall.expectedExpense)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Actual Expense</Text>
            <Text style={styles.statValue}>{formatCurrency(stats.overall.actualExpense)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Profit/Loss</Text>
            <Text style={[
              styles.statValue,
              stats.overall.profitOrLoss >= 0 ? styles.profitText : styles.lossText
            ]}>
              {formatCurrency(stats.overall.profitOrLoss)}
              {stats.overall.profitOrLoss >= 0 ? ' (Profit)' : ' (Loss)'}
            </Text>
          </View>
        </View>
      </View>

      {/* Collection-wise Stats */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="folder-open" size={20} color={Colors.light.tint} />
          <Text style={styles.sectionTitle}>Collection Statistics</Text>
        </View>
        {Object.entries(stats.perCollection).map(([collectionName, data]) => (
          <View key={collectionName} style={styles.collectionCard}>
            <Text style={styles.collectionName}>{collectionName}</Text>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Days</Text>
              <Text style={styles.statValue}>{data.totalDays}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Purchase Price</Text>
              <Text style={styles.statValue}>{formatCurrency(data.expectedExpense)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Actual Expense</Text>
              <Text style={styles.statValue}>{formatCurrency(data.actualExpense)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Profit/Loss</Text>
              <Text style={[
                styles.statValue,
                data.profitOrLoss >= 0 ? styles.profitText : styles.lossText
              ]}>
                {formatCurrency(data.profitOrLoss)}
                {data.profitOrLoss >= 0 ? ' (Profit)' : ' (Loss)'}
              </Text>
            </View>
            <Text style={styles.cowsLabel}>Cows: {data.cows.join(', ')}</Text>
          </View>
        ))}
      </View>

      {/* Per Cow Stats */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="paw" size={20} color={Colors.light.tint} />
          <Text style={styles.sectionTitle}>Per Cow Statistics</Text>
        </View>
        {Object.entries(stats.perCow).map(([cowId, data]) => (
          <View key={cowId} style={styles.cowCard}>
            <Text style={styles.cowName}>Cow ID: {cowId}</Text>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Days in Farm</Text>
              <Text style={styles.statValue}>{data.daysInFarm}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Purchase Price</Text>
              <Text style={styles.statValue}>{formatCurrency(data.expectedExpense)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Actual Expense</Text>
              <Text style={styles.statValue}>{formatCurrency(data.actualExpense)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Profit/Loss</Text>
              <Text style={[
                styles.statValue,
                data.profitOrLoss >= 0 ? styles.profitText : styles.lossText
              ]}>
                {formatCurrency(data.profitOrLoss)}
                {data.profitOrLoss >= 0 ? ' (Profit)' : ' (Loss)'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  collectionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  cowsLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  cowCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cowName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  profitText: {
    color: '#4CAF50',
  },
  lossText: {
    color: '#F44336',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SalePurchase;
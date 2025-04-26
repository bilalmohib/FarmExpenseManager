import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { getMonthlyExpenses, addMonthlyExpense, updateMonthlyExpense, deleteMonthlyExpense, MonthlyExpense, getAllAnimalRecords, AnimalRecord } from '../../firebase/firestore';
import { Picker } from '@react-native-picker/picker';

interface CollectionStats {
  totalExpense: number;
  profit: number;
  loss: number;
  animalCount: number;
  animals: Array<{
    id: string;
    animalNumber: string;
    totalExpense: number;
    profit: number;
    loss: number;
    status: 'active' | 'sold' | 'deceased';
  }>;
}

export default function BreedingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<AnimalRecord[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [allCollections, setAllCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedRecords, fetchedExpenses] = await Promise.all([
        getAllAnimalRecords(),
        getMonthlyExpenses()
      ]);
      setRecords(fetchedRecords);
      setMonthlyExpenses(fetchedExpenses);

      const uniqueCollections = new Set<string>();
      fetchedRecords.forEach(record => {
        record.collectionNames?.forEach(name => uniqueCollections.add(name));
      });
      setAllCollections(Array.from(uniqueCollections).sort());

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load breeding data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };
  
  const calculateAnimalStats = (record: AnimalRecord): { totalExpense: number; profit: number; loss: number } => {
    let totalExpense = record.purchasePrice || 0;
    let profit = 0;
    let loss = 0;

    totalExpense += Object.values(record.expenses || {}).reduce((sum: number, expense) => sum + (expense as { amount: number }).amount, 0);

    const taggedExpenses = monthlyExpenses.filter(expense =>
      expense.tags && record.collectionNames?.some(collName => expense.tags.includes(collName))
    ).reduce((sum, expense) => sum + expense.amount, 0);

    totalExpense += taggedExpenses;

    if (record.status === 'sold') {
      const salePrice = record.sellingPrice || 0;
      if (salePrice > totalExpense) {
        profit = salePrice - totalExpense;
      } else {
        loss = totalExpense - salePrice;
      }
    }

    return { totalExpense, profit, loss };
  };

  const breedingStats = useMemo(() => {
    const stats: Record<string, CollectionStats> = {};

    records.forEach(record => {
      const animalStats = calculateAnimalStats(record);

      record.collectionNames?.forEach(collectionName => {
        if (!stats[collectionName]) {
          stats[collectionName] = {
            totalExpense: 0,
            profit: 0,
            loss: 0,
            animalCount: 0,
            animals: []
          };
        }
        stats[collectionName].totalExpense += animalStats.totalExpense;
        stats[collectionName].profit += animalStats.profit;
        stats[collectionName].loss += animalStats.loss;
        stats[collectionName].animalCount += record.isBulk ? (record.quantity || 1) : 1;
        stats[collectionName].animals.push({
          id: record.id,
          animalNumber: record.animalNumber,
          totalExpense: animalStats.totalExpense,
          profit: animalStats.profit,
          loss: animalStats.loss,
          status: record.status
        });
      });
    });
    return stats;
  }, [records, monthlyExpenses]);

  const filteredCollections = useMemo(() => {
    if (!selectedCollection) {
      return Object.keys(breedingStats).sort();
    }
    return selectedCollection in breedingStats ? [selectedCollection] : [];
  }, [selectedCollection, breedingStats]);
  
  const formatCurrency = (value: number): string => {
    return `₹${Math.abs(value).toFixed(2)}`;
  };

  const renderCollectionCard = (collectionName: string) => {
    const data = breedingStats[collectionName];
    if (!data) return null;

    return (
      <View key={collectionName} style={styles.card}>
        <Text style={styles.cardTitle}>{collectionName}</Text>
        <View style={styles.collectionStatsContainer}>
            <View style={styles.statItem}><Text style={styles.statLabel}>Animals:</Text><Text style={styles.statValue}>{data.animalCount}</Text></View>
            <View style={styles.statItem}><Text style={styles.statLabel}>Total Expense:</Text><Text style={styles.statValue}>{formatCurrency(data.totalExpense)}</Text></View>
            <View style={styles.statItem}><Text style={styles.statLabel}>Total Profit:</Text><Text style={[styles.statValue, styles.profitText]}>{formatCurrency(data.profit)}</Text></View>
            <View style={styles.statItem}><Text style={styles.statLabel}>Total Loss:</Text><Text style={[styles.statValue, styles.lossText]}>{formatCurrency(data.loss)}</Text></View>
        </View>

        <Text style={styles.subTitle}>Animals in this Collection:</Text>
        {data.animals.map(animal => renderAnimalRow(animal))}
      </View>
    );
  };

  const renderAnimalRow = (animal: CollectionStats['animals'][0]) => (
    <View key={animal.id} style={styles.animalRow}>
        <Text style={styles.animalId}>{animal.animalNumber} ({animal.status})</Text>
        <View style={styles.animalStats}>
            <Text style={styles.animalStat}>Exp: {formatCurrency(animal.totalExpense)}</Text>
            <Text style={[styles.animalStat, animal.profit > 0 ? styles.profitText : styles.lossText]}>
                {animal.profit > 0 ? `P: ${formatCurrency(animal.profit)}` : `L: ${formatCurrency(animal.loss)}`}
            </Text>
        </View>
    </View>
  );
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading Breeding Data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.title}>Breeding Analysis</Text>
      </View>

      <View style={styles.filterContainer}>
         <Text style={styles.filterLabel}>Filter by Collection:</Text>
         <View style={styles.pickerWrapper}>
            <Picker
                selectedValue={selectedCollection}
                onValueChange={(itemValue) => setSelectedCollection(itemValue || null)}
                style={styles.picker}
                dropdownIconColor={Colors.light.tint}
            >
                <Picker.Item label="All Collections" value={null} />
                {allCollections.map(coll => (
                <Picker.Item key={coll} label={coll} value={coll} />
                ))}
            </Picker>
         </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.light.tint]}/>}
      >
        {filteredCollections.length === 0 && !selectedCollection && (
             <Text style={styles.noDataText}>No collections found.</Text>
        )}
        {filteredCollections.length === 0 && selectedCollection && (
             <Text style={styles.noDataText}>No data found for "{selectedCollection}".</Text>
        )}
        {filteredCollections.map(collectionName => renderCollectionCard(collectionName))}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333333',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333333',
  },
  scrollView: {
    flex: 1,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.tint,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  collectionStatsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 15,
  },
  statItem: {
      flexDirection: 'row',
      width: '50%',
      marginBottom: 8,
      alignItems: 'center',
  },
  statLabel: {
      fontSize: 13,
      color: '#666',
      marginRight: 5,
  },
  statValue: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
  },
  subTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#444',
      marginTop: 10,
      marginBottom: 8,
  },
  animalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  animalId: {
      flex: 1,
      fontSize: 14,
      color: '#555',
  },
  animalStats: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  animalStat: {
      fontSize: 13,
      marginLeft: 10,
      fontWeight: '500',
  },
  profitText: {
    color: Colors.light.success,
    fontWeight: 'bold',
  },
  lossText: {
    color: Colors.light.error,
    fontWeight: 'bold',
  },
  noDataText: {
      textAlign: 'center',
      marginTop: 40,
      fontSize: 16,
      color: '#888',
  },
  bottomPadding: {
    height: 20,
  },
}); 
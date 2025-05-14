import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Alert,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { getAllAnimalRecords, getMonthlyExpenses, AnimalRecord, MonthlyExpense, getAllLoadRecords } from '../../firebase/firestore';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { LoadRecord } from '../models/LoadRecord';
import { set } from 'react-hook-form';

const screenWidth = Dimensions.get('window').width;

// Chart configurations
const chartConfig = {
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#FFFFFF',
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.7,
  decimalPlaces: 0,
};

interface CollectionStats {
  totalExpense: number;
  totalSale: number;
  profit: number;
  loss: number;
  animalCount: number;
  animals: Array<{
    animalNumber: string;
    profit: number;
    loss: number;
  }>;
}

interface ReportStats {
  totalExpense: number;
  totalSale: number;
  profit: number;
  loss: number;
  collectionNames: [];
  collections: Record<string, CollectionStats>;
  animals: Record<string, {
    totalExpense: number;
    salePrice: number;
    profit: number;
    loss: number;
    status: string;
  }>;
}

export default function LoadInOut() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<LoadRecord[]>([]);
  const [daysInFarm, setDaysInFarm] = useState<number>(0);
  const [stats, setStats] = useState<ReportStats>({
    totalExpense: 0,
    totalSale: 0,
    profit: 0,
    loss: 0,
    collectionNames: [],
    animals: {},
    collections: {}
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year' | 'all'>('all');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [records, selectedPeriod]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const allRecords = await getAllLoadRecords();
      // Filter only load records
      const loadRecords = allRecords.filter(record => record.recordType === 'load');
      setRecords(loadRecords);
    } catch (error) {
      console.error('Error loading records:', error);
      Alert.alert('Error', 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnimalExpense = (record: LoadRecord, monthlyExpenses: MonthlyExpense[]) => {
    // Ensure this is a load record
    if (record.recordType !== 'load') return 0;
    function toDate(input: any): Date {
  if (input instanceof Date) return input;
  if (input?.toDate) return input.toDate(); // Firestore Timestamp object
  return new Date(input); // ISO string or timestamp number
}
const loadInDate = record.loadInDate ? toDate(record.loadInDate) : new Date();
const loadOutDate = record.status === 'loaded out' && record.loadOutDate 
  ? toDate(record.loadOutDate) 
  : new Date();
    const daysInFarm = Math.max(1, Math.floor((loadOutDate.getTime() - loadInDate.getTime()) / (1000 * 60 * 60 * 24)));
console.log('load in date:', loadInDate);
console.log('load out date:', loadOutDate);
    // Calculate total expense per day
    const totalExpense = record.LoadInPrice ? parseFloat(record.LoadInPrice.toString()) : 0;
    console.log('total expense sa :', totalExpense);
    const expensePerDay = totalExpense / daysInFarm;
console.log('expense per day:', expensePerDay.toString());
    // Calculate total expense based on days in farm
    return daysInFarm * expensePerDay;
  };

const calculateStats = async () => {
  const newStats: ReportStats = {
    totalExpense: 0,
    totalSale: 0,
    profit: 0,
    loss: 0,
    collectionNames: [],
    collections: {},
    animals: {}
  };

  try {
    // Get all monthly expenses and organize by collection
    const monthlyExpenses = await getMonthlyExpenses();
    const collectionExpenses: Record<string, number> = {};
    
    monthlyExpenses.forEach(expense => {
      expense.tags.forEach((tag: string) => {
        if (!collectionExpenses[tag]) {
          collectionExpenses[tag] = 0;
        }
        collectionExpenses[tag] += expense.amount;
      });
    });

    // Process each record
    records.forEach(record => {
      if (record.recordType !== 'load') return;
      
      const loadInPrice = record.LoadInPrice || 0; // This is ET (Expected/Taken Expense)
      let actualExpense = 0; // This is E (Actual Expense)
      
      // Calculate actual expense for this animal's collections
      record.collectionNames.forEach(collectionName => {
        actualExpense += collectionExpenses[collectionName] || 0;
      });

      // Calculate profit/loss for this animal
      const profitOrLoss = loadInPrice - actualExpense;
      const profit = profitOrLoss > 0 ? profitOrLoss : 0;
      const loss = profitOrLoss < 0 ? Math.abs(profitOrLoss) : 0;

      // Update collection stats
      record.collectionNames.forEach(collectionName => {
        if (!newStats.collections[collectionName]) {
          newStats.collections[collectionName] = {
            totalExpense: 0,
            totalSale: 0,
            profit: 0,
            loss: 0,
            animalCount: 0,
            animals: []
          };
        }

        const collection = newStats.collections[collectionName];
        collection.totalExpense += actualExpense;
        collection.totalSale += loadInPrice;
        collection.profit += profit;
        collection.loss += loss;
        collection.animalCount += 1;
        collection.animals.push({
          animalNumber: record.animalNumber,
          profit,
          loss
        });
      });

      // Update overall stats
      newStats.totalExpense += actualExpense;
      newStats.totalSale += loadInPrice;
      newStats.profit += profit;
      newStats.loss += loss;

      // Store individual animal stats
      newStats.animals[record.id] = {
        totalExpense: actualExpense,
        salePrice: loadInPrice,
        profit,
        loss,
        status: record.status
      };
    });

    setStats(newStats);
  } catch (error) {
    console.error('Error calculating stats:', error);
    Alert.alert('Error', 'Failed to calculate statistics');
  }
};

const getDaysDifference = (
  loadInDate: any,
  loadOutDate: any
): number | null => {
  console.log('Getting days difference...');
  console.log('Load In Date:', loadInDate);
  console.log('Load Out Date:', loadOutDate);

  if (!loadInDate || !loadOutDate) {
    console.warn('❌ One or both dates are null or undefined.');
    return null;
  }

  // Convert Firestore Timestamp to JS Date
  const start = loadInDate.toDate ? loadInDate.toDate() : new Date(loadInDate);
  const end = loadOutDate.toDate ? loadOutDate.toDate() : new Date(loadOutDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.warn('❌ Invalid date(s) provided.');
    return null;
  }

  const diffMilliseconds = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMilliseconds / (1000 * 60 * 60 * 24));

  console.log('✅ Days Difference:', diffDays);
  return diffDays;
};



  const formatCurrency = (amount: number) => {
    return `₹${Math.abs(amount).toFixed(2)}`;
  };

  // Prepare data for overall profit/loss pie chart
  const getProfitLossChartData = () => {
    const profitLossData = [
      {
        name: 'Profit',
        value: stats.profit,
        color: '#4CAF50',
        legendFontColor: '#4CAF50',
        legendFontSize: 12
      },
      {
        name: 'Loss',
        value: stats.loss,
        color: '#F44336',
        legendFontColor: '#F44336',
        legendFontSize: 12
      }
    ];
    
    // Filter out zero values
    return profitLossData.filter(item => item.value > 0);
  };

  // Prepare data for collection-wise bar chart
  const getCollectionChartData = () => {
    const collectionData = Object.entries(stats.collections).map(([name, data]) => ({
      name,
      profit: data.profit || 0,
      loss: data.loss || 0
    }));

    return {
      labels: collectionData.map(item => item.name),
      datasets: [{
        data: collectionData.map(item => item.profit - item.loss),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2
      }],
      legend: ['Net Profit/Loss']
    };
  };

  // Prepare data for animal-wise visualization
  const getAnimalChartData = () => {
    const animalData = Object.entries(stats.collections)
      .flatMap(([_, data]) => data.animals || [])
      .map(animal => ({
        name: animal.animalNumber,
        profit: animal.profit || 0,
        loss: animal.loss || 0
      }));

    if (animalData.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [0],
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 2
        }],
        legend: ['No Data']
      };
    }

    return {
      labels: animalData.map(item => item.name),
      datasets: [{
        data: animalData.map(item => item.profit - item.loss),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2
      }],
      legend: ['Net Profit/Loss']
    };
  };

  interface DayWiseStats {
    days: number;
    totalExpense: number;
    totalSale: number;
    profit: number;
    loss: number;
    animalCount: number;
  }

const getDayWiseData = (): DayWiseStats[] => {
  const dayWiseData: Record<number, DayWiseStats> = {};

  records.forEach(record => {
    if (!record.loadInDate || !record.loadOutDate) return;

    const loadInDate = record.loadInDate.toDate();
    const loadOutDate = record.loadOutDate.toDate();
    const totalDays = Math.floor((loadOutDate.getTime() - loadInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate daily values
    const dailyExpense = (record.LoadInPrice || 0) / totalDays;
    let actualDailyExpense = 0;
    
    // Calculate actual daily expense from collections
    record.collectionNames.forEach(name => {
      const collectionExpense = stats.collections[name]?.totalExpense || 0;
      actualDailyExpense += collectionExpense / totalDays;
    });

    // Create entry for each day this animal was in farm
    for (let day = 1; day <= totalDays; day++) {
      if (!dayWiseData[day]) {
        dayWiseData[day] = {
          days: day,
          totalExpense: 0,
          totalSale: 0,
          profit: 0,
          loss: 0,
          animalCount: 0
        };
      }

      const profitOrLoss = dailyExpense - actualDailyExpense;
      
      dayWiseData[day].totalExpense += actualDailyExpense;
      dayWiseData[day].totalSale += dailyExpense;
      dayWiseData[day].animalCount += 1;
      
      if (profitOrLoss > 0) {
        dayWiseData[day].profit += profitOrLoss;
      } else {
        dayWiseData[day].loss += Math.abs(profitOrLoss);
      }
    }
  });

  // Convert to array and sort by day
  return Object.values(dayWiseData).sort((a, b) => a.days - b.days);
};

  const renderDayWiseStats = () => {
    const dayWiseData = getDayWiseData();
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar" size={20} color={Colors.light.tint} />
          <Text style={styles.sectionTitle}>Day-wise Statistics</Text>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.dayWiseContainer}>
            {dayWiseData.map((data, index) => (
              <View key={index} style={styles.dayWiseCard}>
                <Text style={styles.dayWiseTitle}>Day {data.days}</Text>
                <View style={styles.dayWiseStats}>
                  <View style={styles.dayWiseStat}>
                    <Text style={styles.dayWiseLabel}>Animals</Text>
                    <Text style={styles.dayWiseValue}>{data.animalCount}</Text>
                  </View>
                  <View style={styles.dayWiseStat}>
                    <Text style={styles.dayWiseLabel}>Expense</Text>
                    <Text style={styles.dayWiseValue}>{formatCurrency(data.totalExpense)}</Text>
                  </View>
                  <View style={styles.dayWiseStat}>
                    <Text style={styles.dayWiseLabel}>Load In / Load Out</Text>
                    <Text style={styles.dayWiseValue}>{formatCurrency(data.totalSale)}</Text>
                  </View>
                  <View style={styles.dayWiseStat}>
                    <Text style={styles.dayWiseLabel}>Profit</Text>
                    <Text style={[styles.dayWiseValue, styles.profitText]}>{formatCurrency(data.profit)}</Text>
                  </View>
                  <View style={styles.dayWiseStat}>
                    <Text style={styles.dayWiseLabel}>Loss</Text>
                    <Text style={[styles.dayWiseValue, styles.lossText]}>{formatCurrency(data.loss)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderCollectionStats = () => {
    return Object.entries(stats.collections).map(([name, data]) => (
      <View key={name} style={styles.collectionCard}>
        <Text style={styles.collectionName}>{name}</Text>
        <View style={styles.divider} />
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Expense</Text>
            <Text style={styles.statValue}>{formatCurrency(data.totalExpense)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Load In / Load Out</Text>
            <Text style={styles.statValue}>{formatCurrency(data.totalSale)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Profit</Text>
            <Text style={[styles.statValue, styles.profitText]}>{formatCurrency(data.profit)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Loss</Text>
            <Text style={[styles.statValue, styles.lossText]}>{formatCurrency(data.loss)}</Text>
          </View>
        </View>
        <View style={styles.animalCountContainer}>
          <Ionicons name="paw" size={16} color="#666" />
          <Text style={styles.animalCountText}>{data.animalCount} Animals</Text>
        </View>
      </View>
    ));
  };

  const renderAnimalStats = () => {
    return Object.entries(stats.animals).map(([id, data]) => {
      const record = records.find(r => r.id === id);
      return (
        <View key={id} style={styles.animalCard}>
          <View style={styles.animalHeader}>
            <Text style={styles.animalName}>ID: {record?.animalNumber}</Text>
            <View style={[
              styles.statusBadge, 
              data.status === 'sold' ? styles.soldBadge : styles.unsoldBadge
            ]}>
              <Text style={styles.statusText}>{data.status}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Expense</Text>
              <Text style={styles.statValue}>{formatCurrency(data.totalExpense)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Load In / Out Price</Text>
              <Text style={styles.statValue}>{formatCurrency(data.salePrice)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Profit/Loss</Text>
              {data.status === 'loaded out' && (
              <Text style={[
                styles.statValue, 
                data.salePrice > data.totalExpense ? styles.profitText : styles.lossText
              ]}>
                {formatCurrency(Math.abs(data.salePrice - data.totalExpense))}
                {' '}
                {data.salePrice > data.totalExpense ? '(Profit)' : '(Loss)'}
              </Text>
              )}
              {data.status !== 'loaded out' && (
              <Text style={styles.statValue}>Pending</Text>
              )}
            </View>
          </View>
        </View>
      );
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="stats-chart" size={24} color={Colors.light.tint} />
          <Text style={styles.title}>Farm Reports</Text>
        </View>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.selectedPeriod]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.selectedPeriodText]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'year' && styles.selectedPeriod]}
            onPress={() => setSelectedPeriod('year')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'year' && styles.selectedPeriodText]}>Year</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'all' && styles.selectedPeriod]}
            onPress={() => setSelectedPeriod('all')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'all' && styles.selectedPeriodText]}>All Time</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderDayWiseStats()}
        <View style={styles.overallStats}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={20} color={Colors.light.tint} />
            <Text style={styles.sectionTitle}>Overall Statistics</Text>
          </View>
          <View style={styles.statsCard}>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Total Expense</Text>
                <Text style={styles.statBoxValue}>{formatCurrency(stats.totalExpense)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Load In / Load Out</Text>
                <Text style={styles.statBoxValue}>{formatCurrency(stats.totalSale)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Total Profit</Text>
                <Text style={[styles.statBoxValue, styles.profitText]}>{formatCurrency(stats.profit)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Total Loss</Text>
                <Text style={[styles.statBoxValue, styles.lossText]}>{formatCurrency(stats.loss)}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.netResultContainer}>
              <Text style={styles.netResultLabel}>Net Result:</Text>
              {stats.profit - stats.loss >= 0 ? (
                <Text style={[styles.netResultValue, styles.profitText]}>
                  {formatCurrency(stats.profit - stats.loss)} (Profit)
                </Text>
              ) : (
                <Text style={[styles.netResultValue, styles.lossText]}>
                  {formatCurrency(stats.loss - stats.profit)} (Loss)
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.collectionsStats}>
          <View style={styles.sectionHeader}>
            <Ionicons name="folder-open" size={20} color={Colors.light.tint} />
            <Text style={styles.sectionTitle}>Collection Statistics</Text>
          </View>
          {renderCollectionStats()}
        </View>

        <View style={styles.animalsStats}>
          <View style={styles.sectionHeader}>
            <Ionicons name="paw" size={20} color={Colors.light.tint} />
            <Text style={styles.sectionTitle}>Animal Statistics</Text>
          </View>
          {renderAnimalStats()}
        </View>
        
        {/* Adding some bottom padding for better scrolling experience */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333333',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555555',
  },
  selectedPeriod: {
    backgroundColor: Colors.light.tint,
  },
  selectedPeriodText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  overallStats: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333333',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  statBox: {
    width: '50%',
    padding: 8,
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 12,
  },
  netResultContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  netResultLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 8,
  },
  netResultValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  collectionsStats: {
    marginBottom: 24,
  },
  collectionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  collectionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    paddingVertical: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  animalCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  animalCountText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666666',
  },
  animalsStats: {
    marginBottom: 24,
  },
  animalCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  animalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  animalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  soldBadge: {
    backgroundColor: '#E8F5E9',
  },
  unsoldBadge: {
    backgroundColor: '#FFF8E1',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  profitText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  lossText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center'
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333333'
  },
  bottomPadding: {
    height: 24
  },
  dayWiseContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  dayWiseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayWiseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  dayWiseStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayWiseStat: {
    width: '50%',
    marginBottom: 12,
  },
  dayWiseLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  dayWiseValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  section: {
    marginBottom: 24,
  }
});
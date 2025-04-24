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
import { getAllAnimalRecords, getMonthlyExpenses, AnimalRecord, MonthlyExpense } from '../../firebase/firestore';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';

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
  collections: Record<string, CollectionStats>;
  animals: Record<string, {
    totalExpense: number;
    salePrice: number;
    profit: number;
    loss: number;
    status: string;
  }>;
}

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AnimalRecord[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalExpense: 0,
    totalSale: 0,
    profit: 0,
    loss: 0,
    collections: {},
    animals: {}
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
      const allRecords = await getAllAnimalRecords();
      setRecords(allRecords);
    } catch (error) {
      console.error('Error loading records:', error);
      Alert.alert('Error', 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    const newStats: ReportStats = {
      totalExpense: 0,
      totalSale: 0,
      profit: 0,
      loss: 0,
      collections: {},
      animals: {}
    };

    try {
      // Get all monthly expenses
      const monthlyExpenses = await getMonthlyExpenses();

      records.forEach(record => {
        // Calculate total expenses for the animal
        const animalExpenses = Object.values(record.expenses || {}).reduce((sum: number, expense) => sum + (expense as {amount: number}).amount, 0);
        const totalExpense = record.purchasePrice + animalExpenses;
        const salePrice = record.sellingPrice || 0;

        // Calculate profit/loss for the animal only if it's sold
        let profit = 0;
        let loss = 0;

        if (record.status === 'sold') {
          // Find matching expenses based on collection tags
          const matchingExpenses = monthlyExpenses.filter(expense => {
            return expense.tags && record.collectionNames.some(collectionName => 
              expense.tags.includes(collectionName)
            );
          });

          // Add matching expenses to total expense
          const matchingExpensesTotal = matchingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
          const totalExpenseWithMatching = totalExpense + matchingExpensesTotal;

          // Calculate profit/loss
          profit = salePrice > totalExpenseWithMatching ? salePrice - totalExpenseWithMatching : 0;
          loss = salePrice < totalExpenseWithMatching ? totalExpenseWithMatching - salePrice : 0;
        }

        // Update animal stats
        newStats.animals[record.id] = {
          totalExpense,
          salePrice,
          profit,
          loss,
          status: record.status || 'unsold'
        };

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
          collection.totalExpense += totalExpense;
          collection.totalSale += salePrice;
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
        newStats.totalExpense += totalExpense;
        newStats.totalSale += salePrice;
        newStats.profit += profit;
        newStats.loss += loss;
      });

      setStats(newStats);
    } catch (error) {
      console.error('Error calculating stats:', error);
      Alert.alert('Error', 'Failed to calculate statistics');
    }
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
            <Text style={styles.statLabel}>Total Sale</Text>
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
              <Text style={styles.statLabel}>Sale Price</Text>
              <Text style={styles.statValue}>{formatCurrency(data.salePrice)}</Text>
            </View>
            {data.status === 'sold' && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{data.profit > 0 ? 'Profit' : 'Loss'}</Text>
                {data.profit > 0 ? (
                  <Text style={[styles.statValue, styles.profitText]}>{formatCurrency(data.profit)}</Text>
                ) : (
                  <Text style={[styles.statValue, styles.lossText]}>{formatCurrency(data.loss)}</Text>
                )}
              </View>
            )}
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
                <Text style={styles.statBoxLabel}>Total Sale</Text>
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

          {getProfitLossChartData().length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Profit vs Loss</Text>
              <PieChart
                data={getProfitLossChartData()}
                width={screenWidth - 48}
                height={200}
                chartConfig={chartConfig}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          )}
        </View>

        <View style={styles.collectionsStats}>
          <View style={styles.sectionHeader}>
            <Ionicons name="folder-open" size={20} color={Colors.light.tint} />
            <Text style={styles.sectionTitle}>Collection Statistics</Text>
          </View>
          
          {Object.keys(stats.collections).length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Collection Performance</Text>
              <BarChart
                data={getCollectionChartData()}
                width={screenWidth - 48}
                height={220}
                yAxisLabel="₹"
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  barPercentage: 0.5,
                }}
                verticalLabelRotation={30}
                fromZero={true}
              />
            </View>
          )}
          
          {renderCollectionStats()}
        </View>

        <View style={styles.animalsStats}>
          <View style={styles.sectionHeader}>
            <Ionicons name="paw" size={20} color={Colors.light.tint} />
            <Text style={styles.sectionTitle}>Animal Statistics</Text>
          </View>
          
          {getAnimalChartData() && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Animal Profit/Loss</Text>
              <LineChart
                data={getAnimalChartData()}
                width={screenWidth - 48}
                height={220}
                yAxisLabel="₹"
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                verticalLabelRotation={30}
                fromZero={true}
              />
            </View>
          )}
          
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
  }
});
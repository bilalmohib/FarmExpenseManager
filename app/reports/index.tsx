import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { getAllAnimalRecords, getMonthlyExpenses, AnimalRecord, MonthlyExpense } from '../../firebase/firestore';

// Temporary Chart Components
// In a real implementation, you would use a library like react-native-chart-kit
const PieChart = ({ data, colors }: { data: { value: number, label: string }[], colors: string[] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const getPercentage = (value: number) => (value / total) * 100;
  
  return (
    <View style={styles.chartContainer}>
      <View style={styles.pieContainer}>
        <View style={styles.pie}>
          {data.map((item, index) => {
            const angle = getPercentage(item.value) * 3.6; // 360 degrees = 100%
            return (
              <View 
                key={index}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  transform: [{ rotate: `${index === 0 ? 0 : data.slice(0, index).reduce((sum, i) => sum + getPercentage(i.value) * 3.6, 0)}deg` }],
                }}
              >
                <View 
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: 100,
                    backgroundColor: colors[index % colors.length],
                    clip: 'rect(0, 100px, 100px, 50px)',
                    transform: [{ rotate: `${Math.min(angle, 180)}deg` }]
                  }}
                />
                {angle > 180 && (
                  <View 
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      borderRadius: 100,
                      backgroundColor: colors[index % colors.length],
                      clip: 'rect(0, 50px, 100px, 0)',
                      transform: [{ rotate: `${180}deg` }, { rotate: `${Math.min(angle - 180, 180)}deg` }]
                    }}
                  />
                )}
              </View>
            );
          })}
          <View style={styles.pieCenter} />
        </View>
      </View>
      
      <View style={styles.chartLegend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendMarker, { backgroundColor: colors[index % colors.length] }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
            <Text style={styles.legendValue}>{item.value.toFixed(2)}</Text>
            <Text style={styles.legendPercentage}>({getPercentage(item.value).toFixed(1)}%)</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const BarChart = ({ data, color }: { data: { value: number, label: string }[], color: string }) => {
  const maxValue = Math.max(...data.map(item => item.value)) * 1.1;
  
  return (
    <View style={styles.chartContainer}>
      <View style={styles.barChartContainer}>
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 150;
          return (
            <View key={index} style={styles.barColumn}>
              <Text style={styles.barValue}>{item.value.toFixed(0)}</Text>
              <View style={[styles.bar, { height, backgroundColor: color }]} />
              <Text style={styles.barLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [records, setRecords] = useState<AnimalRecord[]>([]);
  const [expenses, setExpenses] = useState<MonthlyExpense[]>([]);
  const [stats, setStats] = useState({
    totalProfit: 0,
    totalLoss: 0,
    netProfitLoss: 0,
    collectionStats: [] as Array<{
      collection: string;
      count: number;
      profit: number;
      loss: number;
      netProfitLoss: number;
    }>,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [records, expenses, period]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load animal records
      const allRecords = await getAllAnimalRecords();
      setRecords(allRecords);
      
      // Load monthly expenses
      const allExpenses = await getMonthlyExpenses();
      setExpenses(allExpenses);
    } catch (error) {
      console.error('Error loading report data:', error);
      Alert.alert('Error', 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!records.length) return;
    
    // Filter records by period
    const filteredRecords = filterRecordsByPeriod(records);
    
    // Filter expenses by period
    const filteredExpenses = filterExpensesByPeriod(expenses);
    
    // Calculate total profit and loss
    const totalProfit = filteredRecords.reduce((sum, record) => sum + (record.profit || 0), 0);
    const totalLoss = filteredRecords.reduce((sum, record) => sum + (record.loss || 0), 0) 
      + filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Get unique collections
    const collections = Array.from(new Set(filteredRecords.map(record => record.collectionName)));
    
    // Calculate stats for each collection
    const collectionStats = collections.map(collection => {
      const collectionRecords = filteredRecords.filter(record => record.collectionName === collection);
      const count = collectionRecords.length;
      const profit = collectionRecords.reduce((sum, record) => sum + (record.profit || 0), 0);
      const loss = collectionRecords.reduce((sum, record) => sum + (record.loss || 0), 0);
      
      return {
        collection,
        count,
        profit,
        loss,
        netProfitLoss: profit - loss
      };
    });
    
    // Sort collections by profit (desc)
    collectionStats.sort((a, b) => b.netProfitLoss - a.netProfitLoss);
    
    setStats({
      totalProfit,
      totalLoss,
      netProfitLoss: totalProfit - totalLoss,
      collectionStats
    });
  };

  const filterRecordsByPeriod = (records: AnimalRecord[]) => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    return records.filter(record => {
      const recordDate = new Date(record.purchaseDate);
      
      if (period === 'month') {
        return recordDate.getMonth() === thisMonth && recordDate.getFullYear() === thisYear;
      } else if (period === 'year') {
        return recordDate.getFullYear() === thisYear;
      }
      
      return true; // 'all' period
    });
  };

  const filterExpensesByPeriod = (expenses: MonthlyExpense[]) => {
    const now = new Date();
    const thisMonth = now.getMonth() + 1; // Month is 1-indexed in our data
    const thisYear = now.getFullYear();
    
    return expenses.filter(expense => {
      if (period === 'month') {
        return expense.month === thisMonth && expense.year === thisYear;
      } else if (period === 'year') {
        return expense.year === thisYear;
      }
      
      return true; // 'all' period
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const getChartData = () => {
    const chartColors = ['#4CAF50', '#FFC107', '#2196F3', '#9C27B0', '#F44336'];
    
    // Collection profit/loss data for pie chart
    const pieData = stats.collectionStats.map(stat => ({
      label: stat.collection,
      value: Math.abs(stat.netProfitLoss)
    }));
    
    // Bar chart data
    const barData = stats.collectionStats.map(stat => ({
      label: stat.collection,
      value: stat.count
    }));
    
    return {
      pieData,
      pieColors: chartColors,
      barData,
      barColor: Colors.light.tint
    };
  };

  const handleExport = () => {
    // In a real implementation, this would export the report
    Alert.alert('Export', 'This feature is not implemented yet');
  };

  const renderPeriodSelector = () => {
    return (
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodButton, period === 'month' && styles.activePeriodButton]}
          onPress={() => setPeriod('month')}
        >
          <Text style={[styles.periodText, period === 'month' && styles.activePeriodText]}>
            This Month
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.periodButton, period === 'year' && styles.activePeriodButton]}
          onPress={() => setPeriod('year')}
        >
          <Text style={[styles.periodText, period === 'year' && styles.activePeriodText]}>
            This Year
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.periodButton, period === 'all' && styles.activePeriodButton]}
          onPress={() => setPeriod('all')}
        >
          <Text style={[styles.periodText, period === 'all' && styles.activePeriodText]}>
            All Time
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const { pieData, pieColors, barData, barColor } = getChartData();

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Generating reports...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {renderPeriodSelector()}
          
          <View style={styles.summaryCards}>
            <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.summaryLabel}>Total Profit</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                {formatCurrency(stats.totalProfit)}
              </Text>
            </View>
            
            <View style={[styles.summaryCard, { backgroundColor: '#FFEBEE' }]}>
              <Text style={styles.summaryLabel}>Total Loss</Text>
              <Text style={[styles.summaryValue, { color: '#F44336' }]}>
                {formatCurrency(stats.totalLoss)}
              </Text>
            </View>
            
            <View style={[styles.summaryCard, { 
              backgroundColor: stats.netProfitLoss >= 0 ? '#E8F5E9' : '#FFEBEE' 
            }]}>
              <Text style={styles.summaryLabel}>Net Profit/Loss</Text>
              <Text style={[styles.summaryValue, { 
                color: stats.netProfitLoss >= 0 ? '#4CAF50' : '#F44336' 
              }]}>
                {formatCurrency(Math.abs(stats.netProfitLoss))}
              </Text>
            </View>
          </View>
          
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Profit/Loss Breakdown</Text>
            {pieData.length > 0 ? (
              <PieChart data={pieData} colors={pieColors} />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No profit/loss data available</Text>
              </View>
            )}
          </View>
          
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Animal Count by Collection</Text>
            {barData.length > 0 ? (
              <BarChart data={barData} color={barColor} />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No animal data available</Text>
              </View>
            )}
          </View>
          
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Collection Performance</Text>
            {stats.collectionStats.length > 0 ? (
              <View style={styles.collectionListContainer}>
                {stats.collectionStats.map((stat, index) => (
                  <View key={index} style={styles.collectionItem}>
                    <View style={styles.collectionHeader}>
                      <Text style={styles.collectionName}>{stat.collection}</Text>
                      <Text style={styles.collectionCount}>{stat.count} animals</Text>
                    </View>
                    
                    <View style={styles.collectionStats}>
                      <View style={styles.statColumn}>
                        <Text style={styles.statLabel}>Profit</Text>
                        <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                          {formatCurrency(stat.profit)}
                        </Text>
                      </View>
                      
                      <View style={styles.statColumn}>
                        <Text style={styles.statLabel}>Loss</Text>
                        <Text style={[styles.statValue, { color: '#F44336' }]}>
                          {formatCurrency(stat.loss)}
                        </Text>
                      </View>
                      
                      <View style={styles.statColumn}>
                        <Text style={styles.statLabel}>Net</Text>
                        <Text style={[styles.statValue, { 
                          color: stat.netProfitLoss >= 0 ? '#4CAF50' : '#F44336' 
                        }]}>
                          {formatCurrency(Math.abs(stat.netProfitLoss))}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No collection data available</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
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
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: Colors.light.tint,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activePeriodText: {
    color: '#FFFFFF',
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryCard: {
    width: '32%',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  pieContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pie: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F5F5F5',
  },
  pieCenter: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  chartLegend: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 8,
  },
  legendPercentage: {
    fontSize: 12,
    color: '#666',
    width: 50,
    textAlign: 'right',
  },
  barChartContainer: {
    flexDirection: 'row',
    height: 200,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 10,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: '70%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  barValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  noDataContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
  },
  collectionListContainer: {
    marginBottom: 10,
  },
  collectionItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingVertical: 10,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  collectionName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  collectionCount: {
    fontSize: 14,
    color: '#666',
  },
  collectionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 

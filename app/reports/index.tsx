import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { getAllAnimalRecords, getAllMonthlyExpenses } from '../../firebase/firestore';
import { AnimalRecord, MonthlyExpense } from '../../firebase/firestore';

// Mock components for charts (you can replace with actual chart libraries)
const PieChart = ({ data }: { data: any[] }) => (
  <View style={styles.chartContainer}>
    <View style={styles.chartPlaceholder}>
      <Text style={styles.chartPlaceholderText}>Profit/Loss Distribution</Text>
      {data.map((item, index) => (
        <View key={index} style={styles.chartLegendItem}>
          <View 
            style={[
              styles.chartLegendColor, 
              { backgroundColor: item.color }
            ]} 
          />
          <Text style={styles.chartLegendText}>{item.name}: {item.value}</Text>
        </View>
      ))}
    </View>
  </View>
);

const BarChart = ({ data }: { data: any[] }) => (
  <View style={styles.chartContainer}>
    <View style={styles.chartPlaceholder}>
      <Text style={styles.chartPlaceholderText}>Collection Performance</Text>
      {data.map((item, index) => (
        <View key={index} style={styles.chartBarContainer}>
          <Text style={styles.chartBarLabel}>{item.name}</Text>
          <View style={styles.chartBarWrapper}>
            <View 
              style={[
                styles.chartBar, 
                { 
                  width: `${Math.min(Math.abs(item.percentage), 100)}%`,
                  backgroundColor: item.value >= 0 ? '#4CAF50' : '#F44336'
                }
              ]} 
            />
          </View>
          <Text style={styles.chartBarValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  </View>
);

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month'); // 'month', 'year', 'all'
  const [records, setRecords] = useState<AnimalRecord[]>([]);
  const [expenses, setExpenses] = useState<MonthlyExpense[]>([]);
  const [stats, setStats] = useState({
    totalProfit: 0,
    totalLoss: 0,
    netProfitLoss: 0,
    collectionStats: [] as {
      collection: string;
      profit: number;
      loss: number;
      net: number;
      count: number;
      soldCount: number;
    }[],
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (records.length > 0 || expenses.length > 0) {
      calculateStats();
    }
  }, [records, expenses, period]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedRecords, fetchedExpenses] = await Promise.all([
        getAllAnimalRecords(),
        getAllMonthlyExpenses(),
      ]);
      
      setRecords(fetchedRecords);
      setExpenses(fetchedExpenses);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateStats = () => {
    // Filter records by period
    const filteredRecords = filterRecordsByPeriod(records);
    const filteredExpenses = filterExpensesByPeriod(expenses);
    
    // Calculate total profit and loss
    let totalProfit = 0;
    let totalLoss = 0;
    
    // Get unique collections
    const collections = new Set(filteredRecords.map(record => record.collectionName));
    const collectionStats = Array.from(collections).map(collection => {
      const collectionRecords = filteredRecords.filter(
        record => record.collectionName === collection
      );
      
      let collectionProfit = 0;
      let collectionLoss = 0;
      let soldCount = 0;
      
      collectionRecords.forEach(record => {
        if (record.soldDate) {
          soldCount++;
          const profit = record.sellingPrice - record.purchasePrice;
          if (profit >= 0) {
            collectionProfit += profit;
            totalProfit += profit;
          } else {
            collectionLoss += Math.abs(profit);
            totalLoss += Math.abs(profit);
          }
        }
      });
      
      return {
        collection,
        profit: collectionProfit,
        loss: collectionLoss,
        net: collectionProfit - collectionLoss,
        count: collectionRecords.length,
        soldCount,
      };
    });
    
    // Add expenses to total loss
    const totalExpenses = filteredExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    totalLoss += totalExpenses;
    
    // Calculate net profit/loss
    const netProfitLoss = totalProfit - totalLoss;
    
    // Sort collections by net profit/loss
    collectionStats.sort((a, b) => b.net - a.net);
    
    setStats({
      totalProfit,
      totalLoss,
      netProfitLoss,
      collectionStats,
    });
  };
  
  const filterRecordsByPeriod = (records: AnimalRecord[]) => {
    if (period === 'all') return records;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return records.filter(record => {
      if (!record.soldDate) return false;
      
      const soldDate = new Date(record.soldDate);
      
      if (period === 'month') {
        return (
          soldDate.getMonth() === currentMonth &&
          soldDate.getFullYear() === currentYear
        );
      } else if (period === 'year') {
        return soldDate.getFullYear() === currentYear;
      }
      
      return true;
    });
  };
  
  const filterExpensesByPeriod = (expenses: MonthlyExpense[]) => {
    if (period === 'all') return expenses;
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed
    const currentYear = now.getFullYear();
    
    return expenses.filter(expense => {
      if (period === 'month') {
        return expense.month === currentMonth && expense.year === currentYear;
      } else if (period === 'year') {
        return expense.year === currentYear;
      }
      
      return true;
    });
  };
  
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };
  
  const getPieChartData = () => {
    const { totalProfit, totalLoss } = stats;
    
    return [
      { name: 'Profit', value: formatCurrency(totalProfit), color: '#4CAF50' },
      { name: 'Loss', value: formatCurrency(totalLoss), color: '#F44336' },
    ];
  };
  
  const getBarChartData = () => {
    return stats.collectionStats.map(stat => {
      // Calculate a percentage for visualization
      const maxValue = Math.max(
        ...stats.collectionStats.map(s => Math.abs(s.net))
      );
      const percentage = maxValue > 0 ? (stat.net / maxValue) * 100 : 0;
      
      return {
        name: stat.collection,
        value: formatCurrency(stat.net),
        percentage,
      };
    });
  };
  
  const getPeriodLabel = () => {
    const now = new Date();
    const monthName = now.toLocaleString('default', { month: 'long' });
    
    if (period === 'month') return `${monthName} ${now.getFullYear()}`;
    if (period === 'year') return now.getFullYear().toString();
    return 'All Time';
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
      </View>
      
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodOption, period === 'month' && styles.selectedPeriod]}
          onPress={() => setPeriod('month')}
        >
          <Text 
            style={[
              styles.periodText, 
              period === 'month' && styles.selectedPeriodText
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.periodOption, period === 'year' && styles.selectedPeriod]}
          onPress={() => setPeriod('year')}
        >
          <Text 
            style={[
              styles.periodText, 
              period === 'year' && styles.selectedPeriodText
            ]}
          >
            Year
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.periodOption, period === 'all' && styles.selectedPeriod]}
          onPress={() => setPeriod('all')}
        >
          <Text 
            style={[
              styles.periodText, 
              period === 'all' && styles.selectedPeriodText
            ]}
          >
            All Time
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.periodLabel}>{getPeriodLabel()}</Text>
        
        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, styles.profitCard]}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="arrow-up" size={24} color="#4CAF50" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Total Profit</Text>
              <Text style={[styles.summaryValue, styles.profitValue]}>
                {formatCurrency(stats.totalProfit)}
              </Text>
            </View>
          </View>
          
          <View style={[styles.summaryCard, styles.lossCard]}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="arrow-down" size={24} color="#F44336" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Total Loss</Text>
              <Text style={[styles.summaryValue, styles.lossValue]}>
                {formatCurrency(stats.totalLoss)}
              </Text>
            </View>
          </View>
          
          <View 
            style={[
              styles.summaryCard, 
              styles.netCard,
              stats.netProfitLoss >= 0 ? styles.profitCard : styles.lossCard
            ]}
          >
            <View style={styles.summaryIconContainer}>
              <Ionicons 
                name={stats.netProfitLoss >= 0 ? "trending-up" : "trending-down"} 
                size={24} 
                color={stats.netProfitLoss >= 0 ? "#4CAF50" : "#F44336"} 
              />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Net Profit/Loss</Text>
              <Text 
                style={[
                  styles.summaryValue, 
                  stats.netProfitLoss >= 0 ? styles.profitValue : styles.lossValue
                ]}
              >
                {formatCurrency(stats.netProfitLoss)}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Charts */}
        <Text style={styles.sectionTitle}>Analysis</Text>
        
        {stats.totalProfit === 0 && stats.totalLoss === 0 ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="analytics" size={50} color="#ccc" />
            <Text style={styles.noDataText}>
              No profit/loss data available for this period.
            </Text>
          </View>
        ) : (
          <>
            <PieChart data={getPieChartData()} />
            {stats.collectionStats.length > 0 && (
              <BarChart data={getBarChartData()} />
            )}
          </>
        )}
        
        {/* Collection Stats */}
        {stats.collectionStats.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Collection Performance</Text>
            
            {stats.collectionStats.map((stat, index) => (
              <View key={index} style={styles.collectionCard}>
                <View style={styles.collectionHeader}>
                  <Text style={styles.collectionName}>{stat.collection}</Text>
                  <Text 
                    style={[
                      styles.collectionNet,
                      stat.net >= 0 ? styles.profitValue : styles.lossValue
                    ]}
                  >
                    {formatCurrency(stat.net)}
                  </Text>
                </View>
                
                <View style={styles.collectionDetails}>
                  <View style={styles.collectionDetail}>
                    <Text style={styles.detailLabel}>Total Animals</Text>
                    <Text style={styles.detailValue}>{stat.count}</Text>
                  </View>
                  
                  <View style={styles.collectionDetail}>
                    <Text style={styles.detailLabel}>Sold Animals</Text>
                    <Text style={styles.detailValue}>{stat.soldCount}</Text>
                  </View>
                  
                  <View style={styles.collectionDetail}>
                    <Text style={styles.detailLabel}>Profit</Text>
                    <Text style={styles.detailValue}>{formatCurrency(stat.profit)}</Text>
                  </View>
                  
                  <View style={styles.collectionDetail}>
                    <Text style={styles.detailLabel}>Loss</Text>
                    <Text style={styles.detailValue}>{formatCurrency(stat.loss)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
        
        {/* Export Options */}
        <View style={styles.exportContainer}>
          <Text style={styles.exportTitle}>Export Report</Text>
          
          <TouchableOpacity style={styles.exportButton} disabled>
            <Ionicons name="document-text-outline" size={20} color="#fff" />
            <Text style={styles.exportButtonText}>PDF</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.exportButton} disabled>
            <Ionicons name="document-outline" size={20} color="#fff" />
            <Text style={styles.exportButtonText}>CSV</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: Colors.light.tint,
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 5,
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedPeriod: {
    backgroundColor: Colors.light.tint,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  selectedPeriodText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  periodLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  summaryCards: {
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profitCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  lossCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  netCard: {
    borderLeftWidth: 4,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  profitValue: {
    color: '#4CAF50',
  },
  lossValue: {
    color: '#F44336',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 15,
    color: '#333',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartPlaceholder: {
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  chartLegendColor: {
    width: 16,
    height: 16,
    marginRight: 8,
    borderRadius: 4,
  },
  chartLegendText: {
    fontSize: 14,
    color: '#333',
  },
  chartBarContainer: {
    width: '100%',
    marginVertical: 8,
  },
  chartBarLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555',
  },
  chartBarWrapper: {
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  chartBar: {
    height: '100%',
  },
  chartBarValue: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  noDataContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
  },
  collectionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  collectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  collectionNet: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  collectionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  collectionDetail: {
    width: '50%',
    paddingVertical: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 2,
  },
  exportContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  exportButton: {
    backgroundColor: Colors.light.tint + '80', // Adding transparency
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
}); 
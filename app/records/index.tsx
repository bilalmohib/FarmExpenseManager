import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllAnimalRecords, deleteAnimalRecord, AnimalRecord } from '../../firebase/firestore';
import { Colors } from '../../constants/Colors';

export default function RecordsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<AnimalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AnimalRecord[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const filterCategory = params.filterCategory as string;

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    if (filterCategory && records.length > 0) {
      setFilters(prev => ({
        ...prev,
        category: filterCategory
      }));
      applyFilters();
    }
  }, [filterCategory, records]);

  useEffect(() => {
    applyFilters();
  }, [records, searchText, filters]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const allRecords = await getAllAnimalRecords();
      setRecords(allRecords);
    } catch (error) {
      console.error('Error getting records:', error);
      Alert.alert('Error', 'Failed to load animal records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecords();
  };

  const applyFilters = () => {
    let filtered = [...records];
    
    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(record => 
        record.category.toLowerCase() === filters.category.toLowerCase()
      );
    }
    
    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(record => 
        record.status.toLowerCase() === filters.status.toLowerCase()
      );
    }
    
    // Apply search text
    if (searchText) {
      filtered = filtered.filter(record => 
        record.name.toLowerCase().includes(searchText.toLowerCase()) ||
        record.category.toLowerCase().includes(searchText.toLowerCase()) ||
        record.id.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (filters.sortBy === 'date') {
        const dateA = new Date(a.purchaseDate).getTime();
        const dateB = new Date(b.purchaseDate).getTime();
        return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (filters.sortBy === 'price') {
        return filters.sortOrder === 'asc' 
          ? a.purchasePrice - b.purchasePrice 
          : b.purchasePrice - a.purchasePrice;
      }
      return 0;
    });
    
    setFilteredRecords(filtered);
  };

  const handleAddRecord = () => {
    router.push('/records/new');
  };

  const handleEditRecord = (recordId: string) => {
    router.push(`/records/${recordId}`);
  };

  const handleDeleteRecord = (record: AnimalRecord) => {
    Alert.alert(
      'Delete Record',
      `Are you sure you want to delete ${record.animalNumber || 'this record'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteAnimalRecord(record.id);
              loadRecords();
              Alert.alert('Success', 'Record deleted successfully');
            } catch (error) {
              console.error('Error deleting record:', error);
              Alert.alert('Error', 'Failed to delete record');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const toggleFilter = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType as keyof typeof prev] === value ? '' : value
    }));
  };

  const toggleFilterMenu = () => {
    setShowFilters(!showFilters);
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      status: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
    setSearchText('');
  };

  const getUniqueCollections = () => {
    const collections = new Set(records.map(record => record.collectionName));
    return Array.from(collections);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const renderRecord = ({ item }: { item: AnimalRecord }) => {
    const isSold = !!item.soldDate;
    const statusColor = isSold ? '#4CAF50' : '#FF9800';
    
    return (
      <View style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <Text style={styles.recordNumber}>ID: {item.animalNumber || 'N/A'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{isSold ? 'Sold' : 'Active'}</Text>
          </View>
        </View>
        
        <View style={styles.recordBody}>
          <View style={styles.recordImageContainer}>
            {item.imageUrl ? (
              <Image 
                source={{ uri: item.imageUrl }} 
                style={styles.recordImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.noImagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#CCCCCC" />
              </View>
            )}
          </View>
          
          <View style={styles.recordDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Collection:</Text>
              <Text style={styles.detailValue}>{item.collectionName}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase:</Text>
              <Text style={styles.detailValue}>
                {formatDate(item.purchaseDate)} - {formatCurrency(item.purchasePrice)}
              </Text>
            </View>
            
            {isSold && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sold:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(item.soldDate!)} - {formatCurrency(item.sellingPrice)}
                </Text>
              </View>
            )}
            
            <View style={styles.profitLossRow}>
              {item.profit > 0 ? (
                <Text style={styles.profitText}>Profit: {formatCurrency(item.profit)}</Text>
              ) : item.loss > 0 ? (
                <Text style={styles.lossText}>Loss: {formatCurrency(item.loss)}</Text>
              ) : (
                <Text>No profit/loss recorded</Text>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.recordActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditRecord(item.id)}
          >
            <Ionicons name="create-outline" size={20} color={Colors.light.tint} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteRecord(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
            <Text style={[styles.actionText, { color: '#F44336' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search records..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={toggleFilterMenu}
        >
          <Ionicons name="options-outline" size={24} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>
      
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Collection</Text>
            <View style={styles.filterOptions}>
              {getUniqueCollections().map((collection, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filterChip,
                    filters.collectionName === collection ? styles.activeFilterChip : null
                  ]}
                  onPress={() => toggleFilter('collectionName', collection)}
                >
                  <Text 
                    style={[
                      styles.filterChipText,
                      filters.collectionName === collection ? styles.activeFilterChipText : null
                    ]}
                  >
                    {collection}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filters.status === 'all' ? styles.activeFilterChip : null
                ]}
                onPress={() => setFilters(prev => ({ ...prev, status: 'all' }))}
              >
                <Text 
                  style={[
                    styles.filterChipText,
                    filters.status === 'all' ? styles.activeFilterChipText : null
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filters.status === 'active' ? styles.activeFilterChip : null
                ]}
                onPress={() => setFilters(prev => ({ ...prev, status: 'active' }))}
              >
                <Text 
                  style={[
                    styles.filterChipText,
                    filters.status === 'active' ? styles.activeFilterChipText : null
                  ]}
                >
                  Active
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filters.status === 'sold' ? styles.activeFilterChip : null
                ]}
                onPress={() => setFilters(prev => ({ ...prev, status: 'sold' }))}
              >
                <Text 
                  style={[
                    styles.filterChipText,
                    filters.status === 'sold' ? styles.activeFilterChipText : null
                  ]}
                >
                  Sold
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filters.sortBy === 'date' ? styles.activeFilterChip : null
                ]}
                onPress={() => setFilters(prev => ({ ...prev, sortBy: 'date' }))}
              >
                <Text 
                  style={[
                    styles.filterChipText,
                    filters.sortBy === 'date' ? styles.activeFilterChipText : null
                  ]}
                >
                  Date
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filters.sortBy === 'price' ? styles.activeFilterChip : null
                ]}
                onPress={() => setFilters(prev => ({ ...prev, sortBy: 'price' }))}
              >
                <Text 
                  style={[
                    styles.filterChipText,
                    filters.sortBy === 'price' ? styles.activeFilterChipText : null
                  ]}
                >
                  Price
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  { marginLeft: 'auto' }
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                }))}
              >
                <Ionicons 
                  name={filters.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
                  size={16} 
                  color={Colors.light.tint} 
                />
                <Text style={styles.filterChipText}>
                  {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetFilters}
          >
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Loading records...</Text>
        </View>
      ) : filteredRecords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="sad-outline" size={60} color="#CCCCCC" />
          <Text style={styles.emptyText}>No records found</Text>
          {(searchText || filters.collectionName || filters.status !== 'all') && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
            >
              <Text style={styles.resetButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          renderItem={renderRecord}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.recordsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.light.tint]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    marginLeft: 10,
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  filterSection: {
    marginBottom: 15,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilterChip: {
    backgroundColor: Colors.light.tint,
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  resetButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EEEEEE',
    borderRadius: 5,
    marginTop: 5,
  },
  resetButtonText: {
    color: '#666',
    fontWeight: '500',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
    marginBottom: 10,
  },
  recordsList: {
    padding: 15,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  recordNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recordBody: {
    flexDirection: 'row',
    padding: 15,
  },
  recordImageContainer: {
    width: 80,
    height: 80,
    marginRight: 15,
  },
  recordImage: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#F0F0F0',
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordDetails: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  profitLossRow: {
    marginTop: 8,
  },
  profitText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  lossText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  recordActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  deleteButton: {
    borderLeftWidth: 1,
    borderLeftColor: '#EEEEEE',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
    color: Colors.light.tint,
  },
}); 
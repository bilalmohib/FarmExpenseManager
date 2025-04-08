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
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllAnimalRecords, deleteAnimalRecord } from '../../firebase/firestore';
import { Colors } from '../../constants/Colors';
import { AnimalRecord } from '../../firebase/firestore';

export default function RecordsScreen() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AnimalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AnimalRecord[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    collectionName: '',
    showSold: true,
    showUnsold: true,
    dateRange: {
      start: null as Date | null,
      end: null as Date | null,
    }
  });
  
  const router = useRouter();

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [records, searchText, filters]);

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

  const applyFilters = () => {
    let filtered = [...records];
    
    // Apply search text filter
    if (searchText) {
      filtered = filtered.filter(record => 
        record.collectionName.toLowerCase().includes(searchText.toLowerCase()) ||
        (record.calfNames && record.calfNames.some(name => 
          name.toLowerCase().includes(searchText.toLowerCase())
        ))
      );
    }
    
    // Apply collection name filter
    if (filters.collectionName) {
      filtered = filtered.filter(record => 
        record.collectionName.toLowerCase() === filters.collectionName.toLowerCase()
      );
    }
    
    // Apply sold/unsold filter
    if (!filters.showSold) {
      filtered = filtered.filter(record => !record.saleDate);
    }
    
    if (!filters.showUnsold) {
      filtered = filtered.filter(record => record.saleDate);
    }
    
    // Apply date range filter
    if (filters.dateRange.start) {
      const startDate = filters.dateRange.start;
      filtered = filtered.filter(record => {
        const purchaseDate = new Date(record.purchaseDate);
        return purchaseDate >= startDate;
      });
    }
    
    if (filters.dateRange.end) {
      const endDate = filters.dateRange.end;
      filtered = filtered.filter(record => {
        const purchaseDate = new Date(record.purchaseDate);
        return purchaseDate <= endDate;
      });
    }
    
    setFilteredRecords(filtered);
  };

  const handleEditRecord = (recordId: string) => {
    router.push(`/records/${recordId}`);
  };

  const handleDeleteRecord = (recordId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAnimalRecord(recordId);
              setRecords(records.filter(record => record.id !== recordId));
              Alert.alert('Success', 'Record deleted successfully');
            } catch (error) {
              console.error('Error deleting record:', error);
              Alert.alert('Error', 'Failed to delete record');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '₹0.00';
    return `₹${amount.toFixed(2)}`;
  };

  const getCollectionNames = () => {
    const names = new Set<string>();
    records.forEach(record => {
      if (record.collectionName) {
        names.add(record.collectionName);
      }
    });
    return Array.from(names);
  };

  const toggleCollectionFilter = (name: string) => {
    setFilters(prev => ({
      ...prev,
      collectionName: prev.collectionName === name ? '' : name
    }));
  };

  const renderRecord = ({ item }: { item: AnimalRecord }) => {
    const isProfitable = (item.profit || 0) > 0;
    
    return (
      <View style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <View style={styles.collectionTag}>
            <Text style={styles.collectionText}>{item.collectionName}</Text>
          </View>
          
          {item.saleDate ? (
            <View style={[styles.statusTag, styles.soldTag]}>
              <Text style={styles.statusText}>Sold</Text>
            </View>
          ) : (
            <View style={[styles.statusTag, styles.activeTag]}>
              <Text style={styles.statusText}>Active</Text>
            </View>
          )}
        </View>
        
        <View style={styles.recordContent}>
          <View style={styles.recordImageContainer}>
            {item.imageURL ? (
              <Image 
                source={{ uri: item.imageURL }} 
                style={styles.recordImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.noImageContainer}>
                <Ionicons name="image-outline" size={40} color="#DDD" />
              </View>
            )}
          </View>
          
          <View style={styles.recordDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase Date:</Text>
              <Text style={styles.detailValue}>{formatDate(item.purchaseDate)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase Price:</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.purchasePrice)}</Text>
            </View>
            
            {item.saleDate && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sale Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(item.saleDate)}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sale Price:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(item.salePrice)}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {isProfitable ? 'Profit:' : 'Loss:'}
                  </Text>
                  <Text 
                    style={[
                      styles.detailValue, 
                      isProfitable ? styles.profitText : styles.lossText
                    ]}
                  >
                    {isProfitable 
                      ? formatCurrency(item.profit) 
                      : formatCurrency(item.loss)
                    }
                  </Text>
                </View>
              </>
            )}
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity:</Text>
              <Text style={styles.detailValue}>{item.bulkQuantity}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.recordActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditRecord(item.id || '')}
          >
            <Ionicons name="create-outline" size={22} color={Colors.light.tint} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteRecord(item.id || '')}
          >
            <Ionicons name="trash-outline" size={22} color="#F44336" />
            <Text style={[styles.actionText, { color: '#F44336' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Animal Records</Text>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search collections or calves..."
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
            <Ionicons 
              name="options-outline" 
              size={24} 
              color={showFilters ? Colors.light.tint : '#999'} 
            />
          </TouchableOpacity>
        </View>
        
        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filterTitle}>Filter By Collection:</Text>
            <View style={styles.collectionFilters}>
              {getCollectionNames().map(name => (
                <TouchableOpacity 
                  key={name}
                  style={[
                    styles.collectionFilterButton,
                    filters.collectionName === name && styles.activeCollectionFilter
                  ]}
                  onPress={() => toggleCollectionFilter(name)}
                >
                  <Text 
                    style={[
                      styles.collectionFilterText,
                      filters.collectionName === name && styles.activeCollectionFilterText
                    ]}
                  >
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.filterTitle}>Status:</Text>
            <View style={styles.statusFilters}>
              <TouchableOpacity 
                style={[
                  styles.statusFilterButton,
                  filters.showUnsold && styles.activeStatusFilter
                ]}
                onPress={() => setFilters(prev => ({ ...prev, showUnsold: !prev.showUnsold }))}
              >
                <Ionicons 
                  name={filters.showUnsold ? "checkbox" : "square-outline"} 
                  size={18} 
                  color={filters.showUnsold ? Colors.light.tint : '#999'} 
                />
                <Text style={styles.statusFilterText}>Active</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.statusFilterButton,
                  filters.showSold && styles.activeStatusFilter
                ]}
                onPress={() => setFilters(prev => ({ ...prev, showSold: !prev.showSold }))}
              >
                <Ionicons 
                  name={filters.showSold ? "checkbox" : "square-outline"} 
                  size={18} 
                  color={filters.showSold ? Colors.light.tint : '#999'} 
                />
                <Text style={styles.statusFilterText}>Sold</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Loading records...</Text>
        </View>
      ) : (
        <>
          {filteredRecords.length > 0 ? (
            <FlatList
              data={filteredRecords}
              renderItem={renderRecord}
              keyExtractor={item => item.id || Math.random().toString()}
              contentContainerStyle={styles.recordsList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>No records found</Text>
              <Text style={styles.emptySubtext}>
                {records.length > 0 
                  ? 'Try adjusting your filters or search terms'
                  : 'Start by adding your first animal record'
                }
              </Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push('/records/new')}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add New Record</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
      
      {!loading && filteredRecords.length > 0 && (
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => router.push('/records/new')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
  },
  filtersContainer: {
    marginTop: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
  },
  filterTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  collectionFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  collectionFilterButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  activeCollectionFilter: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  collectionFilterText: {
    color: '#666',
    fontSize: 14,
  },
  activeCollectionFilterText: {
    color: '#FFFFFF',
  },
  statusFilters: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statusFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  activeStatusFilter: {
    
  },
  statusFilterText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
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
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  collectionTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 5,
  },
  collectionText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 5,
  },
  soldTag: {
    backgroundColor: '#FFEBEE',
  },
  activeTag: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D32F2F',
  },
  recordContent: {
    flexDirection: 'row',
    padding: 15,
  },
  recordImageContainer: {
    width: 90,
    height: 90,
    marginRight: 15,
  },
  recordImage: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordDetails: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
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
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    color: Colors.light.tint,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
}); 
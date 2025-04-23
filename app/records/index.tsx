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
import { Picker } from '@react-native-picker/picker';

export default function RecordsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<AnimalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AnimalRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'sold' | 'deceased'>('all');
  const [collections, setCollections] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    collectionNames: '',
    status: '',
    category: '',
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
  }, [records, searchQuery, filters]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const allRecords = await getAllAnimalRecords();
      setRecords(allRecords);
      
      // Get unique collections
      const uniqueCollections = new Set<string>();
      allRecords.forEach(record => {
        if (record.collectionNames && Array.isArray(record.collectionNames)) {
          record.collectionNames.forEach(collection => uniqueCollections.add(collection));
        }
      });
      setCollections(Array.from(uniqueCollections));
    } catch (error) {
      console.error('Error loading records:', error);
      Alert.alert('Error', 'Failed to load records');
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
    
    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(record => record.status === selectedStatus);
    }
    
    // Apply collection filter
    if (selectedCollection) {
      filtered = filtered.filter(record => 
        record.collectionNames && 
        record.collectionNames.includes(selectedCollection)
      );
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        record.animalNumber.toLowerCase().includes(query) ||
        record.category?.toLowerCase().includes(query) ||
        record.breed?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (filters.sortBy === 'date') {
        const dateA = new Date(a.purchaseDate || '').getTime();
        const dateB = new Date(b.purchaseDate || '').getTime();
        return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (filters.sortBy === 'price') {
        return filters.sortOrder === 'asc' 
          ? (a.purchasePrice || 0) - (b.purchasePrice || 0)
          : (b.purchasePrice || 0) - (a.purchasePrice || 0);
      }
      return 0;
    });
    
    setFilteredRecords(filtered);
  };

  const handleAddRecord = () => {
    router.push('/records/new');
  };
  const handleEditRecord = (recordId: string) => {
    router.push(`/records/${recordId}` as any); // Type assertion to fix type error
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

  const toggleFilter = (filterType: 'collectionNames' | 'status' | 'category' | 'sortBy' | 'sortOrder', value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? '' : value
    }));
  };

  const toggleFilterMenu = () => {
    setShowFilters(!showFilters);
  };

  const resetFilters = () => {
    setFilters({
      collectionNames: '',
      status: '',
      category: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
    setSearchQuery('');
  };

  const getUniqueCollections = () => {
    const collections = new Set<string>();
    records.forEach(record => {
      if (record.collectionNames && Array.isArray(record.collectionNames)) {
        record.collectionNames.forEach(name => collections.add(name));
      }
    });
    return Array.from(collections);
  };

  const getUniqueCategories = () => {
    const categories = new Set(records.map(record => record.category).filter((category): category is string => !!category));
    return Array.from(categories);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const renderRecord = ({ item }: { item: AnimalRecord }) => {
    const statusColor = item.status === 'sold' ? '#4CAF50' : 
                       item.status === 'deceased' ? '#F44336' : '#FF9800';
    
    return (
      <View style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <Text style={styles.recordNumber}>ID: {item.animalNumber || 'N/A'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status}</Text>
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
              <Text style={styles.detailLabel}>Collections:</Text>
              <Text style={styles.detailValue}>
                {(item.collectionNames || []).join(', ') || 'No collections'}
              </Text>
            </View>
            
            {item.category && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{item.category}</Text>
              </View>
            )}
            
            {item.breed && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Breed:</Text>
                <Text style={styles.detailValue}>{item.breed}</Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase:</Text>
              <Text style={styles.detailValue}>
                {formatDate(item.purchaseDate)} - {formatCurrency(item.purchasePrice || 0)}
              </Text>
            </View>
            
            {item.soldDate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sold:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(item.soldDate)} - {formatCurrency(item.sellingPrice || 0)}
                </Text>
              </View>
            )}
            
            <View style={styles.profitLossRow}>
              {item.profit && item.profit > 0 ? (
                <Text style={styles.profitText}>Profit: {formatCurrency(item.profit)}</Text>
              ) : item.loss && item.loss > 0 ? (
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
      <View style={styles.header}>
        <Text style={styles.title}>Animal Records</Text>
        <View style={styles.filters}>
          <Picker
            selectedValue={selectedStatus}
            style={styles.picker}
            onValueChange={(value: 'all' | 'active' | 'sold' | 'deceased') => setSelectedStatus(value)}
          >
            <Picker.Item label="All Status" value="all" />
            <Picker.Item label="Active" value="active" />
            <Picker.Item label="Sold" value="sold" />
            <Picker.Item label="Deceased" value="deceased" />
          </Picker>
          <Picker
            selectedValue={selectedCollection}
            style={styles.picker}
            onValueChange={(value: string | null) => setSelectedCollection(value)}
          >
            <Picker.Item label="All Collections" value={null} />
            {collections.map(collection => (
              <Picker.Item key={collection} label={collection} value={collection} />
            ))}
          </Picker>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search records..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Collections</Text>
            <View style={styles.filterOptions}>
              {getUniqueCollections().map((collection, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filterChip,
                    filters.collectionNames === collection ? styles.activeFilterChip : null
                  ]}
                  onPress={() => toggleFilter('collectionNames', collection)}
                >
                  <Text 
                    style={[
                      styles.filterChipText,
                      filters.collectionNames === collection ? styles.activeFilterChipText : null
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
              {['active', 'sold', 'deceased'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    filters.status === status ? styles.activeFilterChip : null
                  ]}
                  onPress={() => toggleFilter('status', status)}
                >
                  <Text 
                    style={[
                      styles.filterChipText,
                      filters.status === status ? styles.activeFilterChipText : null
                    ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Category</Text>
            <View style={styles.filterOptions}>
              {getUniqueCategories().map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filterChip,
                    filters.category === category ? styles.activeFilterChip : null
                  ]}
                  onPress={() => toggleFilter('category', category)}
                >
                  <Text 
                    style={[
                      styles.filterChipText,
                      filters.category === category ? styles.activeFilterChipText : null
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
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
          {(searchQuery || filters.collectionNames || filters.status || filters.category) && (
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
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddRecord}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 10,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  picker: {
    width: 120,
    height: 50,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
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
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
}); 



// import React, { useState, useEffect } from 'react';
// import { 
//   StyleSheet, 
//   View, 
//   Text, 
//   FlatList, 
//   TouchableOpacity, 
//   ActivityIndicator, 
//   Image,
//   TextInput,
//   Alert,
//   RefreshControl,
//   Platform,
//   Dimensions
// } from 'react-native';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
// import { getAllAnimalRecords, deleteAnimalRecord, AnimalRecord } from '../../firebase/firestore';
// import { Colors } from '../../constants/Colors';
// import { Picker } from '@react-native-picker/picker';
// import { BlurView } from 'expo-blur';
// import { LinearGradient } from 'expo-linear-gradient';
// import { StatusBar } from 'expo-status-bar';

// // Define theme colors
// const THEME = {
//   primary: Colors.light.tint || '#4A90E2',
//   lightPrimary: '#E3F2FD',
//   background: '#F9FAFB',
//   cardBackground: '#FFFFFF',
//   success: '#00C853',
//   warning: '#FFC107',
//   danger: '#FF5252',
//   gray: '#9E9E9E',
//   darkGray: '#616161',
//   lightGray: '#EEEEEE',
//   textDark: '#212121',
//   textMedium: '#424242',
//   textLight: '#757575',
// };

// const SCREEN_WIDTH = Dimensions.get('window').width;

// export default function RecordsScreen() {
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [records, setRecords] = useState<AnimalRecord[]>([]);
//   const [filteredRecords, setFilteredRecords] = useState<AnimalRecord[]>([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
//   const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'sold' | 'deceased'>('all');
//   const [collections, setCollections] = useState<string[]>([]);
//   const [showFilters, setShowFilters] = useState(false);
//   const [filters, setFilters] = useState({
//     collectionNames: '',
//     status: '',
//     category: '',
//     sortBy: 'date',
//     sortOrder: 'desc'
//   });
  
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const filterCategory = params.filterCategory as string;

//   useEffect(() => {
//     loadRecords();
//   }, []);

//   useEffect(() => {
//     if (filterCategory && records.length > 0) {
//       setFilters(prev => ({
//         ...prev,
//         category: filterCategory
//       }));
//       applyFilters();
//     }
//   }, [filterCategory, records]);

//   useEffect(() => {
//     applyFilters();
//   }, [records, searchQuery, filters]);

//   const loadRecords = async () => {
//     try {
//       setLoading(true);
//       const allRecords = await getAllAnimalRecords();
//       setRecords(allRecords);
      
//       // Get unique collections
//       const uniqueCollections = new Set<string>();
//       allRecords.forEach(record => {
//         if (record.collectionNames && Array.isArray(record.collectionNames)) {
//           record.collectionNames.forEach(collection => uniqueCollections.add(collection));
//         }
//       });
//       setCollections(Array.from(uniqueCollections));
//     } catch (error) {
//       console.error('Error loading records:', error);
//       Alert.alert('Error', 'Failed to load records');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const handleRefresh = () => {
//     setRefreshing(true);
//     loadRecords();
//   };

//   const applyFilters = () => {
//     let filtered = [...records];
    
//     // Apply status filter
//     if (selectedStatus !== 'all') {
//       filtered = filtered.filter(record => record.status === selectedStatus);
//     }
    
//     // Apply collection filter
//     if (selectedCollection) {
//       filtered = filtered.filter(record => 
//         record.collectionNames && 
//         record.collectionNames.includes(selectedCollection)
//       );
//     }
    
//     // Apply search filter
//     if (searchQuery) {
//       const query = searchQuery.toLowerCase();
//       filtered = filtered.filter(record =>
//         record.animalNumber.toLowerCase().includes(query) ||
//         record.category?.toLowerCase().includes(query) ||
//         record.breed?.toLowerCase().includes(query)
//       );
//     }
    
//     // Apply sorting
//     filtered.sort((a, b) => {
//       if (filters.sortBy === 'date') {
//         const dateA = new Date(a.purchaseDate || '').getTime();
//         const dateB = new Date(b.purchaseDate || '').getTime();
//         return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
//       } else if (filters.sortBy === 'price') {
//         return filters.sortOrder === 'asc' 
//           ? (a.purchasePrice || 0) - (b.purchasePrice || 0)
//           : (b.purchasePrice || 0) - (a.purchasePrice || 0);
//       }
//       return 0;
//     });
    
//     setFilteredRecords(filtered);
//   };

//   const handleAddRecord = () => {
//     router.push('/records/new');
//   };
  
//   const handleEditRecord = (recordId: string) => {
//     router.push(`/records/${recordId}` as any); // Type assertion to fix type error
//   };

//   const handleDeleteRecord = (record: AnimalRecord) => {
//     Alert.alert(
//       'Delete Record',
//       `Are you sure you want to delete ${record.animalNumber || 'this record'}?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Delete', 
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               setLoading(true);
//               await deleteAnimalRecord(record.id);
//               loadRecords();
//               Alert.alert('Success', 'Record deleted successfully');
//             } catch (error) {
//               console.error('Error deleting record:', error);
//               Alert.alert('Error', 'Failed to delete record');
//               setLoading(false);
//             }
//           }
//         }
//       ]
//     );
//   };

//   const toggleFilter = (filterType: 'collectionNames' | 'status' | 'category' | 'sortBy' | 'sortOrder', value: string) => {
//     setFilters(prev => ({
//       ...prev,
//       [filterType]: prev[filterType] === value ? '' : value
//     }));
//   };

//   const toggleFilterMenu = () => {
//     setShowFilters(!showFilters);
//   };

//   const resetFilters = () => {
//     setFilters({
//       collectionNames: '',
//       status: '',
//       category: '',
//       sortBy: 'date',
//       sortOrder: 'desc'
//     });
//     setSearchQuery('');
//   };

//   const getUniqueCollections = () => {
//     const collections = new Set<string>();
//     records.forEach(record => {
//       if (record.collectionNames && Array.isArray(record.collectionNames)) {
//         record.collectionNames.forEach(name => collections.add(name));
//       }
//     });
//     return Array.from(collections);
//   };

//   const getUniqueCategories = () => {
//     const categories = new Set(records.map(record => record.category).filter((category): category is string => !!category));
//     return Array.from(categories);
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString();
//   };

//   const formatCurrency = (amount: number) => {
//     return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'active': return THEME.success;
//       case 'sold': return THEME.primary;
//       case 'deceased': return THEME.danger;
//       default: return THEME.gray;
//     }
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case 'active': return 'checkmark-circle';
//       case 'sold': return 'cash-outline';
//       case 'deceased': return 'alert-circle';
//       default: return 'help-circle';
//     }
//   };
  
//   const renderHeader = () => (
//     <View style={styles.headerContainer}>
//       <StatusBar style="light" />
//       <LinearGradient
//         colors={[THEME.primary, '#3B78C4']}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 0 }}
//         style={styles.headerGradient}
//       >
//         <View style={styles.headerContent}>
//           <Text style={styles.headerTitle}>Animal Records</Text>
          
//           <TouchableOpacity 
//             style={styles.filterButton} 
//             onPress={toggleFilterMenu}
//           >
//             <Ionicons 
//               name={showFilters ? "funnel" : "funnel-outline"} 
//               size={22} 
//               color="#FFFFFF" 
//             />
//             <Text style={styles.filterButtonText}>
//               {showFilters ? "Hide Filters" : "Filters"}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </LinearGradient>
      
//       <View style={styles.searchContainer}>
//         <View style={styles.searchInputContainer}>
//           <Ionicons name="search" size={20} color={THEME.textLight} style={styles.searchIcon} />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search by ID, category, or breed..."
//             placeholderTextColor={THEME.textLight}
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//           />
//           {searchQuery ? (
//             <TouchableOpacity onPress={() => setSearchQuery('')}>
//               <Ionicons name="close-circle" size={18} color={THEME.textLight} />
//             </TouchableOpacity>
//           ) : null}
//         </View>
//       </View>

//       <View style={styles.quickFilters}>
//         <View style={styles.pickerContainer}>
//           <Picker
//             selectedValue={selectedStatus}
//             style={styles.picker}
//             dropdownIconColor={THEME.primary}
//             onValueChange={(value: 'all' | 'active' | 'sold' | 'deceased') => setSelectedStatus(value)}
//           >
//             <Picker.Item label="All Status" value="all" />
//             <Picker.Item label="Active" value="active" />
//             <Picker.Item label="Sold" value="sold" />
//             <Picker.Item label="Deceased" value="deceased" />
//           </Picker>
//         </View>
        
//         <View style={styles.pickerContainer}>
//           <Picker
//             selectedValue={selectedCollection}
//             style={styles.picker}
//             dropdownIconColor={THEME.primary}
//             onValueChange={(value: string | null) => setSelectedCollection(value)}
//           >
//             <Picker.Item label="All Collections" value={null} />
//             {collections.map(collection => (
//               <Picker.Item key={collection} label={collection} value={collection} />
//             ))}
//           </Picker>
//         </View>
//       </View>
//     </View>
//   );

//   const renderFilters = () => (
//     <View style={styles.advancedFiltersContainer}>
//       <View style={styles.filterSection}>
//         <Text style={styles.filterSectionTitle}>Collections</Text>
//         <View style={styles.filterOptions}>
//           {getUniqueCollections().map((collection, index) => (
//             <TouchableOpacity
//               key={index}
//               style={[
//                 styles.filterChip,
//                 filters.collectionNames === collection ? styles.activeFilterChip : null
//               ]}
//               onPress={() => toggleFilter('collectionNames', collection)}
//             >
//               <Text 
//                 style={[
//                   styles.filterChipText,
//                   filters.collectionNames === collection ? styles.activeFilterChipText : null
//                 ]}
//               >
//                 {collection}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </View>
      
//       <View style={styles.filterSection}>
//         <Text style={styles.filterSectionTitle}>Status</Text>
//         <View style={styles.filterOptions}>
//           {['active', 'sold', 'deceased'].map((status) => (
//             <TouchableOpacity
//               key={status}
//               style={[
//                 styles.filterChip,
//                 filters.status === status ? styles.activeFilterChip : null
//               ]}
//               onPress={() => toggleFilter('status', status)}
//             >
//               <Ionicons 
//                 name={getStatusIcon(status)} 
//                 size={14} 
//                 color={filters.status === status ? '#fff' : THEME.textLight} 
//                 style={styles.chipIcon}
//               />
//               <Text 
//                 style={[
//                   styles.filterChipText,
//                   filters.status === status ? styles.activeFilterChipText : null
//                 ]}
//               >
//                 {status.charAt(0).toUpperCase() + status.slice(1)}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </View>
      
//       <View style={styles.filterSection}>
//         <Text style={styles.filterSectionTitle}>Category</Text>
//         <View style={styles.filterOptions}>
//           {getUniqueCategories().map((category, index) => (
//             <TouchableOpacity
//               key={index}
//               style={[
//                 styles.filterChip,
//                 filters.category === category ? styles.activeFilterChip : null
//               ]}
//               onPress={() => toggleFilter('category', category)}
//             >
//               <Text 
//                 style={[
//                   styles.filterChipText,
//                   filters.category === category ? styles.activeFilterChipText : null
//                 ]}
//               >
//                 {category}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </View>
      
//       <View style={styles.filterSection}>
//         <Text style={styles.filterSectionTitle}>Sort By</Text>
//         <View style={styles.filterOptions}>
//           <TouchableOpacity
//             style={[
//               styles.filterChip,
//               filters.sortBy === 'date' ? styles.activeFilterChip : null
//             ]}
//             onPress={() => setFilters(prev => ({ ...prev, sortBy: 'date' }))}
//           >
//             <Ionicons 
//               name="calendar-outline" 
//               size={14} 
//               color={filters.sortBy === 'date' ? '#fff' : THEME.textLight}
//               style={styles.chipIcon} 
//             />
//             <Text 
//               style={[
//                 styles.filterChipText,
//                 filters.sortBy === 'date' ? styles.activeFilterChipText : null
//               ]}
//             >
//               Date
//             </Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity
//             style={[
//               styles.filterChip,
//               filters.sortBy === 'price' ? styles.activeFilterChip : null
//             ]}
//             onPress={() => setFilters(prev => ({ ...prev, sortBy: 'price' }))}
//           >
//             <Ionicons 
//               name="pricetag-outline" 
//               size={14}
//               color={filters.sortBy === 'price' ? '#fff' : THEME.textLight}
//               style={styles.chipIcon}
//             />
//             <Text 
//               style={[
//                 styles.filterChipText,
//                 filters.sortBy === 'price' ? styles.activeFilterChipText : null
//               ]}
//             >
//               Price
//             </Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity
//             style={[
//               styles.sortOrderChip,
//             ]}
//             onPress={() => setFilters(prev => ({ 
//               ...prev, 
//               sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
//             }))}
//           >
//             <Ionicons 
//               name={filters.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
//               size={14} 
//               color={THEME.primary}
//               style={styles.chipIcon}
//             />
//             <Text style={styles.sortOrderText}>
//               {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>
      
//       <TouchableOpacity
//         style={styles.resetButton}
//         onPress={resetFilters}
//       >
//         <Ionicons name="refresh" size={16} color="#fff" style={styles.resetButtonIcon} />
//         <Text style={styles.resetButtonText}>Reset All Filters</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   const renderEmptyState = () => (
//     <View style={styles.emptyContainer}>
//       <View style={styles.emptyImageContainer}>
//         <Ionicons name="folder-open-outline" size={80} color={THEME.lightGray} />
//       </View>
//       <Text style={styles.emptyTitle}>No Records Found</Text>
//       <Text style={styles.emptyText}>
//         {(searchQuery || filters.collectionNames || filters.status || filters.category) 
//           ? "Try adjusting your filters or search criteria" 
//           : "Add your first animal record to get started"}
//       </Text>
//       {(searchQuery || filters.collectionNames || filters.status || filters.category) && (
//         <TouchableOpacity
//           style={styles.emptyResetButton}
//           onPress={resetFilters}
//         >
//           <Text style={styles.emptyResetButtonText}>Clear Filters</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );

//   const renderRecord = ({ item }: { item: AnimalRecord }) => {
//     const statusColor = getStatusColor(item.status);
    
//     return (
//       <View style={styles.recordCard}>
//         <View style={styles.cardTop}>
//           <View style={styles.recordImageContainer}>
//             {item.imageUrl ? (
//               <Image 
//                 source={{ uri: item.imageUrl }} 
//                 style={styles.recordImage} 
//                 resizeMode="cover"
//               />
//             ) : (
//               <View style={styles.noImagePlaceholder}>
//                 <MaterialCommunityIcons name="cow" size={36} color="#CCCCCC" />
//               </View>
//             )}
//           </View>
          
//           <View style={styles.cardTopContent}>
//             <View style={styles.recordIdContainer}>
//               <Text style={styles.animalIdLabel}>ID</Text> 
//               <Text style={styles.animalId}>{item.animalNumber || 'N/A'}</Text>
//             </View>
            
//             <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
//               <Ionicons name={getStatusIcon(item.status)} size={12} color="#FFFFFF" style={styles.statusIcon} />
//               <Text style={styles.statusText}>{item.status}</Text>
//             </View>
//           </View>
//         </View>
        
//         <View style={styles.recordContent}>
//           {(item.collectionNames && item.collectionNames.length > 0) && (
//             <View style={styles.tagsContainer}>
//               {item.collectionNames.map((collection, index) => (
//                 <View key={index} style={styles.collectionTag}>
//                   <Text style={styles.collectionTagText}>{collection}</Text>
//                 </View>
//               ))}
//             </View>
//           )}
          
//           <View style={styles.infoSection}>
//             {item.category && (
//               <View style={styles.infoRow}>
//                 <View style={styles.infoIconContainer}>
//                   <Ionicons name="pricetag-outline" size={16} color={THEME.primary} />
//                 </View>
//                 <Text style={styles.infoLabel}>Category:</Text>
//                 <Text style={styles.infoValue}>{item.category}</Text>
//               </View>
//             )}
            
//             {item.breed && (
//               <View style={styles.infoRow}>
//                 <View style={styles.infoIconContainer}>
//                   <FontAwesome5 name="dna" size={16} color={THEME.primary} />
//                 </View>
//                 <Text style={styles.infoLabel}>Breed:</Text>
//                 <Text style={styles.infoValue}>{item.breed}</Text>
//               </View>
//             )}
            
//             <View style={styles.infoRow}>
//               <View style={styles.infoIconContainer}>
//                 <Ionicons name="calendar" size={16} color={THEME.primary} />
//               </View>
//               <Text style={styles.infoLabel}>Purchase:</Text>
//               <Text style={styles.infoValue}>
//                 {formatDate(item.purchaseDate)}
//               </Text>
//             </View>
            
//             <View style={styles.infoRow}>
//               <View style={styles.infoIconContainer}>
//                 <Ionicons name="cash-outline" size={16} color={THEME.primary} />
//               </View>
//               <Text style={styles.infoLabel}>Price:</Text>
//               <Text style={styles.infoValue}>{formatCurrency(item.purchasePrice || 0)}</Text>
//             </View>
            
//             {item.soldDate && (
//               <>
//                 <View style={styles.infoRow}>
//                   <View style={styles.infoIconContainer}>
//                     <Ionicons name="calendar-outline" size={16} color={THEME.primary} />
//                   </View>
//                   <Text style={styles.infoLabel}>Sold Date:</Text>
//                   <Text style={styles.infoValue}>{formatDate(item.soldDate)}</Text>
//                 </View>
                
//                 <View style={styles.infoRow}>
//                   <View style={styles.infoIconContainer}>
//                     <Ionicons name="trending-up" size={16} color={THEME.primary} />
//                   </View>
//                   <Text style={styles.infoLabel}>Sold Price:</Text>
//                   <Text style={styles.infoValue}>{formatCurrency(item.sellingPrice || 0)}</Text>
//                 </View>
//               </>
//             )}
//           </View>
          
//           {(item.profit && item.profit > 0) || (item.loss && item.loss > 0) ? (
//             <View style={styles.financialResultContainer}>
//               {item.profit && item.profit > 0 ? (
//                 <View style={styles.profitContainer}>
//                   <Ionicons name="trending-up" size={18} color={THEME.success} style={styles.profitIcon} />
//                   <Text style={styles.profitText}>Profit: {formatCurrency(item.profit)}</Text>
//                 </View>
//               ) : item.loss && item.loss > 0 ? (
//                 <View style={styles.lossContainer}>
//                   <Ionicons name="trending-down" size={18} color={THEME.danger} style={styles.lossIcon} />
//                   <Text style={styles.lossText}>Loss: {formatCurrency(item.loss)}</Text>
//                 </View>
//               ) : null}
//             </View>
//           ) : null}
//         </View>
        
//         <View style={styles.cardActions}>
//           <TouchableOpacity 
//             style={styles.editButton}
//             onPress={() => handleEditRecord(item.id)}
//           >
//             <Ionicons name="create-outline" size={18} color="#FFFFFF" />
//             <Text style={styles.editButtonText}>Edit</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={styles.deleteButton}
//             onPress={() => handleDeleteRecord(item)}
//           >
//             <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
//             <Text style={styles.deleteButtonText}>Delete</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       {renderHeader()}
      
//       {showFilters && renderFilters()}
      
//       {loading && !refreshing ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={THEME.primary} />
//           <Text style={styles.loadingText}>Loading records...</Text>
//         </View>
//       ) : filteredRecords.length === 0 ? (
//         renderEmptyState()
//       ) : (
//         <FlatList
//           data={filteredRecords}
//           renderItem={renderRecord}
//           keyExtractor={item => item.id}
//           contentContainerStyle={styles.recordsList}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={handleRefresh}
//               colors={[THEME.primary]}
//               tintColor={THEME.primary}
//             />
//           }
//         />
//       )}
      
//       <TouchableOpacity
//         style={styles.addButton}
//         onPress={handleAddRecord}
//         activeOpacity={0.8}
//       >
//         <Ionicons name="add" size={28} color="#FFFFFF" />
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: THEME.background,
//   },
//   headerContainer: {
//     backgroundColor: THEME.cardBackground,
//     borderBottomLeftRadius: 0,
//     borderBottomRightRadius: 0,
//     overflow: 'hidden',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   headerGradient: {
//     paddingTop: Platform.OS === 'ios' ? 50 : 10,
//     paddingBottom: 15,
//     paddingHorizontal: 20,
//   },
//   headerContent: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#FFFFFF',
//   },
//   filterButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 20,
//   },
//   filterButtonText: {
//     color: '#FFFFFF',
//     marginLeft: 6,
//     fontWeight: '500',
//   },
//   searchContainer: {
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     backgroundColor: THEME.cardBackground,
//   },
//   searchInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: THEME.background,
//     borderRadius: 10, 
//     paddingHorizontal: 12,
//     height: 46,
//     borderWidth: 1,
//     borderColor: THEME.lightGray,
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: THEME.textDark,
//     height: '100%',
//   },
//   quickFilters: {
//     flexDirection: 'row',
//     paddingHorizontal: 16,
//     paddingBottom: 12,
//     backgroundColor: THEME.cardBackground,
//   },
//   pickerContainer: {
//     flex: 1,
//     marginHorizontal: 4,
//     borderWidth: 1,
//     borderColor: THEME.lightGray,
//     borderRadius: 8,
//     overflow: 'hidden',
//     backgroundColor: THEME.background,
//   },
//   picker: {
//     height: 40,
//     width: '100%',
//   },
//   advancedFiltersContainer: {
//     backgroundColor: THEME.cardBackground,
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: THEME.lightGray,
//     marginBottom: 8,
//   },
//   filterSection: {
//     marginBottom: 16,
//   },
//   filterSectionTitle: {
//     fontSize: 15,
//     fontWeight: '600',
//     marginBottom: 10,
//     color: THEME.textDark,
//   },
//   filterOptions: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   filterChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: THEME.lightGray,
//     borderRadius: 20,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     marginRight: 8,
//     marginBottom: 8,
//   },
//   activeFilterChip: {
//     backgroundColor: THEME.primary,
//   },
//   chipIcon: {
//     marginRight: 4,
//   },
//   filterChipText: {
//     fontSize: 14,
//     color: THEME.textMedium,
//   },
//   activeFilterChipText: {
//     color: '#FFFFFF',
//     fontWeight: '500',
//   },
//   sortOrderChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: 20,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     marginRight: 8,
//     marginBottom: 8,
//     borderWidth: 1,
//     borderColor: THEME.primary,
//   },
//   sortOrderText: {
//     fontSize: 14,
//     color: THEME.primary,
//     fontWeight: '500',
//   },
//   resetButton: {
//     alignSelf: 'center',
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//     backgroundColor: THEME.primary,
//     borderRadius: 8,
//     marginTop: 8,
//   },
//   resetButtonIcon: {
//     marginRight: 6,
//   },
//   resetButtonText: {
//     color: '#FFFFFF',
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: THEME.background,
//   },
//   loadingText: {
//     marginTop: 16,
//     color: THEME.textMedium,
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: THEME.background,
//   },
//   emptyImageContainer: {
//     marginBottom: 16,
//     opacity: 0.5,
//   },
//   emptyTitle: {
//     fontSize: 20,
//     color: THEME.textDark,
//     fontWeight: '600',
//     textAlign: 'center',
//     marginBottom: 8
//   },
//   emptyText: {
//     color: THEME.textMedium,
//     textAlign: 'center',
//     marginBottom: 16
//   },
//   emptyResetButton: {
//     backgroundColor: THEME.primary,
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     marginTop: 16
//   },
//   emptyResetButtonText: {


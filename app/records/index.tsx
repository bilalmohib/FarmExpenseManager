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
//   ScrollView,
//   SafeAreaView
// } from 'react-native';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { getAllAnimalRecords, deleteAnimalRecord, AnimalRecord, getAllMonthlyExpenses } from '../../firebase/firestore';
// import { Colors } from '../../constants/Colors';
// import { Picker } from '@react-native-picker/picker';
// import { BottomSheet } from '@rneui/themed';

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
//   const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  
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
//     if (records.length > 0) {
//       applyFilters();
//     }
//   }, [records, selectedStatus, selectedCollection, searchQuery, filters]);

//   const loadRecords = async () => {
//     try {
//       setLoading(true);
//       const allRecords = await getAllAnimalRecords();
//       const monthlyExpenses = await getAllMonthlyExpenses();

//       // Filter records by recordType
//       const filteredRecords = allRecords.filter(record => record.recordType === 'load');

//       // Calculate profit/loss for each record
//       const recordsWithProfitLoss = filteredRecords.map(record => {
//         if (record.status === 'sold') {
//           // Calculate base expenses
//           const animalExpenses = Object.values(record.expenses || {}).reduce((sum: number, expense) => sum + (expense as {amount: number}).amount, 0);
//           const totalExpense = record.purchasePrice + animalExpenses;

//           // Find matching expenses based on collection tags
//           const matchingExpenses = monthlyExpenses.filter(expense => {
//             return expense.tags && record.collectionNames.some(collectionName =>
//               expense.tags.includes(collectionName)
//             );
//           });

//           // Add matching expenses to total expense
//           const matchingExpensesTotal = matchingExpenses.reduce((sum: any, expense: { amount: any; }) => sum + expense.amount, 0);
//           const totalExpenseWithMatching = totalExpense + matchingExpensesTotal;

//           // Calculate profit/loss
//           const salePrice = record.sellingPrice || 0;
//           const profit = salePrice > totalExpenseWithMatching ? salePrice - totalExpenseWithMatching : 0;
//           const loss = salePrice < totalExpenseWithMatching ? totalExpenseWithMatching - salePrice : 0;

//           return {
//             ...record,
//             profit,
//             loss
//           };
//         }
//         return record;
//       });

//       setRecords(recordsWithProfitLoss);
      
//       // Get unique collections
//       const uniqueCollections = new Set<string>();
//       recordsWithProfitLoss.forEach(record => {
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
//         record.category?.toLowerCase().includes(query)
//         // record.breed?.toLowerCase().includes(query)
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
//     setIsBottomSheetVisible(true);
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

//   // const formatDate = (dateString: string) => {
//   //   const date = new Date(dateString);
//   //   return date.toLocaleDateString();
//   // };

//   const formatCurrency = (amount: number) => {
//     return `₹${amount.toFixed(2)}`;
//   };

//   const renderRecordItem = ({ item }: { item: AnimalRecord }) => {
//     return (
//       <View style={styles.recordCard}>
//         <View style={styles.recordHeader}>
//           <Text style={styles.recordTitle}>ID: {item.animalNumber}</Text>
//           <View style={[
//             styles.statusBadge,
//             item.status === 'sold' ? styles.soldBadge :
//             item.status === 'deceased' ? styles.deceasedBadge :
//             styles.activeBadge
//           ]}>
//             <Text style={styles.statusText}>{item.status}</Text>
//           </View>
//         </View>

//         <View style={styles.recordInfo}>
//           <Text style={styles.infoText}>Category: {item.category}</Text>
//           <Text style={styles.infoText}>Collections: {item.collectionNames.join(', ')}</Text>
//           <Text style={styles.infoText}>Purchase Date: {new Date(item.purchaseDate).toLocaleDateString()}</Text>
//           <Text style={styles.infoText}>Purchase Price: ₹{item.purchasePrice}</Text>
//           {item.status === 'sold' && (
//             <>
//               <Text style={styles.infoText}>Sold Date: {new Date(item.soldDate!).toLocaleDateString()}</Text>
//               <Text style={styles.infoText}>Selling Price: ₹{item.sellingPrice}</Text>
//             </>
//           )}
//           {item.isBulk && (
//             <Text style={styles.infoText}>Quantity: {item.quantity}</Text>
//           )}
//         </View>

//         <View style={styles.recordActions}>
//           {item.isBulk && (
//             <TouchableOpacity
//               style={[styles.actionButton, styles.bulkButton]}
//               onPress={() => router.push(`/records/bulk/${item.id}`)}
//             >
//               <Ionicons name="list" size={16} color="#FFFFFF" />
//               <Text style={styles.actionButtonText}>Manage Animals</Text>
//             </TouchableOpacity>
//           )}
//           <TouchableOpacity
//             style={[styles.actionButton, styles.editButton]}
//             onPress={() => handleEditRecord(item.id)}
//           >
//             <Ionicons name="create" size={16} color="#FFFFFF" />
//             <Text style={styles.actionButtonText}>Edit</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[styles.actionButton, styles.deleteButton]}
//             onPress={() => handleDeleteRecord(item)}
//           >
//             <Ionicons name="trash" size={16} color="#FFFFFF" />
//             <Text style={styles.actionButtonText}>Delete</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   };

//   const handleStatusChange = (value: 'all' | 'active' | 'sold' | 'deceased') => {
//     setSelectedStatus(value);
//   };

//   const handleCollectionChange = (value: string | null) => {
//     setSelectedCollection(value);
//   };

//   const handleSearchChange = (text: string) => {
//     setSearchQuery(text);
//   };

//   const handleLoadInOut = () => {
//     setIsBottomSheetVisible(false);
//     router.push('/records/new/new_load');
//   };

//   const handleSalePurchase = () => {
//     setIsBottomSheetVisible(false);
//     router.push('/records/new/new_sale');
//   };

//   const handleBreeding = () => {
//     setIsBottomSheetVisible(false);
//     router.push('/records/new/new_breed');
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>Animal Records</Text>
//         <View style={styles.filters}>
//           <Picker
//             selectedValue={selectedStatus}
//             style={styles.picker}
//             onValueChange={handleStatusChange}
//           >
//             <Picker.Item label="All Status" value="all" />
//             <Picker.Item label="Active" value="active" />
//             <Picker.Item label="Sold" value="sold" />
//             <Picker.Item label="Deceased" value="deceased" />
//           </Picker>
//           <Picker
//             selectedValue={selectedCollection}
//             style={styles.picker}
//             onValueChange={handleCollectionChange}
//           >
//             <Picker.Item label="All Collections" value={null} />
//             {collections.map(collection => (
//               <Picker.Item key={collection} label={collection} value={collection} />
//             ))}
//           </Picker>
//         </View>
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search records..."
//           value={searchQuery}
//           onChangeText={handleSearchChange}
//         />
//       </View>
      
//       {showFilters && (
//         <View style={styles.filtersContainer}>
//           <View style={styles.filterSection}>
//             <Text style={styles.filterSectionTitle}>Collections</Text>
//             <View style={styles.filterOptions}>
//               {getUniqueCollections().map((collection, index) => (
//                 <TouchableOpacity
//                   key={index}
//                   style={[
//                     styles.filterChip,
//                     filters.collectionNames === collection ? styles.activeFilterChip : null
//                   ]}
//                   onPress={() => toggleFilter('collectionNames', collection)}
//                 >
//                   <Text 
//                     style={[
//                       styles.filterChipText,
//                       filters.collectionNames === collection ? styles.activeFilterChipText : null
//                     ]}
//                   >
//                     {collection}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>
          
//           <View style={styles.filterSection}>
//             <Text style={styles.filterSectionTitle}>Status</Text>
//             <View style={styles.filterOptions}>
//               {['active', 'sold', 'deceased'].map((status) => (
//                 <TouchableOpacity
//                   key={status}
//                   style={[
//                     styles.filterChip,
//                     filters.status === status ? styles.activeFilterChip : null
//                   ]}
//                   onPress={() => toggleFilter('status', status)}
//                 >
//                   <Text 
//                     style={[
//                       styles.filterChipText,
//                       filters.status === status ? styles.activeFilterChipText : null
//                     ]}
//                   >
//                     {status.charAt(0).toUpperCase() + status.slice(1)}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>
          
//           <View style={styles.filterSection}>
//             <Text style={styles.filterSectionTitle}>Category</Text>
//             <View style={styles.filterOptions}>
//               {getUniqueCategories().map((category, index) => (
//                 <TouchableOpacity
//                   key={index}
//                   style={[
//                     styles.filterChip,
//                     filters.category === category ? styles.activeFilterChip : null
//                   ]}
//                   onPress={() => toggleFilter('category', category)}
//                 >
//                   <Text 
//                     style={[
//                       styles.filterChipText,
//                       filters.category === category ? styles.activeFilterChipText : null
//                     ]}
//                   >
//                     {category}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>
          
//           <View style={styles.filterSection}>
//             <Text style={styles.filterSectionTitle}>Sort By</Text>
//             <View style={styles.filterOptions}>
//               <TouchableOpacity
//                 style={[
//                   styles.filterChip,
//                   filters.sortBy === 'date' ? styles.activeFilterChip : null
//                 ]}
//                 onPress={() => setFilters(prev => ({ ...prev, sortBy: 'date' }))}
//               >
//                 <Text 
//                   style={[
//                     styles.filterChipText,
//                     filters.sortBy === 'date' ? styles.activeFilterChipText : null
//                   ]}
//                 >
//                   Date
//                 </Text>
//               </TouchableOpacity>
              
//               <TouchableOpacity
//                 style={[
//                   styles.filterChip,
//                   filters.sortBy === 'price' ? styles.activeFilterChip : null
//                 ]}
//                 onPress={() => setFilters(prev => ({ ...prev, sortBy: 'price' }))}
//               >
//                 <Text 
//                   style={[
//                     styles.filterChipText,
//                     filters.sortBy === 'price' ? styles.activeFilterChipText : null
//                   ]}
//                 >
//                   Price
//                 </Text>
//               </TouchableOpacity>
              
//               <TouchableOpacity
//                 style={[
//                   styles.filterChip,
//                   { marginLeft: 'auto' }
//                 ]}
//                 onPress={() => setFilters(prev => ({ 
//                   ...prev, 
//                   sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
//                 }))}
//               >
//                 <Ionicons 
//                   name={filters.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
//                   size={16} 
//                   color={Colors.light.tint} 
//                 />
//                 <Text style={styles.filterChipText}>
//                   {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
          
//           <TouchableOpacity
//             style={styles.resetButton}
//             onPress={resetFilters}
//           >
//             <Text style={styles.resetButtonText}>Reset Filters</Text>
//           </TouchableOpacity>
//         </View>
//       )}
      
//       {loading && !refreshing ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={Colors.light.tint} />
//           <Text style={styles.loadingText}>Loading records...</Text>
//         </View>
//       ) : filteredRecords.length === 0 ? (
//         <View style={styles.emptyContainer}>
//           <Ionicons name="sad-outline" size={60} color="#CCCCCC" />
//           <Text style={styles.emptyText}>No records found</Text>
//           {(searchQuery || filters.collectionNames || filters.status || filters.category) && (
//             <TouchableOpacity
//               style={styles.resetButton}
//               onPress={resetFilters}
//             >
//               <Text style={styles.resetButtonText}>Clear Filters</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       ) : (
//         <FlatList
//           data={filteredRecords}
//           renderItem={renderRecordItem}
//           keyExtractor={item => item.id}
//           contentContainerStyle={styles.recordsList}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={handleRefresh}
//               colors={[Colors.light.tint]}
//             />
//           }
//         />
//       )}
      
//       <TouchableOpacity
//         style={styles.addButton}
//         onPress={handleAddRecord}
//       >
//         <Ionicons name="add" size={24} color="#FFFFFF" />
//       </TouchableOpacity>

//       <BottomSheet
//         isVisible={isBottomSheetVisible}
//         onBackdropPress={() => setIsBottomSheetVisible(false)}
//       >
//         <View style={styles.bottomSheetContent}>
//           <TouchableOpacity
//             style={styles.bottomSheetOption}
//             onPress={handleLoadInOut}
//           >
//             <Ionicons name="swap-horizontal" size={24} color={Colors.light.tint} />
//             <Text style={styles.bottomSheetOptionText}>Add Load In/Out Record</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.bottomSheetOption}
//             onPress={handleSalePurchase}
//           >
//             <Ionicons name="cart" size={24} color={Colors.light.tint} />
//             <Text style={styles.bottomSheetOptionText}>Add Sale/Purchase Record</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.bottomSheetOption}
//             onPress={handleBreeding}
//           >
//             <Ionicons name="heart" size={24} color={Colors.light.tint} />
//             <Text style={styles.bottomSheetOptionText}>Add Breeding Record</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.bottomSheetOption, styles.cancelOption]}
//             onPress={() => setIsBottomSheetVisible(false)}
//           >
//             <Text style={styles.cancelOptionText}>Cancel</Text>
//           </TouchableOpacity>
//         </View>
//       </BottomSheet>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F5F5F5',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginRight: 10,
//   },
//   filters: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   picker: {
//     height: 50,
//     width: '100%',
//     color: '#333333',
//     backgroundColor: '#FFFFFF',
//   },
//   searchInput: {
//     flex: 1,
//     height: 40,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     borderWidth: 1,
//     borderColor: '#DDDDDD',
//   },
//   filtersContainer: {
//     backgroundColor: '#FFFFFF',
//     padding: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEEEEE',
//   },
//   filterSection: {
//     marginBottom: 15,
//   },
//   filterSectionTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 8,
//     color: '#333',
//   },
//   filterOptions: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   filterChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F0F0F0',
//     borderRadius: 20,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     marginRight: 8,
//     marginBottom: 8,
//   },
//   activeFilterChip: {
//     backgroundColor: Colors.light.tint,
//   },
//   filterChipText: {
//     fontSize: 14,
//     color: '#666',
//   },
//   activeFilterChipText: {
//     color: '#FFFFFF',
//   },
//   resetButton: {
//     alignSelf: 'center',
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     backgroundColor: '#EEEEEE',
//     borderRadius: 5,
//     marginTop: 5,
//   },
//   resetButtonText: {
//     color: '#666',
//     fontWeight: '500',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 10,
//     color: '#666',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   emptyText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#999',
//     marginBottom: 10,
//   },
//   recordsList: {
//     padding: 15,
//   },
//   recordCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 10,
//     marginBottom: 15,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//     overflow: 'hidden',
//   },
//   recordHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 15,
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEEEEE',
//   },
//   recordTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   statusBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 4,
//   },
//   activeBadge: {
//     backgroundColor: '#4CAF50',
//   },
//   soldBadge: {
//     backgroundColor: '#F44336',
//   },
//   deceasedBadge: {
//     backgroundColor: '#FF9800',
//   },
//   statusText: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   recordInfo: {
//     padding: 15,
//   },
//   infoText: {
//     marginBottom: 6,
//     color: '#333',
//     fontWeight: '500',
//   },
//   recordActions: {
//     flexDirection: 'row',
//     borderTopWidth: 1,
//     borderTopColor: '#EEEEEE',
//   },
//   actionButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//   },
//   editButton: {
//     borderLeftWidth: 1,
//     borderLeftColor: '#EEEEEE',
//   },
//   deleteButton: {
//     borderLeftWidth: 1,
//     borderLeftColor: '#EEEEEE',
//   },
//   actionButtonText: {
//     fontSize: 14,
//     fontWeight: '500',
//     marginLeft: 5,
//     color: Colors.light.tint,
//   },
//   bulkButton: {
//     backgroundColor: '#673AB7',
//   },
//   addButton: {
//     position: 'absolute',
//     right: 20,
//     bottom: 20,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: Colors.light.tint,
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//   },
//   filterContainer: {
//     padding: 16,
//     backgroundColor: '#FFFFFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//   },
//   filterLabel: {
//     fontSize: 16,
//     fontWeight: '500',
//     marginBottom: 8,
//     color: '#333333',
//   },
//   pickerWrapper: {
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     borderRadius: 8,
//     backgroundColor: '#FFFFFF',
//     overflow: 'hidden',
//     marginBottom: 16,
//   },
//   bottomSheetContent: {
//     backgroundColor: 'white',
//     padding: 20,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//   },
//   bottomSheetOption: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   bottomSheetOptionText: {
//     marginLeft: 15,
//     fontSize: 16,
//     color: '#333',
//   },
//   cancelOption: {
//     justifyContent: 'center',
//     borderBottomWidth: 0,
//     marginTop: 10,
//   },
//   cancelOptionText: {
//     color: '#ff3b30',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });



import React, { useState, useEffect } from 'react';
import { BottomSheet } from '@rneui/themed';
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
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllAnimalRecords, deleteAnimalRecord, AnimalRecord, getAllMonthlyExpenses } from '../../firebase/firestore';
import { Colors } from '../../constants/Colors';
import { Picker } from '@react-native-picker/picker';
   import { getFirestore, Timestamp } from 'firebase/firestore';


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
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
    const handleLoadInOut = () => {
    setIsBottomSheetVisible(false);
    router.push('/records/new/new_load');
  };

  const handleSalePurchase = () => {
    setIsBottomSheetVisible(false);
    router.push('/records/new/new_sale');
  };

  const handleBreeding = () => {
    setIsBottomSheetVisible(false);
    router.push('/records/new/new_breed');
  };

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
    if (records.length > 0) {
      applyFilters();
    }
  }, [records, selectedStatus, selectedCollection, searchQuery, filters]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const allRecords = await getAllAnimalRecords();
      const monthlyExpenses = await getAllMonthlyExpenses();

      // Calculate profit/loss for each record
      const recordsWithProfitLoss = allRecords.map(record => {
        if (record.status === 'sold') {
          // Calculate base expenses
          const animalExpenses = Object.values(record.expenses || {}).reduce((sum: number, expense) => sum + (expense as {amount: number}).amount, 0);
          const totalExpense = record.purchasePrice + animalExpenses;

          // Find matching expenses based on collection tags
          const matchingExpenses = monthlyExpenses.filter(expense => {
            return expense.tags && record.collectionNames.some(collectionName =>
              expense.tags.includes(collectionName)
            );
          });

          // Add matching expenses to total expense
          const matchingExpensesTotal = matchingExpenses.reduce((sum: any, expense: { amount: any; }) => sum + expense.amount, 0);
          const totalExpenseWithMatching = totalExpense + matchingExpensesTotal;

          // Calculate profit/loss
          const salePrice = record.sellingPrice || 0;
          const profit = salePrice > totalExpenseWithMatching ? salePrice - totalExpenseWithMatching : 0;
          const loss = salePrice < totalExpenseWithMatching ? totalExpenseWithMatching - salePrice : 0;

          return {
            ...record,
            profit,
            loss
          };
        }
        return record;
      });

      setRecords(recordsWithProfitLoss);
      
      // Get unique collections
      const uniqueCollections = new Set<string>();
      recordsWithProfitLoss.forEach(record => {
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
        record.category?.toLowerCase().includes(query)
        // record.breed?.toLowerCase().includes(query)
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

  // const handleAddRecord = () => {
  //   router.push('/records/new');
  // };
    const handleAddRecord = () => {
    setIsBottomSheetVisible(true);
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

  const renderRecordItem = ({ item }: { item: AnimalRecord }) => {
     const LoadInTimeStamp = item.LoadInDate; // Replace 'yourTimestampField'
     const LoadInDate = LoadInTimeStamp instanceof Timestamp ? LoadInTimeStamp.toDate() : new Date(LoadInTimeStamp);
     const LoadOutTimeStamp = item.LoadOutDate; // Replace 'yourTimestampField'
     const LoadOutDate = LoadOutTimeStamp instanceof Timestamp ? LoadOutTimeStamp.toDate() : new Date(LoadOutTimeStamp);

    return (
      <View style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <Text style={styles.recordTitle}>ID: {item.animalNumber}</Text>
          <View style={[
            styles.statusBadge,
            item.status === 'sold' ? styles.soldBadge :
            item.status === 'deceased' ? styles.deceasedBadge :
            styles.activeBadge
          ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.recordInfo}>
          <Text style={styles.infoText}>Category: {item.category}</Text>
          <Text style={styles.infoText}>Collections: {item.collectionNames.join(', ')}</Text>
          <Text style={styles.infoText}>{(item.recordType == "load") ? "Load In Date: " + LoadInDate.toDateString().toString(): "Purchase Date: " + new Date(item.purchaseDate!).toLocaleDateString()}</Text>
          <Text style={styles.infoText}>{(item.recordType == "load") ? "Load In Price: ₹" + item.LoadInPrice : "Purchase Price: ₹" + item.purchasePrice}</Text>
          {item.status === 'sold' && (
            <>
              <Text style={styles.infoText}>{"Sold Date: " + new Date(item.soldDate!).toLocaleDateString()}</Text>
              <Text style={styles.infoText}>Selling Price: ₹{item.sellingPrice}</Text>
            </>
          )}
          {item.isBulk && (
            <Text style={styles.infoText}>Quantity: {item.quantity}</Text>
          )}
        </View>

        <View style={styles.recordActions}>
          {item.isBulk && (
            <TouchableOpacity
              style={[styles.actionButton, styles.bulkButton]}
              onPress={() => router.push(`/records/bulk/${item.id}`)}
            >
              <Ionicons name="list" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Manage Animals</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditRecord(item.id)}
          >
            <Ionicons name="create" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteRecord(item)}
          >
            <Ionicons name="trash" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleStatusChange = (value: 'all' | 'active' | 'sold' | 'deceased') => {
    setSelectedStatus(value);
  };

  const handleCollectionChange = (value: string | null) => {
    setSelectedCollection(value);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Animal Records</Text>
        <View style={styles.filters}>
          <Picker
            selectedValue={selectedStatus}
            style={styles.picker}
            onValueChange={handleStatusChange}
          >
            <Picker.Item label="All Status" value="all" />
            <Picker.Item label="Active" value="active" />
            <Picker.Item label="Sold" value="sold" />
            <Picker.Item label="Deceased" value="deceased" />
          </Picker>
          <Picker
            selectedValue={selectedCollection}
            style={styles.picker}
            onValueChange={handleCollectionChange}
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
          onChangeText={handleSearchChange}
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
          renderItem={renderRecordItem}
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
            <BottomSheet
        isVisible={isBottomSheetVisible}
        onBackdropPress={() => setIsBottomSheetVisible(false)}
      >
        <View style={styles.bottomSheetContent}>
          <TouchableOpacity
            style={styles.bottomSheetOption}
            onPress={handleLoadInOut}
          >
            <Ionicons name="swap-horizontal" size={24} color={Colors.light.tint} />
            <Text style={styles.bottomSheetOptionText}>Add Load In/Out Record</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomSheetOption}
            onPress={handleSalePurchase}
          >
            <Ionicons name="cart" size={24} color={Colors.light.tint} />
            <Text style={styles.bottomSheetOptionText}>Add Sale/Purchase Record</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomSheetOption}
            onPress={handleBreeding}
          >
            <Ionicons name="heart" size={24} color={Colors.light.tint} />
            <Text style={styles.bottomSheetOptionText}>Add Breeding Record</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomSheetOption, styles.cancelOption]}
            onPress={() => setIsBottomSheetVisible(false)}
          >
            <Text style={styles.cancelOptionText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
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
    height: 50,
    width: '100%',
    color: '#333333',
    backgroundColor: '#FFFFFF',
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
  recordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  soldBadge: {
    backgroundColor: '#F44336',
  },
  deceasedBadge: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recordInfo: {
    padding: 15,
  },
  infoText: {
    marginBottom: 6,
    color: '#333',
    fontWeight: '500',
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
  editButton: {
    borderLeftWidth: 1,
    borderLeftColor: '#EEEEEE',
  },
  deleteButton: {
    borderLeftWidth: 1,
    borderLeftColor: '#EEEEEE',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
    color: Colors.light.tint,
  },
  bulkButton: {
    backgroundColor: '#673AB7',
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
    marginBottom: 16,
  },
    bottomSheetContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bottomSheetOptionText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  cancelOption: {
    justifyContent: 'center',
    borderBottomWidth: 0,
    marginTop: 10,
  },
  cancelOptionText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
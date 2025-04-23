import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllAnimalRecords } from '../../firebase/firestore';
import { Colors } from '../../constants/Colors';

interface Collection {
  name: string;
  description?: string;
  animalCount: number;
  totalValue: number;
  lastUpdated: string;
}

export default function CollectionsScreen() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const records = await getAllAnimalRecords();
      
      // Group records by collection
      const collectionMap = new Map<string, Collection>();
      
      records.forEach(record => {
        // Ensure collectionNames exists and is an array
        const collectionNames = record.collectionNames || [];
        
        collectionNames.forEach(collectionName => {
          if (!collectionMap.has(collectionName)) {
            collectionMap.set(collectionName, {
              name: collectionName,
              animalCount: 0,
              totalValue: 0,
              lastUpdated: new Date().toISOString()
            });
          }
          
          const collection = collectionMap.get(collectionName)!;
          collection.animalCount++;
          collection.totalValue += record.purchasePrice || 0;
          if (record.updatedAt && record.updatedAt > collection.lastUpdated) {
            collection.lastUpdated = record.updatedAt;
          }
        });
      });
      
      setCollections(Array.from(collectionMap.values()));
    } catch (error) {
      console.error('Error loading collections:', error);
      Alert.alert('Error', 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollection = () => {
    if (!newCollectionName.trim()) {
      Alert.alert('Error', 'Please enter a collection name');
      return;
    }
    
    // Check if collection already exists
    if (collections.some(c => c.name.toLowerCase() === newCollectionName.toLowerCase())) {
      Alert.alert('Error', 'A collection with this name already exists');
      return;
    }
    
    const newCollection: Collection = {
      name: newCollectionName,
      description: newCollectionDescription,
      animalCount: 0,
      totalValue: 0,
      lastUpdated: new Date().toISOString()
    };
    
    setCollections(prev => [...prev, newCollection]);
    setShowAddModal(false);
    setNewCollectionName('');
    setNewCollectionDescription('');
  };

  const handleViewCollection = (collectionName: string) => {
    router.push(`/records?filterCollection=${encodeURIComponent(collectionName)}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const renderCollection = ({ item }: { item: Collection }) => (
    <TouchableOpacity 
      style={styles.collectionCard}
      onPress={() => handleViewCollection(item.name)}
    >
      <View style={styles.collectionHeader}>
        <Text style={styles.collectionName}>{item.name}</Text>
        <Text style={styles.animalCount}>{item.animalCount} animals</Text>
      </View>
      
      {item.description && (
        <Text style={styles.collectionDescription}>{item.description}</Text>
      )}
      
      <View style={styles.collectionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Value:</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.totalValue)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Updated:</Text>
          <Text style={styles.detailValue}>{formatDate(item.lastUpdated)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Loading collections...</Text>
        </View>
      ) : (
        <FlatList
          data={collections}
          renderItem={renderCollection}
          keyExtractor={item => item.name}
          contentContainerStyle={styles.collectionsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-outline" size={60} color="#CCCCCC" />
              <Text style={styles.emptyText}>No collections found</Text>
              <Text style={styles.emptySubtext}>Add a new collection to get started</Text>
            </View>
          }
        />
      )}
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Collection</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Collection Name"
              value={newCollectionName}
              onChangeText={setNewCollectionName}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={newCollectionDescription}
              onChangeText={setNewCollectionDescription}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddCollection}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  collectionsList: {
    padding: 15,
  },
  collectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
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
  },
  collectionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  animalCount: {
    fontSize: 14,
    color: '#666',
  },
  collectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  collectionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
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
    color: '#333',
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
  },
  emptySubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#999',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#EEEEEE',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
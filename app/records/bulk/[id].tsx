import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Switch
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAnimalRecordById, updateAnimalRecord, AnimalRecord } from '../../../firebase/firestore';
import { Colors } from '../../../constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function BulkRecordScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [record, setRecord] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedAnimalIndex, setSelectedAnimalIndex] = useState<number>(-1);

  useEffect(() => {
    loadRecord();
  }, [id]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      const fetchedRecord = await getAnimalRecordById(id as string);
      if (fetchedRecord) {
        setRecord(fetchedRecord);
      }
    } catch (error) {
      console.error('Error loading record:', error);
      Alert.alert('Error', 'Failed to load animal record');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAnimal = async (index: number, updates: any) => {
    if (!record) return;

    try {
      setLoading(true);
      const updatedAnimals = [...record.individualAnimals];
      updatedAnimals[index] = {
        ...updatedAnimals[index],
        ...updates
      };

      await updateAnimalRecord(id as string, {
        individualAnimals: updatedAnimals
      });

      setRecord((prev: AnimalRecord | null) => {
        if (!prev) return null;
        return {
          ...prev,
          individualAnimals: updatedAnimals
        };
      });

      Alert.alert('Success', 'Animal record updated successfully');
    } catch (error) {
      console.error('Error updating record:', error);
      Alert.alert('Error', 'Failed to update animal record');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (index: number, status: 'active' | 'sold' | 'deceased') => {
    if (!record) return;
    handleUpdateAnimal(index, { status });
  };

  const handleSellingPriceChange = (index: number, price: string) => {
    if (!record) return;
    handleUpdateAnimal(index, { sellingPrice: parseFloat(price) || 0 });
  };

  const handleSoldDateChange = (index: number, date: Date) => {
    if (!record) return;
    handleUpdateAnimal(index, { soldDate: date.toISOString() });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </SafeAreaView>
    );
  }

  if (!record || !record.isBulk) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text>Record not found or not a bulk record</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Bulk Record: {record.animalNumber}</Text>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Collection Information</Text>
            <Text style={styles.infoText}>Collections: {record.collectionNames.join(', ')}</Text>
            <Text style={styles.infoText}>Purchase Date: {new Date(record.purchaseDate).toLocaleDateString()}</Text>
            <Text style={styles.infoText}>Total Quantity: {record.quantity}</Text>
            <Text style={styles.infoText}>Total Purchase Price: ₹{record.purchasePrice}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Individual Animals</Text>
            {record.individualAnimals.map((animal: any, index: number) => (
              <View key={index} style={styles.animalCard}>
                <View style={styles.animalHeader}>
                  <Text style={styles.animalId}>ID: {animal.id}</Text>
                  <View style={[
                    styles.statusBadge,
                    animal.status === 'sold' ? styles.soldBadge :
                    animal.status === 'deceased' ? styles.deceasedBadge :
                    styles.activeBadge
                  ]}>
                    <Text style={styles.statusText}>{animal.status}</Text>
                  </View>
                </View>

                <View style={styles.statusContainer}>
                  <TouchableOpacity
                    style={[styles.statusButton, animal.status === 'active' && styles.activeButton]}
                    onPress={() => handleStatusChange(index, 'active')}
                  >
                    <Text style={styles.statusButtonText}>Active</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, animal.status === 'sold' && styles.soldButton]}
                    onPress={() => handleStatusChange(index, 'sold')}
                  >
                    <Text style={styles.statusButtonText}>Sold</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, animal.status === 'deceased' && styles.deceasedButton]}
                    onPress={() => handleStatusChange(index, 'deceased')}
                  >
                    <Text style={styles.statusButtonText}>Deceased</Text>
                  </TouchableOpacity>
                </View>

                {animal.status === 'sold' && (
                  <View style={styles.saleInfo}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Selling Price (₹)</Text>
                      <TextInput
                        style={styles.input}
                        value={animal.sellingPrice?.toString() || ''}
                        onChangeText={(text) => handleSellingPriceChange(index, text)}
                        placeholder="Enter selling price"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Sold Date</Text>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => {
                          setSelectedAnimalIndex(index);
                          setShowDatePicker(true);
                        }}
                      >
                        <Text style={styles.dateText}>
                          {animal.soldDate ? new Date(animal.soldDate).toLocaleDateString() : 'Select date'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={selectedAnimalIndex >= 0 && record.individualAnimals[selectedAnimalIndex].soldDate 
            ? new Date(record.individualAnimals[selectedAnimalIndex].soldDate)
            : new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date && selectedAnimalIndex >= 0) {
              handleSoldDateChange(selectedAnimalIndex, date);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  animalCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  animalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  animalId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  soldBadge: {
    backgroundColor: '#4CAF50',
  },
  deceasedBadge: {
    backgroundColor: '#F44336',
  },
  activeBadge: {
    backgroundColor: '#2196F3',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusButton: {
    flex: 1,
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 4,
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  activeButton: {
    backgroundColor: '#2196F3',
  },
  soldButton: {
    backgroundColor: '#4CAF50',
  },
  deceasedButton: {
    backgroundColor: '#F44336',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  saleInfo: {
    marginTop: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
  },
  dateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
}); 
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
  Image,
  KeyboardAvoidingView,
  SafeAreaView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getAnimalRecordById, updateAnimalRecord } from '../../firebase/firestore';
import { Colors } from '../../constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AnimalRecord, HealthRecord, BreedingRecord, VaccinationRecord, AnimalExpense } from '../../firebase/firestore';

interface FormData {
  animalNumber: string;
  collectionNames: string[];
  purchaseDate: Date;
  purchasePrice: string;
  category: string;
  gender: 'male' | 'female';
  status: 'active' | 'sold' | 'deceased';
  description: string;
  notes: string;
  soldDate: Date;
  sellingPrice: string;
}

export default function EditRecordScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [image, setImage] = useState<string | null>(null);
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState<boolean>(false);
  const [showSoldDatePicker, setShowSoldDatePicker] = useState<boolean>(false);
  const [newCollection, setNewCollection] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    animalNumber: '',
    collectionNames: [],
    purchaseDate: new Date(),
    purchasePrice: '',
    category: '',
    gender: 'male',
    status: 'active',
    description: '',
    notes: '',
    soldDate: new Date(),
    sellingPrice: ''
  });

  useEffect(() => {
    loadRecord();
  }, [id]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      const record = await getAnimalRecordById(id as string);
      if (record) {
        setFormData({
          animalNumber: record.animalNumber || '',
          collectionNames: record.collectionNames || [],
          purchaseDate: new Date(record.purchaseDate),
          purchasePrice: record.purchasePrice?.toString() || '',
          category: record.category || '',
          gender: record.gender || 'male',
          status: record.status || 'active',
          description: record.description || '',
          notes: record.notes || '',
          soldDate: record.soldDate ? new Date(record.soldDate) : new Date(),
          sellingPrice: record.sellingPrice?.toString() || ''
        });
        setImage(record.imageUrl || null);
      }
    } catch (error) {
      console.error('Error loading record:', error);
      Alert.alert('Error', 'Failed to load animal record');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async (): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to add images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleAddCollection = (): void => {
    if (!newCollection.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      collectionNames: [...prev.collectionNames, newCollection.trim()]
    }));
    setNewCollection('');
  };

  const handleRemoveCollection = (collection: string): void => {
    setFormData(prev => ({
      ...prev,
      collectionNames: prev.collectionNames.filter(c => c !== collection)
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!formData.animalNumber.trim()) {
      Alert.alert('Error', 'Please enter an animal number');
      return;
    }

    if (formData.collectionNames.length === 0) {
      Alert.alert('Error', 'Please add at least one collection');
      return;
    }

    if (formData.status === 'sold' && !formData.sellingPrice) {
      Alert.alert('Error', 'Please enter selling price for sold animals');
      return;
    }

    try {
      setLoading(true);
      const profit = formData.status === 'sold' 
        ? parseFloat(formData.sellingPrice) - parseFloat(formData.purchasePrice)
        : 0;
      const loss = formData.status === 'sold' && profit < 0 ? Math.abs(profit) : 0;

      await updateAnimalRecord(id as string, {
        ...formData,
        animalNumber: formData.animalNumber.trim(),
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        sellingPrice: formData.status === 'sold' ? parseFloat(formData.sellingPrice) : 0,
        soldDate: formData.status === 'sold' ? formData.soldDate.toISOString() : undefined,
        profit: formData.status === 'sold' ? Math.max(0, profit) : 0,
        loss: formData.status === 'sold' ? loss : 0,
        gender: formData.gender,
        status: formData.status,
        purchaseDate: formData.purchaseDate.toISOString(),
        imageUrl: image || undefined
      });
      
      Alert.alert('Success', 'Animal record updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating record:', error);
      Alert.alert('Error', 'Failed to update animal record');
    } finally {
      setLoading(false);
    }
  };

  const renderFieldLabel = (label: string, required: boolean = false): React.ReactElement => (
    <View style={styles.labelContainer}>
      <Text style={styles.label}>{label}</Text>
      {required && <Text style={styles.requiredIndicator}>*</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Loading record...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Animal</Text>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.imageContainer}>
              {image ? (
                <Image source={{ uri: image }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={48} color="#CCCCCC" />
                  <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.imageButton}
                onPress={handleImagePick}
              >
                <Ionicons name="camera" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.imageButtonText}>
                  {image ? 'Change Image' : 'Select Image'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Basic Information</Text>
              
              <View style={styles.inputGroup}>
                {renderFieldLabel('Animal Number', true)}
                <View style={styles.inputWithIcon}>
                  <Ionicons name="paw" size={20} color="#777" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.animalNumber}
                    onChangeText={(text: string) => setFormData(prev => ({ ...prev, animalNumber: text }))}
                    placeholder="Enter animal number"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                {renderFieldLabel('Collections', true)}
                <View style={styles.collectionsContainer}>
                  {formData.collectionNames.map((collection, index) => (
                    <View key={index} style={styles.collectionTag}>
                      <Text style={styles.collectionText}>{collection}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveCollection(collection)}
                        style={styles.removeCollectionButton}
                      >
                        <Ionicons name="close" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <View style={styles.addCollectionContainer}>
  <View style={styles.inputWithIcon}>
    <Ionicons name="folder" size={20} color="#777" style={styles.inputIcon} />
    <TextInput
      style={styles.collectionInput}
      value={newCollection}
      onChangeText={setNewCollection}
      placeholder="Add new collection"
      placeholderTextColor="#999"
    />
  </View>
  <TouchableOpacity
    style={styles.addCollectionButton}
    onPress={handleAddCollection}
  >
    <Ionicons name="add" size={22} color="#FFFFFF" />
  </TouchableOpacity>
</View>
              </View>

              <View style={styles.inputGroup}>
                {renderFieldLabel('Category')}
                <View style={styles.inputWithIcon}>
                  <Ionicons name="pricetag" size={20} color="#777" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.category}
                    onChangeText={(text: string) => setFormData(prev => ({ ...prev, category: text }))}
                    placeholder="Enter category"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                {renderFieldLabel('Gender')}
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      formData.gender === 'male' && styles.genderButtonActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                  >
                    <Ionicons 
                      name="male" 
                      size={20} 
                      color={formData.gender === 'male' ? '#FFFFFF' : '#666'} 
                    />
                    <Text style={[
                      styles.genderText,
                      formData.gender === 'male' && styles.genderTextActive
                    ]}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      formData.gender === 'female' && styles.genderButtonActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                  >
                    <Ionicons 
                      name="female" 
                      size={20} 
                      color={formData.gender === 'female' ? '#FFFFFF' : '#666'} 
                    />
                    <Text style={[
                      styles.genderText,
                      formData.gender === 'female' && styles.genderTextActive
                    ]}>Female</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                {renderFieldLabel('Status')}
                <View style={styles.statusContainer}>
                  {['active', 'sold', 'deceased'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusButton,
                        formData.status === status && styles.statusButtonActive
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, status: status as 'active' | 'sold' | 'deceased' }))}
                    >
                      <Text style={[
                        styles.statusText,
                        formData.status === status && styles.statusTextActive
                      ]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                {renderFieldLabel('Purchase Date', true)}
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowPurchaseDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color="#777" style={styles.inputIcon} />
                  <Text style={styles.dateText}>
                    {formData.purchaseDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                {showPurchaseDatePicker && (
                  <DateTimePicker
                    value={formData.purchaseDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowPurchaseDatePicker(false);
                      if (date) {
                        setFormData(prev => ({ ...prev, purchaseDate: date }));
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                {renderFieldLabel('Purchase Price', true)}
                <View style={styles.inputWithIcon}>
                  <Ionicons name="cash" size={20} color="#777" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.purchasePrice}
                    onChangeText={(text: string) => setFormData(prev => ({ ...prev, purchasePrice: text }))}
                    placeholder="Enter purchase price"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {formData.status === 'sold' && (
                <>
                  <View style={styles.inputGroup}>
                    {renderFieldLabel('Sold Date', true)}
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowSoldDatePicker(true)}
                    >
                      <Ionicons name="calendar" size={20} color="#777" style={styles.inputIcon} />
                      <Text style={styles.dateText}>
                        {formData.soldDate.toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                    {showSoldDatePicker && (
                      <DateTimePicker
                        value={formData.soldDate}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                          setShowSoldDatePicker(false);
                          if (date) {
                            setFormData(prev => ({ ...prev, soldDate: date }));
                          }
                        }}
                      />
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    {renderFieldLabel('Selling Price', true)}
                    <View style={styles.inputWithIcon}>
                      <Ionicons name="cash" size={20} color="#777" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={formData.sellingPrice}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, sellingPrice: text }))}
                        placeholder="Enter selling price"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                {renderFieldLabel('Description')}
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text: string) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Enter description"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                {renderFieldLabel('Notes')}
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text: string) => setFormData(prev => ({ ...prev, notes: text }))}
                  placeholder="Enter notes"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.submitButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  backButton: {
    padding: 8,
  },
  formContainer: {
    padding: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#999999',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  imageButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666666',
  },
  requiredIndicator: {
    color: '#FF0000',
    marginLeft: 4,
  },
//   inputWithIcon: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F5F5F5',
//     borderRadius: 8,
//     paddingHorizontal: 12,
//   },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#333333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  collectionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  collectionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  collectionText: {
    color: '#FFFFFF',
    marginRight: 4,
  },
  removeCollectionButton: {
    padding: 2,
  },
  addCollectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputWithIcon: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    paddingVertical: 0,
    paddingHorizontal: 8,
    marginRight: 8,
    height: 44,
  },
//   inputIcon: {
//     marginRight: 8,
//   },
  collectionInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#333333',
    padding: 0,
  },
  addCollectionButton: {
    backgroundColor: Colors.light.tint,
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
//   collectionInput: {
//     flex: 1,
//     height: 48,
//     backgroundColor: '#F5F5F5',
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     color: '#333333',
//   },
//   addCollectionButton: {
//     backgroundColor: Colors.light.tint,
//     width: 48,
//     height: 48,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 8,
//   },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  genderButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  genderText: {
    marginLeft: 8,
    color: '#666666',
  },
  genderTextActive: {
    color: '#FFFFFF',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statusButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  statusText: {
    color: '#666666',
  },
  statusTextActive: {
    color: '#FFFFFF',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  dateText: {
    flex: 1,
    color: '#333333',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666666',
  },
}); 
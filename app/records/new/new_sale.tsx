import React, { useState } from 'react';
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
  SafeAreaView,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { addAnimalRecord } from '../../../firebase/firestore';
import { Colors } from '../../../constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AnimalRecord, HealthRecord, BreedingRecord, VaccinationRecord, AnimalExpense } from '../../../firebase/firestore';

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
  isBulk: boolean;
  quantity: string;
  individualAnimals: Array<{
    id: string;
    status: 'active' | 'sold' | 'deceased';
    soldDate?: Date;
    sellingPrice?: string;
  }>;
}

export default function NewSaleRecordScreen(): React.ReactElement {
  const router = useRouter();
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
    sellingPrice: '',
    isBulk: false,
    quantity: '1',
    individualAnimals: []
  });

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

    if (formData.isBulk && (!formData.quantity || parseInt(formData.quantity) < 1)) {
      Alert.alert('Error', 'Please enter a valid quantity for bulk animals');
      return;
    }

    try {
      setLoading(true);
      
      // Calculate individual animal expenses and profits
      const quantity = formData.isBulk ? parseInt(formData.quantity) : 1;
      const totalExpense = parseFloat(formData.purchasePrice) || 0;
      const expensePerAnimal = totalExpense / quantity;

      // Handle sold date and price based on status
      const soldDate = formData.status === 'sold' ? formData.soldDate.toISOString() : '';
      const sellingPrice = formData.status === 'sold' ? parseFloat(formData.sellingPrice) : 0;
      const profit = formData.status === 'sold' ? Math.max(0, sellingPrice - totalExpense) : 0;
      const loss = formData.status === 'sold' ? Math.max(0, totalExpense - sellingPrice) : 0;

      const individualAnimals = formData.isBulk ? 
        Array(quantity).fill(null).map((_, index) => ({
          id: `${formData.animalNumber}-${index + 1}`,
          status: 'active' as const,
          daysInFarm: 0,
          individualExpense: expensePerAnimal,
          individualProfit: 0,
          individualLoss: 0,
          soldDate: '',
          sellingPrice: 0
        })) : 
        [{
          id: formData.animalNumber,
          status: formData.status,
          soldDate: soldDate,
          sellingPrice: sellingPrice,
          daysInFarm: 0,
          individualExpense: totalExpense,
          individualProfit: profit,
          individualLoss: loss
      }];

      await addAnimalRecord({
        ...formData,
        animalNumber: formData.animalNumber.trim(),
        purchasePrice: totalExpense,
        sellingPrice: sellingPrice,
        soldDate: soldDate,
        profit: profit,
        loss: loss,
        gender: formData.gender,
        status: formData.status,
        purchaseDate: formData.purchaseDate.toISOString(),
        isBulk: formData.isBulk,
        quantity: quantity,
        individualAnimals: individualAnimals,
        expenses: {},
        userId: formData.animalNumber,
        salePrice: 0,
        date: new Date().toISOString(),
        weight: 0,
        animalType: '',
        recordType: '',
        collectionNames: formData.collectionNames,
        saleDate: soldDate,
        name: '',
        collectionName: ''
      });
      
      Alert.alert('Success', 'Animal record added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding record:', error);
      Alert.alert('Error', 'Failed to add animal record');
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add New Animal</Text>
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
                  <Ionicons name="list" size={20} color="#777" style={styles.inputIcon} />
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
                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    style={[
                      styles.segmentButton,
                      formData.gender === 'male' && styles.segmentButtonActive,
                      { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                  >
                    <Ionicons 
                      name="male" 
                      size={18} 
                      color={formData.gender === 'male' ? '#FFFFFF' : '#666'} 
                      style={styles.segmentIcon}
                    />
                    <Text style={[
                      styles.segmentButtonText,
                      formData.gender === 'male' && styles.segmentButtonTextActive
                    ]}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.segmentButton,
                      formData.gender === 'female' && styles.segmentButtonActive,
                      { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                  >
                    <Ionicons 
                      name="female" 
                      size={18} 
                      color={formData.gender === 'female' ? '#FFFFFF' : '#666'} 
                      style={styles.segmentIcon}
                    />
                    <Text style={[
                      styles.segmentButtonText,
                      formData.gender === 'female' && styles.segmentButtonTextActive
                    ]}>Female</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Purchase Details</Text>
              
              <View style={styles.inputGroup}>
                {renderFieldLabel('Purchase Date')}
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowPurchaseDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color="#777" style={styles.dateButtonIcon} />
                  <Text style={styles.dateButtonText}>
                    {formData.purchaseDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                {showPurchaseDatePicker && (
                  <DateTimePicker
                    value={formData.purchaseDate}
                    mode="date"
                    display="default"
                    onChange={(event, date?: Date) => {
                      setShowPurchaseDatePicker(false);
                      if (date) {
                        setFormData(prev => ({ ...prev, purchaseDate: date }));
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                {renderFieldLabel('Purchase Price')}
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
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Status</Text>
              
              <View style={styles.inputGroup}>
                <View style={styles.statusContainer}>
                  {[
                    { value: 'active' as const, icon: 'checkmark-circle', label: 'Active' },
                    { value: 'sold' as const, icon: 'cash', label: 'Sold' },
                    // { value: 'deceased' as const, icon: 'alert-circle', label: 'Deceased' }
                  ].map(({ value, icon, label }) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.statusButton,
                        formData.status === value && styles.statusButtonActive
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <Ionicons 
                        name={icon as "checkmark-circle" | "cash" | "alert-circle"}
                        size={18} 
                        color={formData.status === value ? '#FFFFFF' : '#666'} 
                        style={styles.statusIcon}
                      />
                      <Text style={[
                        styles.statusButtonText,
                        formData.status === value && styles.statusButtonTextActive
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {formData.status === 'sold' && (
                <>
                  <View style={styles.inputGroup}>
                    {renderFieldLabel('Sold Date')}
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowSoldDatePicker(true)}
                    >
                      <Ionicons name="calendar" size={20} color="#777" style={styles.dateButtonIcon} />
                      <Text style={styles.dateButtonText}>
                        {formData.soldDate.toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                    {showSoldDatePicker && (
                      <DateTimePicker
                        value={formData.soldDate}
                        mode="date"
                        display="default"
                        onChange={(event, date?: Date) => {
                          setShowSoldDatePicker(false);
                          if (date) {
                            setFormData(prev => ({ ...prev, soldDate: date }));
                          }
                        }}
                      />
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    {renderFieldLabel('Sold Price', true)}
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
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Bulk Quantity</Text>
              
              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Bulk Entry</Text>
                  <Switch
                    value={formData.isBulk}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, isBulk: value }))}
                  />
                </View>

                {formData.isBulk && (
                  <View style={styles.inputGroup}>
                    {renderFieldLabel('Quantity', true)}
                    <View style={styles.inputWithIcon}>
                      <Ionicons name="calculator" size={20} color="#777" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={formData.quantity}
                        onChangeText={(text: string) => setFormData(prev => ({ ...prev, quantity: text }))}
                        placeholder="Enter quantity"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Additional Information</Text>
              
              <View style={styles.inputGroup}>
                {renderFieldLabel('Description')}
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text: string) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Enter description"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                {renderFieldLabel('Notes')}
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text: string) => setFormData(prev => ({ ...prev, notes: text }))}
                  placeholder="Enter additional notes"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" style={styles.submitButtonIcon} />
                  <Text style={styles.submitButtonText}>Add Animal</Text>
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
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  backButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  formContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  image: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F2F2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    color: '#AAAAAA',
    marginTop: 8,
    fontSize: 14,
  },
  imageButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  imageButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555555',
  },
  requiredIndicator: {
    color: '#FF6B6B',
    marginLeft: 4,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 15,
    color: '#333333',
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  collectionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  collectionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  collectionText: {
    color: '#FFFFFF',
    marginRight: 6,
    fontSize: 13,
  },
  removeCollectionButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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
  inputIcon: {
    marginRight: 8,
  },
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonIcon: {
    marginRight: 10,
  },
  dateButtonText: {
    fontSize: 15,
    color: '#333333',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  segmentButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  segmentIcon: {
    marginRight: 6,
  },
  segmentButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  statusButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  statusIcon: {
    marginRight: 6,
  },
  statusButtonText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 30,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555555',
    marginRight: 10,
  },
});
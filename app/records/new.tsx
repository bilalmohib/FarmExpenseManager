import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { addAnimalRecord, updateAnimalRecord } from '../../firebase/firestore';
import { uploadAnimalImage } from '../../firebase/storage';
import { getMonthlyExpense } from '../../firebase/firestore';
import { Colors } from '../../constants/Colors';

export default function NewRecordScreen() {
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [saleDate, setSaleDate] = useState<Date | null>(null);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [expenses, setExpenses] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [bulkQuantity, setBulkQuantity] = useState('1');
  const [calfNames, setCalfNames] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [showSaleDatePicker, setShowSaleDatePicker] = useState(false);
  const [monthlyExpenseExists, setMonthlyExpenseExists] = useState(false);
  const [calculatedValues, setCalculatedValues] = useState({
    profit: 0,
    loss: 0,
  });
  
  const router = useRouter();

  // Check if monthly expense exists for the current month
  useEffect(() => {
    const checkMonthlyExpense = async () => {
      try {
        const currentDate = new Date();
        const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        const expense = await getMonthlyExpense(monthStr);
        setMonthlyExpenseExists(expense !== null);
      } catch (error) {
        console.error('Error checking monthly expense:', error);
      }
    };
    
    checkMonthlyExpense();
  }, []);

  // Calculate profit or loss when inputs change
  useEffect(() => {
    calculateProfitLoss();
  }, [purchasePrice, salePrice, expenses, purchaseDate, saleDate]);

  const calculateProfitLoss = () => {
    if (!purchasePrice || isNaN(Number(purchasePrice))) return;
    
    const purchase = Number(purchasePrice);
    const sale = Number(salePrice) || 0;
    const additionalExpenses = Number(expenses) || 0;
    const totalExpense = purchase + additionalExpenses;
    
    if (sale > 0 && saleDate) {
      // Calculate profit or loss
      if (sale > totalExpense) {
        setCalculatedValues({
          profit: sale - totalExpense,
          loss: 0
        });
      } else {
        setCalculatedValues({
          profit: 0,
          loss: totalExpense - sale
        });
      }
    } else {
      setCalculatedValues({
        profit: 0,
        loss: 0
      });
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload images.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera permissions to take photos.');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSubmit = async () => {
    // Validate mandatory fields
    if (!purchaseDate || !purchasePrice || !collectionName || !bulkQuantity) {
      Alert.alert('Error', 'Please fill in all required fields: Purchase Date, Purchase Price, Collection Name, and Bulk Quantity');
      return;
    }
    
    if (!monthlyExpenseExists) {
      Alert.alert(
        'Monthly Expense Missing',
        'Please enter monthly expense for the current month before adding records. This is required for accurate profit/loss calculations.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Expenses', onPress: () => router.push('/expenses/new') }
        ]
      );
      return;
    }

    try {
      setLoading(true);
      
      // Prepare record data
      const recordData = {
        purchaseDate: purchaseDate.toISOString(),
        saleDate: saleDate ? saleDate.toISOString() : null,
        purchasePrice: Number(purchasePrice),
        salePrice: salePrice ? Number(salePrice) : null,
        expenses: Number(expenses) || 0,
        profit: calculatedValues.profit,
        loss: calculatedValues.loss,
        collectionName,
        bulkQuantity: Number(bulkQuantity),
        calfNames: calfNames.split(',').map(name => name.trim()).filter(name => name)
      };
      
      // Add record to Firestore
      const newRecord = await addAnimalRecord(recordData);
      
      // Upload image if selected
      if (image && newRecord.id) {
        const imageUrl = await uploadAnimalImage(image, newRecord.id);
        
        // Update record with image URL
        await updateAnimalRecord(newRecord.id, { imageURL: imageUrl });
      }
      
      Alert.alert('Success', 'Record added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error adding record:', error);
      Alert.alert('Error', error.message || 'Failed to add record');
    } finally {
      setLoading(false);
    }
  };

  // Simple date formatter
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Handle date selection without DateTimePicker
  const handlePurchaseDateChange = () => {
    // In a real implementation, this would open a date picker
    // For now, we'll just use the current date
    console.log('[MOCK] Opening date picker for purchase date');
    setPurchaseDate(new Date());
  };

  const handleSaleDateChange = () => {
    // In a real implementation, this would open a date picker
    // For now, we'll just use the current date
    console.log('[MOCK] Opening date picker for sale date');
    setSaleDate(new Date());
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add New Animal Record</Text>
        </View>
        
        {/* Image Picker */}
        <View style={styles.imageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={50} color="#CCC" />
              <Text style={styles.imagePlaceholderText}>Add Photo</Text>
            </View>
          )}
          
          <View style={styles.imageButtonsContainer}>
            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={24} color={Colors.light.tint} />
              <Text style={styles.imageButtonText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Ionicons name="images-outline" size={24} color={Colors.light.tint} />
              <Text style={styles.imageButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Form Fields */}
        <View style={styles.form}>
          {/* Purchase Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Purchase Date *</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={handlePurchaseDateChange}
            >
              <Text style={styles.dateText}>
                {formatDate(purchaseDate)}
              </Text>
              <Ionicons name="calendar-outline" size={24} color="#777" />
            </TouchableOpacity>
          </View>
          
          {/* Purchase Price */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Purchase Price *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash-outline" size={24} color="#777" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Amount"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          {/* Sale Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Sale Date (if sold)</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={handleSaleDateChange}
            >
              <Text style={styles.dateText}>
                {saleDate ? formatDate(saleDate) : 'Select Date'}
              </Text>
              <Ionicons name="calendar-outline" size={24} color="#777" />
            </TouchableOpacity>
          </View>
          
          {/* Sale Price */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Sale Price (if sold)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash-outline" size={24} color="#777" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Amount"
                value={salePrice}
                onChangeText={setSalePrice}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          {/* Additional Expenses */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Additional Expenses</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="wallet-outline" size={24} color="#777" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Amount"
                value={expenses}
                onChangeText={setExpenses}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          {/* Collection Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Collection Name *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="bookmark-outline" size={24} color="#777" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Group/Collection"
                value={collectionName}
                onChangeText={setCollectionName}
              />
            </View>
          </View>
          
          {/* Bulk Quantity */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Bulk Quantity *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calculator-outline" size={24} color="#777" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Number of animals"
                value={bulkQuantity}
                onChangeText={setBulkQuantity}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          {/* Calf Names */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Calf Names (comma separated)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="list-outline" size={24} color="#777" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Calf1, Calf2, Calf3..."
                value={calfNames}
                onChangeText={setCalfNames}
                multiline
              />
            </View>
          </View>
          
          {/* Calculated Profit/Loss */}
          {(calculatedValues.profit > 0 || calculatedValues.loss > 0) && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>
                {calculatedValues.profit > 0 ? 'Estimated Profit:' : 'Estimated Loss:'}
              </Text>
              <Text 
                style={[
                  styles.resultValue, 
                  calculatedValues.profit > 0 ? styles.profitText : styles.lossText
                ]}
              >
                {calculatedValues.profit > 0
                  ? `₹${calculatedValues.profit.toFixed(2)}`
                  : `₹${calculatedValues.loss.toFixed(2)}`
                }
              </Text>
            </View>
          )}
          
          {/* Warning about monthly expense */}
          {!monthlyExpenseExists && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning-outline" size={24} color="#FF9800" />
              <Text style={styles.warningText}>
                Please add the monthly expense for accurate profit/loss calculation.
              </Text>
            </View>
          )}
          
          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Save Record</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  header: {
    marginVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: 200,
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePlaceholderText: {
    color: '#999',
    marginTop: 10,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#F0F0F0',
  },
  imageButtonText: {
    color: Colors.light.tint,
    marginLeft: 5,
  },
  form: {
    marginBottom: 30,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 55,
    fontSize: 16,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 55,
  },
  dateText: {
    fontSize: 16,
  },
  resultContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profitText: {
    color: '#4CAF50',
  },
  lossText: {
    color: '#F44336',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    marginLeft: 10,
    color: '#FF9800',
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    height: 55,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
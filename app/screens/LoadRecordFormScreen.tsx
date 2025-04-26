import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, RadioButton, HelperText } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '@clerk/clerk-expo';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LoadRecordService } from '../services/LoadRecordService';
import { LoadRecord } from '../models/LoadRecord';

type FormData = {
  animalType: string;
  quantity: string;
  price: string;
  weight: string;
  notes: string;
  date: Date;
  recordType: 'load-in' | 'load-out';
};

const LoadRecordFormScreen = () => {
  const { user } = useUser();
  const navigation = useNavigation();
  const route = useRoute();
  // @ts-ignore - route params typing
  const { mode, recordId } = route.params || { mode: 'add' };
  const isEditMode = mode === 'edit';

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    animalType: '',
    quantity: '',
    price: '',
    weight: '',
    notes: '',
    date: new Date(),
    recordType: 'load-in',
  });

  const [errors, setErrors] = useState({
    animalType: '',
    quantity: '',
    price: '',
  });

  useEffect(() => {
    if (isEditMode && recordId) {
      fetchRecord();
    }
  }, [isEditMode, recordId]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const record = await LoadRecordService.getLoadRecordById(recordId);
      if (record) {
        setFormData({
          animalType: record.animalType,
          quantity: record.quantity.toString(),
          price: record.price.toString(),
          weight: record.weight ? record.weight.toString() : '',
          notes: record.notes || '',
          date: new Date(record.date),
          recordType: record.recordType as 'load-in' | 'load-out',
        });
      }
    } catch (error) {
      console.error('Error fetching record:', error);
      Alert.alert('Error', 'Failed to load record details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      animalType: '',
      quantity: '',
      price: '',
    };

    if (!formData.animalType.trim()) {
      newErrors.animalType = 'Animal type is required';
      isValid = false;
    }

    if (!formData.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
      isValid = false;
    } else if (isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
      isValid = false;
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
      isValid = false;
    } else if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = 'Price must be a valid number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm() || !user?.id) return;

    try {
      setLoading(true);

      const recordData = {
        userId: user.id,
        animalType: formData.animalType,
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        notes: formData.notes.trim() || null,
        date: formData.date.toISOString(),
        recordType: formData.recordType,
      };

      if (isEditMode && recordId) {
        await LoadRecordService.updateLoadRecord(recordId, recordData);
        Alert.alert('Success', 'Record updated successfully');
      } else {
        await LoadRecordService.addLoadRecord(recordData);
        Alert.alert('Success', 'Record added successfully');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving record:', error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'add'} record`);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{isEditMode ? 'Edit Record' : 'Add New Record'}</Text>
        
        <View style={styles.radioContainer}>
          <Text>Record Type:</Text>
          <RadioButton.Group
            onValueChange={(value) => setFormData({ ...formData, recordType: value as 'load-in' | 'load-out' })}
            value={formData.recordType}
          >
            <View style={styles.radioRow}>
              <RadioButton.Item 
                label="Purchase (Load In)" 
                value="load-in" 
                position="leading"
                style={styles.radioButton}
              />
              <RadioButton.Item 
                label="Sale (Load Out)" 
                value="load-out" 
                position="leading"
                style={styles.radioButton}
              />
            </View>
          </RadioButton.Group>
        </View>
        
        <TextInput
          label="Animal Type"
          value={formData.animalType}
          onChangeText={(text) => setFormData({ ...formData, animalType: text })}
          style={styles.input}
          error={!!errors.animalType}
          disabled={loading}
        />
        {errors.animalType ? <HelperText type="error">{errors.animalType}</HelperText> : null}
        
        <TextInput
          label="Quantity"
          value={formData.quantity}
          onChangeText={(text) => setFormData({ ...formData, quantity: text })}
          keyboardType="numeric"
          style={styles.input}
          error={!!errors.quantity}
          disabled={loading}
        />
        {errors.quantity ? <HelperText type="error">{errors.quantity}</HelperText> : null}
        
        <TextInput
          label="Price Per Unit"
          value={formData.price}
          onChangeText={(text) => setFormData({ ...formData, price: text })}
          keyboardType="numeric"
          style={styles.input}
          error={!!errors.price}
          disabled={loading}
          left={<TextInput.Affix text="₦" />}
        />
        {errors.price ? <HelperText type="error">{errors.price}</HelperText> : null}
        
        <TextInput
          label="Weight (kg, optional)"
          value={formData.weight}
          onChangeText={(text) => setFormData({ ...formData, weight: text })}
          keyboardType="numeric"
          style={styles.input}
          disabled={loading}
        />
        
        <Button 
          mode="outlined" 
          onPress={() => setShowDatePicker(true)}
          style={styles.dateButton}
          disabled={loading}
        >
          {formData.date.toDateString()}
        </Button>
        
        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
        
        <TextInput
          label="Notes (optional)"
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          style={styles.input}
          multiline
          numberOfLines={3}
          disabled={loading}
        />
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            onPress={handleSave} 
            style={styles.saveButton}
            loading={loading}
            disabled={loading}
          >
            {isEditMode ? 'Update' : 'Save'}
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={() => navigation.goBack()} 
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  radioContainer: {
    marginBottom: 15,
  },
  radioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  radioButton: {
    flex: 1,
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white',
  },
  dateButton: {
    marginVertical: 10,
  },
  buttonContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    flex: 1,
    marginLeft: 10,
  },
});

export default LoadRecordFormScreen; 
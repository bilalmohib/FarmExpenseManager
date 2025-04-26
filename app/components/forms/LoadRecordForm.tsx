import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, HelperText, RadioButton, Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { useUser } from '@clerk/clerk-expo';

import { addLoadRecord, updateLoadRecord } from '../../../firebase/firestore';
import { LoadRecord } from '../../models/LoadRecord';
import { formatDate, parseDate } from '../../utils/dateUtils';

type LoadRecordFormProps = {
  initialData?: LoadRecord;
  isEditing?: boolean;
};

type FormValues = {
  recordType: 'load-in' | 'load-out';
  animalType: string;
  quantity: string;
  weight: string;
  price: string;
  date: Date;
  notes: string;
};

const LoadRecordForm = ({ initialData, isEditing = false }: LoadRecordFormProps) => {
  const navigation = useNavigation();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      recordType: initialData?.recordType || 'load-in',
      animalType: initialData?.animalType || '',
      quantity: initialData?.quantity?.toString() || '',
      weight: initialData?.weight?.toString() || '',
      price: initialData?.price?.toString() || '',
      date: initialData?.date ? parseDate(initialData.date) : new Date(),
      notes: initialData?.notes || '',
    }
  });

  const recordType = watch('recordType');
  const quantity = watch('quantity');
  const price = watch('price');

  const calculateTotal = () => {
    const qtyNum = parseFloat(quantity || '0');
    const priceNum = parseFloat(price || '0');
    return isNaN(qtyNum) || isNaN(priceNum) ? '0.00' : (qtyNum * priceNum).toFixed(2);
  };

  const onSubmit = async (data: any) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add records');
      return;
    }

    try {
      setLoading(true);
      const formattedData = {
        ...data,
        quantity: parseFloat(data.quantity),
        weight: parseFloat(data.weight),
        price: parseFloat(data.price),
        date: formatDate(data.date),
        userId: user.id,
      };

      if (isEditing && initialData) {
        await updateLoadRecord(initialData.id, formattedData);
        Alert.alert('Success', 'Load record updated successfully');
      } else {
        await addLoadRecord(formattedData);
        Alert.alert('Success', 'Load record added successfully');
      }
      
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setValue('date', selectedDate);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>{isEditing ? 'Edit Load Record' : 'Add New Load Record'}</Text>
        
        <Controller
          control={control}
          name="recordType"
          rules={{ required: 'Record type is required' }}
          render={({ field: { onChange, value } }) => (
            <View style={styles.radioContainer}>
              <Text>Record Type:</Text>
              <RadioButton.Group onValueChange={onChange} value={value}>
                <View style={styles.radioButton}>
                  <RadioButton value="load-in" />
                  <Text>Load In (Purchase)</Text>
                </View>
                <View style={styles.radioButton}>
                  <RadioButton value="load-out" />
                  <Text>Load Out (Sale)</Text>
                </View>
              </RadioButton.Group>
              {errors.recordType && (
                <HelperText type="error">{errors.recordType.message}</HelperText>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="animalType"
          rules={{ required: 'Animal type is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                label="Animal Type"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.animalType}
                style={styles.input}
              />
              {errors.animalType && (
                <HelperText type="error">{errors.animalType.message}</HelperText>
              )}
            </>
          )}
        />

        <Controller
          control={control}
          name="quantity"
          rules={{ 
            required: 'Quantity is required',
            pattern: {
              value: /^\d+$/,
              message: 'Please enter a valid number'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                label="Quantity"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.quantity}
                keyboardType="numeric"
                style={styles.input}
              />
              {errors.quantity && (
                <HelperText type="error">{errors.quantity.message}</HelperText>
              )}
            </>
          )}
        />

        <Controller
          control={control}
          name="weight"
          rules={{ 
            required: 'Weight is required',
            pattern: {
              value: /^\d*\.?\d*$/,
              message: 'Please enter a valid number'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                label="Weight (kg)"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.weight}
                keyboardType="numeric"
                style={styles.input}
              />
              {errors.weight && (
                <HelperText type="error">{errors.weight.message}</HelperText>
              )}
            </>
          )}
        />

        <Controller
          control={control}
          name="price"
          rules={{ 
            required: 'Price is required',
            pattern: {
              value: /^\d*\.?\d*$/,
              message: 'Please enter a valid number'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                label={recordType === 'load-in' ? 'Purchase Price per Head' : 'Sale Price per Head'}
                mode="outlined"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.price}
                keyboardType="numeric"
                style={styles.input}
              />
              {errors.price && (
                <HelperText type="error">{errors.price.message}</HelperText>
              )}
            </>
          )}
        />

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalValue}>${calculateTotal()}</Text>
        </View>

        <Controller
          control={control}
          name="date"
          rules={{ required: 'Date is required' }}
          render={({ field: { value } }) => (
            <>
              <TextInput
                label="Date"
                mode="outlined"
                value={formatDate(value)}
                onFocus={() => setShowDatePicker(true)}
                style={styles.input}
                right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
              />
              {showDatePicker && (
                <DateTimePicker
                  value={value}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
            </>
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Notes"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea]}
            />
          )}
        />

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          {isEditing ? 'Update Record' : 'Save Record'}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 8,
  },
  textArea: {
    height: 100,
  },
  radioContainer: {
    marginBottom: 16,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginVertical: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    marginTop: 20,
    marginBottom: 40,
  },
});

export default LoadRecordForm; 
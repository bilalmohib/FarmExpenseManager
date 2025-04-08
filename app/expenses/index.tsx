import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { getMonthlyExpenses, addMonthlyExpense, updateMonthlyExpense, deleteMonthlyExpense, MonthlyExpense } from '../../firebase/firestore';

export default function ExpensesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState<MonthlyExpense[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<MonthlyExpense | null>(null);
  const [expenseType, setExpenseType] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Month selector data
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  
  useEffect(() => {
    loadExpenses();
  }, [selectedMonth, selectedYear]);
  
  const loadExpenses = async () => {
    try {
      setLoading(true);
      const fetchedExpenses = await getMonthlyExpenses(selectedYear, selectedMonth);
      setExpenses(fetchedExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'Failed to load expenses. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadExpenses();
  };
  
  const handleAddExpense = () => {
    setCurrentExpense(null);
    setExpenseType('');
    setDescription('');
    setAmount('');
    setModalVisible(true);
  };
  
  const handleEditExpense = (expense: MonthlyExpense) => {
    setCurrentExpense(expense);
    setExpenseType(expense.type);
    setDescription(expense.description || '');
    setAmount(expense.amount.toString());
    setModalVisible(true);
  };
  
  const handleDeleteExpense = (expense: MonthlyExpense) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this expense entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteMonthlyExpense(expense.id);
              loadExpenses();
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', 'Failed to delete expense. Please try again.');
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };
  
  const handleSaveExpense = async () => {
    if (!expenseType.trim()) {
      Alert.alert('Error', 'Please enter an expense type');
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    try {
      setModalVisible(false);
      setLoading(true);
      
      if (currentExpense) {
        // Update existing expense
        await updateMonthlyExpense(currentExpense.id, {
          type: expenseType.trim(),
          description: description.trim(),
          amount: amountNum,
          year: selectedYear,
          month: selectedMonth,
          date: new Date().toISOString(),
        });
      } else {
        // Add new expense
        await addMonthlyExpense({
          type: expenseType.trim(),
          description: description.trim(),
          amount: amountNum,
          year: selectedYear,
          month: selectedMonth,
          date: new Date().toISOString(),
        });
      }
      
      loadExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      Alert.alert('Error', 'Failed to save expense. Please try again.');
      setLoading(false);
    }
  };
  
  const changeMonth = (direction: 'prev' | 'next') => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;
    
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        newMonth = 12;
        newYear = selectedYear - 1;
      } else {
        newMonth = selectedMonth - 1;
      }
    } else {
      if (selectedMonth === 12) {
        newMonth = 1;
        newYear = selectedYear + 1;
      } else {
        newMonth = selectedMonth + 1;
      }
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };
  
  const renderMonthYear = () => {
    const monthName = months.find(m => m.value === selectedMonth)?.label;
    return `${monthName} ${selectedYear}`;
  };
  
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };
  
  const calculateTotal = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };
  
  const renderExpenseItem = ({ item }: { item: MonthlyExpense }) => {
    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseMain}>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseType}>{item.type}</Text>
            {item.description ? (
              <Text style={styles.expenseDescription}>{item.description}</Text>
            ) : null}
            <Text style={styles.expenseDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.expenseAmount}>{formatCurrency(item.amount)}</Text>
        </View>
        
        <View style={styles.expenseActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditExpense(item)}
          >
            <Ionicons name="create-outline" size={18} color={Colors.light.tint} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteExpense(item)}
          >
            <Ionicons name="trash-outline" size={18} color="#ff3b30" />
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Monthly Expenses</Text>
      </View>
      
      <View style={styles.monthSelector}>
        <TouchableOpacity
          style={styles.monthButton}
          onPress={() => changeMonth('prev')}
        >
          <Ionicons name="chevron-back" size={20} color="#555" />
        </TouchableOpacity>
        
        <Text style={styles.monthYearText}>{renderMonthYear()}</Text>
        
        <TouchableOpacity
          style={styles.monthButton}
          onPress={() => changeMonth('next')}
        >
          <Ionicons name="chevron-forward" size={20} color="#555" />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : (
        <>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Expenses</Text>
            <Text style={styles.totalAmount}>{formatCurrency(calculateTotal())}</Text>
          </View>
          
          {expenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No expenses recorded for this month</Text>
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={handleAddExpense}
              >
                <Text style={styles.addFirstButtonText}>Add First Expense</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={expenses}
              keyExtractor={(item) => item.id || String(Math.random())}
              renderItem={renderExpenseItem}
              contentContainerStyle={styles.listContainer}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          )}
          
          {expenses.length > 0 && (
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={handleAddExpense}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </>
      )}
      
      {/* Add/Edit Expense Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {currentExpense ? 'Edit Expense' : 'Add Expense'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Expense Type*</Text>
              <TextInput
                style={styles.input}
                value={expenseType}
                onChangeText={setExpenseType}
                placeholder="Feed, Medicine, Labor, etc."
                placeholderTextColor="#999"
              />
              
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Additional details..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              
              <Text style={styles.inputLabel}>Amount ($)*</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveExpense}
              >
                <Text style={styles.saveButtonText}>Save Expense</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: Colors.light.tint,
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  monthButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  listContainer: {
    padding: 15,
    paddingTop: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  addFirstButton: {
    marginTop: 20,
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  expenseCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  expenseDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  expenseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: 10,
  },
  actionText: {
    fontSize: 14,
    color: Colors.light.tint,
    marginLeft: 5,
  },
  deleteButton: {
    marginLeft: 15,
  },
  deleteText: {
    color: '#ff3b30',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
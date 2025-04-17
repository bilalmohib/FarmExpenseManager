// Firebase Firestore Implementation
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';

import { db, auth } from './config';
import { User } from './auth';

// Types
export interface AnimalRecord {
  id: string;
  animalNumber: string;
  collectionName: string;
  purchaseDate: string;
  purchasePrice: number;
  sellingPrice: number;
  soldDate?: string;
  description?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  saleDate?: string;
  loss: number;
  profit: number;
  userId?: string;
}

export interface MonthlyExpense {
  id: string;
  type: string;
  description?: string;
  amount: number;
  year: number;
  month: number;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

// Helper Functions
const getCurrentUserId = (): string => {
  if (!auth.currentUser) {
    console.log('No authenticated user, using default user ID');
    return 'default-public-user';
  }
  return auth.currentUser.uid;
};

const convertTimestampToString = (timestamp: Timestamp | undefined): string | undefined => {
  return timestamp ? timestamp.toDate().toISOString() : undefined;
};

const formatDocumentData = <T extends DocumentData>(docData: DocumentData, docId: string): T => {
  const formattedData = { id: docId, ...docData } as unknown as T;
  
  // Convert Firestore timestamps to ISO strings
  const data = formattedData as any;
  if (data.createdAt && data.createdAt instanceof Timestamp) {
    data.createdAt = convertTimestampToString(data.createdAt);
  }
  if (data.updatedAt && data.updatedAt instanceof Timestamp) {
    data.updatedAt = convertTimestampToString(data.updatedAt);
  }
  
  return formattedData;
};

// Collection References
const getAnimalRecordsRef = () => collection(db, 'animalRecords');
const getMonthlyExpensesRef = () => collection(db, 'monthlyExpenses');

// Animal Record Functions
export const addAnimalRecord = async (record: Omit<AnimalRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnimalRecord> => {
  try {
    const userId = getCurrentUserId();
    
    const docRef = await addDoc(getAnimalRecordsRef(), {
      ...record,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      profit: 0,
      loss: 0
    });
    
    const newRecord = {
      ...record,
      id: docRef.id,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as AnimalRecord;
    
    return newRecord;
  } catch (error: any) {
    console.error('Error adding record:', error);
    throw new Error(error.message || 'Failed to add record');
  }
};

export const getAnimalRecords = async (): Promise<AnimalRecord[]> => {
  try {
    const userId = getCurrentUserId();
    const q = query(
      getAnimalRecordsRef(),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const records: AnimalRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      records.push(formatDocumentData<AnimalRecord>(doc.data(), doc.id));
    });
    
    return records;
  } catch (error: any) {
    console.error('Error getting records:', error);
    throw new Error(error.message || 'Failed to get records');
  }
};

// Function alias for backward compatibility
export const getAllAnimalRecords = getAnimalRecords;

export const getAnimalRecordById = async (recordId: string): Promise<AnimalRecord | null> => {
  try {
    const docRef = doc(db, 'animalRecords', recordId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // No longer verify if record belongs to user
      return formatDocumentData<AnimalRecord>(docSnap.data(), docSnap.id);
    } 
    
    return null;
  } catch (error: any) {
    console.error('Error getting record:', error);
    throw new Error(error.message || 'Failed to get record');
  }
};

export const updateAnimalRecord = async (recordId: string, data: Partial<AnimalRecord>): Promise<AnimalRecord> => {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'animalRecords', recordId);
    
    // First, check if the document exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error(`Record with id ${recordId} not found`);
    }
    
    // No longer verify record ownership
    
    // Prepare update data (remove id and userId if present)
    const { id, userId: _, ...updateData } = data;
    
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    // Fetch the updated document
    const updatedDocSnap = await getDoc(docRef);
    const updatedData = updatedDocSnap.data();
    if (!updatedData) {
      throw new Error('Failed to retrieve updated record data');
    }
    return formatDocumentData<AnimalRecord>(updatedData, updatedDocSnap.id);
  } catch (error: any) {
    console.error('Error updating record:', error);
    throw new Error(error.message || 'Failed to update record');
  }
};

export const deleteAnimalRecord = async (recordId: string): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'animalRecords', recordId);
    
    // First, check if the document exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error(`Record with id ${recordId} not found`);
    }
    
    // No longer verify record ownership
    
    await deleteDoc(docRef);
  } catch (error: any) {
    console.error('Error deleting record:', error);
    throw new Error(error.message || 'Failed to delete record');
  }
};

// Monthly Expense Functions
export const getMonthlyExpenses = async (year?: number, month?: number): Promise<MonthlyExpense[]> => {
  try {
    const userId = getCurrentUserId();
    let q = query(
      getMonthlyExpensesRef(),
      where('userId', '==', userId)
    );
    
    if (year !== undefined && month !== undefined) {
      q = query(
        getMonthlyExpensesRef(),
        where('userId', '==', userId),
        where('year', '==', year),
        where('month', '==', month)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const expenses: MonthlyExpense[] = [];
    
    querySnapshot.forEach((doc) => {
      expenses.push(formatDocumentData<MonthlyExpense>(doc.data(), doc.id));
    });
    
    return expenses;
  } catch (error: any) {
    console.error('Error getting monthly expenses:', error);
    throw new Error(error.message || 'Failed to get monthly expenses');
  }
};

export const getAllMonthlyExpenses = async (): Promise<MonthlyExpense[]> => {
  try {
    const userId = getCurrentUserId();
    const q = query(
      getMonthlyExpensesRef(),
      where('userId', '==', userId),
      orderBy('year', 'desc'),
      orderBy('month', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const expenses: MonthlyExpense[] = [];
    
    querySnapshot.forEach((doc) => {
      expenses.push(formatDocumentData<MonthlyExpense>(doc.data(), doc.id));
    });
    
    return expenses;
  } catch (error: any) {
    console.error('Error getting all monthly expenses:', error);
    throw new Error(error.message || 'Failed to get monthly expenses');
  }
};

export const getMonthlyExpenseById = async (id: string): Promise<MonthlyExpense | null> => {
  try {
    const docRef = doc(db, 'monthlyExpenses', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const userId = getCurrentUserId();
      const data = docSnap.data();
      
      // Verify that the expense belongs to the current user
      if (data.userId !== userId) {
        throw new Error('Unauthorized access to expense');
      }
      
      return formatDocumentData<MonthlyExpense>(data, docSnap.id);
    }
    
    return null;
  } catch (error: any) {
    console.error('Error getting monthly expense by ID:', error);
    throw new Error(error.message || 'Failed to get monthly expense');
  }
};

export const getMonthlyExpense = async (month: string): Promise<MonthlyExpense | null> => {
  try {
    // Parse month string in YYYY-MM format
    const [yearStr, monthStr] = month.split('-');
    if (!yearStr || !monthStr) return null;
    
    const year = parseInt(yearStr);
    const monthNum = parseInt(monthStr);
    
    const userId = getCurrentUserId();
    const q = query(
      getMonthlyExpensesRef(),
      where('userId', '==', userId),
      where('year', '==', year),
      where('month', '==', monthNum)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    
    // Get the first matching expense
    const doc = querySnapshot.docs[0];
    return formatDocumentData<MonthlyExpense>(doc.data(), doc.id);
  } catch (error: any) {
    console.error('Error getting monthly expense:', error);
    throw new Error(error.message || 'Failed to get monthly expense');
  }
};

export const addMonthlyExpense = async (expense: Omit<MonthlyExpense, 'id' | 'createdAt' | 'updatedAt'>): Promise<MonthlyExpense> => {
  try {
    const userId = getCurrentUserId();
    
    const docRef = await addDoc(getMonthlyExpensesRef(), {
      ...expense,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    const newExpense = {
      ...expense,
      id: docRef.id,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as MonthlyExpense;
    
    return newExpense;
  } catch (error: any) {
    console.error('Error adding monthly expense:', error);
    throw new Error(error.message || 'Failed to add monthly expense');
  }
};

export const updateMonthlyExpense = async (id: string, data: Partial<MonthlyExpense>): Promise<MonthlyExpense> => {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'monthlyExpenses', id);
    
    // First, check if the document exists and belongs to the user
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error(`Expense with id ${id} not found`);
    }
    
    const expenseData = docSnap.data();
    if (expenseData.userId !== userId) {
      throw new Error('Unauthorized access to expense');
    }
    
    // Prepare update data (remove id and userId if present)
    const { id: _, userId: __, ...updateData } = data;
    
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    // Fetch the updated document
    const updatedDocSnap = await getDoc(docRef);
    const updatedData = updatedDocSnap.data();
    if (!updatedData) {
      throw new Error(`Failed to retrieve updated expense data for id ${id}`);
    }
    return formatDocumentData<MonthlyExpense>(updatedData, updatedDocSnap.id);
  } catch (error: any) {
    console.error('Error updating monthly expense:', error);
    throw new Error(error.message || 'Failed to update monthly expense');
  }
};

export const deleteMonthlyExpense = async (id: string): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'monthlyExpenses', id);
    
    // First, check if the document exists and belongs to the user
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error(`Expense with id ${id} not found`);
    }
    
    const expenseData = docSnap.data();
    if (expenseData.userId !== userId) {
      throw new Error('Unauthorized access to expense');
    }
    
    await deleteDoc(docRef);
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    throw new Error(error.message || 'Failed to delete expense');
  }
};
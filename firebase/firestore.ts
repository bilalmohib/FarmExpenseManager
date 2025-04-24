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
  saleDate: any;
  expenses: {};
  id: string;
  animalNumber: string;
  collectionNames: string[];
  purchaseDate: string;
  purchasePrice: number;
  category: string;
  gender: 'male' | 'female';
  status: 'active' | 'sold' | 'deceased';
  description?: string;
  notes?: string;
  soldDate?: string;
  sellingPrice?: number;
  imageUrl?: string;
  profit?: number;
  loss?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  lastWeight?: number;
  lastWeightDate?: string;
  productionRecords?: Record<string, ProductionRecord>;
}

export interface MonthlyExpense {
  tags: any;
  id: string;
  type: string;
  group: string;
  description?: string;
  amount: number;
  year: number;
  month: number;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

// Types for sub-records
export interface HealthRecord {
  date: string;
  type: string;
  description: string;
  cost?: number;
  nextDueDate?: string;
}

export interface BreedingRecord {
  date: string;
  partnerId?: string;
  expectedDeliveryDate?: string;
  status: 'successful' | 'failed' | 'in_progress';
  notes?: string;
}

export interface VaccinationRecord {
  date: string;
  type: string;
  nextDueDate?: string;
  notes?: string;
}

export interface AnimalExpense {
  date: string;
  type: string;
  amount: number;
  description?: string;
}

export interface ProductionRecord {
  type: 'milk' | 'meat' | 'wool' | 'eggs';
  quantity: number;
  unit: string;
  date: string;
  notes?: string;
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

// Utility Functions
export const calculateAge = (dateOfBirth: string): number => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const calculateGrowthRate = (currentWeight: number, previousWeight: number, days: number): number => {
  if (!previousWeight || !days) return 0;
  return (currentWeight - previousWeight) / days;
};

export const calculateFeedConversionRatio = (feedAmount: number, weightGain: number): number => {
  if (!weightGain) return 0;
  return feedAmount / weightGain;
};

// Collection References
const getAnimalRecordsRef = () => collection(db, 'animalRecords');
const getMonthlyExpensesRef = () => collection(db, 'monthlyExpenses');
const getHealthRecordsRef = (animalId: string) => collection(db, `animalRecords/${animalId}/healthRecords`);
const getBreedingRecordsRef = (animalId: string) => collection(db, `animalRecords/${animalId}/breedingRecords`);
const getVaccinationRecordsRef = (animalId: string) => collection(db, `animalRecords/${animalId}/vaccinationRecords`);
const getExpensesRef = (animalId: string) => collection(db, `animalRecords/${animalId}/expenses`);

// Animal Record Functions
export const addAnimalRecord = async (data: Omit<AnimalRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
  const docRef = doc(collection(db, 'animalRecords'));
  const now = new Date().toISOString();
  const record: AnimalRecord = {
    ...data,
    id: docRef.id,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(docRef, record);
  return record;
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
// export const getAllAnimalRecords = getAnimalRecords;

export const getAnimalRecordById = async (id: string): Promise<AnimalRecord | null> => {
  try {
    const docRef = doc(db, 'animalRecords', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const userId = getCurrentUserId();
      const data = docSnap.data();
      
      // Only verify user ID if it exists in the record
      if (data.userId && data.userId !== userId) {
        throw new Error('Unauthorized access to animal record');
      }
      
      return formatDocumentData<AnimalRecord>(data, docSnap.id);
    }
    
    return null;
  } catch (error: any) {
    console.error('Error getting animal record by ID:', error);
    throw new Error(error.message || 'Failed to get animal record');
  }
};

export const getAllAnimalRecords = async (): Promise<AnimalRecord[]> => {
  const querySnapshot = await getDocs(collection(db, "animalRecords"));
  const records: AnimalRecord[] = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as AnimalRecord[];

  return records;
};

export const updateAnimalRecord = async (id: string, data: Partial<AnimalRecord>) => {
  const docRef = doc(db, 'animalRecords', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
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

// Health Record Functions
export const addHealthRecord = async (animalId: string, healthRecord: HealthRecord): Promise<void> => {
  try {
    const docRef = await addDoc(getHealthRecordsRef(animalId), {
      ...healthRecord,
      createdAt: serverTimestamp()
    });
    
    // Update the animal record with the new health record
    const animalRef = doc(db, 'animalRecords', animalId);
    await updateDoc(animalRef, {
      lastHealthCheck: healthRecord.date,
      nextHealthCheck: healthRecord.nextDueDate,
      [`healthRecords.${docRef.id}`]: healthRecord
    });
  } catch (error: any) {
    console.error('Error adding health record:', error);
    throw new Error(error.message || 'Failed to add health record');
  }
};

// Breeding Record Functions
export const addBreedingRecord = async (animalId: string, breedingRecord: BreedingRecord): Promise<void> => {
  try {
    const docRef = await addDoc(getBreedingRecordsRef(animalId), {
      ...breedingRecord,
      createdAt: serverTimestamp()
    });
    
    // Update the animal record with the new breeding record
    const animalRef = doc(db, 'animalRecords', animalId);
    await updateDoc(animalRef, {
      lastBreeding: breedingRecord.date,
      nextBreeding: breedingRecord.expectedDeliveryDate,
      [`breedingRecords.${docRef.id}`]: breedingRecord
    });
  } catch (error: any) {
    console.error('Error adding breeding record:', error);
    throw new Error(error.message || 'Failed to add breeding record');
  }
};

// Vaccination Record Functions
export const addVaccinationRecord = async (animalId: string, vaccinationRecord: VaccinationRecord): Promise<void> => {
  try {
    const docRef = await addDoc(getVaccinationRecordsRef(animalId), {
      ...vaccinationRecord,
      createdAt: serverTimestamp()
    });
    
    // Update the animal record with the new vaccination record
    const animalRef = doc(db, 'animalRecords', animalId);
    await updateDoc(animalRef, {
      lastVaccination: vaccinationRecord.date,
      nextVaccination: vaccinationRecord.nextDueDate,
      [`vaccinationRecords.${docRef.id}`]: vaccinationRecord
    });
  } catch (error: any) {
    console.error('Error adding vaccination record:', error);
    throw new Error(error.message || 'Failed to add vaccination record');
  }
};

// Expense Functions
export const addExpense = async (animalId: string, expense: AnimalExpense): Promise<void> => {
  try {
    const docRef = await addDoc(getExpensesRef(animalId), {
      ...expense,
      createdAt: serverTimestamp()
    });
    
    // Update the animal record with the new expense
    const animalRef = doc(db, 'animalRecords', animalId);
    await updateDoc(animalRef, {
      [`expenses.${docRef.id}`]: expense
    });
  } catch (error: any) {
    console.error('Error adding expense:', error);
    throw new Error(error.message || 'Failed to add expense');
  }
};

export const updateAnimalWeight = async (animalId: string, weight: number): Promise<void> => {
  try {
    const animalRef = doc(db, 'animalRecords', animalId);
    const animalSnap = await getDoc(animalRef);
    
    if (!animalSnap.exists()) {
      throw new Error('Animal not found');
    }
    
    const animalData = animalSnap.data() as AnimalRecord;
    const previousWeight = animalData.lastWeight || 0;
    const previousWeightDate = animalData.lastWeightDate || new Date().toISOString();
    
    const days = Math.floor((new Date().getTime() - new Date(previousWeightDate).getTime()) / (1000 * 60 * 60 * 24));
    const growthRate = calculateGrowthRate(weight, previousWeight, days);
    
    await updateDoc(animalRef, {
      lastWeight: weight,
      lastWeightDate: new Date().toISOString(),
      growthRate
    });
  } catch (error: any) {
    console.error('Error updating weight:', error);
    throw new Error(error.message || 'Failed to update weight');
  }
};

export const updateAnimalProduction = async (
  animalId: string,
  productionType: 'milk' | 'meat' | 'wool' | 'eggs',
  data: Partial<NonNullable<AnimalRecord['productionRecords']>[typeof productionType]>
): Promise<void> => {
  try {
    const animalRef = doc(db, 'animalRecords', animalId);
    const field = `productionRecords.${productionType}`;
    
    await updateDoc(animalRef, {
      [field]: data
    });
  } catch (error: any) {
    console.error(`Error updating ${productionType} production:`, error);
    throw new Error(error.message || `Failed to update ${productionType} production`);
  }
};
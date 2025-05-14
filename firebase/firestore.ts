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

  import { db, auth} from './config';
  // import { User } from 'firebase/auth';
  import { ReactNode } from 'react';
  import { LoadRecord, NewLoadRecord } from '@/app/models/LoadRecord';
  import { createUserWithEmailAndPassword } from 'firebase/auth';

  // Types
  export interface AnimalRecord {
    name: any;
    collectionName: any;
    salePrice: number;
    date: any;
    weight: ReactNode;
    animalType: ReactNode;
    recordType: string;
    saleDate: any;
    expenses: {};
    id: string;
    animalNumber: string;
    LoadInPrice: number;
    LoadInDate: Timestamp;
    LoadOutDate: Timestamp;
    collectionNames: string[];
    purchaseDate: string;
    purchasePrice: number;
    category: string;
    gender: 'male' | 'female';
    status: 'active' | 'sold' | 'deceased' | 'loaded out';
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
    isBulk: boolean;
    quantity: number;
    individualAnimals?: Array<{
      id: string;
      status: 'active' | 'sold' | 'loaded out' | 'deceased';
      soldDate?: string;
      sellingPrice?: number;
      daysInFarm?: number;
      individualExpense?: number;
      individualProfit?: number;
      individualLoss?: number;
    }>;
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

  export interface UserPermission {
    canCreateInvoice: boolean;
    canCreateExpense: boolean;
    canViewMonthlyProfit: boolean;
    canManageAnimals: boolean;
    canManageCollections: boolean;
    canManageUsers: boolean;
    isAdmin: boolean;
  }

  export interface User {
    id: string;
    email: string;
    name: string;
    permissions: UserPermission;
    createdBy: string; // Admin's ID who created this user
    createdAt: Date;
  }

  // Helper Functions
  const getCurrentUserId = (): string => {
    if (!auth.currentUser) {
      console.log('No authenticated user, using default user ID');
      return 'default-public-user';
    }
    return auth.currentUser.uid;
  };

  const convertTimestampToString = (timestamp: Timestamp | Timestamp): string | '' => {
    return timestamp ? timestamp.toDate().toISOString() : timestamp;
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
  const getLoadRecordsRef = () => collection(db, 'loadRecords');

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

  // Load Animal Records

  export const addLoadRecord = async (data: Omit<NewLoadRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const docRef = doc(collection(db, 'animalRecords'));
    const now = new Date().toISOString();
    const record: NewLoadRecord = {
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
        // if (data.userId && data.userId !== userId) {
        //   throw new Error('Unauthorized access to animal record');
        // }
        
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

  export const getAllLoadRecords = async (): Promise<LoadRecord[]> => {
    // const querySnapshot = await getDocs(collection(db, "animalRecords"));
    const animalRef = collection(db, 'animalRecords');
    const q = query(animalRef, where('recordType', '==', 'load'));

    const querySnapshot = await getDocs(q);
    // const data: Expense[] = querySnapshot.docs.map((doc) => ({
    //   id: doc.id,
    //   ...doc.data(),
    // })) as Expense[];
    const records: LoadRecord[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as LoadRecord[];

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
        // where('userId', '==', userId)
      );
      
      if (year !== undefined && month !== undefined) {
        q = query(
          getMonthlyExpensesRef(),
          // where('userId', '==', userId),
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

  // Load Record Functions
  // export const addLoadRecord = async (data: Omit<LoadRecord, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'>) => {
  //   const docRef = doc(collection(db, 'loadRecords'));
  //   const now = new Date().toISOString();
  //   const totalAmount = data.quantity * data.price;
    
  //   const record: LoadRecord = {
  //     ...data,
  //     id: docRef.id,
  //     totalAmount,
  //     createdAt: now,
  //     updatedAt: now,
  //   };
    
  //   await setDoc(docRef, record);
  //   return record;
  // };

  export const getLoadRecords = async (userId: string) => {
    const q = query(
      getLoadRecordsRef(),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as LoadRecord);
  };

  export const getLoadRecordById = async (id: string) => {
    const docRef = doc(db, 'loadRecords', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as LoadRecord;
    }
    
    return null;
  };

  export const updateLoadRecord = async (id: string, data: Partial<LoadRecord>) => {
    const docRef = doc(db, 'loadRecords', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  };

  export const deleteLoadRecord = async (id: string) => {
    const docRef = doc(db, 'loadRecords', id);
    await deleteDoc(docRef);
  };

  export const createUser = async (user: User): Promise<void> => {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      ...user,
      createdAt: serverTimestamp()
    });
  };

  export const getUser = async (userId: string): Promise<User | null> => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() as User : null;
  };

  export const updateUserPermissions = async (
    userId: string,
    permissions: Partial<UserPermission>
  ): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      permissions: {
        ...permissions
      }
    });
  };

  export const createInitialAdmin = async (email: string, name: string): Promise<void> => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, 'admin123'); // Default password
      const userId = userCredential.user.uid;

      // Create admin user document in Firestore
      const adminUser: User = {
        id: userId,
        email,
        name,
        permissions: {
          canCreateInvoice: true,
          canCreateExpense: true,
          canViewMonthlyProfit: true,
          canManageAnimals: true,
          canManageCollections: true,
          canManageUsers: true,
          isAdmin: true
        },
        createdBy: 'system',
        createdAt: new Date()
      };

      await createUser(adminUser);
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  };

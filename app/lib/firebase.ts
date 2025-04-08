// Firebase services file (not a route)
// Use this file to import Firebase services in your components

// Export config
export { app, auth, db, storage } from '../../firebase/config';

// Export auth services
export * from '../../firebase/auth';

// Export firestore services
export * from '../../firebase/firestore';

// Export storage services
export * from '../../firebase/storage';

// Mock Firebase implementation
// This file simulates Firebase Authentication and other Firebase services
// Replace with actual Firebase implementation when ready

import { User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock User type to match Firebase User interface
interface MockUser extends User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

// Auth state observer callbacks
const authStateObservers: ((user: User | null) => void)[] = [];

// Mock animal records data
export interface AnimalRecord {
  id: string;
  name: string;
  category: string;
  breed?: string;
  dateOfBirth?: string;
  weight?: number;
  gender?: 'male' | 'female';
  purchaseDate: string;
  purchasePrice: number;
  sellDate?: string;
  sellPrice?: number;
  status: 'active' | 'sold' | 'deceased';
  notes?: string;
  imageUrl?: string;
  collectionName: string;
}

// Mock monthly expense data
export interface MonthlyExpense {
  id: string;
  month: number; // 1-12
  year: number;
  feed: number;
  healthcare: number;
  maintenance: number;
  labor: number;
  other: number;
  notes?: string;
  collectionNames?: string[]; // Associated collections
}

// Mock data store
const mockDataStore = {
  users: new Map<string, MockUser>(),
  animalRecords: [] as AnimalRecord[],
  monthlyExpenses: [] as MonthlyExpense[],
  currentUser: null as MockUser | null,
};

// Mock Auth State Change
export function onAuthStateChange(callback: (user: User | null) => void) {
  authStateObservers.push(callback);
  
  // Initial callback with current user
  setTimeout(() => {
    callback(mockDataStore.currentUser);
  }, 500);
  
  // Return unsubscribe function
  return () => {
    const index = authStateObservers.indexOf(callback);
    if (index > -1) {
      authStateObservers.splice(index, 1);
    }
  };
}

// Helper to notify all observers of auth state changes
function notifyAuthStateChange() {
  authStateObservers.forEach(callback => {
    callback(mockDataStore.currentUser);
  });
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  // Check AsyncStorage for a stored user
  try {
    const storedUser = await AsyncStorage.getItem('mockUser');
    if (storedUser) {
      mockDataStore.currentUser = JSON.parse(storedUser) as MockUser;
    }
  } catch (error) {
    console.error('Error retrieving stored user:', error);
  }
  
  return mockDataStore.currentUser;
}

// Sign in with email and password
export async function signInWithEmailAndPassword(email: string, password: string): Promise<User> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Find user by email
  let foundUser: MockUser | undefined;
  mockDataStore.users.forEach(user => {
    if (user.email === email) {
      foundUser = user;
    }
  });
  
  if (!foundUser) {
    throw new Error('User not found');
  }
  
  // Update last sign-in time
  foundUser.metadata.lastSignInTime = new Date().toISOString();
  
  // Update current user
  mockDataStore.currentUser = foundUser;
  
  // Store in AsyncStorage
  await AsyncStorage.setItem('mockUser', JSON.stringify(foundUser));
  
  // Notify observers
  notifyAuthStateChange();
  
  return foundUser;
}

// Create user with email and password
export async function createUserWithEmailAndPassword(
  email: string, 
  password: string, 
  displayName: string
): Promise<User> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check if user already exists
  mockDataStore.users.forEach(user => {
    if (user.email === email) {
      throw new Error('Email already in use');
    }
  });
  
  // Create new user
  const now = new Date().toISOString();
  const newUser: MockUser = {
    uid: `mock-uid-${Date.now()}`,
    email,
    displayName,
    photoURL: null,
    emailVerified: false,
    isAnonymous: false,
    metadata: {
      creationTime: now,
      lastSignInTime: now,
    },
    // Add required properties from User interface
    delete: async () => Promise.resolve(),
    getIdToken: async () => Promise.resolve('mock-token'),
    getIdTokenResult: async () => Promise.resolve({
      token: 'mock-token',
      signInProvider: 'password',
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      issuedAtTime: now,
      authTime: now,
      claims: {},
      signInSecondFactor: null, // Added missing property
    }),
    reload: async () => Promise.resolve(),
    toJSON: () => ({ uid: `mock-uid-${Date.now()}` }),
    providerData: [{
      providerId: 'password',
      uid: email,
      displayName,
      email,
      phoneNumber: null,
      photoURL: null,
    }],
    refreshToken: '',
    tenantId: null,
    phoneNumber: null,
    providerId: ''
  };
  
  // Add to users map
  mockDataStore.users.set(newUser.uid, newUser);
  
  // Update current user
  mockDataStore.currentUser = newUser;
  
  // Store in AsyncStorage
  await AsyncStorage.setItem('mockUser', JSON.stringify(newUser));
  
  // Notify observers
  notifyAuthStateChange();
  
  return newUser;
}

// Sign out
export async function signOut(): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Clear current user
  mockDataStore.currentUser = null;
  
  // Clear from AsyncStorage
  await AsyncStorage.removeItem('mockUser');
  
  // Notify observers
  notifyAuthStateChange();
}

// Update user profile
export async function updateUserProfile(
  user: User,
  profileData: { displayName?: string; photoURL?: string }
): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockUser = mockDataStore.users.get(user.uid);
  if (!mockUser) {
    throw new Error('User not found');
  }
  
  // Update profile
  if (profileData.displayName) {
    mockUser.displayName = profileData.displayName;
  }
  
  if (profileData.photoURL) {
    mockUser.photoURL = profileData.photoURL;
  }
  
  // Update in storage
  mockDataStore.users.set(mockUser.uid, mockUser);
  
  // If this is the current user, update that too
  if (mockDataStore.currentUser?.uid === mockUser.uid) {
    mockDataStore.currentUser = mockUser;
    await AsyncStorage.setItem('mockUser', JSON.stringify(mockUser));
  }
}

// ================= Firestore Mock Functions =================

// Get all animal records
export async function getAnimalRecords(): Promise<AnimalRecord[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockDataStore.animalRecords];
}

// Get animal record by ID
export async function getAnimalRecordById(id: string): Promise<AnimalRecord | null> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const record = mockDataStore.animalRecords.find(record => record.id === id);
  return record || null;
}

// Add animal record
export async function addAnimalRecord(record: Omit<AnimalRecord, 'id'>): Promise<AnimalRecord> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const newRecord: AnimalRecord = {
    ...record,
    id: `record-${Date.now()}`,
  };
  
  mockDataStore.animalRecords.push(newRecord);
  return newRecord;
}

// Update animal record
export async function updateAnimalRecord(id: string, updates: Partial<AnimalRecord>): Promise<AnimalRecord> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const index = mockDataStore.animalRecords.findIndex(record => record.id === id);
  
  if (index === -1) {
    throw new Error('Record not found');
  }
  
  const updatedRecord = {
    ...mockDataStore.animalRecords[index],
    ...updates,
  };
  
  mockDataStore.animalRecords[index] = updatedRecord;
  return updatedRecord;
}

// Delete animal record
export async function deleteAnimalRecord(id: string): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const index = mockDataStore.animalRecords.findIndex(record => record.id === id);
  
  if (index === -1) {
    throw new Error('Record not found');
  }
  
  mockDataStore.animalRecords.splice(index, 1);
}

// Get all monthly expenses
export async function getMonthlyExpenses(): Promise<MonthlyExpense[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockDataStore.monthlyExpenses];
}

// Get monthly expense by month/year
export async function getMonthlyExpense(month: number, year: number): Promise<MonthlyExpense | null> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const expense = mockDataStore.monthlyExpenses.find(
    expense => expense.month === month && expense.year === year
  );
  
  return expense || null;
}

// Add or update monthly expense
export async function setMonthlyExpense(expense: Omit<MonthlyExpense, 'id'>): Promise<MonthlyExpense> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const existingIndex = mockDataStore.monthlyExpenses.findIndex(
    e => e.month === expense.month && e.year === expense.year
  );
  
  if (existingIndex !== -1) {
    // Update existing expense
    const updatedExpense = {
      ...mockDataStore.monthlyExpenses[existingIndex],
      ...expense,
    };
    mockDataStore.monthlyExpenses[existingIndex] = updatedExpense;
    return updatedExpense;
  } else {
    // Add new expense
    const newExpense: MonthlyExpense = {
      ...expense,
      id: `expense-${expense.year}-${expense.month}`,
    };
    mockDataStore.monthlyExpenses.push(newExpense);
    return newExpense;
  }
}

// Delete monthly expense
export async function deleteMonthlyExpense(id: string): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const index = mockDataStore.monthlyExpenses.findIndex(expense => expense.id === id);
  
  if (index === -1) {
    throw new Error('Expense not found');
  }
  
  mockDataStore.monthlyExpenses.splice(index, 1);
}

// ================= Storage Mock Functions =================

// Upload image
export async function uploadImage(uri: string, path: string): Promise<string> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return a mock image URL
  return `https://example.com/mock-images/${path}`;
}

// Delete image
export async function deleteImage(path: string): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // No real operation needed in mock
  console.log(`Mock deleted image at ${path}`);
}

// Sign in with Google
export async function signInWithGoogle(): Promise<User> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create a mock Google user
  const now = new Date().toISOString();
  const mockGoogleUser: MockUser = {
    uid: `google-${Date.now()}`,
    email: `user${Date.now()}@gmail.com`,
    displayName: 'Google User',
    photoURL: 'https://lh3.googleusercontent.com/a/default-user',
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    phoneNumber: null,
    providerId: 'google.com',
    emailVerified: true,
    isAnonymous: false,
    metadata: {
      creationTime: now,
      lastSignInTime: now,
    },
    delete: async () => Promise.resolve(),
    getIdToken: async () => Promise.resolve('mock-google-token'),
    getIdTokenResult: async () => Promise.resolve({
      token: 'mock-google-token',
      signInProvider: 'google.com',
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      issuedAtTime: now,
      authTime: now,
      claims: {},
      signInSecondFactor: null, // Added missing property
    }),
    reload: async () => Promise.resolve(),
    toJSON: () => ({ uid: `google-${Date.now()}` }),
    providerData: [{
      providerId: 'google.com',
      uid: `${Date.now()}`,
      displayName: 'Google User',
      email: `user${Date.now()}@gmail.com`,
      phoneNumber: null,
      photoURL: 'https://lh3.googleusercontent.com/a/default-user',
    }],
  };
  
  // Add to users map
  mockDataStore.users.set(mockGoogleUser.uid, mockGoogleUser);
  
  // Update current user
  mockDataStore.currentUser = mockGoogleUser;
  
  // Store in AsyncStorage
  await AsyncStorage.setItem('mockUser', JSON.stringify(mockGoogleUser));
  
  // Notify observers
  notifyAuthStateChange();
  
  return mockGoogleUser;
}

// Initialize with some sample data
(async () => {
  // Add sample admin user
  const adminUser: MockUser = {
    uid: 'admin-user',
    email: 'admin@example.com',
    displayName: 'Admin User',
    photoURL: null,
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    phoneNumber: null,
    providerId: 'password',
    emailVerified: true,
    isAnonymous: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    // Add required properties from User interface
    delete: async () => Promise.resolve(),
    getIdToken: async () => Promise.resolve('mock-token'),
    getIdTokenResult: async () => Promise.resolve({
      token: 'mock-token',
      signInProvider: 'password',
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      issuedAtTime: new Date().toISOString(),
      authTime: new Date().toISOString(),
      claims: {},
      signInSecondFactor: null,
    }),
    reload: async () => Promise.resolve(),
    toJSON: () => ({ uid: 'admin-user' }),
    providerData: [{
      providerId: 'password',
      uid: 'admin@example.com',
      displayName: 'Admin User',
      email: 'admin@example.com',
      phoneNumber: null,
      photoURL: null,
    }],
  };
  
  mockDataStore.users.set(adminUser.uid, adminUser);
  
  // Add some sample animal records
  mockDataStore.animalRecords = [
    {
      id: 'cow1',
      name: 'Bella',
      category: 'Cattle',
      breed: 'Holstein',
      dateOfBirth: '2020-05-15',
      weight: 550,
      gender: 'female',
      purchaseDate: '2021-01-10',
      purchasePrice: 800,
      status: 'active',
      notes: 'Healthy cow, good milk production',
      collectionName: 'Dairy Cows',
    },
    {
      id: 'goat1',
      name: 'Billy',
      category: 'Goats',
      breed: 'Boer',
      dateOfBirth: '2022-03-20',
      weight: 45,
      gender: 'male',
      purchaseDate: '2022-05-05',
      purchasePrice: 200,
      status: 'active',
      collectionName: 'Meat Goats',
    },
    {
      id: 'sheep1',
      name: 'Woolly',
      category: 'Sheep',
      breed: 'Merino',
      dateOfBirth: '2021-08-12',
      weight: 70,
      gender: 'female',
      purchaseDate: '2022-01-15',
      purchasePrice: 250,
      status: 'active',
      collectionName: 'Wool Sheep',
    },
    {
      id: 'cow2',
      name: 'Angus',
      category: 'Cattle',
      breed: 'Black Angus',
      dateOfBirth: '2019-11-08',
      weight: 800,
      gender: 'male',
      purchaseDate: '2020-06-20',
      purchasePrice: 1200,
      sellDate: '2023-01-15',
      sellPrice: 1800,
      status: 'sold',
      notes: 'Premium beef quality',
      collectionName: 'Beef Cattle',
    },
  ];
  
  // Add sample monthly expenses
  mockDataStore.monthlyExpenses = [
    {
      id: 'expense-2023-1',
      month: 1,
      year: 2023,
      feed: 800,
      healthcare: 200,
      maintenance: 150,
      labor: 500,
      other: 100,
      notes: 'Winter feed costs higher than expected',
      collectionNames: ['Dairy Cows', 'Meat Goats'],
    },
    {
      id: 'expense-2023-2',
      month: 2,
      year: 2023,
      feed: 750,
      healthcare: 100,
      maintenance: 200,
      labor: 500,
      other: 50,
      collectionNames: ['Dairy Cows', 'Meat Goats', 'Wool Sheep'],
    },
    {
      id: 'expense-2023-3',
      month: 3,
      year: 2023,
      feed: 700,
      healthcare: 350,
      maintenance: 100,
      labor: 500,
      other: 80,
      notes: 'Vaccination campaign for all animals',
      collectionNames: ['Dairy Cows', 'Meat Goats', 'Wool Sheep'],
    },
  ];
})(); 
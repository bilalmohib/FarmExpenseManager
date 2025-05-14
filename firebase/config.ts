import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  getAuth,
  initializeAuth,
} from 'firebase/auth';
// import { reactNativePersistence  } from 'firebase/auth/react-native'; // ✅ Correct import for React Native
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ This is correct for Expo
import * as firebaseAuth from 'firebase/auth';
// ✅ Your Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBcO30W-nwkl4d5vwu6Ev2HAtaLM2glQAc',
  authDomain: 'farmexpensemanager.firebaseapp.com',
  projectId: 'farmexpensemanager',
  storageBucket: 'farmexpensemanager.appspot.com', // ✅ fixed .app to .com
  messagingSenderId: '440452578045',
  appId: '1:440452578045:web:e844aa608f521272d0dc94',
};

        
const reactNativePersistence = (firebaseAuth as any).getReactNativePersistence;

// ✅ Initialize the app only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        
// initialize auth
const auth = initializeAuth(app, {
persistence: reactNativePersistence(AsyncStorage),
});

// ✅ Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };

// TODO: TEMPORARY FILE - Replace with actual Firebase implementation once dependencies are installed

// Firebase Configuration
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBcO30W-nwkl4d5vwu6Ev2HAtaLM2glQAc",
  authDomain: "farmexpensemanager.firebaseapp.com",
  projectId: "farmexpensemanager",
  storageBucket: "farmexpensemanager.firebasestorage.app",
  messagingSenderId: "440452578045",
  appId: "1:440452578045:web:e844aa608f521272d0dc94"
};


// Initialize Firebase - prevent duplicate initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export mock objects
export { app, auth, db, storage }; 
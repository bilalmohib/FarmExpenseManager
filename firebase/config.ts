// TODO: TEMPORARY FILE - Replace with actual Firebase implementation once dependencies are installed

// Firebase Configuration
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCOHRIkOgtolY6_vaDBjlYqL4EIUj5dQls",
  authDomain: "livestockmanagement-6c488.firebaseapp.com",
  projectId: "livestockmanagement-6c488",
  storageBucket: "livestockmanagement-6c488.firebasestorage.app",
  messagingSenderId: "310571190795",
  appId: "1:310571190795:web:e62bd80fbd41b56500550e",
  measurementId: "G-YZGWENEWE9"
};

// Initialize Firebase - prevent duplicate initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export mock objects
export { app, auth, db, storage }; 
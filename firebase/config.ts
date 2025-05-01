// // TODO: TEMPORARY FILE - Replace with actual Firebase implementation once dependencies are installed

// // Firebase Configuration
// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
// import storage from '@react-native-firebase/storage';

// // Initialize Firebase services
// const db = firestore();
// const storageRef = storage();

// // Export services
// export { auth, db, storageRef as storage }; 

// firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyBcO30W-nwkl4d5vwu6Ev2HAtaLM2glQAc",
    authDomain: "farmexpensemanager.firebaseapp.com",
    projectId: "farmexpensemanager",
    storageBucket: "farmexpensemanager.firebasestorage.app",
    messagingSenderId: "440452578045",
    appId: "1:440452578045:web:e844aa608f521272d0dc94"
  };
  
// Prevent re-initializing
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);


export { auth, db };

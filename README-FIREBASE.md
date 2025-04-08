# Firebase Setup for Farm Expense Manager App

This app uses Firebase for authentication, database, and storage. The current implementation uses a mock version of Firebase services due to installation issues, but below are instructions for setting up real Firebase services.

## Current Status

Currently, the app uses mock Firebase implementations to allow development to continue while Firebase dependency issues are resolved. The mock services simulate the behavior of:

- Firebase Authentication
- Firestore Database
- Firebase Storage

These mock services allow basic app functionality to work, but **data is not persistent** between app restarts and no real cloud functionality is available.

## Setting Up Real Firebase

Follow these steps to properly configure Firebase for this app:

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable Google Analytics (recommended)

### 2. Register Your App with Firebase

1. In the Firebase console, click the gear icon and select "Project settings"
2. In the "Your apps" section, click the add app button (</>) 
3. Select "Web" as the platform
4. Register your app with a nickname (e.g., "Farm Expense Manager")
5. Copy the Firebase configuration object that appears

### 3. Configure Firebase in Your App

1. Replace the placeholder configuration in `app/firebase/config.ts` with your actual Firebase configuration:

```typescript
// Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET", 
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Enable Authentication Methods

1. In the Firebase console, navigate to "Authentication" -> "Sign-in method"
2. Enable "Email/Password" and "Google" sign-in methods

### 5. Set Up Firestore Database

1. In the Firebase console, navigate to "Firestore Database"
2. Click "Create database"
3. Choose either production or test mode (recommended to start with test mode)
4. Select a location close to your users
5. Wait for the database to be created

### 6. Set Up Storage

1. In the Firebase console, navigate to "Storage"
2. Click "Get started" 
3. Accept the default security rules (you'll modify these later)
4. Select a location close to your users

### 7. Deploy Security Rules

1. In the Firebase console, navigate to "Firestore Database" -> "Rules"
2. Replace the default rules with the ones from `app/firebase/security-rules.txt`
3. Do the same for Storage rules

### 8. Replace Mock Implementations

After installing the Firebase packages successfully, you should:

1. Replace the mock Firebase configuration with the real one in `app/firebase/config.ts`
2. Replace the mock implementations in `app/firebase/auth.ts`, `app/firebase/firestore.ts`, and `app/firebase/storage.ts` with the real Firebase implementations

### 9. Install Required Dependencies

Try installing the Firebase dependencies using:

```bash
npx expo install firebase
expo install @react-native-async-storage/async-storage
expo install expo-image-picker
expo install expo-notifications
expo install @react-native-community/datetimepicker
```

If you encounter PowerShell execution policy restrictions, try:

```bash
cmd /c "npx expo install firebase"
```

Or modify your PowerShell execution policy temporarily:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Firestore Data Structure

The app uses the following data structure in Firestore:

```
users (collection)
  └── {uid} (document)
       ├── profile (document)
       └── records (collection)
            └── {recordId} (document)
                 - purchaseDate
                 - saleDate
                 - expenses
                 - profit
                 - loss
                 - collectionName
                 - bulkQuantity
                 - calfNames
                 - imageURL
       └── monthlyExpenses (collection)
            └── {YYYY-MM} (document)
                 - totalExpense
                 - createdAt
```

## Troubleshooting

If you encounter issues with Firebase dependencies:

1. Check that you're using compatible versions of Firebase packages with Expo
2. Ensure you have the latest version of Expo CLI
3. Try clearing npm cache: `npm cache clean --force`
4. Try using Yarn instead of npm: `yarn add firebase` 
// Re-export all Firebase modules
import { app, auth, db, storage } from '../../../firebase/config';

// Auth exports
export * from '../../../firebase/auth';

// Firestore exports
export * from '../../../firebase/firestore';

// Storage exports
export * from '../../../firebase/storage';

// Export config items
export { app, auth, db, storage }; 
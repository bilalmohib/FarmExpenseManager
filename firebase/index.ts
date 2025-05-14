// Re-export all Firebase modules
import { app, auth, db } from './config';

// Re-export services
export * from './auth';
// export * from './firestore';
export * from './storage';

// Export config items
export { app, auth, db }; 
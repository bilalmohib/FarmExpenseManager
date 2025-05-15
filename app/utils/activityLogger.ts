import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';

// Activity log types
export type ActivityType =
  | 'record_added'
  | 'record_updated'
  | 'record_deleted'
  | 'invoice_generated'
  | 'expense_added'
  | 'expense_updated'
  | 'expense_deleted'
  | 'user_login'
  | 'user_logout'
  | 'load_in'
  | 'load_out'
  | 'breeding_record'
  | 'health_record'
  | 'sale_record'
  | 'purchase_record'
  | 'user_management';

export interface ActivityLogData {
  type: ActivityType;
  description: string;
  metadata?: Record<string, any>;
  userName?: string;
  entityId?: string;
  entityType?: string;
  action?: 'create' | 'update' | 'delete' | 'view';
}

/**
 * Logs an activity to Firestore
 * @param data Activity log data
 * @returns Promise<void>
 */
export async function logActivity(data: ActivityLogData): Promise<void> {
  try {
    if (!auth.currentUser) {
      console.warn('Cannot log activity: No authenticated user');
      return;
    }
    
    const userId = auth.currentUser.uid;
    const userName = auth.currentUser.displayName || auth.currentUser.email || 'Unknown User';
    
    const activityRef = collection(db, 'activityLogs');
    await addDoc(activityRef, {
      ...data,
      userId,
      userName,
      timestamp: serverTimestamp()
    });
    
    console.log(`Activity logged: ${data.type} - ${data.description}`);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

/**
 * Higher-order function that wraps database operations with activity logging
 * @param operation The database operation to perform
 * @param logData The activity log data
 * @returns A function that performs the operation and logs the activity
 */
export function withActivityLogging<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  getLogData: (...args: [...T, R]) => ActivityLogData
): (...args: T) => Promise<R> {
  return async (...args: T) => {
    try {
      // Perform the database operation
      const result = await operation(...args);
      
      // Log the activity
      const logData = getLogData(...args, result);
      await logActivity(logData);
      
      return result;
    } catch (error) {
      // Re-throw the error after logging
      console.error("Operation failed with error:", error);
      throw error;
    }
  };
}

/**
 * Helper function to create activity descriptions based on action and entity
 */
export function createActivityDescription(
  action: 'created' | 'updated' | 'deleted' | 'viewed', 
  entityType: string, 
  entityName?: string
): string {
  const name = entityName ? ` "${entityName}"` : '';
  return `${action} ${entityType}${name}`;
} 
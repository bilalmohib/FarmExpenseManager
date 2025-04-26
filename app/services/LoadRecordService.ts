import { LoadRecord } from '../models/LoadRecord';
import { 
  addLoadRecord, 
  getLoadRecords, 
  getLoadRecordById, 
  updateLoadRecord, 
  deleteLoadRecord 
} from '../../firebase/firestore';

export const LoadRecordService = {
  async getLoadRecords(userId: string): Promise<LoadRecord[]> {
    try {
      return await getLoadRecords(userId);
    } catch (error) {
      console.error('Error fetching load records:', error);
      throw new Error('Failed to fetch load records');
    }
  },

  async getLoadRecordsByType(userId: string, recordType: 'load-in' | 'load-out'): Promise<LoadRecord[]> {
    try {
      const records = await getLoadRecords(userId);
      return records.filter(record => record.recordType === recordType);
    } catch (error) {
      console.error('Error fetching load records by type:', error);
      throw new Error('Failed to fetch load records by type');
    }
  },

  async getLoadRecordById(id: string): Promise<LoadRecord | null> {
    try {
      return await getLoadRecordById(id);
    } catch (error) {
      console.error('Error fetching load record:', error);
      throw new Error('Failed to fetch load record');
    }
  },

  async addLoadRecord(record: Omit<LoadRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<LoadRecord> {
    try {
      const result = await addLoadRecord(record);
      if (!result) {
        throw new Error('Failed to add load record');
      }
      return result;
    } catch (error) {
      console.error('Error adding load record:', error);
      throw new Error('Failed to add load record');
    }
  },

  async updateLoadRecord(
    id: string, 
    record: Partial<Omit<LoadRecord, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    try {
      await updateLoadRecord(id, record);
    } catch (error) {
      console.error('Error updating load record:', error);
      throw new Error('Failed to update load record');
    }
  },

  async deleteLoadRecord(id: string): Promise<void> {
    try {
      await deleteLoadRecord(id);
    } catch (error) {
      console.error('Error deleting load record:', error);
      throw new Error('Failed to delete load record');
    }
  }
}; 
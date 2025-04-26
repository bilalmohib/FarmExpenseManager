export interface LoadRecord {
  id: string;
  userId: string;
  recordType: 'load-in' | 'load-out'; // load-in = purchase, load-out = sale
  animalType: string;
  quantity: number;
  price: number;
  weight?: number;
  notes?: string;
  date: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export type NewLoadRecord = Omit<LoadRecord, 'id' | 'createdAt' | 'updatedAt'>; 
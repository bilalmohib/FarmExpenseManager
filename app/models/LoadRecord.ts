export interface LoadRecord {
  id: string;
  userId: string;
  recordType: 'load';
  animalType: string;
  LoadInPrice: number;
  loadInDate: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Additional optional properties
  animalNumber: string;
  pic?: string;
  collectionNames: string[];
  category?: string;
  gender?: string;
  description?: string;
  status?: string;
  loadOutDate?: Date;
  singleEntry?: boolean;
  ownerDetail?: string;
}

export type NewLoadRecord = Omit<LoadRecord, 'id' | 'createdAt' | 'updatedAt'> & {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  animalType: string;
  LoadInPrice: number;
  loadInDate: Date; // ISO date string
  animalNumber?: string;  
  pic?: string;
  collectionNames?: string[];
  category?: string;
  gender?: string;
  description?: string;
  status?: string;
  loadOutDate?: Date;
  singleEntry?: boolean;
  ownerDetail?: string;
};




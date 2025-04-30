import { openDB, DBSchema } from 'idb';
import { v4 as uuidv4 } from 'uuid';

interface OfflineTransaction {
  id: string;
  type: string;
  data: unknown;
  sync_status: number; // Changed from boolean to number
}

interface MyDB extends DBSchema {
  offline_transactions: {
    key: string;
    value: OfflineTransaction;
    indexes: { 'by-sync-status': number }; // Changed from boolean to number
  };
}

const DB_NAME = 'hybrid_db';
const DB_VERSION = 3; // Incremented version to trigger upgrade

export const initDB = async () => {
  const db = await openDB<MyDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // If old store exists, delete it
      if (oldVersion > 0 && db.objectStoreNames.contains('offline_transactions')) {
        db.deleteObjectStore('offline_transactions');
      }
      
      // Create store with correct index
      const store = db.createObjectStore('offline_transactions', {
        keyPath: 'id',
      });
      
      // Create index with number type
      store.createIndex('by-sync-status', 'sync_status', { unique: false });
    },
  });
  return db;
};

export const addTransaction = async (type: string, data: unknown) => {
  const db = await initDB();
  const transaction: OfflineTransaction = {
    id: uuidv4(),
    type,
    data,
    sync_status: 0, // 0 for unsynced
  };
  await db.add('offline_transactions', transaction);
  return transaction;
};

export const getUnsyncedTransactions = async () => {
  const db = await initDB();
  try {
    const index = db.transaction('offline_transactions', 'readonly').store.index('by-sync-status');
    const range = IDBKeyRange.only(0); // Use 0 for unsynced
    return await index.getAll(range);
  } catch (error) {
    console.error('Error getting unsynced transactions:', error);
    return [];
  }
};

export const markAsSynced = async (id: string) => {
  const db = await initDB();
  const tx = await db.get('offline_transactions', id);
  if (tx) {
    tx.sync_status = 1; // 1 for synced
    await db.put('offline_transactions', tx);
  }
};
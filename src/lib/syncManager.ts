import { supabase } from './supabase';
import { getUnsyncedTransactions, markAsSynced } from './indexedDB';
import { CircuitBreaker } from './resilience';

export class SyncManager {
  private syncInterval: number | null = null;
  private readonly posCircuitBreaker: CircuitBreaker;
  private readonly payrollCircuitBreaker: CircuitBreaker;

  constructor(private syncIntervalMs = 5000) {
    this.posCircuitBreaker = new CircuitBreaker('pos-transactions');
    this.payrollCircuitBreaker = new CircuitBreaker('payroll-entries');
  }

  start() {
    if (this.syncInterval === null) {
      this.syncInterval = window.setInterval(() => this.sync(), this.syncIntervalMs);
    }
  }

  stop() {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async sync() {
    try {
      const unsyncedTransactions = await getUnsyncedTransactions();
      
      for (const transaction of unsyncedTransactions) {
        try {
          // Push to Supabase based on transaction type with circuit breaker protection
          switch (transaction.type) {
            case 'POS_TRANSACTION':
              await this.posCircuitBreaker.execute(async () => {
                await supabase
                  .from('pos_transactions')
                  .insert(transaction.data);
              });
              break;
            case 'PAYROLL_ENTRY':
              await this.payrollCircuitBreaker.execute(async () => {
                await supabase
                  .from('payroll_entries')
                  .insert(transaction.data);
              });
              break;
          }
          
          // Mark as synced in IndexedDB
          await markAsSynced(transaction.id);
        } catch (error) {
          if (error instanceof CircuitBreakerError) {
            console.error('Service unavailable:', error.message);
            break; // Stop processing transactions of this type
          }
          console.error('Error syncing transaction:', transaction.id, error);
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }
}

export const syncManager = new SyncManager();
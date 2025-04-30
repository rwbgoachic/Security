import { useEffect, useState } from 'react'
import { syncManager } from './lib/syncManager'
import { addTransaction } from './lib/indexedDB'
import './App.css'

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Start sync manager
    syncManager.start()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      syncManager.stop()
    }
  }, [])

  const handleAddTransaction = async () => {
    try {
      const transaction = {
        amount: 100,
        description: 'Test transaction',
        timestamp: new Date().toISOString()
      }
      
      await addTransaction('POS_TRANSACTION', transaction)
    } catch (error) {
      console.error('Error adding transaction:', error)
    }
  }

  return (
    <div className="container">
      <h1>Hybrid Database Demo</h1>
      <div className="status">
        Network Status: {isOnline ? 'Online' : 'Offline'}
      </div>
      <button onClick={handleAddTransaction}>
        Add Test Transaction
      </button>
    </div>
  )
}

export default App
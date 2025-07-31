export class IndexedDBStorage {
  constructor(dbName = 'ColdCallingDB', version = 1) {
    this.dbName = dbName
    this.version = version
    this.db = null
  }

  // Initialize the database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Create object stores
        if (!db.objectStoreNames.contains('companies')) {
          db.createObjectStore('companies', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' })
        }
      }
    })
  }

  // Save all companies
  async saveCompanies(companies) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['companies'], 'readwrite')
      const store = transaction.objectStore('companies')

      // Clear existing companies
      const clearRequest = store.clear()
      
      clearRequest.onsuccess = () => {
        // Add all companies
        let completed = 0
        const total = companies.length

        if (total === 0) {
          resolve()
          return
        }

        companies.forEach(company => {
          const addRequest = store.add(company)
          addRequest.onsuccess = () => {
            completed++
            if (completed === total) {
              resolve()
            }
          }
          addRequest.onerror = () => reject(addRequest.error)
        })
      }

      clearRequest.onerror = () => reject(clearRequest.error)
    })
  }

  // Load all companies
  async loadCompanies() {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['companies'], 'readonly')
      const store = transaction.objectStore('companies')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  // Update a single company
  async updateCompany(company) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['companies'], 'readwrite')
      const store = transaction.objectStore('companies')
      const request = store.put(company)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Save settings (dialer position, click counts, etc.)
  async saveSetting(key, value) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readwrite')
      const store = transaction.objectStore('settings')
      const request = store.put({ key, value })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Load a setting
  async loadSetting(key, defaultValue = null) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly')
      const store = transaction.objectStore('settings')
      const request = store.get(key)

      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.value : defaultValue)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Export all data for backup
  async exportData() {
    const companies = await this.loadCompanies()
    const dialerPosition = await this.loadSetting('dialerPosition')
    const googleVoiceClicks = await this.loadSetting('googleVoiceClicks')

    return {
      companies,
      settings: {
        dialerPosition,
        googleVoiceClicks
      },
      exportDate: new Date().toISOString(),
      version: this.version
    }
  }

  // Import data from backup
  async importData(data) {
    if (data.companies) {
      await this.saveCompanies(data.companies)
    }

    if (data.settings) {
      for (const [key, value] of Object.entries(data.settings)) {
        if (value !== null && value !== undefined) {
          await this.saveSetting(key, value)
        }
      }
    }
  }

  // Clear all data
  async clearAllData() {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['companies', 'settings', 'metadata'], 'readwrite')
      
      let completed = 0
      const stores = ['companies', 'settings', 'metadata']
      
      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName)
        const request = store.clear()
        
        request.onsuccess = () => {
          completed++
          if (completed === stores.length) {
            resolve()
          }
        }
        request.onerror = () => reject(request.error)
      })
    })
  }

  // Get database size info
  async getStorageInfo() {
    if (!navigator.storage || !navigator.storage.estimate) {
      return { quota: 'Unknown', usage: 'Unknown' }
    }

    const estimate = await navigator.storage.estimate()
    return {
      quota: this.formatBytes(estimate.quota),
      usage: this.formatBytes(estimate.usage)
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

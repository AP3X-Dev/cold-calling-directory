export class FileStorage {
  constructor() {
    this.fileHandle = null
    this.autoSaveEnabled = true
    this.autoSaveInterval = 30000 // 30 seconds
    this.autoSaveTimer = null
  }

  // Check if File System Access API is supported
  static isSupported() {
    return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window
  }

  // Save data to a JSON file
  async saveData(data, filename = 'cold-calling-data.json') {
    try {
      if (!FileStorage.isSupported()) {
        // Fallback to download
        this.downloadAsFile(data, filename)
        return true
      }

      const options = {
        types: [{
          description: 'JSON files',
          accept: { 'application/json': ['.json'] }
        }],
        suggestedName: filename
      }

      this.fileHandle = await window.showSaveFilePicker(options)
      const writable = await this.fileHandle.createWritable()
      await writable.write(JSON.stringify(data, null, 2))
      await writable.close()

      console.log('Data saved successfully')
      return true
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error saving file:', error)
      }
      return false
    }
  }

  // Load data from a JSON file
  async loadData() {
    try {
      if (!FileStorage.isSupported()) {
        throw new Error('File System Access API not supported')
      }

      const options = {
        types: [{
          description: 'JSON files',
          accept: { 'application/json': ['.json'] }
        }],
        multiple: false
      }

      const [fileHandle] = await window.showOpenFilePicker(options)
      const file = await fileHandle.getFile()
      const text = await file.text()
      const data = JSON.parse(text)

      this.fileHandle = fileHandle
      console.log('Data loaded successfully')
      return data
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading file:', error)
      }
      return null
    }
  }

  // Auto-save to the same file (if previously saved)
  async autoSave(data) {
    if (!this.fileHandle || !this.autoSaveEnabled) return false

    try {
      const writable = await this.fileHandle.createWritable()
      await writable.write(JSON.stringify(data, null, 2))
      await writable.close()
      console.log('Auto-saved data')
      return true
    } catch (error) {
      console.error('Auto-save failed:', error)
      return false
    }
  }

  // Start auto-save timer
  startAutoSave(getData) {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }

    this.autoSaveTimer = setInterval(async () => {
      const data = getData()
      await this.autoSave(data)
    }, this.autoSaveInterval)
  }

  // Stop auto-save timer
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  // Fallback: Download as file (for unsupported browsers)
  downloadAsFile(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Import from file input (fallback method)
  async importFromInput(fileInput) {
    return new Promise((resolve, reject) => {
      const file = fileInput.files[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          resolve(data)
        } catch (error) {
          reject(new Error('Invalid JSON file'))
        }
      }
      reader.onerror = () => reject(new Error('Error reading file'))
      reader.readAsText(file)
    })
  }
}

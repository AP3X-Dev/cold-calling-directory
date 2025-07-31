import { PowerDialer } from './PowerDialer.js'
import { FileStorage } from '../utils/FileStorage.js'
import { IndexedDBStorage } from '../utils/IndexedDBStorage.js'

export class ColdCallingApp {
  constructor() {
    this.companies = []
    this.currentFilter = 'all'
    this.currentCityFilter = 'all'
    this.currentStateFilter = 'all'
    this.currentView = 'directory' // 'directory' or 'dialer' - default to directory
    this.powerDialer = null

    // Initialize storage systems
    this.fileStorage = new FileStorage()
    this.indexedDBStorage = new IndexedDBStorage()
    this.storageType = 'indexeddb' // 'indexeddb', 'file', or 'localStorage'

    // Load data on initialization
    this.loadData()
  }

  async init() {
    // Load data first
    await this.loadData()

    // Update existing companies to include city/state if missing
    this.updateExistingCompaniesWithCityState()

    // Check if we need to re-parse addresses for state extraction
    this.checkAndReParseIfNeeded()

    // If we have companies and default view is dialer, initialize power dialer
    if (this.companies.length > 0 && this.currentView === 'dialer') {
      this.initializePowerDialer()
    }
    this.render()
    this.attachEventListeners()

    // Start auto-save for file storage
    if (this.storageType === 'file') {
      this.fileStorage.startAutoSave(() => this.getAllData())
    }
  }

  render() {
    const app = document.querySelector('#app')
    const callClicks = localStorage.getItem('googleVoiceClicks') || 0

    if (this.currentView === 'dialer' && this.powerDialer) {
      app.innerHTML = this.powerDialer.render()
      this.powerDialer.attachEventListeners()
      return
    }

    app.innerHTML = `
      <div class="cold-calling-app">
        <header class="app-header">
          <h1>Cold Calling Directory</h1>
          <p>Pressure Washing Companies</p>
        </header>

        <div class="upload-section">
          <h2>Upload Company Data</h2>
          <input type="file" id="jsonUpload" accept=".json" />
          <button id="uploadBtn">Upload JSON File</button>
          <div class="click-tracker">
            <p><strong>Google Voice Clicks:</strong> <span id="gvClickCount">${callClicks}</span></p>
            <button id="resetClickCounter" class="reset-btn">Reset Counter</button>
          </div>
        </div>

        <div class="storage-section">
          <h2>Data Storage</h2>
          <div class="storage-controls">
            <div class="storage-type">
              <label>Storage Type:</label>
              <select id="storageType">
                <option value="indexeddb" ${this.storageType === 'indexeddb' ? 'selected' : ''}>IndexedDB (Recommended)</option>
                <option value="file" ${this.storageType === 'file' ? 'selected' : ''}>File Storage</option>
                <option value="localStorage" ${this.storageType === 'localStorage' ? 'selected' : ''}>Browser Storage</option>
              </select>
            </div>
            <div class="storage-actions">
              <button id="saveDataBtn" class="storage-btn">💾 Save Data</button>
              <button id="loadDataBtn" class="storage-btn">📁 Load Data</button>
              <button id="exportDataBtn" class="storage-btn">📤 Export Backup</button>
              <button id="importDataBtn" class="storage-btn">📥 Import Backup</button>
              <button id="reParseBtn" class="storage-btn">🔄 Re-parse Addresses</button>
            </div>
          </div>
        </div>

        <div class="view-controls">
          <button id="directoryView" class="view-btn ${this.currentView === 'directory' ? 'active' : ''}">
            📋 Directory View
          </button>
          <button id="dialerView" class="view-btn ${this.currentView === 'dialer' ? 'active' : ''}">
            📞 Power Dialer
          </button>
        </div>

        <div class="filter-section">
          <h3>Filter Companies</h3>
          <div class="filter-controls">
            <div class="filter-group">
              <label>Status:</label>
              <select id="statusFilter">
                <option value="all" ${this.currentFilter === 'all' ? 'selected' : ''}>All Statuses</option>
                <option value="not-called" ${this.currentFilter === 'not-called' ? 'selected' : ''}>Not Called</option>
                <option value="not-available" ${this.currentFilter === 'not-available' ? 'selected' : ''}>Not Available</option>
                <option value="not-interested" ${this.currentFilter === 'not-interested' ? 'selected' : ''}>Not Interested</option>
                <option value="voicemail" ${this.currentFilter === 'voicemail' ? 'selected' : ''}>Voicemail</option>
                <option value="wrong-number" ${this.currentFilter === 'wrong-number' ? 'selected' : ''}>Wrong Number</option>
                <option value="call-back" ${this.currentFilter === 'call-back' ? 'selected' : ''}>Call Back</option>
                <option value="sold" ${this.currentFilter === 'sold' ? 'selected' : ''}>Sold</option>
              </select>
            </div>

            <div class="filter-group">
              <label>City:</label>
              <select id="cityFilter">
                <option value="all" ${this.currentCityFilter === 'all' ? 'selected' : ''}>All Cities</option>
                ${this.getCityOptions()}
              </select>
            </div>

            <div class="filter-group">
              <label>State:</label>
              <select id="stateFilter">
                <option value="all" ${this.currentStateFilter === 'all' ? 'selected' : ''}>All States</option>
                ${this.getStateOptions()}
              </select>
            </div>
          </div>
        </div>

        <div class="companies-section">
          <h3>Companies (${this.getFilteredCompanies().length})</h3>
          <div id="companiesList" class="companies-list">
            ${this.renderCompanies()}
          </div>
        </div>
      </div>
    `
  }

  renderCompanies() {
    const filteredCompanies = this.getFilteredCompanies()
    
    if (filteredCompanies.length === 0) {
      return '<p class="no-companies">No companies found. Upload a JSON file to get started.</p>'
    }

    return filteredCompanies.map((company, index) => `
      <div class="company-card ${this.getCardColorClass(company.disposition)}" data-company-id="${company.id}" data-index="${index}">
        <div class="company-info">
          <div class="company-header">
            <h4>${company.title || 'Unknown Company'}</h4>
            ${this.renderRatingAndStatus(company)}
          </div>
          <div class="contact-details">
            <p><strong>Phone:</strong> ${company.phone || 'N/A'}</p>
            <p><strong>Website:</strong> ${company.website ? `<a href="${company.website}" target="_blank" onclick="event.stopPropagation()">${this.truncateUrl(company.website)}</a>` : 'N/A'}</p>
            <p><strong>Email:</strong> ${company.email || 'N/A'}</p>
            <p><strong>Contact:</strong> ${company.contactName || 'N/A'}</p>
            <p><strong>Address:</strong> ${company.originalData?.address || 'N/A'}</p>
            ${company.googleMapsUrl ? `<p><strong>Maps:</strong> <a href="${company.googleMapsUrl}" target="_blank" onclick="event.stopPropagation()">View on Google Maps</a></p>` : ''}
          </div>
          <div class="card-action">
            <span class="view-in-dialer">📞 View in Power Dialer</span>
          </div>
        </div>
        
        <div class="call-management">
          <div class="disposition-section">
            <label>Disposition:</label>
            <select class="disposition-select" data-company-id="${company.id}">
              <option value="">Select Status</option>
              <option value="not-available" ${company.disposition === 'not-available' ? 'selected' : ''}>Not Available</option>
              <option value="not-interested" ${company.disposition === 'not-interested' ? 'selected' : ''}>Not Interested</option>
              <option value="voicemail" ${company.disposition === 'voicemail' ? 'selected' : ''}>Voicemail</option>
              <option value="wrong-number" ${company.disposition === 'wrong-number' ? 'selected' : ''}>Wrong Number</option>
              <option value="call-back" ${company.disposition === 'call-back' ? 'selected' : ''}>Call Back</option>
              <option value="sold" ${company.disposition === 'sold' ? 'selected' : ''}>Sold</option>
            </select>
          </div>
          
          <div class="notes-section">
            <label>Call Notes:</label>
            <textarea class="call-notes" data-company-id="${company.id}" placeholder="Add notes about your call...">${company.notes || ''}</textarea>
            <button class="save-notes-btn" data-company-id="${company.id}">Save Notes</button>
          </div>
        </div>
      </div>
    `).join('')
  }

  getFilteredCompanies() {
    let filtered = this.companies

    // Filter by status
    if (this.currentFilter !== 'all') {
      if (this.currentFilter === 'not-called') {
        filtered = filtered.filter(company => !company.disposition)
      } else {
        filtered = filtered.filter(company => company.disposition === this.currentFilter)
      }
    }

    // Filter by city
    if (this.currentCityFilter !== 'all') {
      filtered = filtered.filter(company => company.city === this.currentCityFilter)
    }

    // Filter by state
    if (this.currentStateFilter !== 'all') {
      filtered = filtered.filter(company => company.state === this.currentStateFilter)
    }

    return filtered
  }

  attachEventListeners() {
    // File upload
    document.getElementById('uploadBtn').addEventListener('click', () => this.handleFileUpload())

    // Reset click counter
    const resetBtn = document.getElementById('resetClickCounter')
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        PowerDialer.resetGoogleVoiceClickCounter()
      })
    }

    // Storage controls
    document.getElementById('storageType').addEventListener('change', (e) => {
      this.storageType = e.target.value
    })

    document.getElementById('saveDataBtn').addEventListener('click', () => this.handleSaveData())
    document.getElementById('loadDataBtn').addEventListener('click', () => this.handleLoadData())
    document.getElementById('exportDataBtn').addEventListener('click', () => this.handleExportData())
    document.getElementById('importDataBtn').addEventListener('click', () => this.handleImportData())
    document.getElementById('reParseBtn').addEventListener('click', () => this.handleReParseAddresses())

    // View switching
    document.getElementById('directoryView').addEventListener('click', () => this.switchToDirectory())
    document.getElementById('dialerView').addEventListener('click', () => this.switchToDialer())

    // Filter changes
    document.getElementById('statusFilter').addEventListener('change', (e) => {
      this.currentFilter = e.target.value
      this.updateCompaniesList()
    })

    document.getElementById('cityFilter').addEventListener('change', (e) => {
      this.currentCityFilter = e.target.value
      this.updateCompaniesList()
    })

    document.getElementById('stateFilter').addEventListener('change', (e) => {
      this.currentStateFilter = e.target.value
      this.updateCompaniesList()
    })

    // Disposition changes
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('disposition-select')) {
        this.updateDisposition(e.target.dataset.companyId, e.target.value)
      }
    })

    // Save notes
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('save-notes-btn')) {
        const companyId = e.target.dataset.companyId
        const notesTextarea = document.querySelector(`textarea[data-company-id="${companyId}"]`)
        this.updateNotes(companyId, notesTextarea.value)
      }
    })

    // Click to view in Power Dialer
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.company-card')
      if (card && !e.target.closest('a') && !e.target.closest('select') && !e.target.closest('button') && !e.target.closest('textarea')) {
        const companyId = card.dataset.companyId
        this.openInPowerDialer(companyId)
      }
    })
  }

  handleFileUpload() {
    const fileInput = document.getElementById('jsonUpload')
    const file = fileInput.files[0]
    
    if (!file) {
      alert('Please select a JSON file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result)
        this.processUploadedData(jsonData)
      } catch (error) {
        alert('Error parsing JSON file: ' + error.message)
      }
    }
    reader.readAsText(file)
  }

  processUploadedData(jsonData) {
    const newCompanies = jsonData.map((item, index) => {
      // Handle both old and new JSON formats
      let title = item.title || item.name || 'Unknown Company'
      let phone = item.phone || item.phoneNumber || item.internationalPhoneNumber || null
      let website = item.website || null
      let email = item.email || null
      let contactName = item.contactName || null
      let address = item.address || null

      // Use existing city/state fields if available, otherwise parse from address
      let city = item.city || null
      let state = item.state || null

      // If city/state are missing, try to parse from address
      if (!city || !state) {
        const parsed = this.parseAddress(address)
        city = city || parsed.city
        state = state || parsed.state
      }

      // Handle full state names (convert "North Carolina" to "NC")
      if (state) {
        state = this.normalizeStateName(state)
      }

      // Debug logging for state extraction
      if (address && (!city || !state)) {
        console.log('Address parsing debug:', {
          address: address,
          parsed: this.parseAddress(address),
          finalCity: city,
          finalState: state
        })
      }

      // Extract additional data from new format
      let rating = item.rating || null
      let totalRatings = item.totalRatings || null
      let businessStatus = item.businessStatus || item.status || null
      let googleMapsUrl = item.googleMapsUrl || null
      let placeId = item.placeId || null

      return {
        id: `company_${Date.now()}_${index}`,
        title: title,
        phone: phone,
        website: website,
        email: email,
        contactName: contactName,
        city: city,
        state: state,
        disposition: null,
        notes: '',
        // Enhanced data from new format
        rating: rating,
        totalRatings: totalRatings,
        businessStatus: businessStatus,
        googleMapsUrl: googleMapsUrl,
        placeId: placeId,
        originalData: item
      }
    })

    this.companies = [...this.companies, ...newCompanies]
    this.saveData()

    // Debug: Log all extracted states
    const extractedStates = [...new Set(newCompanies.map(c => c.state).filter(s => s))]
    console.log('Extracted states:', extractedStates)

    // Re-render the entire view to update dropdowns with new cities/states
    this.render()
    this.attachEventListeners()

    alert(`Successfully uploaded ${newCompanies.length} companies`)
  }

  parseAddress(address) {
    // Handle null, undefined, empty, or "\N" addresses
    if (!address || address === '\\N' || address.trim() === '') {
      return { city: null, state: null }
    }

    // Common address formats:
    // "210 25th Ave N Suite 810, Nashville, TN 37203, United States"
    // "1300 Burtonwood Cir, Charlotte, NC 28212"
    // "Charlotte, NC 28212"
    // "Charlotte, NC"
    // "Phoenix AZ 85001" (without commas)
    // "123 Main St Phoenix AZ 85001"

    // First try comma-separated format
    const parts = address.split(',').map(part => part.trim())

    if (parts.length >= 2) {
      // Handle format: "Street, City, ST ZIP, Country"
      if (parts.length >= 3) {
        // Look for state in the third-to-last part (before country)
        for (let i = parts.length - 2; i >= 0; i--) {
          const part = parts[i]
          // Look for state pattern: "ST ZIP" or "State ZIP" or just "ST"
          const stateMatch = part.match(/^([A-Z]{2})\s*(\d{5})?/i) ||
                           part.match(/([A-Z]{2})\s*(\d{5})?$/i)

          if (stateMatch) {
            const state = stateMatch[1].toUpperCase()
            // City should be the part before this one
            const city = i > 0 ? parts[i - 1] : null
            return { city, state }
          }
        }
      }

      // Fallback: Get the last part which should contain state (and possibly zip)
      const lastPart = parts[parts.length - 1]
      // Get the second to last part which should be the city
      const cityPart = parts[parts.length - 2]

      // Skip if last part is "United States" or similar
      if (lastPart.toLowerCase().includes('united states') ||
          lastPart.toLowerCase().includes('usa') ||
          lastPart.toLowerCase().includes('us')) {
        // Try the part before "United States"
        if (parts.length >= 3) {
          const statePart = parts[parts.length - 2]
          const stateMatch = statePart.match(/^([A-Z]{2})\s*(\d{5})?/i) ||
                           statePart.match(/([A-Z]{2})\s*(\d{5})?$/i)
          if (stateMatch) {
            const state = stateMatch[1].toUpperCase()
            const city = parts.length >= 4 ? parts[parts.length - 3] : null
            return { city, state }
          }
        }
      } else {
        // Extract state (first 2 letters of last part)
        const stateMatch = lastPart.match(/^([A-Z]{2})/i)
        const state = stateMatch ? stateMatch[1].toUpperCase() : null

        // City is the second to last part
        const city = cityPart || null

        if (state && city) {
          return { city, state }
        }
      }
    }

    // If no commas, try space-separated format (common in some datasets)
    // Look for pattern: "City ST 12345" or "City ST"
    const spaceMatch = address.match(/\b([A-Za-z\s]+?)\s+([A-Z]{2})\s*(\d{5})?/i)
    if (spaceMatch) {
      const city = spaceMatch[1].trim()
      const state = spaceMatch[2].toUpperCase()
      return { city, state }
    }

    return { city: null, state: null }
  }

  normalizeStateName(state) {
    if (!state) return null

    // If already 2 letters, return as-is (uppercase)
    if (state.length === 2) {
      return state.toUpperCase()
    }

    // Map of full state names to abbreviations
    const stateMap = {
      'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
      'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
      'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
      'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
      'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
      'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
      'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
      'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
      'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
      'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
    }

    const normalized = stateMap[state.toLowerCase()]
    return normalized || state.toUpperCase()
  }

  updateDisposition(companyId, disposition) {
    const company = this.companies.find(c => c.id === companyId)
    if (company) {
      company.disposition = disposition
      this.saveToLocalStorage()
    }
  }

  updateNotes(companyId, notes) {
    const company = this.companies.find(c => c.id === companyId)
    if (company) {
      company.notes = notes
      this.saveToLocalStorage()
      alert('Notes saved successfully')
    }
  }

  updateCompaniesList() {
    const companiesList = document.getElementById('companiesList')
    if (companiesList) {
      companiesList.innerHTML = this.renderCompanies()
    }

    // Update count
    const countElement = document.querySelector('.companies-section h3')
    if (countElement) {
      countElement.textContent = `Companies (${this.getFilteredCompanies().length})`
    }

    // Update filter dropdowns to reflect current state
    this.updateFilterDropdowns()
  }

  updateFilterDropdowns() {
    // Update city filter options
    const cityFilter = document.getElementById('cityFilter')
    if (cityFilter) {
      cityFilter.innerHTML = `
        <option value="all" ${this.currentCityFilter === 'all' ? 'selected' : ''}>All Cities</option>
        ${this.getCityOptions()}
      `
    }

    // Update state filter options
    const stateFilter = document.getElementById('stateFilter')
    if (stateFilter) {
      stateFilter.innerHTML = `
        <option value="all" ${this.currentStateFilter === 'all' ? 'selected' : ''}>All States</option>
        ${this.getStateOptions()}
      `
    }
  }

  // New unified save method
  async saveData() {
    try {
      switch (this.storageType) {
        case 'indexeddb':
          await this.indexedDBStorage.saveCompanies(this.companies)
          break
        case 'file':
          // File storage saves manually or via auto-save
          break
        case 'localStorage':
        default:
          localStorage.setItem('companies', JSON.stringify(this.companies))
          break
      }
    } catch (error) {
      console.error('Error saving data:', error)
      // Fallback to localStorage
      localStorage.setItem('companies', JSON.stringify(this.companies))
    }
  }

  // Load data from selected storage
  async loadData() {
    try {
      switch (this.storageType) {
        case 'indexeddb':
          this.companies = await this.indexedDBStorage.loadCompanies()
          break
        case 'file':
          // File storage loads manually
          this.companies = JSON.parse(localStorage.getItem('companies')) || []
          break
        case 'localStorage':
        default:
          this.companies = JSON.parse(localStorage.getItem('companies')) || []
          break
      }
    } catch (error) {
      console.error('Error loading data:', error)
      this.companies = []
    }
  }

  // Get all data for export/backup
  getAllData() {
    return {
      companies: this.companies,
      settings: {
        dialerPosition: this.getLastDialerPosition(),
        googleVoiceClicks: localStorage.getItem('googleVoiceClicks') || 0
      },
      exportDate: new Date().toISOString()
    }
  }

  // Legacy method for compatibility
  saveToLocalStorage() {
    this.saveData()
  }

  // Storage event handlers
  async handleSaveData() {
    try {
      if (this.storageType === 'file') {
        const success = await this.fileStorage.saveData(this.getAllData())
        if (success) {
          alert('Data saved successfully!')
        }
      } else {
        await this.saveData()
        alert('Data saved successfully!')
      }
    } catch (error) {
      alert('Error saving data: ' + error.message)
    }
  }

  async handleLoadData() {
    try {
      if (this.storageType === 'file') {
        const data = await this.fileStorage.loadData()
        if (data) {
          if (data.companies) {
            this.companies = data.companies
          }
          if (data.settings) {
            if (data.settings.dialerPosition) {
              localStorage.setItem('dialerPosition', data.settings.dialerPosition)
            }
            if (data.settings.googleVoiceClicks) {
              localStorage.setItem('googleVoiceClicks', data.settings.googleVoiceClicks)
            }
          }
          this.render()
          this.attachEventListeners()
          alert('Data loaded successfully!')
        }
      } else {
        await this.loadData()
        this.render()
        this.attachEventListeners()
        alert('Data loaded successfully!')
      }
    } catch (error) {
      alert('Error loading data: ' + error.message)
    }
  }

  async handleExportData() {
    try {
      let data
      if (this.storageType === 'indexeddb') {
        data = await this.indexedDBStorage.exportData()
      } else {
        data = this.getAllData()
      }

      this.fileStorage.downloadAsFile(data, `cold-calling-backup-${new Date().toISOString().split('T')[0]}.json`)
      alert('Backup exported successfully!')
    } catch (error) {
      alert('Error exporting data: ' + error.message)
    }
  }

  async handleImportData() {
    try {
      const fileInput = document.createElement('input')
      fileInput.type = 'file'
      fileInput.accept = '.json'

      fileInput.onchange = async (e) => {
        try {
          const data = await this.fileStorage.importFromInput(fileInput)

          if (this.storageType === 'indexeddb') {
            await this.indexedDBStorage.importData(data)
            await this.loadData()
          } else {
            if (data.companies) {
              this.companies = data.companies
            }
            if (data.settings) {
              if (data.settings.dialerPosition) {
                localStorage.setItem('dialerPosition', data.settings.dialerPosition)
              }
              if (data.settings.googleVoiceClicks) {
                localStorage.setItem('googleVoiceClicks', data.settings.googleVoiceClicks)
              }
            }
            await this.saveData()
          }

          this.render()
          this.attachEventListeners()
          alert('Data imported successfully!')
        } catch (error) {
          alert('Error importing data: ' + error.message)
        }
      }

      fileInput.click()
    } catch (error) {
      alert('Error importing data: ' + error.message)
    }
  }

  async handleReParseAddresses() {
    try {
      const updated = this.reParseAllAddresses()
      alert(`Re-parsed ${updated} company addresses. Check console for details.`)
    } catch (error) {
      alert('Error re-parsing addresses: ' + error.message)
    }
  }

  switchToDirectory() {
    this.currentView = 'directory'
    this.render()
    this.attachEventListeners()
  }

  switchToDialer() {
    if (this.companies.length === 0) {
      alert('Please upload company data first')
      return
    }

    this.currentView = 'dialer'
    this.initializePowerDialer()
    this.render()
    // Note: attachEventListeners is called in render() for dialer view
  }

  initializePowerDialer() {
    const filteredCompanies = this.getFilteredCompanies()

    if (filteredCompanies.length === 0) {
      this.powerDialer = new PowerDialer(
        [],
        (company) => this.handleCompanyUpdate(company),
        () => this.switchToDirectory(),
        0
      )
      return
    }

    // Get last position before creating PowerDialer
    const lastPosition = this.getLastDialerPosition()
    const startIndex = (lastPosition !== null && lastPosition < filteredCompanies.length) ? lastPosition : 0

    this.powerDialer = new PowerDialer(
      filteredCompanies,
      (company) => this.handleCompanyUpdate(company),
      () => this.switchToDirectory(),
      startIndex // Pass the starting index to constructor
    )
  }

  handleCompanyUpdate(updatedCompany) {
    const index = this.companies.findIndex(c => c.id === updatedCompany.id)
    if (index !== -1) {
      this.companies[index] = updatedCompany
      this.saveToLocalStorage()
    }
  }

  getCardColorClass(disposition) {
    switch(disposition) {
      case 'not-available': return 'card-not-available'
      case 'not-interested': return 'card-not-interested'
      case 'voicemail': return 'card-voicemail'
      case 'wrong-number': return 'card-wrong-number'
      case 'call-back': return 'card-call-back'
      case 'sold': return 'card-sold'
      default: return ''
    }
  }

  saveDialerPosition(index) {
    localStorage.setItem('dialerPosition', index.toString())
  }

  getLastDialerPosition() {
    const position = localStorage.getItem('dialerPosition')
    return position !== null ? parseInt(position, 10) : null
  }

  truncateUrl(url) {
    if (!url) return 'N/A'
    // Remove protocol and www
    let display = url.replace(/^https?:\/\/(www\.)?/, '')
    // Truncate for directory view - shorter than Power Dialer
    if (display.length > 25) {
      display = display.substring(0, 22) + '...'
    }
    return display
  }

  renderRatingAndStatus(company) {
    let html = ''

    // Render rating if available
    if (company.rating && company.totalRatings) {
      const stars = '★'.repeat(Math.floor(company.rating)) + '☆'.repeat(5 - Math.floor(company.rating))
      html += `
        <div class="company-rating">
          <span class="stars">${stars}</span>
          <span class="rating-text">${company.rating} (${company.totalRatings} reviews)</span>
        </div>
      `
    }

    // Render business status if available
    if (company.businessStatus) {
      const statusClass = company.businessStatus === 'OPERATIONAL' ? 'status-open' : 'status-closed'
      const statusText = company.businessStatus === 'OPERATIONAL' ? 'Open' : company.businessStatus
      html += `
        <div class="business-status ${statusClass}">
          ${statusText}
        </div>
      `
    }

    return html
  }

  openInPowerDialer(companyId) {
    // Find the company index in the current filtered list
    const filteredCompanies = this.getFilteredCompanies()
    const companyIndex = filteredCompanies.findIndex(company => company.id === companyId)

    if (companyIndex !== -1) {
      // Save the position we want to jump to
      localStorage.setItem('dialerPosition', companyIndex.toString())

      // Switch to Power Dialer view
      this.switchToDialer()
    }
  }

  getCityOptions() {
    const cities = [...new Set(this.companies.map(company => company.city).filter(city => city))]
    return cities.sort().map(city =>
      `<option value="${city}" ${this.currentCityFilter === city ? 'selected' : ''}>${city}</option>`
    ).join('')
  }

  getStateOptions() {
    const states = [...new Set(this.companies.map(company => company.state).filter(state => state))]
    return states.sort().map(state =>
      `<option value="${state}" ${this.currentStateFilter === state ? 'selected' : ''}>${state}</option>`
    ).join('')
  }

  updateExistingCompaniesWithCityState() {
    let updated = false

    this.companies.forEach(company => {
      // Update if city/state are missing
      if (company.city === undefined || company.state === undefined ||
          (!company.city && !company.state)) {

        // First try to use direct city/state fields from originalData
        let city = company.originalData?.city || null
        let state = company.originalData?.state || null

        // If still missing, try to parse from address
        if (!city || !state) {
          const parsed = this.parseAddress(company.originalData?.address)
          city = city || parsed.city
          state = state || parsed.state
        }

        // Normalize state name
        if (state) {
          state = this.normalizeStateName(state)
        }

        company.city = city
        company.state = state
        updated = true
      }
    })

    // Save to localStorage if any companies were updated
    if (updated) {
      this.saveToLocalStorage()
    }
  }

  // Method to force re-parse all addresses (useful for debugging)
  reParseAllAddresses() {
    let updated = 0
    const debugInfo = []

    this.companies.forEach((company, index) => {
      const originalCity = company.city
      const originalState = company.state

      // Use direct city/state fields if available, otherwise parse from address
      let city = company.originalData?.city || null
      let state = company.originalData?.state || null

      // If city/state are missing, try to parse from address
      if (!city || !state) {
        const parsed = this.parseAddress(company.originalData?.address)
        city = city || parsed.city
        state = state || parsed.state

        // Debug info
        debugInfo.push({
          company: company.title,
          address: company.originalData?.address,
          parsed: parsed,
          oldCity: originalCity,
          oldState: originalState,
          newCity: city,
          newState: state
        })
      }

      // Normalize state name
      if (state) {
        state = this.normalizeStateName(state)
      }

      if (city !== company.city || state !== company.state) {
        company.city = city
        company.state = state
        updated++
      }
    })

    // Log debug information
    console.log('Address parsing debug info:', debugInfo)

    // Log all unique states found
    const allStates = [...new Set(this.companies.map(c => c.state).filter(s => s))]
    console.log('All extracted states:', allStates.sort())

    if (updated > 0) {
      this.saveData()
      this.render()
      this.attachEventListeners()
      console.log(`Re-parsed ${updated} company addresses`)
    }

    return updated
  }

  // Check if existing companies need state re-parsing
  checkAndReParseIfNeeded() {
    // Count companies that have addresses but no states
    const companiesWithAddressButNoState = this.companies.filter(company =>
      company.originalData?.address &&
      company.originalData.address !== '\\N' &&
      !company.state
    ).length

    // If more than 50% of companies with addresses don't have states, auto re-parse
    const companiesWithAddresses = this.companies.filter(company =>
      company.originalData?.address &&
      company.originalData.address !== '\\N'
    ).length

    if (companiesWithAddresses > 0 &&
        companiesWithAddressButNoState / companiesWithAddresses > 0.5) {
      console.log(`Auto re-parsing addresses: ${companiesWithAddressButNoState} of ${companiesWithAddresses} companies missing states`)
      const updated = this.reParseAllAddresses()
      if (updated > 0) {
        console.log(`Auto-parsed ${updated} company addresses for state extraction`)
      }
    }
  }
}

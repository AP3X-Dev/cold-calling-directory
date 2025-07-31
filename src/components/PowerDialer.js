export class PowerDialer {
  // Static flag to ensure Google Voice interception is only set up once globally
  static googleVoiceInterceptionSetup = false

  constructor(companies, onCompanyUpdate, onBackToDirectory, startIndex = 0) {
    this.companies = companies
    this.currentIndex = startIndex
    this.onCompanyUpdate = onCompanyUpdate
    this.onBackToDirectory = onBackToDirectory
  }

  render() {
    if (this.companies.length === 0) {
      return `
        <div class="power-dialer">
          <div class="power-dialer-header">
            <button id="backToDirectory" class="back-btn">← Back to Directory</button>
            <h2>Power Dialer</h2>
          </div>
          <div class="no-leads">
            <p>No leads available. Upload a JSON file first.</p>
          </div>
        </div>
      `
    }

    const company = this.companies[this.currentIndex]
    const progress = this.currentIndex + 1
    const total = this.companies.length

    return `
      <div class="power-dialer">
        <div class="power-dialer-header">
          <div class="header-left">
            <button id="backToDirectory" class="back-btn">← Back to Directory</button>
            <h2>Power Dialer</h2>
          </div>

          <div class="header-center">
            <button id="prevLead" class="nav-btn" ${this.currentIndex === 0 ? 'disabled' : ''}>
              ← Previous
            </button>
            <div class="lead-counter">
              ${progress} / ${total}
            </div>
            <button id="nextLead" class="nav-btn" ${this.currentIndex === this.companies.length - 1 ? 'disabled' : ''}>
              Next →
            </button>
          </div>

          <div class="header-right">
            <div class="progress-info">
              Lead ${progress} of ${total}
              ${this.isRestoredPosition() ? '<span class="restored-indicator">📍 Resumed</span>' : ''}
            </div>
          </div>
        </div>

        <div class="current-lead">
          <div class="lead-info">
            <div class="lead-header">
              <h3>${company.title || 'Unknown Company'}</h3>
              ${this.renderRatingAndStatus(company)}
            </div>

            <div class="contact-grid">
              <div class="contact-item">
                <label>📞 Phone:</label>
                <div class="editable-field" data-field="phone">
                  <span class="field-display" data-field="phone">${company.phone || 'Click to add phone'}</span>
                  <input type="tel" class="field-input hidden" data-field="phone" value="${company.phone || ''}" placeholder="Phone number">
                  ${company.phone ? this.createGoogleVoiceLink(company.phone) : ''}
                </div>
              </div>

              <div class="contact-item">
                <label>🌐 Website:</label>
                <div class="editable-field" data-field="website">
                  <span class="field-display" data-field="website">${company.website ? this.truncateUrl(company.website) : 'Click to add website'}</span>
                  <input type="url" class="field-input hidden" data-field="website" value="${company.website || ''}" placeholder="Website URL">
                  ${company.website ? `<a href="${company.website}" target="_blank" class="visit-link">🔗 Visit</a>` : ''}
                </div>
              </div>

              <div class="contact-item">
                <label>📧 Email:</label>
                <div class="editable-field" data-field="email">
                  <span class="field-display" data-field="email">${company.email || 'Click to add email'}</span>
                  <input type="email" class="field-input hidden" data-field="email" value="${company.email || ''}" placeholder="Email address">
                  ${company.email ? `<a href="mailto:${company.email}" class="email-link">📧 Email</a>` : ''}
                </div>
              </div>

              <div class="contact-item">
                <label>👤 Contact:</label>
                <div class="editable-field" data-field="contact">
                  <span class="field-display" data-field="contact">${company.contactName || 'Click to add contact'}</span>
                  <input type="text" class="field-input hidden" data-field="contact" value="${company.contactName || ''}" placeholder="Contact name">
                </div>
              </div>

              <div class="contact-item address-item">
                <label>📍 Address:</label>
                <div class="address">
                  ${company.originalData?.address || 'N/A'}
                  ${company.googleMapsUrl ? `<br><a href="${company.googleMapsUrl}" target="_blank" class="maps-link">🗺️ View on Google Maps</a>` : ''}
                </div>
              </div>
            </div>

            <div class="status-indicator ${company.disposition || 'not-called'}">
              Status: ${this.getStatusLabel(company.disposition)}
            </div>
          </div>

          <div class="call-actions">
            <div class="disposition-section">
              <label>Call Disposition:</label>
              <div class="disposition-buttons">
                <button class="disposition-btn disposition-not-available ${company.disposition === 'not-available' ? 'active' : ''}"
                        data-disposition="not-available">Not Available</button>
                <button class="disposition-btn disposition-not-interested ${company.disposition === 'not-interested' ? 'active' : ''}"
                        data-disposition="not-interested">Not Interested</button>
                <button class="disposition-btn disposition-voicemail ${company.disposition === 'voicemail' ? 'active' : ''}"
                        data-disposition="voicemail">Voicemail</button>
                <button class="disposition-btn disposition-wrong-number ${company.disposition === 'wrong-number' ? 'active' : ''}"
                        data-disposition="wrong-number">Wrong Number</button>
                <button class="disposition-btn disposition-call-back ${company.disposition === 'call-back' ? 'active' : ''}"
                        data-disposition="call-back">Call Back</button>
                <button class="disposition-btn disposition-sold ${company.disposition === 'sold' ? 'active' : ''}"
                        data-disposition="sold">Sold</button>
              </div>
            </div>

            <div class="notes-section">
              <label>📝 Call Notes:</label>
              <textarea id="currentLeadNotes" class="call-notes" placeholder="Add notes about your call...">${company.notes || ''}</textarea>
            </div>

            <div class="quick-actions">
              <button class="next-btn">Next Lead →</button>
            </div>
          </div>
        </div>

        <div class="keyboard-shortcuts">
          <small>
            <strong>Shortcuts:</strong>
            ← → Arrow keys to navigate |
            1-6 for dispositions |
            S to save & next |
            Space to skip
          </small>
        </div>
      </div>
    `
  }

  getStatusLabel(disposition) {
    const labels = {
      'not-available': 'Not Available',
      'not-interested': 'Not Interested',
      'voicemail': 'Voicemail',
      'wrong-number': 'Wrong Number',
      'call-back': 'Call Back',
      'sold': 'Sold'
    }
    return labels[disposition] || 'Not Called'
  }

  attachEventListeners() {
    // Back to directory
    const backBtn = document.getElementById('backToDirectory')
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.onBackToDirectory()
      })
    }

    // Navigation
    const prevBtn = document.getElementById('prevLead')
    const nextBtn = document.getElementById('nextLead')

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousLead())
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextLead())
    }

    // Disposition buttons
    document.querySelectorAll('.disposition-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const disposition = e.target.dataset.disposition
        this.updateCurrentDisposition(disposition)
      })
    })

    // Click to edit fields
    document.querySelectorAll('.field-display').forEach(display => {
      display.addEventListener('click', (e) => {
        this.enableFieldEdit(e.target.dataset.field)
      })
    })

    // Save on blur or Enter
    document.querySelectorAll('.field-input').forEach(input => {
      input.addEventListener('blur', (e) => {
        this.saveField(e.target.dataset.field, e.target.value)
      })
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.target.blur()
        }
        if (e.key === 'Escape') {
          this.cancelFieldEdit(e.target.dataset.field)
        }
      })
    })

    // Note: Save notes functionality is handled by auto-save on input
    // No manual save button needed since notes auto-save when typing

    // Auto-save notes on input
    const notesTextarea = document.getElementById('currentLeadNotes')
    if (notesTextarea) {
      notesTextarea.addEventListener('input', () => {
        this.autoSaveNotes()
      })
    }

    // Next lead button (different from navigation next button)
    const nextLeadBtn = document.querySelector('.next-btn')
    if (nextLeadBtn) {
      nextLeadBtn.addEventListener('click', () => {
        this.nextLead()
      })
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e))

    // Intercept Google Voice links to open in popup (only set up once globally)
    PowerDialer.setupGoogleVoiceInterceptionGlobal()
  }

  handleKeyboard(e) {
    // Only handle if not typing in textarea or input fields
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return

    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        this.previousLead()
        break
      case 'ArrowRight':
        e.preventDefault()
        this.nextLead()
        break
      case '1':
        e.preventDefault()
        this.updateCurrentDisposition('not-available')
        break
      case '2':
        e.preventDefault()
        this.updateCurrentDisposition('not-interested')
        break
      case '3':
        e.preventDefault()
        this.updateCurrentDisposition('voicemail')
        break
      case '4':
        e.preventDefault()
        this.updateCurrentDisposition('wrong-number')
        break
      case '5':
        e.preventDefault()
        this.updateCurrentDisposition('call-back')
        break
      case '6':
        e.preventDefault()
        this.updateCurrentDisposition('sold')
        break
      case 's':
      case 'S':
        e.preventDefault()
        this.saveCurrentNotes()
        this.nextLead()
        break
      case ' ':
        e.preventDefault()
        this.nextLead()
        break
    }
  }

  previousLead() {
    if (this.currentIndex > 0) {
      // Auto-save current lead before moving
      this.autoSaveCurrentLead()
      this.currentIndex--
      this.saveCurrentPosition()
      this.updateView()
    }
  }

  nextLead() {
    if (this.currentIndex < this.companies.length - 1) {
      // Auto-save current lead before moving
      this.autoSaveCurrentLead()
      this.currentIndex++
      this.saveCurrentPosition()
      this.updateView()
    }
  }

  updateCurrentDisposition(disposition) {
    const company = this.companies[this.currentIndex]
    company.disposition = disposition
    this.onCompanyUpdate(company)
    this.updateDispositionButtons(disposition)
    this.updateStatusIndicator(disposition)

    // Auto-advance to next lead for certain dispositions
    if (disposition === 'voicemail' || disposition === 'wrong-number') {
      // Small delay to show the disposition was set, then advance
      setTimeout(() => {
        this.nextLead()
      }, 500)
    }
  }

  updateDispositionButtons(activeDisposition) {
    document.querySelectorAll('.disposition-btn').forEach(btn => {
      btn.classList.remove('active')
      if (btn.dataset.disposition === activeDisposition) {
        btn.classList.add('active')
      }
    })
  }

  updateStatusIndicator(disposition) {
    const indicator = document.querySelector('.status-indicator')
    indicator.className = `status-indicator ${disposition || 'not-called'}`
    indicator.textContent = `Status: ${this.getStatusLabel(disposition)}`
  }

  saveCurrentNotes() {
    const company = this.companies[this.currentIndex]
    const notes = document.getElementById('currentLeadNotes').value
    company.notes = notes
    this.onCompanyUpdate(company)
  }

  autoSaveNotes() {
    // Debounced auto-save for notes
    clearTimeout(this.notesTimeout)
    this.notesTimeout = setTimeout(() => {
      this.saveCurrentNotes()
    }, 500) // Save 500ms after user stops typing
  }

  autoSaveCurrentLead() {
    // Save notes when navigating (fields are saved automatically on edit)
    this.saveCurrentNotes()
  }

  enableFieldEdit(fieldType) {
    const display = document.querySelector(`.field-display[data-field="${fieldType}"]`)
    const input = document.querySelector(`.field-input[data-field="${fieldType}"]`)

    if (display && input) {
      display.classList.add('hidden')
      input.classList.remove('hidden')
      input.focus()
      input.select()
    }
  }

  cancelFieldEdit(fieldType) {
    const display = document.querySelector(`.field-display[data-field="${fieldType}"]`)
    const input = document.querySelector(`.field-input[data-field="${fieldType}"]`)

    if (display && input) {
      // Reset input to original value
      const company = this.companies[this.currentIndex]
      const originalValue = this.getFieldValue(company, fieldType)
      input.value = originalValue || ''

      display.classList.remove('hidden')
      input.classList.add('hidden')
    }
  }

  saveField(fieldType, value) {
    const company = this.companies[this.currentIndex]

    // Update company data
    switch(fieldType) {
      case 'phone':
        company.phone = value
        break
      case 'website':
        company.website = value
        break
      case 'email':
        company.email = value
        break
      case 'contact':
        company.contactName = value
        break
    }

    // Save to storage
    this.onCompanyUpdate(company)

    // Update display
    const display = document.querySelector(`.field-display[data-field="${fieldType}"]`)
    const input = document.querySelector(`.field-input[data-field="${fieldType}"]`)

    if (display && input) {
      // Format display value based on field type
      let displayValue = value || this.getPlaceholderText(fieldType)
      if (fieldType === 'website' && value) {
        displayValue = this.truncateUrl(value)
      }

      display.textContent = displayValue
      display.classList.remove('hidden')
      input.classList.add('hidden')

      // Update action links
      this.updateActionLinks()
    }
  }

  getFieldValue(company, fieldType) {
    switch(fieldType) {
      case 'phone': return company.phone
      case 'website': return company.website
      case 'email': return company.email
      case 'contact': return company.contactName
      default: return ''
    }
  }

  getPlaceholderText(fieldType) {
    switch(fieldType) {
      case 'phone': return 'Click to add phone'
      case 'website': return 'Click to add website'
      case 'email': return 'Click to add email'
      case 'contact': return 'Click to add contact'
      default: return 'Click to edit'
    }
  }

  updateActionLinks() {
    const company = this.companies[this.currentIndex]

    // Update phone link with Google Voice
    const phoneContainer = document.querySelector('.editable-field[data-field="phone"]')
    let phoneLink = phoneContainer.querySelector('.call-link')
    if (phoneLink) phoneLink.remove()
    if (company.phone) {
      const formattedPhone = this.formatPhoneForGoogleVoice(company.phone)
      if (formattedPhone) {
        phoneLink = document.createElement('a')
        const encodedPhone = encodeURIComponent(formattedPhone)
        phoneLink.href = `http://voice.google.com/calls?a=nc,${encodedPhone}`
        phoneLink.className = 'gv-tel-link call-link'
        phoneLink.target = '_blank'
        phoneLink.rel = 'noopener'
        phoneLink.title = `Call ${formattedPhone} via Google Voice`
        phoneLink.textContent = '📞 Call via Google Voice'
        phoneContainer.appendChild(phoneLink)
      }
    }

    // Update website link
    const websiteContainer = document.querySelector('.editable-field[data-field="website"]')
    let websiteLink = websiteContainer.querySelector('.visit-link')
    if (websiteLink) websiteLink.remove()
    if (company.website) {
      websiteLink = document.createElement('a')
      websiteLink.href = company.website
      websiteLink.target = '_blank'
      websiteLink.className = 'visit-link'
      websiteLink.textContent = '🔗 Visit'
      websiteContainer.appendChild(websiteLink)
    }

    // Update email link
    const emailContainer = document.querySelector('.editable-field[data-field="email"]')
    let emailLink = emailContainer.querySelector('.email-link')
    if (emailLink) emailLink.remove()
    if (company.email) {
      emailLink = document.createElement('a')
      emailLink.href = `mailto:${company.email}`
      emailLink.className = 'email-link'
      emailLink.textContent = '📧 Email'
      emailContainer.appendChild(emailLink)
    }
  }

  updateView() {
    const container = document.querySelector('.power-dialer')
    if (container) {
      container.innerHTML = this.render()
      this.attachEventListeners()
    }
  }

  setCurrentIndex(index) {
    if (index >= 0 && index < this.companies.length) {
      this.currentIndex = index
      this.saveCurrentPosition()
      // Only update view if the container exists (i.e., component is rendered)
      if (document.querySelector('.power-dialer')) {
        this.updateView()
      }
    }
  }

  saveCurrentPosition() {
    // Save the current position to localStorage
    localStorage.setItem('dialerPosition', this.currentIndex.toString())
  }

  isRestoredPosition() {
    // Check if we're showing the restored position indicator
    const savedPosition = localStorage.getItem('dialerPosition')
    return savedPosition !== null && parseInt(savedPosition, 10) === this.currentIndex && this.currentIndex > 0
  }

  truncateUrl(url) {
    if (!url) return 'N/A'
    // Remove protocol and www
    let display = url.replace(/^https?:\/\/(www\.)?/, '')
    // With wider layout, we can show more of the URL
    if (display.length > 30) {
      display = display.substring(0, 27) + '...'
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

  formatPhoneForGoogleVoice(phone) {
    if (!phone) return null

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')

    // If it's 10 digits, add +1 prefix for US numbers
    if (digits.length === 10) {
      return `+1${digits}`
    }

    // If it's 11 digits and starts with 1, format as +1XXXXXXXXXX
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`
    }

    // If it already has + prefix, return as-is
    if (phone.startsWith('+')) {
      return phone.replace(/\D/g, '').replace(/^/, '+')
    }

    // Default: assume it's a US number and add +1
    return `+1${digits}`
  }

  createGoogleVoiceLink(phone) {
    if (!phone) return ''

    const formattedPhone = this.formatPhoneForGoogleVoice(phone)
    if (!formattedPhone) return ''

    // URL encode the phone number for Google Voice
    const encodedPhone = encodeURIComponent(formattedPhone)
    const googleVoiceUrl = `http://voice.google.com/calls?a=nc,${encodedPhone}`

    return `<a href="${googleVoiceUrl}" class="gv-tel-link call-link" target="_blank" rel="noopener" title="Call ${formattedPhone} via Google Voice">📞 Call via Google Voice</a>`
  }

  // Static method to set up Google Voice interception globally (only once)
  static setupGoogleVoiceInterceptionGlobal() {
    // Only set up the event listener once
    if (PowerDialer.googleVoiceInterceptionSetup) {
      return
    }

    // Use event delegation to catch Google Voice links that get added dynamically
    document.addEventListener('click', (e) => {
      // Check if the clicked element or its parent is a Google Voice link
      const gvLink = e.target.closest('a.gv-tel-link')

      if (gvLink && gvLink.href && gvLink.href.includes('voice.google.com/calls')) {
        e.preventDefault()
        e.stopPropagation()

        // Open Google Voice in a mobile-sized popup window
        const popupWidth = 347;  // Mobile width (320 + half of 55 taken away)
        const popupHeight = 800; // Taller for mobile view
        const left = (window.screen.width - popupWidth) / 2;
        const top = (window.screen.height - popupHeight) / 4; // Position it in the upper part of the screen

        const popup = window.open(
          gvLink.href,
          'googleVoiceCall',
          `width=${popupWidth},height=${popupHeight},top=${top},left=${left},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no`
        );

        // Focus the popup if it opened successfully
        if (popup) {
          popup.focus()
        }

        // Track the click (only increment once per actual click)
        let currentClicks = parseInt(localStorage.getItem('googleVoiceClicks') || '0', 10)
        currentClicks++
        localStorage.setItem('googleVoiceClicks', currentClicks.toString())

        // Update the display if it exists
        const clickCountElement = document.getElementById('gvClickCount')
        if (clickCountElement) {
          clickCountElement.textContent = currentClicks
        }

        return false
      }
    }, true) // Use capture phase to intercept before other handlers

    // Mark as set up
    PowerDialer.googleVoiceInterceptionSetup = true
  }

  // Static method to reset the Google Voice click counter
  static resetGoogleVoiceClickCounter() {
    localStorage.setItem('googleVoiceClicks', '0')
    const clickCountElement = document.getElementById('gvClickCount')
    if (clickCountElement) {
      clickCountElement.textContent = '0'
    }
  }
}

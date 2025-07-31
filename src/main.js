import './style.css'
import { ColdCallingApp } from './components/ColdCallingApp.js'

// Initialize the Cold Calling Directory Application
const app = new ColdCallingApp()

// Handle async initialization
app.init().catch(error => {
  console.error('Error initializing app:', error)
  // Fallback to basic initialization if async fails
  app.render()
  app.attachEventListeners()
})

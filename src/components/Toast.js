// Simple Toast Notification Component
// Usage: Toast.show('Your message')

const Toast = {
  show(message, duration = 2500) {
    let toast = document.createElement('div')
    toast.className = 'toast-notification'
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => {
      toast.classList.add('show')
    }, 10)
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => document.body.removeChild(toast), 300)
    }, duration)
  }
}

export { Toast };

# Deployment Guide

This guide covers different ways to deploy and share the Cold Calling Directory application.

## 🚀 Quick Start (Local Development)

```bash
# 1. Extract the zip file
unzip cold-calling-directory.zip
cd cold-calling-directory

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:5173
```

## 📦 Production Build

### Build for Production
```bash
# Create optimized production build
npm run build

# The built files will be in the 'dist' folder
# You can serve these files with any web server
```

### Preview Production Build
```bash
# Preview the production build locally
npm run preview
```

## 🌐 Deployment Options

### 1. Static File Hosting

**Netlify (Recommended)**
1. Build the project: `npm run build`
2. Drag the `dist` folder to [Netlify Drop](https://app.netlify.com/drop)
3. Your app is live instantly!

**Vercel**
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel --prod`
3. Follow the prompts

**GitHub Pages**
1. Build: `npm run build`
2. Push `dist` folder contents to `gh-pages` branch
3. Enable GitHub Pages in repository settings

### 2. Traditional Web Hosting

**Upload to Web Server**
1. Build: `npm run build`
2. Upload contents of `dist` folder to your web server
3. Ensure your server serves `index.html` for all routes

**Apache Configuration**
Create `.htaccess` in your web root:
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

**Nginx Configuration**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 3. Local Network Sharing

**Share on Local Network**
```bash
# Start dev server accessible on local network
npm run dev -- --host

# Or specify IP address
npm run dev -- --host 0.0.0.0
```

**Using Python (if Node.js not available)**
```bash
# Build first
npm run build

# Serve with Python
cd dist
python -m http.server 8000

# Access at http://localhost:8000
```

## 🔧 Configuration for Different Environments

### Environment Variables
Create `.env` files for different environments:

**.env.development**
```
VITE_APP_TITLE=Cold Calling Directory (Dev)
VITE_DEBUG=true
```

**.env.production**
```
VITE_APP_TITLE=Cold Calling Directory
VITE_DEBUG=false
```

### Custom Base Path
If deploying to a subdirectory:

**vite.config.js**
```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/your-subdirectory/',
  build: {
    outDir: 'dist',
  }
})
```

## 📱 Mobile App (PWA)

The application is PWA-ready. To enable:

1. Add to `index.html`:
```html
<link rel="manifest" href="/manifest.json">
```

2. Create `public/manifest.json`:
```json
{
  "name": "Cold Calling Directory",
  "short_name": "ColdCall",
  "description": "Professional cold calling directory",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## 🔒 Security Considerations

### HTTPS Requirements
- File System Access API requires HTTPS in production
- Use SSL certificates for production deployments

### Content Security Policy
Add to your HTML head:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

## 🐛 Troubleshooting

### Common Issues

**Build Fails**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**File System Access Not Working**
- Ensure HTTPS in production
- Check browser compatibility
- Fallback to localStorage will work

**Performance Issues**
- Enable gzip compression on server
- Use CDN for static assets
- Consider lazy loading for large datasets

### Browser Compatibility
- Modern browsers: Full functionality
- Older browsers: Limited to localStorage
- Mobile browsers: Responsive design works

## 📊 Monitoring

### Analytics (Optional)
Add Google Analytics or similar:
```html
<!-- Add to index.html head -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Tracking
Consider adding error tracking:
```javascript
window.addEventListener('error', (event) => {
  console.error('Application error:', event.error);
  // Send to error tracking service
});
```

## 🔄 Updates

### Updating the Application
1. Download new version
2. Backup your data (Export feature)
3. Replace files (keep data backups)
4. Import your data back

### Version Management
- Check `package.json` for current version
- Review `CHANGELOG.md` for updates
- Test in development before production

---

**Need help?** Check the [README.md](README.md) for more information or create an issue in the repository.

# Cold Calling Directory

A modern, feature-rich cold calling directory application designed specifically for pressure washing companies and sales teams. Built with vanilla JavaScript and Vite for optimal performance and ease of use.

## 🚀 Features

### 📊 **Company Directory**
- **Advanced Filtering**: Filter by disposition, city, and state
- **Smart Search**: Quick company lookup and filtering
- **Rating System**: Display Google ratings and review counts
- **Business Status**: Show operational status and hours
- **Contact Management**: Phone, email, website, and address tracking

### ⚡ **Power Dialer**
- **Sequential Dialing**: Navigate through leads efficiently
- **Disposition Tracking**: Mark calls as sold, not interested, callback, etc.
- **Notes System**: Add detailed call notes for each contact
- **Progress Tracking**: Resume from last position
- **Keyboard Shortcuts**: Quick navigation and actions

### 💾 **Data Management**
- **Multiple Storage Options**: 
  - IndexedDB (recommended for reliability)
  - File Storage (save/load JSON files)
  - Browser Storage (localStorage fallback)
- **Import/Export**: Backup and restore your data
- **Auto-save**: Automatic data persistence
- **Google Places API Support**: Import from Google Places JSON format

### 🎨 **Modern UI**
- **Dark Theme**: Professional dark interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Intuitive Navigation**: Easy switching between directory and dialer views
- **Visual Feedback**: Color-coded dispositions and status indicators

## 📋 Requirements

- **Node.js**: Version 16.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

## 🛠️ Installation

1. **Download and Extract**
   ```bash
   # Extract the zip file to your desired location
   cd cold-calling-directory
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   - Navigate to `http://localhost:5173`
   - The application will automatically open

## 📁 Supported Data Formats

### Google Places API Format
```json
[
  {
    "name": "The Pressure Washing Dude",
    "address": "210 25th Ave N Suite 810, Nashville, TN 37203, United States",
    "rating": 5,
    "totalRatings": 127,
    "phoneNumber": "(615) 481-5990",
    "website": "https://www.pressurewashingdude.com/",
    "businessStatus": "OPERATIONAL",
    "googleMapsUrl": "https://maps.google.com/?cid=15942928770198254900"
  }
]
```

### Legacy Format
```json
[
  {
    "title": "Company Name",
    "phone": "(555) 123-4567",
    "website": "https://example.com",
    "email": "contact@example.com",
    "city": "Nashville",
    "state": "TN"
  }
]
```

## 🎯 Usage Guide

### Getting Started
1. **Upload Data**: Use the "Upload JSON File" button to import your company list
2. **Filter Companies**: Use the filter dropdowns to narrow down your list
3. **Start Calling**: Click "Open in Power Dialer" on any company or switch to Dialer view

### Power Dialer Workflow
1. **Navigate**: Use Previous/Next buttons or keyboard arrows
2. **Make Calls**: Click phone numbers to dial (if configured)
3. **Set Disposition**: Mark the call result (Sold, Not Interested, etc.)
4. **Add Notes**: Record important call details
5. **Continue**: Move to next lead automatically

### Data Management
- **Auto-save**: Your progress is automatically saved
- **Export Backup**: Create backups of your data regularly
- **Re-parse Addresses**: Extract states from address data if needed

## ⌨️ Keyboard Shortcuts

- **Arrow Left/Right**: Navigate between leads in Power Dialer
- **Enter**: Move to next lead
- **Escape**: Return to directory view

## 🔧 Configuration

### Storage Options
- **IndexedDB**: Best for reliability and performance
- **File Storage**: Manual save/load with full control
- **Browser Storage**: Simple but can be cleared by browser

### Customization
- Modify `src/style.css` for theme customization
- Update disposition options in `src/components/ColdCallingApp.js`
- Adjust filtering logic in the filter methods

## 📱 Browser Compatibility

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues, questions, or feature requests:
1. Check the browser console for error messages
2. Use the "Re-parse Addresses" button if state filtering isn't working
3. Export your data before making major changes
4. Contact support with specific error details

## 🔄 Version History

### v1.0.0
- Initial release
- Google Places API format support
- Advanced filtering and power dialer
- Multiple storage options
- Dark theme UI
- Responsive design

---

**Built for pressure washing professionals by sales experts** 🚿💼

# Security Policy

## 🔒 Data Privacy and Security

This application is designed with privacy and security in mind:

### **Local Data Storage**
- All data is stored locally on your device
- No data is transmitted to external servers
- You have complete control over your data

### **API Keys and Sensitive Information**
- **Never commit API keys** to version control
- **Sample data files** may contain API keys and should be kept private
- **Lead-Lists folder** is excluded from git to prevent accidental exposure

## 🚨 Important Security Notes

### **Google Maps API Keys**
If you're using Google Places API data:
1. **Remove API keys** from any JSON files before sharing
2. **Use environment variables** for API keys in production
3. **Restrict API key usage** in Google Cloud Console

### **Sample Data**
- Sample lead files may contain real business information
- Keep sample data private and don't share publicly
- Remove or anonymize data before sharing code

## 🛡️ Best Practices

### **For Developers**
1. **Never hardcode API keys** in source code
2. **Use .env files** for sensitive configuration
3. **Add sensitive files** to .gitignore
4. **Review commits** before pushing to ensure no secrets are included

### **For Users**
1. **Keep your data private** - don't share lead lists publicly
2. **Use strong passwords** for any accounts
3. **Regularly backup** your data using the export feature
4. **Be cautious** when importing data from unknown sources

## 📋 Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** create a public issue
2. **Email** the maintainers privately
3. **Provide details** about the vulnerability
4. **Allow time** for the issue to be addressed before disclosure

## 🔄 Security Updates

- Security patches will be released as soon as possible
- Check for updates regularly
- Review the CHANGELOG.md for security-related updates

## ✅ Safe Usage Guidelines

### **Data Handling**
- Only import data from trusted sources
- Verify data doesn't contain sensitive information before sharing
- Use the application's export feature for backups

### **Deployment**
- Use HTTPS in production environments
- Implement proper Content Security Policy headers
- Regularly update dependencies

### **API Integration**
- Store API keys securely using environment variables
- Implement proper rate limiting
- Use least-privilege access for API keys

---

**Remember: Security is everyone's responsibility. When in doubt, err on the side of caution.**

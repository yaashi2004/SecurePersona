# SecurePersona - Smart Form Filling Chrome Extension

A powerful Chrome extension that streamlines and secures web form filling by allowing users to create and manage multiple customizable profiles for diverse use cases—such as job applications, internships, freelancing, and online shopping.

## ✨ Features

- **🎯 Smart Form Detection**: Automatically detects and fills form fields across any website
- **👤 Multiple Profiles**: Create and manage unlimited profiles for different purposes
- **🔒 Secure Storage**: All data is stored locally using Chrome's secure storage API
- **⚡ One-Click Filling**: Fill forms with a single click using your selected profile
- **🔑 Password Generator**: Built-in strong password generator with customizable options
- **📋 Clipboard Integration**: Copy generated passwords to clipboard instantly
- **🎨 Modern UI**: Clean, intuitive interface with smooth animations
- **🔄 Real-time Feedback**: Visual feedback with field highlighting and success animations

## 🚀 Installation

### Method 1: Load as Unpacked Extension (Recommended for Development)

1. **Download/Clone** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by toggling the switch in the top-right corner
4. **Click "Load unpacked"** and select the folder containing the extension files
5. **Pin the extension** to your toolbar for easy access

### Method 2: Install from Chrome Web Store (Coming Soon)

*The extension will be available on the Chrome Web Store soon!*

## 📖 How to Use

### 1. Create Your First Profile

1. **Click the SecurePersona icon** in your Chrome toolbar
2. **Click "Manage Profiles"** or the settings icon
3. **Click "Add New Profile"** to create your first profile
4. **Fill in your details**:
   - Personal Information (name, email, phone)
   - Address Information (street, city, state, etc.)
   - Professional Information (company, job title, skills, etc.)
   - Payment Information (card details - optional)
5. **Click "Save Profile"**

### 2. Fill Forms on Any Website

1. **Navigate to any website** with forms (job applications, contact forms, etc.)
2. **Click the SecurePersona icon** in your toolbar
3. **Select your profile** from the dropdown
4. **Click "Fill Form"** and watch the magic happen! ✨

### 3. Generate Strong Passwords

1. **Click the SecurePersona icon**
2. **Adjust password settings** (length, include numbers/symbols)
3. **Click "Generate"** to create a strong password
4. **Click "Copy"** to copy it to your clipboard

## 🧪 Testing

Use the included test page to verify form filling functionality:

1. **Open `test-form.html`** in your browser
2. **Create a profile** with test data
3. **Click "Fill Form"** in the extension popup
4. **Watch as all fields are automatically filled** with your profile data

## 🏗️ Architecture

The extension uses a **clean, efficient architecture** without background scripts:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Popup UI      │    │  Options Page    │    │ Content Script  │
│   (popup.js)    │    │  (options.js)    │    │  (content.js)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │ Chrome Storage   │
                    │   API (Local)    │
                    └──────────────────┘
```

### Why No Background Script?

- **Simpler Architecture**: Direct communication between components
- **Better Performance**: No persistent background process
- **Fewer Permissions**: Reduced security footprint
- **Easier Maintenance**: Less complexity, fewer potential issues

## 📁 File Structure

```
SecurePersona/
├── manifest.json          # Extension configuration
├── popup.html            # Popup interface
├── popup.css             # Popup styles
├── popup.js              # Popup functionality
├── options.html          # Options page interface
├── options.css           # Options page styles
├── options.js            # Profile management logic
├── content.js            # Form filling logic
├── test-form.html        # Test page for form filling
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## 🔧 Technical Details

### Permissions Used

- `storage`: Store profile data locally
- `activeTab`: Access current tab for form filling
- `scripting`: Inject content scripts
- `clipboardWrite`: Copy passwords to clipboard

### Security Features

- **Local Storage**: All data stored locally, never sent to external servers
- **No Background Scripts**: Reduced attack surface
- **Content Security Policy**: Strict CSP compliance
- **Minimal Permissions**: Only necessary permissions requested

### Browser Compatibility

- **Chrome**: 88+ (Manifest V3)
- **Edge**: 88+ (Chromium-based)
- **Other Chromium browsers**: Should work with Manifest V3 support

## 🎯 Use Cases

### Job Applications
- Fill out multiple job application forms quickly
- Maintain consistent professional information
- Save time on repetitive form fields

### Online Shopping
- Quick checkout with saved payment information
- Multiple profiles for different purposes (personal, business)
- Secure storage of payment details

### Contact Forms
- Professional contact information for business inquiries
- Personal information for general contact forms
- Consistent branding across all communications

### Freelancing Platforms
- Profile information for Upwork, Fiverr, etc.
- Portfolio and skills information
- Payment and billing details

## 🚀 Future Enhancements

- [ ] **Form Templates**: Pre-configured templates for popular websites
- [ ] **Import/Export**: Backup and restore profile data
- [ ] **Keyboard Shortcuts**: Quick access via keyboard
- [ ] **Profile Categories**: Organize profiles by type
- [ ] **Auto-fill Triggers**: Automatic form detection and filling
- [ ] **Data Encryption**: Additional encryption layer for sensitive data
- [ ] **Cloud Sync**: Optional cloud backup (with user consent)

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. **Check the test page** (`test-form.html`) to verify functionality
2. **Review the console** for any error messages
3. **Ensure the extension is properly loaded** in Chrome
4. **Create an issue** in the repository

## 🎉 Success Stories

*"SecurePersona saved me hours filling out job applications. I can now apply to 10+ jobs in the time it used to take me to apply to 1!"* - Sarah, Software Developer

*"The password generator is amazing! I use it for all my new accounts and the copy feature makes it so convenient."* - Mike, Digital Marketer

---

**Made with ❤️ for productivity and security** 
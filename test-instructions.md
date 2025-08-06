# SecurePersona Extension Testing Instructions

## 🧪 Testing on Real Websites (Recommended)

Since content scripts work more reliably on real websites, try testing on these sites:

### 1. **GitHub Contact Form**
- Go to: https://github.com/contact
- Create a profile with GitHub-related info
- Try filling the contact form

### 2. **Google Forms**
- Go to: https://forms.google.com
- Create a new form with basic fields (name, email, phone)
- Try filling it with your profile

### 3. **Any Contact Form**
- Find any website with a contact form
- Common fields: name, email, phone, message
- Test the extension there

## 🔧 Testing Steps

1. **Reload the extension** in Chrome (`chrome://extensions/` → Reload)
2. **Create a test profile** in the options page with sample data
3. **Go to a real website** with forms (not local files)
4. **Click the extension icon** and select your profile
5. **Click "Fill Form"** and watch the magic happen!

## 🐛 Debugging

If it still doesn't work:
1. Open Developer Console (F12)
2. Look for SecurePersona logs
3. Check if content script is injected
4. Look for any error messages

## 📝 Expected Behavior

- Form fields should be automatically filled
- Fields should highlight briefly when filled
- Success notification should appear
- Console should show detailed logs

## 🚀 Next Steps

Once it works on real websites, we can troubleshoot the local file issue further. 
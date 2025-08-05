// contentScript.js - SecurePersona Content Script

class SecurePersonaFormFiller {
  constructor() {
    this.fieldMappings = {
      // Name fields
      firstName: ['firstname', 'first-name', 'fname', 'given-name', 'name'],
      lastName: ['lastname', 'last-name', 'lname', 'family-name', 'surname'],
      
      // Contact fields
      email: ['email', 'e-mail', 'mail', 'user-email'],
      phone: ['phone', 'telephone', 'tel', 'mobile', 'cell'],
      
      // Address fields
      address: ['address', 'street', 'address1', 'addr', 'street-address'],
      city: ['city', 'town', 'locality'],
      state: ['state', 'province', 'region', 'st'],
      zipCode: ['zip', 'zipcode', 'postal', 'postal-code', 'postcode'],
      country: ['country', 'nation'],
      
      // Professional fields
      company: ['company', 'organization', 'employer', 'workplace'],
      jobTitle: ['job-title', 'title', 'position', 'role'],
      
      // Links
      linkedIn: ['linkedin', 'linkedin-url', 'linkedin-profile'],
      github: ['github', 'github-url', 'github-profile'],
      website: ['website', 'site', 'homepage', 'url'],
      resumeUrl: ['resume', 'cv', 'resume-url', 'cv-url'],
      
      // Education
      education: ['education', 'degree', 'qualification'],
      university: ['university', 'school', 'college', 'institution'],
      graduationYear: ['graduation', 'grad-year', 'year'],
      
      // Personal
      dateOfBirth: ['dob', 'date-of-birth', 'birthday', 'birth-date'],
      
      // Payment fields
      cardNumber: ['card-number', 'cardnumber', 'cc-number', 'credit-card'],
      cardHolder: ['card-holder', 'cardholder', 'cc-name', 'card-name'],
      expiryDate: ['expiry', 'exp-date', 'expiration', 'cc-exp'],
      cvv: ['cvv', 'cvc', 'security-code', 'card-code']
    };
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for messages from the extension
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'fillForm') {
        this.fillForm(request.profileData)
          .then(() => {
            sendResponse({ success: true });
            this.showSuccessNotification();
          })
          .catch(error => {
            console.error('Form filling error:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true; // Indicates we will send a response asynchronously
      }
    });
  }

  async fillForm(profileData) {
    try {
      const formFields = this.detectFormFields();
      let filledCount = 0;

      // Fill each detected field
      for (const [fieldName, value] of Object.entries(profileData)) {
        if (value && fieldName in this.fieldMappings) {
          const elements = this.findFieldElements(fieldName);
          
          for (const element of elements) {
            if (this.fillField(element, value, fieldName)) {
              filledCount++;
            }
          }
        }
      }

      console.log(`SecurePersona: Filled ${filledCount} form fields`);
      return { success: true, filledCount };
      
    } catch (error) {
      console.error('SecurePersona form fill error:', error);
      throw error;
    }
  }

  detectFormFields() {
    const forms = document.querySelectorAll('form');
    const allInputs = document.querySelectorAll('input, select, textarea');
    
    console.log(`SecurePersona: Found ${forms.length} forms and ${allInputs.length} input fields`);
    
    return Array.from(allInputs).filter(element => {
      // Skip hidden fields, passwords, and submit buttons
      const type = element.type?.toLowerCase();
      if (type === 'hidden' || type === 'password' || type === 'submit' || type === 'button') {
        return false;
      }
      
      // Skip disabled or readonly fields
      if (element.disabled || element.readOnly) {
        return false;
      }
      
      return true;
    });
  }

  findFieldElements(fieldName) {
    const mappings = this.fieldMappings[fieldName];
    const elements = [];
    
    for (const mapping of mappings) {
      // Find by name attribute
      elements.push(...document.querySelectorAll(`[name*="${mapping}" i]`));
      
      // Find by id attribute
      elements.push(...document.querySelectorAll(`[id*="${mapping}" i]`));
      
      // Find by placeholder
      elements.push(...document.querySelectorAll(`[placeholder*="${mapping}" i]`));
      
      // Find by class
      elements.push(...document.querySelectorAll(`[class*="${mapping}" i]`));
      
      // Find by autocomplete
      elements.push(...document.querySelectorAll(`[autocomplete*="${mapping}" i]`));
      
      // Find by data attributes
      elements.push(...document.querySelectorAll(`[data-name*="${mapping}" i]`));
      elements.push(...document.querySelectorAll(`[data-field*="${mapping}" i]`));
    }
    
    // Remove duplicates
    return [...new Set(elements)];
  }

  fillField(element, value, fieldName) {
    try {
      // Skip if already filled (unless it's empty)
      if (element.value && element.value.trim() !== '') {
        return false;
      }

      // Format value based on field type
      const formattedValue = this.formatValue(value, fieldName, element);
      
      // Focus the element
      element.focus();
      
      // Clear existing value
      element.value = '';
      
      // Set the new value
      element.value = formattedValue;
      
      // Trigger events to ensure the website recognizes the change
      this.triggerEvents(element);
      
      // Add visual feedback
      this.addVisualFeedback(element);
      
      return true;
      
    } catch (error) {
      console.error(`Error filling field ${fieldName}:`, error);
      return false;
    }
  }

  formatValue(value, fieldName, element) {
    if (!value) return '';
    
    const elementType = element.type?.toLowerCase();
    
    // Handle specific field formatting
    switch (fieldName) {
      case 'phone':
        return this.formatPhoneNumber(value);
      
      case 'cardNumber':
        return this.formatCardNumber(value);
      
      case 'expiryDate':
        return this.formatExpiryDate(value);
      
      case 'dateOfBirth':
        return this.formatDate(value, element);
      
      case 'zipCode':
        return value.toString();
      
      default:
        return value.toString();
    }
  }

  formatPhoneNumber(phone) {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Format US phone numbers
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    return phone; // Return original if can't format
  }

  formatCardNumber(cardNumber) {
    // Remove spaces and format in groups of 4
    const digits = cardNumber.replace(/\s/g, '');
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  formatExpiryDate(expiry) {
    // Ensure MM/YY format
    const cleaned = expiry.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return expiry;
  }

  formatDate(date, element) {
    if (!date) return '';
    
    try {
      const dateObj = new Date(date);
      const elementType = element.type?.toLowerCase();
      
      if (elementType === 'date') {
        // Return YYYY-MM-DD format for date inputs
        return dateObj.toISOString().split('T')[0];
      } else {
        // Return MM/DD/YYYY for text inputs
        return dateObj.toLocaleDateString('en-US');
      }
    } catch (error) {
      return date;
    }
  }

  triggerEvents(element) {
    // Create and dispatch events
    const events = ['input', 'change', 'blur', 'keyup'];
    
    events.forEach(eventType => {
      const event = new Event(eventType, {
        bubbles: true,
        cancelable: true
      });
      
      element.dispatchEvent(event);
    });

    // Also trigger React/Vue specific events
    const reactEvent = new Event('input', { bubbles: true });
    reactEvent.simulated = true;
    
    // Set React fiber properties if available
    const reactKey = Object.keys(element).find(key => key.startsWith('__reactInternalInstance'));
    if (reactKey) {
      element.dispatchEvent(reactEvent);
    }
  }

  addVisualFeedback(element) {
    // Add a temporary green border to show the field was filled
    const originalBorder = element.style.border;
    element.style.border = '2px solid #10b981';
    element.style.transition = 'border-color 0.3s ease';
    
    setTimeout(() => {
      element.style.border = originalBorder;
    }, 2000);
  }

  showSuccessNotification() {
    // Create and show a success notification
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideInRight 0.3s ease-out;
      ">
        ✓ Form filled by SecurePersona
      </div>
    `;
    
    // Add animation styles
    if (!document.getElementById('securepersona-styles')) {
      const styles = document.createElement('style');
      styles.id = 'securepersona-styles';
      styles.textContent = `
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize the form filler when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SecurePersonaFormFiller();
  });
} else {
  new SecurePersonaFormFiller();
}
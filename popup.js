class SecurePersonaPopup {
    constructor() {
        this.profiles = [];
        this.selectedProfile = null;
        this.init();
    }

    async init() {
        try {
            await this.loadProfiles();
            this.setupEventListeners();
            this.updateUI();
        } catch (error) {
            console.error('Error initializing popup:', error);
        }
    }

    async loadProfiles() {
        try {
            const result = await chrome.storage.local.get(['profiles']);
            this.profiles = result.profiles || [];
        } catch (error) {
            console.error('Error loading profiles:', error);
        }
    }

    setupEventListeners() {
        // Profile selection
        const profileSelect = document.getElementById('profileSelect');
        if (profileSelect) {
            profileSelect.addEventListener('change', (e) => {
                this.selectedProfile = this.profiles.find(p => p.id === e.target.value);
                this.updateUI();
            });
        }

        // Fill form button
        const fillFormBtn = document.getElementById('fillFormBtn');
        if (fillFormBtn) {
            fillFormBtn.addEventListener('click', () => {
                this.fillForm();
            });
        }

        // Generate password button
        const generatePasswordBtn = document.getElementById('generatePasswordBtn');
        if (generatePasswordBtn) {
            generatePasswordBtn.addEventListener('click', () => {
                this.generatePassword();
            });
        }

        // Copy password button
        const copyPasswordBtn = document.getElementById('copyPasswordBtn');
        if (copyPasswordBtn) {
            copyPasswordBtn.addEventListener('click', () => {
                this.copyPassword();
            });
        }

        // Password length slider
        const passwordLengthSlider = document.getElementById('passwordLength');
        if (passwordLengthSlider) {
            passwordLengthSlider.addEventListener('input', (e) => {
                document.getElementById('passwordLengthValue').textContent = e.target.value;
            });
        }

                 // Options button
         const optionsBtn = document.getElementById('optionsBtn');
         if (optionsBtn) {
             optionsBtn.addEventListener('click', () => {
                 chrome.runtime.openOptionsPage();
             });
         }

         // Manage Profiles button
         const manageProfilesBtn = document.getElementById('manageProfilesBtn');
         if (manageProfilesBtn) {
             manageProfilesBtn.addEventListener('click', () => {
                 chrome.tabs.create({url: chrome.runtime.getURL('options.html')});
             });
         }
    }

    updateUI() {
        this.updateProfileSelect();
        this.updateFillFormButton();
        this.updatePasswordSection();
    }

    updateProfileSelect() {
        const profileSelect = document.getElementById('profileSelect');
        if (!profileSelect) return;

        profileSelect.innerHTML = '<option value="">Select a profile...</option>';
        
        this.profiles.forEach(profile => {
            const option = document.createElement('option');
            option.value = profile.id;
            option.textContent = profile.name;
            profileSelect.appendChild(option);
        });

        if (this.selectedProfile) {
            profileSelect.value = this.selectedProfile.id;
        }
    }

    updateFillFormButton() {
        const fillFormBtn = document.getElementById('fillFormBtn');
        if (!fillFormBtn) return;

        if (this.selectedProfile) {
            fillFormBtn.disabled = false;
            fillFormBtn.textContent = `Fill Form with "${this.selectedProfile.name}"`;
        } else {
            fillFormBtn.disabled = true;
            fillFormBtn.textContent = 'Select a profile first';
        }
    }

    updatePasswordSection() {
        const passwordDisplay = document.getElementById('generatedPassword');
        const copyPasswordBtn = document.getElementById('copyPasswordBtn');
        
        if (passwordDisplay && copyPasswordBtn) {
            const hasPassword = passwordDisplay.textContent && passwordDisplay.textContent !== 'Click Generate';
            copyPasswordBtn.disabled = !hasPassword;
        }
    }

    async fillForm() {
        if (!this.selectedProfile) {
            this.showNotification('Please select a profile first', 'error');
            return;
        }

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                this.showNotification('No active tab found', 'error');
                return;
            }

            console.log('Attempting to fill form on tab:', tab.url);

            // Always inject content script programmatically for better reliability
            let injectionSuccess = false;
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
                console.log('Content script injected successfully');
                injectionSuccess = true;
            } catch (injectError) {
                console.log('Content script injection failed:', injectError);
                this.showNotification('Failed to inject content script. Please refresh the page and try again.', 'error');
                return;
            }

            // Wait for script to initialize
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Test if content script is working
            let testSuccess = false;
            let retryCount = 0;
            const maxRetries = 3;

            while (!testSuccess && retryCount < maxRetries) {
                try {
                    const testResponse = await chrome.tabs.sendMessage(tab.id, { action: 'test' });
                    console.log('Test response:', testResponse);
                    if (testResponse && testResponse.success) {
                        testSuccess = true;
                        break;
                    }
                } catch (testError) {
                    console.log(`Test message failed (attempt ${retryCount + 1}):`, testError);
                    retryCount++;
                    
                    if (retryCount < maxRetries) {
                        // Wait a bit before retrying
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // Try injecting again
                        try {
                            await chrome.scripting.executeScript({
                                target: { tabId: tab.id },
                                files: ['content.js']
                            });
                            console.log('Retry injection successful');
                        } catch (retryError) {
                            console.log('Retry injection failed:', retryError);
                        }
                    }
                }
            }

            if (!testSuccess) {
                throw new Error('Content script failed to initialize after multiple attempts');
            }

            // Send message to content script to fill the form
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'fillForm',
                profile: this.selectedProfile
            });

            console.log('Form fill response:', response);

            if (response && response.success) {
                this.showNotification(`Form filled with "${this.selectedProfile.name}" profile!`, 'success');
            } else if (response && !response.success) {
                this.showNotification(response.message || 'No form found on this page', 'info');
            } else {
                this.showNotification('No form found on this page', 'info');
            }
        } catch (error) {
            console.error('Error filling form:', error);
            if (error.message.includes('Receiving end does not exist') || error.message.includes('Content script failed to initialize')) {
                this.showNotification('Content script not loaded. Please refresh the page and try again.', 'error');
            } else {
                this.showNotification('Error filling form. Make sure you\'re on a webpage with forms.', 'error');
            }
        }
    }

    generatePassword() {
        const length = parseInt(document.getElementById('passwordLength').value) || 12;
        const includeNumbers = document.getElementById('includeNumbers').checked;
        const includeSymbols = document.getElementById('includeSymbols').checked;

        const password = this.generateStrongPassword(length, includeNumbers, includeSymbols);
        
        const passwordDisplay = document.getElementById('generatedPassword');
        if (passwordDisplay) {
            passwordDisplay.textContent = password;
        }

        this.updatePasswordSection();
        this.showNotification('Password generated!', 'success');
    }

    generateStrongPassword(length = 12, includeNumbers = true, includeSymbols = true) {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let chars = lowercase + uppercase;
        if (includeNumbers) chars += numbers;
        if (includeSymbols) chars += symbols;

        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return password;
    }

    async copyPassword() {
        const passwordDisplay = document.getElementById('generatedPassword');
        if (!passwordDisplay || !passwordDisplay.textContent || passwordDisplay.textContent === 'Click Generate') {
            this.showNotification('Generate a password first', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(passwordDisplay.textContent);
            this.showNotification('Password copied to clipboard!', 'success');
        } catch (error) {
            console.error('Error copying password:', error);
            this.showNotification('Error copying password', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SecurePersonaPopup();
    });
} else {
    new SecurePersonaPopup();
} 
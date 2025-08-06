// Simplified SecurePersona Options
console.log('Simple options script loaded');

class SimpleSecurePersona {
    constructor() {
        this.profiles = [];
        this.init();
    }

    async init() {
        console.log('Initializing simple SecurePersona...');
        
        // Check if elements exist
        this.checkElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load profiles
        await this.loadProfiles();
    }

    checkElements() {
        console.log('=== Checking Elements ===');
        
        const elements = [
            'addProfileBtn',
            'createFirstProfileBtn', 
            'profileForm',
            'welcomeScreen',
            'profileList'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            console.log(`${id}: ${!!element}`);
        });
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Add Profile button
        const addProfileBtn = document.getElementById('addProfileBtn');
        if (addProfileBtn) {
            addProfileBtn.addEventListener('click', () => {
                console.log('Add Profile button clicked');
                this.showForm();
            });
        } else {
            console.error('Add Profile button not found!');
        }

        // Create First Profile button
        const createFirstProfileBtn = document.getElementById('createFirstProfileBtn');
        if (createFirstProfileBtn) {
            createFirstProfileBtn.addEventListener('click', () => {
                console.log('Create First Profile button clicked');
                this.showForm();
            });
        } else {
            console.error('Create First Profile button not found!');
        }

        // Form submission
        const profileFormElement = document.getElementById('profileFormElement');
        if (profileFormElement) {
            profileFormElement.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Form submitted');
                this.saveProfile();
            });
        } else {
            console.error('Profile form element not found!');
        }

        // Cancel buttons
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideForm();
            });
        }

        const cancelFormBtn = document.getElementById('cancelFormBtn');
        if (cancelFormBtn) {
            cancelFormBtn.addEventListener('click', () => {
                this.hideForm();
            });
        }
    }

    async loadProfiles() {
        try {
            console.log('Loading profiles...');
            const response = await this.sendMessage({ action: 'getProfiles' });
            console.log('Load profiles response:', response);
            
            if (response && response.success) {
                this.profiles = response.profiles || [];
                console.log(`Loaded ${this.profiles.length} profiles`);
                this.updateUI();
            } else {
                console.error('Error loading profiles:', response.error);
            }
        } catch (error) {
            console.error('Error loading profiles:', error);
        }
    }

    showForm() {
        console.log('=== Showing Form ===');
        
        // Hide all screens first
        this.hideAllScreens();
        
        // Show the form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.style.display = 'block';
            console.log('✓ Form should now be visible');
            
            // Update form title
            const formTitle = document.getElementById('formTitle');
            if (formTitle) {
                formTitle.textContent = 'Add New Profile';
            }
            
            // Clear the form
            this.clearForm();
        } else {
            console.error('✗ Profile form element not found!');
        }
    }

    hideForm() {
        console.log('Hiding form...');
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.style.display = 'none';
        }
        this.updateUI();
    }

    hideAllScreens() {
        console.log('Hiding all screens...');
        
        const screens = [
            'welcomeScreen',
            'profileForm', 
            'profileDetails'
        ];
        
        screens.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    clearForm() {
        const form = document.getElementById('profileFormElement');
        if (form) {
            form.reset();
            console.log('Form cleared');
        }
    }

    updateUI() {
        console.log('Updating UI...');
        
        const hasProfiles = this.profiles.length > 0;
        const welcomeScreen = document.getElementById('welcomeScreen');
        const profileList = document.getElementById('profileList');
        
        if (hasProfiles) {
            console.log('Profiles exist, showing profile list');
            if (welcomeScreen) welcomeScreen.style.display = 'none';
            if (profileList) profileList.style.display = 'block';
        } else {
            console.log('No profiles, showing welcome screen');
            if (welcomeScreen) welcomeScreen.style.display = 'block';
            if (profileList) profileList.style.display = 'none';
        }
    }

    async saveProfile() {
        console.log('=== Saving Profile ===');
        
        const form = document.getElementById('profileFormElement');
        if (!form) {
            console.error('Form element not found!');
            return;
        }
        
        const formData = new FormData(form);
        const profile = {};
        
        console.log('Form data entries:');
        for (const [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
            if (value.trim()) {
                profile[key] = value.trim();
            }
        }
        
        console.log('Profile object:', profile);
        
        // Check required fields
        if (!profile.name) {
            console.error('Profile name is required');
            alert('Profile name is required');
            return;
        }
        
        try {
            console.log('Sending profile to background script...');
            const response = await this.sendMessage({
                action: 'saveProfile',
                profile: profile
            });
            
            console.log('Save response:', response);
            
            if (response && response.success) {
                console.log('✓ Profile saved successfully!');
                alert('Profile saved successfully!');
                await this.loadProfiles();
                this.hideForm();
            } else {
                console.error('✗ Error saving profile:', response.error);
                alert('Error saving profile: ' + response.error);
            }
        } catch (error) {
            console.error('✗ Error saving profile:', error);
            alert('Error saving profile: ' + error.message);
        }
    }

    async sendMessage(message) {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage(message, resolve);
            } else {
                console.error('Chrome extension API not available');
                resolve({ success: false, error: 'Chrome extension API not available' });
            }
        });
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing SimpleSecurePersona...');
        window.simpleSecurePersona = new SimpleSecurePersona();
    });
} else {
    console.log('DOM already loaded, initializing SimpleSecurePersona...');
    window.simpleSecurePersona = new SimpleSecurePersona();
}

console.log('Simple options script finished loading'); 
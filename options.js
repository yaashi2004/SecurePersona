class SecurePersonaOptions {
    constructor() {
        this.profiles = [];
        this.currentProfile = null;
        this.isEditing = false;
        this.init();
    }

    async init() {
        try {
            await this.loadProfiles();
            this.setupEventListeners();
            this.updateUI();
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    setupEventListeners() {
        // Navigation buttons
        const addProfileBtn = document.getElementById('addProfileBtn');
        if (addProfileBtn) {
            addProfileBtn.addEventListener('click', () => {
                this.showForm();
            });
        }

        const createFirstProfileBtn = document.getElementById('createFirstProfileBtn');
        if (createFirstProfileBtn) {
            createFirstProfileBtn.addEventListener('click', () => {
                this.showForm();
            });
        }

        // Form buttons
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

        const deleteBtn = document.getElementById('deleteBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.showDeleteConfirmation();
            });
        }

        const deleteDetailBtn = document.getElementById('deleteDetailBtn');
        if (deleteDetailBtn) {
            deleteDetailBtn.addEventListener('click', () => {
                this.showDeleteConfirmation();
            });
        }

        // Form submission
        const profileFormElement = document.getElementById('profileFormElement');
        if (profileFormElement) {
            profileFormElement.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }

        // Modal buttons
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }

        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                this.deleteProfile();
            });
        }

        // Edit button
        const editBtn = document.getElementById('editBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editProfile();
            });
        }

        // Card number formatting
        const cardNumber = document.getElementById('cardNumber');
        if (cardNumber) {
            cardNumber.addEventListener('input', (e) => {
                this.formatCardNumber(e.target);
            });
        }

        // Card expiry formatting
        const cardExpiry = document.getElementById('cardExpiry');
        if (cardExpiry) {
            cardExpiry.addEventListener('input', (e) => {
                this.formatCardExpiry(e.target);
            });
        }

        // CVV formatting
        const cardCvv = document.getElementById('cardCvv');
        if (cardCvv) {
            cardCvv.addEventListener('input', (e) => {
                this.formatCvv(e.target);
            });
        }
    }

    async loadProfiles() {
        try {
            const result = await chrome.storage.local.get(['profiles']);
            this.profiles = result.profiles || [];
            this.renderProfileList();
        } catch (error) {
            console.error('Error loading profiles:', error);
        }
    }

    renderProfileList() {
        const profileItems = document.getElementById('profileItems');
        if (!profileItems) return;
        
        profileItems.innerHTML = '';

        if (this.profiles.length === 0) {
            profileItems.innerHTML = '<p style="color: #64748b; text-align: center; padding: 20px;">No profiles yet</p>';
            return;
        }

        this.profiles.forEach(profile => {
            const profileItem = this.createProfileItem(profile);
            profileItems.appendChild(profileItem);
        });
    }

    createProfileItem(profile) {
        const item = document.createElement('div');
        item.className = 'profile-item';
        if (this.currentProfile && this.currentProfile.id === profile.id) {
            item.classList.add('active');
        }

        item.innerHTML = `
            <div class="profile-item-header">
                <div>
                    <div class="profile-item-name">${profile.name}</div>
                    <div class="profile-item-type">${profile.type || 'personal'}</div>
                </div>
                <div class="profile-item-actions">
                    <button title="Edit" onclick="securePersonaOptions.editProfileById('${profile.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                        </svg>
                    </button>
                    <button title="Delete" onclick="securePersonaOptions.deleteProfileById('${profile.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        item.addEventListener('click', (e) => {
            if (!e.target.closest('.profile-item-actions')) {
                this.selectProfile(profile);
            }
        });

        return item;
    }

    selectProfile(profile) {
        this.currentProfile = profile;
        this.updateUI();
        this.showProfileDetails();
    }

    showProfileDetails() {
        this.hideAllScreens();
        const profileDetails = document.getElementById('profileDetails');
        if (profileDetails) {
            profileDetails.style.display = 'block';
        }
        
        const title = document.getElementById('detailTitle');
        const content = document.getElementById('profileContent');
        
        if (title) title.textContent = this.currentProfile.name;
        if (content) content.innerHTML = this.generateProfileDetailsHTML(this.currentProfile);
    }

    generateProfileDetailsHTML(profile) {
        const sections = [
            {
                title: 'Personal Information',
                fields: [
                    { label: 'First Name', value: profile.firstName },
                    { label: 'Last Name', value: profile.lastName },
                    { label: 'Email', value: profile.email },
                    { label: 'Phone', value: profile.phone }
                ]
            },
            {
                title: 'Address Information',
                fields: [
                    { label: 'Address', value: profile.address, full: true },
                    { label: 'City', value: profile.city },
                    { label: 'State/Province', value: profile.state },
                    { label: 'ZIP/Postal Code', value: profile.zipCode },
                    { label: 'Country', value: profile.country }
                ]
            },
            {
                title: 'Professional Information',
                fields: [
                    { label: 'Company', value: profile.company },
                    { label: 'Job Title', value: profile.jobTitle },
                    { label: 'LinkedIn', value: profile.linkedin },
                    { label: 'GitHub', value: profile.github },
                    { label: 'Resume/CV', value: profile.resume },
                    { label: 'Website', value: profile.website },
                    { label: 'Skills', value: profile.skills, full: true },
                    { label: 'Experience', value: profile.experience, full: true },
                    { label: 'Education', value: profile.education, full: true },
                    { label: 'Bio', value: profile.bio, full: true }
                ]
            },
            {
                title: 'Payment Information',
                fields: [
                    { label: 'Cardholder Name', value: profile.cardName },
                    { label: 'Card Number', value: profile.cardNumber ? this.maskCardNumber(profile.cardNumber) : null },
                    { label: 'Expiry Date', value: profile.cardExpiry },
                    { label: 'CVV', value: profile.cardCvv ? '***' : null }
                ]
            }
        ];

        return sections.map(section => `
            <div class="detail-section">
                <h4>${section.title}</h4>
                <div class="detail-grid">
                    ${section.fields.map(field => `
                        <div class="detail-item ${field.full ? 'detail-full' : ''}">
                            <div class="detail-label">${field.label}</div>
                            <div class="detail-value ${!field.value ? 'empty' : ''}">
                                ${field.value || 'Not provided'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    maskCardNumber(cardNumber) {
        if (!cardNumber) return '';
        const cleaned = cardNumber.replace(/\s/g, '');
        if (cleaned.length <= 4) return cleaned;
        return '**** **** **** ' + cleaned.slice(-4);
    }

    showForm(profile = null) {
        this.hideAllScreens();
        this.isEditing = !!profile;
        this.currentProfile = profile;
        
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.style.display = 'block';
        }
        
        const title = document.getElementById('formTitle');
        const deleteBtn = document.getElementById('deleteBtn');
        
        if (this.isEditing) {
            if (title) title.textContent = 'Edit Profile';
            if (deleteBtn) deleteBtn.style.display = 'block';
            this.populateForm(profile);
        } else {
            if (title) title.textContent = 'Add New Profile';
            if (deleteBtn) deleteBtn.style.display = 'none';
            this.clearForm();
        }
    }

    populateForm(profile) {
        const form = document.getElementById('profileFormElement');
        if (!form) return;
        
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            const value = profile[field.name];
            if (value !== undefined) {
                field.value = value;
            }
        });
    }

    clearForm() {
        const form = document.getElementById('profileFormElement');
        if (form) form.reset();
    }

    hideForm() {
        const profileForm = document.getElementById('profileForm');
        if (profileForm) profileForm.style.display = 'none';
        this.isEditing = false;
        this.currentProfile = null;
        this.updateUI();
    }

    hideAllScreens() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const profileForm = document.getElementById('profileForm');
        const profileDetails = document.getElementById('profileDetails');
        
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        if (profileForm) profileForm.style.display = 'none';
        if (profileDetails) profileDetails.style.display = 'none';
    }

    updateUI() {
        const hasProfiles = this.profiles.length > 0;
        const welcomeScreen = document.getElementById('welcomeScreen');
        const profileList = document.getElementById('profileList');
        
        if (hasProfiles) {
            if (welcomeScreen) welcomeScreen.style.display = 'none';
            if (profileList) profileList.style.display = 'block';
            
            if (!this.currentProfile) {
                this.selectProfile(this.profiles[0]);
            }
        } else {
            if (welcomeScreen) welcomeScreen.style.display = 'block';
            if (profileList) profileList.style.display = 'none';
        }
    }

    async saveProfile() {
        const form = document.getElementById('profileFormElement');
        if (!form) return;
        
        const formData = new FormData(form);
        const profile = {};
        
        for (const [key, value] of formData.entries()) {
            if (value.trim()) {
                profile[key] = value.trim();
            }
        }

        if (this.isEditing && this.currentProfile) {
            profile.id = this.currentProfile.id;
            profile.createdAt = this.currentProfile.createdAt;
        }

        if (!profile.name) {
            this.showNotification('Profile name is required', 'error');
            return;
        }

        try {
            await this.saveProfileDirect(profile);
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showNotification('Error saving profile', 'error');
        }
    }

    async saveProfileDirect(profile) {
        if (!profile.id) {
            profile.id = 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            profile.createdAt = new Date().toISOString();
        }
        
        profile.updatedAt = new Date().toISOString();
        
        const result = await chrome.storage.local.get(['profiles']);
        const profiles = result.profiles || [];
        
        const existingIndex = profiles.findIndex(p => p.id === profile.id);
        if (existingIndex >= 0) {
            profiles[existingIndex] = profile;
        } else {
            profiles.push(profile);
        }
        
        await chrome.storage.local.set({ profiles });
        
        await this.loadProfiles();
        this.hideForm();
        this.showNotification('Profile saved successfully!', 'success');
    }

    editProfile() {
        if (this.currentProfile) {
            this.showForm(this.currentProfile);
        }
    }

    editProfileById(profileId) {
        const profile = this.profiles.find(p => p.id === profileId);
        if (profile) {
            this.showForm(profile);
        }
    }

    deleteProfileById(profileId) {
        const profile = this.profiles.find(p => p.id === profileId);
        if (profile) {
            this.currentProfile = profile;
            this.showDeleteConfirmation();
        }
    }

    showDeleteConfirmation() {
        const confirmModal = document.getElementById('confirmModal');
        if (confirmModal) confirmModal.style.display = 'flex';
    }

    hideModal() {
        const confirmModal = document.getElementById('confirmModal');
        if (confirmModal) confirmModal.style.display = 'none';
    }

    async deleteProfile() {
        if (!this.currentProfile) return;

        try {
            await this.deleteProfileDirect(this.currentProfile.id);
        } catch (error) {
            console.error('Error deleting profile:', error);
            this.showNotification('Error deleting profile', 'error');
        }
    }

    async deleteProfileDirect(profileId) {
        const result = await chrome.storage.local.get(['profiles']);
        const profiles = result.profiles || [];
        
        const updatedProfiles = profiles.filter(p => p.id !== profileId);
        await chrome.storage.local.set({ profiles: updatedProfiles });
        
        await this.loadProfiles();
        this.hideModal();
        this.hideForm();
        this.currentProfile = null;
        this.updateUI();
        this.showNotification('Profile deleted successfully!', 'success');
    }

    formatCardNumber(input) {
        let value = input.value.replace(/\s/g, '');
        value = value.replace(/\D/g, '');
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        input.value = value.substring(0, 19);
    }

    formatCardExpiry(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        input.value = value.substring(0, 5);
    }

    formatCvv(input) {
        let value = input.value.replace(/\D/g, '');
        input.value = value.substring(0, 4);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

// Initialize the options page when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const securePersonaOptions = new SecurePersonaOptions();
        window.securePersonaOptions = securePersonaOptions;
    });
} else {
    const securePersonaOptions = new SecurePersonaOptions();
    window.securePersonaOptions = securePersonaOptions;
} 
// options.js - SecurePersona Options Page

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const addProfileBtn = document.getElementById('addProfileBtn');
  const profileForm = document.getElementById('profileForm');
  const profileFormElement = document.getElementById('profileFormElement');
  const profilesList = document.getElementById('profilesList');
  const emptyState = document.getElementById('emptyState');
  const cancelFormBtn = document.getElementById('cancelFormBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const saveBtn = document.getElementById('saveBtn');
  const formTitle = document.getElementById('formTitle');
  const saveText = document.getElementById('saveText');
  const statusToast = document.getElementById('statusToast');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');

  // Form inputs
  const cardNumberInput = document.getElementById('cardNumber');
  const expiryDateInput = document.getElementById('expiryDate');
  const cvvInput = document.getElementById('cvv');

  // State
  let profiles = [];
  let editingProfileId = null;
  let isEditing = false;

  // Initialize
  init();

  async function init() {
    await loadProfiles();
    renderProfiles();
    setupEventListeners();
    setupCardFormatting();
  }

  function setupEventListeners() {
    addProfileBtn.addEventListener('click', showCreateForm);
    cancelFormBtn.addEventListener('click', hideForm);
    cancelBtn.addEventListener('click', hideForm);
    profileFormElement.addEventListener('submit', handleFormSubmit);
    
    // Empty state button
    emptyState.querySelector('.btn').addEventListener('click', showCreateForm);
  }

  function setupCardFormatting() {
    // Format card number
    cardNumberInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
      let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
      e.target.value = formattedValue;
    });

    // Format expiry date
    expiryDateInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      e.target.value = value;
    });

    // CVV only numbers
    cvvInput.addEventListener('input', function(e) {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
  }

  async function loadProfiles() {
    try {
      const result = await chrome.storage.local.get(['profiles']);
      profiles = result.profiles || [];
    } catch (error) {
      console.error('Error loading profiles:', error);
      showToast('Error loading profiles', 'error');
    }
  }

  async function saveProfiles() {
    try {
      await chrome.storage.local.set({ profiles });
    } catch (error) {
      console.error('Error saving profiles:', error);
      showToast('Error saving profiles', 'error');
    }
  }

  function renderProfiles() {
    if (profiles.length === 0) {
      profilesList.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    
    profilesList.innerHTML = profiles.map(profile => `
      <div class="profile-item" data-id="${profile.id}">
        <div class="profile-info">
          <div class="profile-avatar">
            ${getInitials(profile.fields.firstName, profile.fields.lastName)}
          </div>
          <div class="profile-details">
            <h3>${profile.name}</h3>
            <p>${profile.fields.email || 'No email provided'}</p>
          </div>
        </div>
        <div class="profile-actions">
          <button class="btn btn-outline btn-small edit-btn" data-id="${profile.id}">
            <i data-feather="edit-2" class="btn-icon"></i>
            Edit
          </button>
          <button class="btn btn-danger btn-small delete-btn" data-id="${profile.id}">
            <i data-feather="trash-2" class="btn-icon"></i>
            Delete
          </button>
        </div>
      </div>
    `).join('');

    // Re-initialize feather icons
    feather.replace();

    // Add event listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const profileId = e.target.closest('.edit-btn').dataset.id;
        editProfile(profileId);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const profileId = e.target.closest('.delete-btn').dataset.id;
        deleteProfile(profileId);
      });
    });
  }

  function getInitials(firstName, lastName) {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
  }

  function showCreateForm() {
    isEditing = false;
    editingProfileId = null;
    formTitle.textContent = 'Create New Profile';
    saveText.textContent = 'Save Profile';
    profileFormElement.reset();
    profileForm.classList.remove('hidden');
    profileForm.scrollIntoView({ behavior: 'smooth' });
  }

  function editProfile(profileId) {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    isEditing = true;
    editingProfileId = profileId;
    formTitle.textContent = 'Edit Profile';
    saveText.textContent = 'Update Profile';

    // Populate form with profile data
    Object.keys(profile.fields).forEach(key => {
      const input = document.getElementById(key);
      if (input) {
        input.value = profile.fields[key] || '';
      }
    });

    // Set profile name
    document.getElementById('profileName').value = profile.name;

    profileForm.classList.remove('hidden');
    profileForm.scrollIntoView({ behavior: 'smooth' });
  }

  async function deleteProfile(profileId) {
    if (!confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return;
    }

    try {
      profiles = profiles.filter(p => p.id !== profileId);
      await saveProfiles();
      renderProfiles();
      showToast('Profile deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting profile:', error);
      showToast('Error deleting profile', 'error');
    }
  }

  function hideForm() {
    profileForm.classList.add('hidden');
    profileFormElement.reset();
    isEditing = false;
    editingProfileId = null;
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(profileFormElement);
    const profileData = {};
    
    // Extract all form fields
    for (let [key, value] of formData.entries()) {
      profileData[key] = value.trim();
    }

    // Validate required fields
    if (!profileData.profileName) {
      showToast('Profile name is required', 'error');
      return;
    }

    try {
      // Show loading state
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i data-feather="loader" class="btn-icon"></i> Saving...';
      feather.replace();

      // Encrypt sensitive data
      const encryptedData = await encryptSensitiveData(profileData);

      const profile = {
        id: isEditing ? editingProfileId : generateUniqueId(),
        name: profileData.profileName,
        fields: encryptedData,
        createdAt: isEditing ? profiles.find(p => p.id === editingProfileId).createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isEditing) {
        const index = profiles.findIndex(p => p.id === editingProfileId);
        profiles[index] = profile;
      } else {
        profiles.push(profile);
      }

      await saveProfiles();
      renderProfiles();
      hideForm();
      
      showToast(
        isEditing ? 'Profile updated successfully!' : 'Profile created successfully!',
        'success'
      );

    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('Error saving profile', 'error');
    } finally {
      // Reset button state
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i data-feather="save" class="btn-icon"></i> ${isEditing ? 'Update Profile' : 'Save Profile'}`;
      feather.replace();
    }
  }

  async function encryptSensitiveData(data) {
    // For now, we'll store data as-is. In production, you'd encrypt sensitive fields
    // like credit card information using the Web Crypto API
    const encryptedData = { ...data };
    
    // Remove profile name from fields
    delete encryptedData.profileName;
    
    return encryptedData;
  }

  function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    
    // Update toast styling
    statusToast.className = `status-toast ${type}`;
    toastIcon.className = `toast-icon ${type}`;
    
    // Update icon
    if (type === 'success') {
      toastIcon.setAttribute('data-feather', 'check-circle');
    } else {
      toastIcon.setAttribute('data-feather', 'alert-circle');
    }
    
    feather.replace();
    
    // Show toast
    statusToast.classList.remove('hidden');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusToast.classList.add('hidden');
    }, 3000);
  }
});
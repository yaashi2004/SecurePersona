// options.js

document.addEventListener('DOMContentLoaded', () => {
  const profilesList = document.getElementById('profilesList');
  const addProfileBtn = document.getElementById('addProfileBtn');
  const profileEditor = document.getElementById('profileEditor');
  const editorTitle = document.getElementById('editorTitle');
  const closeEditorBtn = document.getElementById('closeEditorBtn');
  const profileForm = document.getElementById('profileForm');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const deleteProfileBtn = document.getElementById('deleteProfileBtn');
  const confirmModal = document.getElementById('confirmModal');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const statusMessage = document.getElementById('statusMessage');
  const statusText = document.getElementById('statusText');

  let profiles = [];
  let editingProfileId = null;
  
  init();

  async function init() {
    await loadProfiles();
    renderProfilesList();
  }

  function showStatus(message, isError = false) {
    statusText.textContent = message;
    statusMessage.className = `status-message ${isError ? 'error' : 'success'}`;
    statusMessage.classList.remove('hidden');
    setTimeout(() => statusMessage.classList.add('hidden'), 3000);
  }

  function loadProfiles() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'getProfiles' }, (response) => {
        profiles = response.profiles || [];
        resolve();
      });
    });
  }

  function saveProfiles() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({
        action: 'saveProfiles',
        profiles,
        activeProfileId: editingProfileId
      }, () => resolve());
    });
  }

  function renderProfilesList() {
    profilesList.innerHTML = '';
    if (profiles.length === 0) {
      profilesList.innerHTML = '<p>No profiles yet. Add one!</p>';
      return;
    }
    profiles.forEach(profile => {
      const item = document.createElement('div');
      item.className = 'profile-item';
      item.innerHTML = `
        <span class="profile-name">${profile.name}</span>
        <div>
          <button class="btn btn-secondary edit-btn" data-id="${profile.id}">Edit</button>
        </div>`;
      profilesList.appendChild(item);
    });
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditor(btn.dataset.id));
    });
  }

  function openEditor(profileId = null) {
    editingProfileId = profileId;
    profileEditor.classList.remove('hidden');
    deleteProfileBtn.classList.toggle('hidden', profileId === null);
    editorTitle.textContent = profileId ? 'Edit Profile' : 'Create New Profile';
    if (profileId) {
      const profile = profiles.find(p => p.id === profileId);
      populateForm(profile);
    } else {
      profileForm.reset();
    }
  }

  function closeEditor() {
    profileEditor.classList.add('hidden');
    editingProfileId = null;
    profileForm.reset();
  }

  function populateForm(profile) {
    profileForm.profileName.value = profile.name;
    profileForm.fullName.value = profile.fields.fullName || '';
    profileForm.email.value = profile.fields.email || '';
    profileForm.phone.value = profile.fields.phone || '';
    profileForm.jobTitle.value = profile.fields.jobTitle || '';
    profileForm.address.value = profile.fields.address || '';
    profileForm.city.value = profile.fields.city || '';
    profileForm.state.value = profile.fields.state || '';
    profileForm.zip.value = profile.fields.zip || '';
    profileForm.country.value = profile.fields.country || '';
    profileForm.company.value = profile.fields.company || '';
    profileForm.experienceYears.value = profile.fields.experienceYears || '';
    profileForm.portfolioURL.value = profile.fields.portfolioURL || '';
    profileForm.linkedin.value = profile.fields.linkedin || '';
    profileForm.github.value = profile.fields.github || '';
    profileForm.resumeURL.value = profile.fields.resumeURL || '';
    profileForm.skills.value = profile.fields.skills || '';
    profileForm.education.value = profile.fields.education || '';
    profileForm.coverLetter.value = profile.fields.coverLetter || '';
  }

  function collectFormData() {
    return {
      name: profileForm.profileName.value.trim(),
      id: editingProfileId || 'profile-' + Date.now(),
      fields: {
        fullName: profileForm.fullName.value.trim(),
        email: profileForm.email.value.trim(),
        phone: profileForm.phone.value.trim(),
        jobTitle: profileForm.jobTitle.value.trim(),
        address: profileForm.address.value.trim(),
        city: profileForm.city.value.trim(),
        state: profileForm.state.value.trim(),
        zip: profileForm.zip.value.trim(),
        country: profileForm.country.value.trim(),
        company: profileForm.company.value.trim(),
        experienceYears: profileForm.experienceYears.value.trim(),
        portfolioURL: profileForm.portfolioURL.value.trim(),
        linkedin: profileForm.linkedin.value.trim(),
        github: profileForm.github.value.trim(),
        resumeURL: profileForm.resumeURL.value.trim(),
        skills: profileForm.skills.value.trim(),
        education: profileForm.education.value.trim(),
        coverLetter: profileForm.coverLetter.value.trim()
      }
    };
  }

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const profileData = collectFormData();
    if (!profileData.name) {
      showStatus('Profile name is required', true);
      return;
    }
    if (editingProfileId) {
      profiles = profiles.map(p => p.id === editingProfileId ? profileData : p);
    } else {
      profiles.push(profileData);
    }
    await saveProfiles();
    showStatus('Profile saved successfully');
    closeEditor();
    renderProfilesList();
  });

  cancelEditBtn.addEventListener('click', closeEditor);

  deleteProfileBtn.addEventListener('click', () => {
    confirmModal.classList.remove('hidden');
  });

  cancelDeleteBtn.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
  });

  confirmDeleteBtn.addEventListener('click', async () => {
    profiles = profiles.filter(p => p.id !== editingProfileId);
    confirmModal.classList.add('hidden');
    await saveProfiles();
    showStatus('Profile deleted', false);
    closeEditor();
    renderProfilesList();
  });

  addProfileBtn.addEventListener('click', () => openEditor());
  closeEditorBtn.addEventListener('click', closeEditor);
});

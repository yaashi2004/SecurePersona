// popup.js

document.addEventListener('DOMContentLoaded', function() {
  const profileSelect = document.getElementById('profileSelect');
  const fillFormBtn = document.getElementById('fillFormBtn');
  const generatePasswordBtn = document.getElementById('generatePasswordBtn');
  const createProfileBtn = document.getElementById('createProfileBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const passwordSection = document.getElementById('passwordSection');
  const generatedPassword = document.getElementById('generatedPassword');
  const copyPasswordBtn = document.getElementById('copyPasswordBtn');
  const statusMessage = document.getElementById('statusMessage');
  const statusText = document.getElementById('statusText');
  const checkmarkContainer = document.getElementById('checkmarkAnimation');
  
  const includeNumbers = document.getElementById('includeNumbers');
  const includeSymbols = document.getElementById('includeSymbols');
  const passwordLength = document.getElementById('passwordLength');
  const lengthValue = document.getElementById('lengthValue');

  let profiles = [];
  let activeProfileId = null;
  let lottieAnimation;

  init();

  async function init() {
    await loadProfiles();
    populateProfileSelect();
    updateFillButtonState();
    setupLottie();
    // Attach click handlers for opening options
    createProfileBtn.addEventListener('click', openOptionsPage);
    settingsBtn.addEventListener('click', openOptionsPage);
  }

  function setupLottie() {
    lottieAnimation = lottie.loadAnimation({
      container: checkmarkContainer,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: chrome.runtime.getURL('assets/animations/checkmark.json')
    });
  }

  function openOptionsPage() {
    chrome.runtime.openOptionsPage();
  }

  function loadProfiles() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'getProfiles' }, response => {
        profiles = response.profiles || [];
        activeProfileId = response.activeProfileId;
        resolve();
      });
    });
  }

  function populateProfileSelect() {
    profileSelect.innerHTML = '<option value="">-- Select Profile --</option>';
    profiles.forEach(profile => {
      const option = document.createElement('option');
      option.value = profile.id;
      option.textContent = profile.name;
      profileSelect.appendChild(option);
    });
    if (activeProfileId) {
      profileSelect.value = activeProfileId;
    }
  }

  function updateFillButtonState() {
    fillFormBtn.disabled = !profileSelect.value;
  }

  function showStatus(message, isError = false) {
    statusText.textContent = message;
    statusMessage.className = `status-message ${isError ? 'error' : 'success'}`;
    statusMessage.classList.remove('hidden');
    if (!isError) {
      lottieAnimation.goToAndPlay(0, true);
    }
    setTimeout(() => {
      statusMessage.classList.add('hidden');
    }, 3000);
  }

  profileSelect.addEventListener('change', function() {
    activeProfileId = this.value;
    updateFillButtonState();
    if (activeProfileId) {
      chrome.runtime.sendMessage({ action: 'setActiveProfile', activeProfileId });
    }
  });

  fillFormBtn.addEventListener('click', async function() {
    if (!activeProfileId) {
      showStatus('Please select a profile first', true);
      return;
    }
    const selected = profiles.find(p => p.id === activeProfileId);
    if (!selected) {
      showStatus('Profile not found', true);
      return;
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(
      tab.id,
      { action: 'fillForm', profileData: selected.fields },
      response => {
        if (response && response.success) {
          showStatus('Form filled successfully!');
        } else {
          showStatus('Failed to fill form', true);
        }
      }
    );
  });

  generatePasswordBtn.addEventListener('click', function() {
    const visible = !passwordSection.classList.contains('hidden');
    passwordSection.classList.toggle('hidden', visible);
    if (!visible) generateNewPassword();
  });

  copyPasswordBtn.addEventListener('click', function() {
    if (generatedPassword.value) {
      navigator.clipboard.writeText(generatedPassword.value)
        .then(() => showStatus('Password copied!'))
        .catch(() => showStatus('Copy failed', true));
    }
  });

  passwordLength.addEventListener('input', function() {
    lengthValue.textContent = this.value;
    generateNewPassword();
  });
  includeNumbers.addEventListener('change', generateNewPassword);
  includeSymbols.addEventListener('change', generateNewPassword);

  function generateNewPassword() {
    const length = parseInt(passwordLength.value);
    let charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers.checked) charset += '0123456789';
    if (includeSymbols.checked) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    let pwd = '';
    const rnd = window.crypto?.getRandomValues
      ? crypto.getRandomValues(new Uint32Array(length))
      : Array.from({ length }, () => Math.floor(Math.random() * charset.length));
    for (let i = 0; i < length; i++) {
      pwd += charset[rnd[i] % charset.length];
    }
    generatedPassword.value = pwd;
  }
});


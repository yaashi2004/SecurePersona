// popup.js - Enhanced SecurePersona Popup

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const profileSelect = document.getElementById('profileSelect');
  const fillFormBtn = document.getElementById('fillFormBtn');
  const generatePasswordBtn = document.getElementById('generatePasswordBtn');
  const createProfileBtn = document.getElementById('createProfileBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const passwordCard = document.getElementById('passwordCard');
  const generatedPassword = document.getElementById('generatedPassword');
  const copyPasswordBtn = document.getElementById('copyPasswordBtn');
  const statusCard = document.getElementById('statusCard');
  const statusText = document.getElementById('statusText');
  const checkmarkContainer = document.getElementById('checkmarkAnimation');
  
  const includeNumbers = document.getElementById('includeNumbers');
  const includeSymbols = document.getElementById('includeSymbols');
  const passwordLength = document.getElementById('passwordLength');
  const lengthValue = document.getElementById('lengthValue');

  // State
  let profiles = [];
  let activeProfileId = null;
  let lottieAnimation;
  let isPasswordSectionVisible = false;

  // Initialize
  init();

  async function init() {
    await loadProfiles();
    populateProfileSelect();
    updateFillButtonState();
    setupLottie();
    setupEventListeners();
    animateInitialLoad();
  }

  function animateInitialLoad() {
    // Stagger card animations
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
      card.style.animationDelay = `${0.1 + index * 0.1}s`;
    });
  }

  function setupLottie() {
    if (checkmarkContainer) {
      lottieAnimation = lottie.loadAnimation({
        container: checkmarkContainer,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: chrome.runtime.getURL('assets/animations/checkmark.json')
      });
    }
  }

  function setupEventListeners() {
    // Profile selection
    profileSelect.addEventListener('change', handleProfileChange);
    
    // Buttons
    fillFormBtn.addEventListener('click', handleFillForm);
    generatePasswordBtn.addEventListener('click', togglePasswordSection);
    createProfileBtn.addEventListener('click', openOptionsPage);
    settingsBtn.addEventListener('click', openOptionsPage);
    copyPasswordBtn.addEventListener('click', handleCopyPassword);
    
    // Password generation
    passwordLength.addEventListener('input', handlePasswordLengthChange);
    includeNumbers.addEventListener('change', generateNewPassword);
    includeSymbols.addEventListener('change', generateNewPassword);

    // Enhanced interactions
    setupButtonAnimations();
    setupHoverEffects();
  }

  function setupButtonAnimations() {
    // Add ripple effect to buttons
    document.querySelectorAll('.btn').forEach(button => {
      button.addEventListener('click', createRippleEffect);
    });

    // Add loading states
    [fillFormBtn, generatePasswordBtn, copyPasswordBtn].forEach(btn => {
      btn.addEventListener('click', () => {
        if (!btn.disabled) {
          addLoadingState(btn);
        }
      });
    });
  }

  function setupHoverEffects() {
    // Card hover effects
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-2px) scale(1.01)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
      });
    });

    // Toggle switch animations
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
      const input = toggle.querySelector('input');
      const slider = toggle.querySelector('.toggle-slider');
      
      toggle.addEventListener('mouseenter', () => {
        slider.style.transform = 'scale(1.05)';
      });
      
      toggle.addEventListener('mouseleave', () => {
        slider.style.transform = 'scale(1)';
      });
    });
  }

  function createRippleEffect(e) {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;

    button.style.position = 'relative';
    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  function addLoadingState(button) {
    button.classList.add('loading');
    button.disabled = true;
    
    setTimeout(() => {
      button.classList.remove('loading');
      button.disabled = false;
    }, 1000);
  }

  function handleProfileChange() {
    activeProfileId = profileSelect.value;
    updateFillButtonState();
    
    // Animate profile selection
    if (activeProfileId) {
      profileSelect.style.transform = 'scale(1.05)';
      setTimeout(() => {
        profileSelect.style.transform = 'scale(1)';
      }, 200);
      
      chrome.runtime.sendMessage({ action: 'setActiveProfile', activeProfileId });
      showStatus('Profile selected successfully!', 'success');
    }
  }

  function handlePasswordLengthChange() {
    const value = passwordLength.value;
    lengthValue.textContent = value;
    
    // Animate length value change
    lengthValue.classList.add('changing');
    setTimeout(() => {
      lengthValue.classList.remove('changing');
    }, 300);
    
    generateNewPassword();
  }

  function togglePasswordSection() {
    isPasswordSectionVisible = !isPasswordSectionVisible;
    
    if (isPasswordSectionVisible) {
      passwordCard.classList.remove('hidden');
      passwordCard.style.animation = 'slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      generateNewPassword();
    } else {
      passwordCard.classList.add('hiding');
      setTimeout(() => {
        passwordCard.classList.add('hidden');
        passwordCard.classList.remove('hiding');
      }, 300);
    }
  }

  async function handleFillForm() {
    if (!activeProfileId) {
      showStatus('Please select a profile first', 'error');
      return;
    }

    const selected = profiles.find(p => p.id === activeProfileId);
    if (!selected) {
      showStatus('Profile not found', 'error');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.tabs.sendMessage(
        tab.id,
        { action: 'fillForm', profileData: selected.fields },
        response => {
          if (response && response.success) {
            showStatus('Form filled successfully!', 'success');
          } else {
            showStatus('Failed to fill form', 'error');
          }
        }
      );
    } catch (error) {
      showStatus('Error filling form', 'error');
    }
  }

  function handleCopyPassword() {
    if (generatedPassword.value) {
      navigator.clipboard.writeText(generatedPassword.value)
        .then(() => {
          // Animate copy success
          copyPasswordBtn.classList.add('copied');
          const icon = copyPasswordBtn.querySelector('.btn-icon');
          
          // Change icon temporarily
          const originalIcon = icon.outerHTML;
          icon.outerHTML = '<i data-feather="check" class="btn-icon"></i>';
          feather.replace();
          
          setTimeout(() => {
            copyPasswordBtn.classList.remove('copied');
            copyPasswordBtn.querySelector('.btn-icon').outerHTML = originalIcon;
            feather.replace();
          }, 2000);
          
          showStatus('Password copied to clipboard!', 'success');
        })
        .catch(() => {
          showStatus('Failed to copy password', 'error');
        });
    }
  }

  function generateNewPassword() {
    const length = parseInt(passwordLength.value);
    let charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    if (includeNumbers.checked) charset += '0123456789';
    if (includeSymbols.checked) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    const randomValues = window.crypto?.getRandomValues
      ? crypto.getRandomValues(new Uint32Array(length))
      : Array.from({ length }, () => Math.floor(Math.random() * charset.length));
    
    for (let i = 0; i < length; i++) {
      password += charset[randomValues[i] % charset.length];
    }
    
    // Animate password generation
    generatedPassword.style.opacity = '0';
    generatedPassword.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
      generatedPassword.value = password;
      generatedPassword.style.opacity = '1';
      generatedPassword.style.transform = 'scale(1)';
    }, 150);
  }

  function showStatus(message, type = 'success') {
    statusText.textContent = message;
    statusCard.className = `card status-card ${type}`;
    statusCard.classList.remove('hidden');
    
    if (type === 'success' && lottieAnimation) {
      lottieAnimation.goToAndPlay(0, true);
    }
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusCard.style.animation = 'slideOutUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      setTimeout(() => {
        statusCard.classList.add('hidden');
        statusCard.style.animation = '';
      }, 300);
    }, 3000);
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
    profileSelect.innerHTML = '<option value="">Choose your profile...</option>';
    
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
    const wasDisabled = fillFormBtn.disabled;
    fillFormBtn.disabled = !profileSelect.value;
    
    // Animate button state change
    if (wasDisabled !== fillFormBtn.disabled) {
      fillFormBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        fillFormBtn.style.transform = 'scale(1)';
      }, 150);
    }
  }

  function openOptionsPage() {
    chrome.runtime.openOptionsPage();
  }

  // Initialize Feather icons when DOM is ready
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
});
// popup.js - Enhanced for Glassmorphism UI

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
  let isPasswordSectionVisible = false;

  // Initialize the application
  init();

  async function init() {
    await loadProfiles();
    populateProfileSelect();
    updateFillButtonState();
    setupLottie();
    setupEventListeners();
    setupRippleEffects();
    addEntranceAnimations();
  }

  // Setup Lottie animation for success feedback
  function setupLottie() {
    try {
      lottieAnimation = lottie.loadAnimation({
        container: checkmarkContainer,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: chrome.runtime.getURL('assets/animations/checkmark.json')
      });
    } catch (error) {
      console.warn('Lottie animation could not be loaded:', error);
    }
  }

  // Setup all event listeners
  function setupEventListeners() {
    // Profile management
    createProfileBtn.addEventListener('click', handleCreateProfile);
    settingsBtn.addEventListener('click', openOptionsPage);
    profileSelect.addEventListener('change', handleProfileChange);

    // Main actions
    fillFormBtn.addEventListener('click', handleFillForm);
    generatePasswordBtn.addEventListener('click', handleTogglePasswordSection);
    copyPasswordBtn.addEventListener('click', handleCopyPassword);

    // Password generation controls
    passwordLength.addEventListener('input', handlePasswordLengthChange);
    includeNumbers.addEventListener('change', generateNewPassword);
    includeSymbols.addEventListener('change', generateNewPassword);

    // Enhanced keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);
  }

  // Setup ripple effects for buttons
  function setupRippleEffects() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
      button.addEventListener('click', createRippleEffect);
    });
  }

  // Create ripple effect on button click
  function createRippleEffect(e) {
    const button = e.currentTarget;
    const ripple = button.querySelector('.btn-ripple');
    
    if (ripple) {
      // Reset the ripple
      ripple.style.animation = 'none';
      ripple.offsetHeight; // Trigger reflow
      ripple.style.animation = 'rippleEffect 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    }
  }

  // Add entrance animations with staggered timing
  function addEntranceAnimations() {
    const animatedElements = document.querySelectorAll('.glass-card');
    animatedElements.forEach((element, index) => {
      element.style.animationDelay = `${(index + 1) * 0.1}s`;
      element.classList.add('animate-in');
    });
  }

  // Enhanced profile change handler
  function handleProfileChange() {
    const newProfileId = profileSelect.value;
    
    // Add loading state
    profileSelect.classList.add('loading');
    
    setTimeout(() => {
      activeProfileId = newProfileId;
      updateFillButtonState();
      profileSelect.classList.remove('loading');
      
      if (activeProfileId) {
        chrome.runtime.sendMessage({ action: 'setActiveProfile', activeProfileId });
        showBriefStatus('Profile selected', false, 1500);
      }
    }, 300); // Small delay for better UX
  }

  // Enhanced create profile handler
  function handleCreateProfile() {
    addButtonLoadingState(createProfileBtn);
    
    setTimeout(() => {
      openOptionsPage();
      removeButtonLoadingState(createProfileBtn);
    }, 200);
  }

  // Enhanced fill form handler
  async function handleFillForm() {
    if (!activeProfileId) {
      showStatus('Please select a profile first', true);
      shakeElement(fillFormBtn);
      return;
    }

    const selected = profiles.find(p => p.id === activeProfileId);
    if (!selected) {
      showStatus('Profile not found', true);
      shakeElement(fillFormBtn);
      return;
    }

    // Add loading state to button
    addButtonLoadingState(fillFormBtn);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.tabs.sendMessage(
        tab.id,
        { action: 'fillForm', profileData: selected.fields },
        response => {
          removeButtonLoadingState(fillFormBtn);
          
          if (response && response.success) {
            showStatus('Form filled successfully!', false);
            addSuccessAnimation(fillFormBtn);
          } else {
            showStatus('Failed to fill form', true);
            shakeElement(fillFormBtn);
          }
        }
      );
    } catch (error) {
      removeButtonLoadingState(fillFormBtn);
      showStatus('Error: Could not access the current tab', true);
      shakeElement(fillFormBtn);
    }
  }

  // Enhanced password section toggle
  function handleTogglePasswordSection() {
    const isCurrentlyVisible = !passwordSection.classList.contains('hidden');
    
    if (isCurrentlyVisible) {
      // Hide with animation
      passwordSection.classList.add('hiding');
      setTimeout(() => {
        passwordSection.classList.add('hidden');
        passwordSection.classList.remove('hiding');
        isPasswordSectionVisible = false;
      }, 400);
    } else {
      // Show with animation
      passwordSection.classList.remove('hidden');
      isPasswordSectionVisible = true;
      generateNewPassword();
      
      // Focus the first interactive element
      setTimeout(() => {
        const firstInput = passwordSection.querySelector('input[type="checkbox"]');
        if (firstInput) firstInput.focus();
      }, 300);
    }

    // Update button state
    updatePasswordButtonState();
  }

  // Update password button appearance
  function updatePasswordButtonState() {
    const buttonText = generatePasswordBtn.querySelector('.btn-text');
    if (isPasswordSectionVisible) {
      buttonText.textContent = 'Hide Generator';
      generatePasswordBtn.classList.add('active');
    } else {
      buttonText.textContent = 'Generate Password';
      generatePasswordBtn.classList.remove('active');
    }
  }

  // Enhanced copy password handler
  async function handleCopyPassword() {
    if (!generatedPassword.value) {
      showBriefStatus('No password to copy', true, 1500);
      return;
    }

    addButtonLoadingState(copyPasswordBtn);

    try {
      await navigator.clipboard.writeText(generatedPassword.value);
      
      // Success animation
      copyPasswordBtn.classList.add('copied');
      removeButtonLoadingState(copyPasswordBtn);
      showStatus('Password copied to clipboard!', false);
      
      // Reset button state
      setTimeout(() => {
        copyPasswordBtn.classList.remove('copied');
      }, 1000);
      
    } catch (error) {
      removeButtonLoadingState(copyPasswordBtn);
      showBriefStatus('Failed to copy password', true, 2000);
    }
  }

  // Enhanced password length change handler
  function handlePasswordLengthChange() {
    const value = passwordLength.value;
    lengthValue.textContent = value;
    lengthValue.classList.add('updating');
    
    setTimeout(() => {
      lengthValue.classList.remove('updating');
    }, 200);
    
    generateNewPassword();
  }

  // Enhanced keyboard navigation
  function handleKeyboardNavigation(e) {
    // ESC to close password section
    if (e.key === 'Escape' && isPasswordSectionVisible) {
      handleTogglePasswordSection();
      return;
    }

    // Enter to fill form if profile is selected
    if (e.key === 'Enter' && !fillFormBtn.disabled) {
      handleFillForm();
      return;
    }

    // Ctrl/Cmd + G to toggle password generator
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
      e.preventDefault();
      handleTogglePasswordSection();
      return;
    }
  }

  // Enhanced status message display
  function showStatus(message, isError = false, duration = 3000) {
    statusText.textContent = message;
    statusMessage.className = `status-message glass-card ${isError ? 'error' : 'success'}`;
    statusMessage.classList.remove('hidden');

    // Play Lottie animation for success
    if (!isError && lottieAnimation) {
      checkmarkContainer.classList.add('playing');
      lottieAnimation.goToAndPlay(0, true);
      
      setTimeout(() => {
        checkmarkContainer.classList.remove('playing');
      }, 600);
    }

    // Hide after duration
    setTimeout(() => {
      statusMessage.classList.add('hiding');
      setTimeout(() => {
        statusMessage.classList.add('hidden');
        statusMessage.classList.remove('hiding');
      }, 300);
    }, duration);
  }

  // Brief status messages for minor feedback
  function showBriefStatus(message, isError = false, duration = 1500) {
    showStatus(message, isError, duration);
  }

  // Add loading state to buttons
  function addButtonLoadingState(button) {
    button.classList.add('loading');
    button.disabled = true;
    
    const originalText = button.querySelector('.btn-text').textContent;
    button.dataset.originalText = originalText;
    button.querySelector('.btn-text').textContent = 'Loading...';
  }

  // Remove loading state from buttons
  function removeButtonLoadingState(button) {
    button.classList.remove('loading');
    button.disabled = false;
    
    if (button.dataset.originalText) {
      button.querySelector('.btn-text').textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }

  // Add success animation to elements
  function addSuccessAnimation(element) {
    element.classList.add('success-pulse');
    setTimeout(() => {
      element.classList.remove('success-pulse');
    }, 600);
  }

  // Shake animation for errors
  function shakeElement(element) {
    element.classList.add('error-shake');
    setTimeout(() => {
      element.classList.remove('error-shake');
    }, 600);
  }

  // Open options page with enhanced feedback
  function openOptionsPage() {
    chrome.runtime.openOptionsPage();
  }

  // Load profiles from storage
  function loadProfiles() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'getProfiles' }, response => {
        profiles = response.profiles || [];
        activeProfileId = response.activeProfileId;
        resolve();
      });
    });
  }

  // Populate profile select with enhanced styling
  function populateProfileSelect() {
    profileSelect.innerHTML = '<option value="">Choose a profile...</option>';
    
    profiles.forEach(profile => {
      const option = document.createElement('option');
      option.value = profile.id;
      option.textContent = profile.name;
      profileSelect.appendChild(option);
    });
    
    if (activeProfileId) {
      profileSelect.value = activeProfileId;
    }

    // Add subtle animation to show profiles loaded
    profileSelect.classList.add('profiles-loaded');
  }

  // Update fill button state with enhanced feedback
  function updateFillButtonState() {
    const wasDisabled = fillFormBtn.disabled;
    fillFormBtn.disabled = !profileSelect.value;
    
    // Add visual feedback when button becomes enabled
    if (wasDisabled && !fillFormBtn.disabled) {
      fillFormBtn.classList.add('newly-enabled');
      setTimeout(() => {
        fillFormBtn.classList.remove('newly-enabled');
      }, 300);
    }
  }

  // Enhanced password generation with better randomness
  function generateNewPassword() {
    const length = parseInt(passwordLength.value);
    let charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    if (includeNumbers.checked) {
      charset += '0123456789';
    }
    
    if (includeSymbols.checked) {
      charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }

    let password = '';
    
    // Use crypto API for better randomness
    if (window.crypto && crypto.getRandomValues) {
      const randomArray = new Uint32Array(length);
      crypto.getRandomValues(randomArray);
      
      for (let i = 0; i < length; i++) {
        password += charset[randomArray[i] % charset.length];
      }
    } else {
      // Fallback for older browsers
      for (let i = 0; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
      }
    }

    // Animate password input when updating
    generatedPassword.style.transform = 'scale(0.95)';
    generatedPassword.value = password;
    
    setTimeout(() => {
      generatedPassword.style.transform = 'scale(1)';
    }, 100);
  }

  // Enhanced error handling for runtime messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'profilesUpdated') {
      loadProfiles().then(() => {
        populateProfileSelect();
        updateFillButtonState();
        showBriefStatus('Profiles updated', false, 1500);
      });
    }
  });

  // Add CSS classes for additional animations
  const style = document.createElement('style');
  style.textContent = `
    .success-pulse {
      animation: successPop 0.6s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    
    .error-shake {
      animation: errorShake 0.6s ease-out !important;
    }
    
    .newly-enabled {
      animation: glowPulse 0.8s ease-out !important;
    }
    
    .profiles-loaded {
      animation: fadeInScale 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    
    .updating {
      animation: iconBounce 0.3s ease-out !important;
    }
    
    .btn.active {
      background: linear-gradient(135deg, #f093fb, #f5576c) !important;
      box-shadow: 0 6px 20px rgba(240, 147, 251, 0.4) !important;
    }
  `;
  document.head.appendChild(style);
});


// popup.js - Enhanced with Advanced Animations

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
    setupAnimations();
    setupInteractiveEffects();
    
    // Attach click handlers for opening options
    createProfileBtn.addEventListener('click', openOptionsPage);
    settingsBtn.addEventListener('click', openOptionsPage);
  }

  function setupAnimations() {
    // Add entrance animations to elements
    const animatedElements = document.querySelectorAll('.profile-section, .actions-section, .footer');
    animatedElements.forEach((el, index) => {
      el.classList.add(`stagger-${index + 1}`);
    });

    // Add floating animation to title
    const title = document.querySelector('.title');
    if (title) {
      title.classList.add('float-animation');
    }

    // Add glassmorphism hover effects
    const glassElements = document.querySelectorAll('.profile-section, .password-section');
    glassElements.forEach(el => {
      el.classList.add('glass-hover', 'interactive-hover');
    });
  }

  function setupInteractiveEffects() {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
      button.addEventListener('click', createRippleEffect);
      button.classList.add('ripple-container', 'magnetic');
    });

    // Add shimmer effect to loading states
    profileSelect.addEventListener('focus', () => {
      profileSelect.classList.add('loading-shimmer');
      setTimeout(() => profileSelect.classList.remove('loading-shimmer'), 1000);
    });

    // Add glow effect to active elements
    fillFormBtn.addEventListener('mouseenter', () => {
      if (!fillFormBtn.disabled) {
        fillFormBtn.classList.add('glow-effect');
      }
    });
    
    fillFormBtn.addEventListener('mouseleave', () => {
      fillFormBtn.classList.remove('glow-effect');
    });
  }

  function createRippleEffect(e) {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    button.appendChild(ripple);
    
    // Add button press animation
    button.classList.add('btn-press');
    setTimeout(() => button.classList.remove('btn-press'), 100);
    
    // Remove ripple after animation
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }

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
      console.log('Lottie animation not available, using fallback');
    }
  }

  function openOptionsPage() {
    // Add exit animation before opening options
    document.body.classList.add('scale-in');
    setTimeout(() => {
      chrome.runtime.openOptionsPage();
    }, 200);
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
    // Add loading animation
    profileSelect.innerHTML = '<option value="">Loading profiles...</option>';
    profileSelect.classList.add('loading-shimmer');
    
    setTimeout(() => {
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
      
      profileSelect.classList.remove('loading-shimmer');
      profileSelect.classList.add('smooth-reveal');
    }, 300);
  }

  function updateFillButtonState() {
    const wasDisabled = fillFormBtn.disabled;
    fillFormBtn.disabled = !profileSelect.value;
    
    // Add animation when button becomes enabled
    if (wasDisabled && !fillFormBtn.disabled) {
      fillFormBtn.classList.add('bounce-in');
      setTimeout(() => fillFormBtn.classList.remove('bounce-in'), 600);
    }
  }

  function showStatus(message, isError = false) {
    statusText.textContent = message;
    statusMessage.className = `status-message ${isError ? 'error' : 'success'}`;
    statusMessage.classList.remove('hidden');
    statusMessage.classList.add('notification-slide');
    
    if (!isError && lottieAnimation) {
      try {
        lottieAnimation.goToAndPlay(0, true);
      } catch (error) {
        // Fallback animation
        checkmarkContainer.innerHTML = '✓';
        checkmarkContainer.classList.add('bounce-in');
      }
    }
    
    // Create floating particles for success
    if (!isError) {
      createSuccessParticles();
    }
    
    setTimeout(() => {
      statusMessage.classList.add('hidden');
      statusMessage.classList.remove('notification-slide');
      if (checkmarkContainer.innerHTML === '✓') {
        checkmarkContainer.innerHTML = '';
        checkmarkContainer.classList.remove('bounce-in');
      }
    }, 3000);
  }

  function createSuccessParticles() {
    const container = document.querySelector('.container');
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 0.5 + 's';
        container.appendChild(particle);
        
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, 3000);
      }, i * 100);
    }
  }

  profileSelect.addEventListener('change', function() {
    activeProfileId = this.value;
    updateFillButtonState();
    
    // Add selection animation
    this.classList.add('scale-in');
    setTimeout(() => this.classList.remove('scale-in'), 300);
    
    if (activeProfileId) {
      chrome.runtime.sendMessage({ action: 'setActiveProfile', activeProfileId });
    }
  });

  fillFormBtn.addEventListener('click', async function() {
    if (!activeProfileId) {
      showStatus('Please select a profile first', true);
      return;
    }
    
    // Add loading state
    const originalText = this.innerHTML;
    this.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
    this.disabled = true;
    
    const selected = profiles.find(p => p.id === activeProfileId);
    if (!selected) {
      showStatus('Profile not found', true);
      this.innerHTML = originalText;
      this.disabled = false;
      return;
    }
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(
        tab.id,
        { action: 'fillForm', profileData: selected.fields },
        response => {
          setTimeout(() => {
            this.innerHTML = originalText;
            this.disabled = false;
            
            if (response && response.success) {
              showStatus('Form filled successfully!');
              // Add success glow
              this.classList.add('glow-effect');
              setTimeout(() => this.classList.remove('glow-effect'), 2000);
            } else {
              showStatus('Failed to fill form', true);
            }
          }, 800);
        }
      );
    } catch (error) {
      this.innerHTML = originalText;
      this.disabled = false;
      showStatus('Failed to fill form', true);
    }
  });

  generatePasswordBtn.addEventListener('click', function() {
    const visible = !passwordSection.classList.contains('hidden');
    
    if (visible) {
      // Hide with animation
      passwordSection.style.animation = 'slideOutUp 0.3s ease-out';
      setTimeout(() => {
        passwordSection.classList.add('hidden');
        passwordSection.style.animation = '';
      }, 300);
    } else {
      // Show with animation
      passwordSection.classList.remove('hidden');
      passwordSection.classList.add('smooth-reveal');
      generateNewPassword();
      setTimeout(() => passwordSection.classList.remove('smooth-reveal'), 800);
    }
  });

  copyPasswordBtn.addEventListener('click', function() {
    if (generatedPassword.value) {
      navigator.clipboard.writeText(generatedPassword.value)
        .then(() => {
          showStatus('Password copied!');
          // Add copy animation
          this.classList.add('scale-in');
          setTimeout(() => this.classList.remove('scale-in'), 300);
        })
        .catch(() => showStatus('Copy failed', true));
    }
  });

  passwordLength.addEventListener('input', function() {
    lengthValue.textContent = this.value;
    // Add value animation
    lengthValue.classList.add('bounce-in');
    setTimeout(() => lengthValue.classList.remove('bounce-in'), 300);
    generateNewPassword();
  });

  includeNumbers.addEventListener('change', () => {
    generateNewPassword();
    // Add checkbox animation
    includeNumbers.parentElement.classList.add('scale-in');
    setTimeout(() => includeNumbers.parentElement.classList.remove('scale-in'), 200);
  });

  includeSymbols.addEventListener('change', () => {
    generateNewPassword();
    // Add checkbox animation
    includeSymbols.parentElement.classList.add('scale-in');
    setTimeout(() => includeSymbols.parentElement.classList.remove('scale-in'), 200);
  });

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
    
    // Animate password generation
    generatedPassword.style.opacity = '0.5';
    generatedPassword.classList.add('loading-shimmer');
    
    setTimeout(() => {
      generatedPassword.value = pwd;
      generatedPassword.style.opacity = '1';
      generatedPassword.classList.remove('loading-shimmer');
      generatedPassword.classList.add('typewriter');
      setTimeout(() => generatedPassword.classList.remove('typewriter'), 1000);
    }, 200);
  }

  // Add slide out up animation keyframe
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideOutUp {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-30px);
      }
    }
  `;
  document.head.appendChild(style);

  // Add particle effects on page load
  setTimeout(createSuccessParticles, 1000);
});


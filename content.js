class SecurePersonaContent {
    constructor() {
        this.setupMessageListener();
    }

    setupMessageListener() {
        console.log('Setting up message listener...');
        
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('Message received:', message);
            
            if (message.action === 'fillForm') {
                console.log('Processing fillForm action...');
                this.fillFormWithProfile(message.profile)
                    .then(result => {
                        console.log('Fill form result:', result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('Error filling form:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            } else if (message.action === 'test') {
                console.log('Test message received');
                sendResponse({ success: true, message: 'Content script is working!' });
                return true;
            }
        });
        
        console.log('Message listener setup complete');
    }

    async fillFormWithProfile(profile) {
        try {
            console.log('=== PROFILE DEBUG INFO ===');
            console.log('Profile name:', profile.name);
            console.log('Profile keys:', Object.keys(profile));
            console.log('Full profile data:', JSON.stringify(profile, null, 2));
            console.log('=== END PROFILE DEBUG ===');
            
            const formFields = this.detectFormFields();
            console.log('Detected form fields:', formFields.length);
            
            if (formFields.length === 0) {
                console.log('No form fields detected on this page');
                return { success: false, message: 'No form fields found' };
            }

            let filledCount = 0;
            const filledFields = [];

            for (const field of formFields) {
                console.log(`\n--- Processing Field ---`);
                console.log('Field element:', field);
                console.log('Field label:', field.getAttribute('data-google-field-label'));
                
                const fieldValue = this.getFieldValue(field, profile);
                console.log('Field value:', fieldValue, 'Empty:', this.isFieldEmpty(field));
                
                if (fieldValue && this.isFieldEmpty(field)) {
                    this.fillField(field, fieldValue);
                    this.highlightField(field);
                    filledFields.push({
                        name: field.name || field.id,
                        value: fieldValue
                    });
                    filledCount++;
                }
            }

            console.log(`Form filling complete: ${filledCount} fields filled out of ${formFields.length} detected`);

            if (filledCount > 0) {
                this.showSuccessAnimation();
                this.showNotification(`Filled ${filledCount} fields with "${profile.name}" profile`, 'success');
                return { 
                    success: true, 
                    filledCount, 
                    filledFields,
                    message: `Successfully filled ${filledCount} form fields`
                };
            } else {
                return { 
                    success: false, 
                    message: `No fields were filled. Detected ${formFields.length} fields but no matching profile data found.`
                };
            }
        } catch (error) {
            console.error('Error in fillFormWithProfile:', error);
            throw error;
        }
    }

    detectFormFields() {
        const fields = [];
        
        console.log('=== FIELD DETECTION ===');
        console.log('Current URL:', window.location.href);
        console.log('Page title:', document.title);
        
        // For Google Forms, try multiple detection methods
        if (window.location.href.includes('docs.google.com')) {
            console.log('=== Google Forms specific detection ===');
            
            // Method 1: Look for Google Forms question containers first
            const questionContainers = document.querySelectorAll('.freebirdFormviewerComponentsQuestionBaseRoot');
            console.log(`Found ${questionContainers.length} question containers`);
            
            if (questionContainers.length > 0) {
                questionContainers.forEach((container, index) => {
                    // Find the question title
                    const titleElement = container.querySelector('.freebirdFormviewerComponentsQuestionBaseTitle');
                    if (titleElement) {
                        const title = titleElement.textContent.trim();
                        console.log(`Question ${index + 1}: "${title}"`);
                        
                        // Find input elements within this container
                        const inputs = container.querySelectorAll('input, textarea, select, div[role="textbox"], div[contenteditable="true"]');
                        console.log(`  Found ${inputs.length} input elements in question "${title}"`);
                        
                        inputs.forEach((input, inputIndex) => {
                            if (this.isVisibleField(input)) {
                                input.setAttribute('data-google-field-label', title);
                                fields.push(input);
                                console.log(`  Added input ${inputIndex + 1} for question "${title}"`);
                            }
                        });
                    }
                });
            } else {
                console.log('No question containers found, trying alternative selectors...');
                
                // Method 2: Try alternative Google Forms selectors
                const alternativeSelectors = [
                    '[data-params]',
                    '.freebirdFormviewerComponentsQuestionBaseTitle',
                    'input[type="text"]',
                    'input[type="email"]',
                    'input[type="tel"]',
                    'textarea'
                ];
                
                alternativeSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    console.log(`Selector "${selector}": found ${elements.length} elements`);
                    
                    elements.forEach((element, index) => {
                        if (this.isVisibleField(element)) {
                            const label = this.findFieldLabel(element);
                            if (label) {
                                element.setAttribute('data-google-field-label', label);
                                fields.push(element);
                                console.log(`Added field via ${selector}: "${label}"`);
                            }
                        }
                    });
                });
            }
        }
        
        // Method 3: Fallback to general input detection
        if (fields.length === 0) {
            console.log('=== Fallback to general input detection ===');
            const inputs = document.querySelectorAll('input, textarea, select, div[role="textbox"], div[contenteditable="true"]');
            console.log(`Found ${inputs.length} input elements`);
            
            inputs.forEach((input, index) => {
                if (this.isVisibleField(input)) {
                    const fieldLabel = this.findFieldLabel(input);
                    if (fieldLabel) {
                        input.setAttribute('data-google-field-label', fieldLabel);
                        fields.push(input);
                        console.log(`Added field ${index + 1}: "${fieldLabel}"`);
                    }
                }
            });
        }
        
        // Sort fields by visual position
        fields.sort((a, b) => {
            const aRect = a.getBoundingClientRect();
            const bRect = b.getBoundingClientRect();
            const verticalDiff = aRect.top - bRect.top;
            if (Math.abs(verticalDiff) > 10) {
                return verticalDiff;
            }
            return aRect.left - bRect.left;
        });
        
        console.log(`Final detected fields: ${fields.length}`);
        console.log('Field labels:', fields.map(f => f.getAttribute('data-google-field-label')));
        
        return fields;
    }
    
    findFieldLabel(input) {
        console.log('=== Finding label for input ===');
        
        // For Google Forms, look for question containers
        if (window.location.href.includes('docs.google.com')) {
            let currentElement = input;
            for (let i = 0; i < 20; i++) {
                if (!currentElement) break;
                
                const questionContainer = currentElement.closest('.freebirdFormviewerComponentsQuestionBaseRoot');
                if (questionContainer) {
                    const titleElement = questionContainer.querySelector('.freebirdFormviewerComponentsQuestionBaseTitle');
                    if (titleElement) {
                        const title = titleElement.textContent.trim();
                        if (title && title.length > 0) {
                            console.log('✅ Found Google Forms question title:', title);
                            return title;
                        }
                    }
                }
                
                currentElement = currentElement.parentElement;
            }
        }
        
        // Look for aria-label
        const ariaLabel = input.getAttribute('aria-label');
        if (ariaLabel) {
            console.log('✅ Found aria-label:', ariaLabel);
            return ariaLabel;
        }
        
        // Look for placeholder
        const placeholder = input.getAttribute('placeholder');
        if (placeholder) {
            console.log('✅ Found placeholder:', placeholder);
            return placeholder;
        }
        
        // Look for label in parent elements
        let parent = input.parentElement;
        for (let i = 0; i < 10; i++) {
            if (!parent) break;
            
            const textContent = parent.textContent.trim();
            const lines = textContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            
            for (const line of lines) {
                if (line.length > 2 && line.length < 100 && 
                    !line.includes('Your answer') && 
                    !line.includes('Switch accounts') && 
                    !line.includes('Not shared') &&
                    !line.includes('Required') &&
                    !line.includes('*')) {
                    console.log('✅ Found potential label:', line);
                    return line;
                }
            }
            
            parent = parent.parentElement;
        }
        
        console.log('❌ No label found for input');
        return null;
    }

    isVisibleField(field) {
        try {
            const style = window.getComputedStyle(field);
            const rect = field.getBoundingClientRect();
            
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   parseFloat(style.opacity) > 0 &&
                   rect.width > 0 && 
                   rect.height > 0;
        } catch (error) {
            return true;
        }
    }

    getFieldValue(field, profile) {
        const fieldLabel = field.getAttribute('data-google-field-label');
        console.log('Field label:', fieldLabel);
        console.log('Available profile fields:', Object.keys(profile));
        console.log('Profile data:', profile);
        
        if (fieldLabel) {
            const label = fieldLabel.toLowerCase();
            console.log('Processing label:', label);
            
            // Check for first name variations - be more flexible
            if ((label.includes('first name') || label.includes('firstname') || 
                 (label.includes('first') && label.includes('name')) ||
                 label.includes('name') && !label.includes('last') && !label.includes('email') && !label.includes('phone')) && 
                profile.firstName) {
                console.log('Mapping FIRST NAME -> firstName =', profile.firstName);
                return profile.firstName;
            }
            
            // Check for last name variations
            if ((label.includes('last name') || label.includes('lastname') || 
                 (label.includes('last') && label.includes('name'))) && profile.lastName) {
                console.log('Mapping LAST NAME -> lastName =', profile.lastName);
                return profile.lastName;
            }
            
            // Check for email variations
            if (label.includes('email') && profile.email) {
                console.log('Mapping Email -> email =', profile.email);
                return profile.email;
            }
            
            // Check for address variations
            if (label.includes('address') && profile.address) {
                console.log('Mapping Address -> address =', profile.address);
                return profile.address;
            }
            
            // Check for phone variations - be more flexible
            if ((label.includes('phone') || label.includes('phone number') || 
                 label.includes('mobile') || label.includes('cell') || 
                 label.includes('telephone') || label.includes('number')) && profile.phone) {
                console.log('Mapping Phone -> phone =', profile.phone);
                return profile.phone;
            }
            
            // Check for company variations
            if ((label.includes('company') || label.includes('organization') || 
                 label.includes('employer')) && profile.company) {
                console.log('Mapping Company -> company =', profile.company);
                return profile.company;
            }
            
            // Check for job title variations
            if ((label.includes('job') || label.includes('title') || 
                 label.includes('position') || label.includes('role')) && profile.jobTitle) {
                console.log('Mapping Job Title -> jobTitle =', profile.jobTitle);
                return profile.jobTitle;
            }
            
            // Check for LinkedIn variations
            if (label.includes('linkedin') && profile.linkedin) {
                console.log('Mapping LinkedIn -> linkedin =', profile.linkedin);
                return profile.linkedin;
            }
            
            // Check for GitHub variations
            if (label.includes('github') && profile.github) {
                console.log('Mapping GitHub -> github =', profile.github);
                return profile.github;
            }
            
            // Check for website variations
            if ((label.includes('website') || label.includes('site') || 
                 label.includes('url')) && profile.website) {
                console.log('Mapping Website -> website =', profile.website);
                return profile.website;
            }
            
            // Check for skills variations
            if ((label.includes('skill') || label.includes('expertise') || 
                 label.includes('competency')) && profile.skills) {
                console.log('Mapping Skills -> skills =', profile.skills);
                return profile.skills;
            }
            
            // Check for experience variations
            if ((label.includes('experience') || label.includes('work')) && profile.experience) {
                console.log('Mapping Experience -> experience =', profile.experience);
                return profile.experience;
            }
            
            // Check for education variations
            if ((label.includes('education') || label.includes('academic') || 
                 label.includes('degree')) && profile.education) {
                console.log('Mapping Education -> education =', profile.education);
                return profile.education;
            }
            
            // Check for bio variations
            if ((label.includes('bio') || label.includes('biography') || 
                 label.includes('about')) && profile.bio) {
                console.log('Mapping Bio -> bio =', profile.bio);
                return profile.bio;
            }
            
            // If no specific match found, try to use available data
            console.log('No specific match found, checking available profile data...');
            
            // If we have firstName and this field doesn't look like email or phone, use firstName
            if (profile.firstName && !label.includes('email') && !label.includes('phone') && !label.includes('number')) {
                console.log('Using firstName as fallback for:', fieldLabel);
                return profile.firstName;
            }
            
            // If we have phone and this field looks like it could be a phone field
            if (profile.phone && (label.includes('phone') || label.includes('number') || label.includes('contact'))) {
                console.log('Using phone as fallback for:', fieldLabel);
                return profile.phone;
            }
        }
        
        console.log('No match found for field:', fieldLabel);
        return null;
    }

    isFieldEmpty(field) {
        const value = field.value || field.textContent || '';
        return value.trim() === '';
    }

    fillField(field, value) {
        try {
            if (field.getAttribute('contenteditable') === 'true' || field.getAttribute('role') === 'textbox') {
                field.textContent = value;
                field.innerHTML = value;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                field.value = value;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            console.log(`Filled field with: ${value}`);
        } catch (error) {
            console.error('Error filling field:', error);
        }
    }

    highlightField(field) {
        const originalBackground = field.style.backgroundColor;
        const originalBorder = field.style.border;
        
        field.style.backgroundColor = '#d1fae5';
        field.style.border = '2px solid #10b981';
        field.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            field.style.backgroundColor = originalBackground;
            field.style.border = originalBorder;
        }, 2000);
    }

    showSuccessAnimation() {
        const animation = document.createElement('div');
        animation.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#10b981" opacity="0.9"/>
                <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        
        animation.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            pointer-events: none;
            animation: successPulse 1s ease-out;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes successPulse {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(animation);
        
        setTimeout(() => {
            if (animation.parentNode) animation.parentNode.removeChild(animation);
            if (style.parentNode) style.parentNode.removeChild(style);
        }, 1000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) notification.parentNode.removeChild(notification);
            }, 300);
        }, 4000);
    }
}

// Check if already loaded to prevent duplicate injection
if (window.securePersonaContentLoaded) {
    console.log('SecurePersona Content Script already loaded, skipping...');
} else {
    // Mark as loaded
    window.securePersonaContentLoaded = true;
    
    console.log('SecurePersona Content Script loaded');

    window.securePersonaContent = null;

    function initializeContentScript() {
        try {
            if (window.securePersonaContent) {
                console.log('Content script already initialized');
                return;
            }
            
            window.securePersonaContent = new SecurePersonaContent();
            console.log('SecurePersona Content Script initialized successfully');
            console.log('✅ SecurePersona content script is ready to receive messages!');
            
        } catch (error) {
            console.error('Error initializing SecurePersona Content Script:', error);
        }
    }

    // Initialize immediately
    initializeContentScript();

    // Also initialize when DOM is ready as backup
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeContentScript);
    } else {
        setTimeout(initializeContentScript, 100);
    }

    // Additional backup initialization
    setTimeout(initializeContentScript, 500);
    setTimeout(initializeContentScript, 1000);

    // Global test function
    window.testSecurePersona = function() {
        console.log('Testing SecurePersona...');
        if (window.securePersonaContent) {
            console.log('✅ SecurePersona is loaded and ready!');
            return true;
        } else {
            console.log('❌ SecurePersona is not loaded');
            return false;
        }
    };

    console.log('SecurePersona content script is available for testing');
} 
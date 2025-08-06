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
            
            // Enhanced Google Forms selectors
            const googleFormsSelectors = [
                // Primary selectors
                '.freebirdFormviewerComponentsQuestionBaseRoot',
                '.freebirdFormviewerComponentsQuestionBaseTitle',
                '[data-params]',
                
                // Input selectors
                'input[type="text"]',
                'input[type="email"]',
                'input[type="tel"]',
                'input[type="url"]',
                'textarea',
                'select',
                
                // Google Forms specific input containers
                '.freebirdFormviewerComponentsQuestionTextInput',
                '.freebirdFormviewerComponentsQuestionTextShortInput',
                '.freebirdFormviewerComponentsQuestionTextLongInput',
                '.freebirdFormviewerComponentsQuestionEmailInput',
                '.freebirdFormviewerComponentsQuestionPhoneInput',
                
                // Contenteditable elements
                'div[role="textbox"]',
                'div[contenteditable="true"]',
                
                // Fallback selectors
                '[data-test-id]',
                '[aria-label]',
                '[placeholder]'
            ];
            
            let foundFields = false;
            
            // Try each selector method
            for (const selector of googleFormsSelectors) {
                const elements = document.querySelectorAll(selector);
                console.log(`Selector "${selector}": found ${elements.length} elements`);
                
                if (elements.length > 0) {
                    elements.forEach((element, index) => {
                        if (this.isVisibleField(element)) {
                            const label = this.findFieldLabel(element);
                            if (label) {
                                element.setAttribute('data-google-field-label', label);
                                fields.push(element);
                                console.log(`Added field via ${selector}: "${label}"`);
                                foundFields = true;
                            }
                        }
                    });
                }
                
                // If we found fields with this method, break
                if (foundFields) {
                    console.log(`Successfully found fields using selector: ${selector}`);
                    break;
                }
            }
            
            // If no fields found with specific selectors, try question containers
            if (!foundFields) {
                console.log('Trying question container approach...');
                const questionContainers = document.querySelectorAll('.freebirdFormviewerComponentsQuestionBaseRoot');
                console.log(`Found ${questionContainers.length} question containers`);
                
                questionContainers.forEach((container, index) => {
                    const titleElement = container.querySelector('.freebirdFormviewerComponentsQuestionBaseTitle');
                    if (titleElement) {
                        const title = titleElement.textContent.trim();
                        console.log(`Question ${index + 1}: "${title}"`);
                        
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
            }
        }
        
        // Fallback to general input detection if still no fields found
        if (fields.length === 0) {
            console.log('=== Fallback to general input detection ===');
            const generalSelectors = [
                'input[type="text"]',
                'input[type="email"]',
                'input[type="tel"]',
                'input[type="url"]',
                'textarea',
                'select',
                'div[role="textbox"]',
                'div[contenteditable="true"]'
            ];
            
            generalSelectors.forEach(selector => {
                const inputs = document.querySelectorAll(selector);
                console.log(`General selector "${selector}": found ${inputs.length} elements`);
                
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
        
        // For Google Forms, try multiple approaches to find the question label
        if (window.location.href.includes('docs.google.com')) {
            console.log('Looking for Google Forms question label...');
            
            // Method 1: Look for aria-labelledby and find the referenced element
            const ariaLabelledBy = input.getAttribute('aria-labelledby');
            if (ariaLabelledBy) {
                console.log('Found aria-labelledby:', ariaLabelledBy);
                const labelIds = ariaLabelledBy.split(' ');
                for (const id of labelIds) {
                    const labelElement = document.getElementById(id);
                    if (labelElement) {
                        const labelText = labelElement.textContent.trim();
                        if (labelText && labelText.length > 0 && !labelText.includes('Your answer')) {
                            console.log('✅ Found label via aria-labelledby:', labelText);
                            return labelText;
                        }
                    }
                }
            }
            
            // Method 2: Look for question containers with different selectors
            let currentElement = input;
            for (let i = 0; i < 20; i++) {
                if (!currentElement) break;
                
                // Try multiple container selectors
                const containerSelectors = [
                    '.freebirdFormviewerComponentsQuestionBaseRoot',
                    '[data-params]',
                    '.freebirdFormviewerComponentsQuestionBaseTitle',
                    '.freebirdFormviewerComponentsQuestionBaseHeader',
                    '.freebirdFormviewerComponentsQuestionBaseTitleText'
                ];
                
                for (const selector of containerSelectors) {
                    const container = currentElement.closest(selector);
                    if (container) {
                        // Look for title elements within the container
                        const titleSelectors = [
                            '.freebirdFormviewerComponentsQuestionBaseTitle',
                            '.freebirdFormviewerComponentsQuestionBaseTitleText',
                            '[data-params]',
                            'div[role="heading"]',
                            'label'
                        ];
                        
                        for (const titleSelector of titleSelectors) {
                            const titleElement = container.querySelector(titleSelector);
                            if (titleElement) {
                                const title = titleElement.textContent.trim();
                                if (title && title.length > 0 && !title.includes('Your answer')) {
                                    console.log('✅ Found Google Forms question title:', title);
                                    return title;
                                }
                            }
                        }
                    }
                }
                
                currentElement = currentElement.parentElement;
            }
            
            // Method 3: Look for nearby text that could be a label
            let parent = input.parentElement;
            for (let i = 0; i < 15; i++) {
                if (!parent) break;
                
                // Look for text nodes and elements that might contain the label
                const walker = document.createTreeWalker(
                    parent,
                    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                    null,
                    false
                );
                
                let node;
                while (node = walker.nextNode()) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const text = node.textContent.trim();
                        if (text && text.length > 2 && text.length < 100 && 
                            !text.includes('Your answer') && 
                            !text.includes('Switch accounts') && 
                            !text.includes('Not shared') &&
                            !text.includes('Required') &&
                            !text.includes('*') &&
                            (text.includes('FIRST') || text.includes('NAME') || text.includes('EMAIL') || text.includes('PHONE'))) {
                            console.log('✅ Found potential label in text node:', text);
                            return text;
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE && node !== input) {
                        const text = node.textContent.trim();
                        if (text && text.length > 2 && text.length < 100 && 
                            !text.includes('Your answer') && 
                            !text.includes('Switch accounts') && 
                            !text.includes('Not shared') &&
                            !text.includes('Required') &&
                            !text.includes('*') &&
                            (text.includes('FIRST') || text.includes('NAME') || text.includes('EMAIL') || text.includes('PHONE'))) {
                            console.log('✅ Found potential label in element:', text);
                            return text;
                        }
                    }
                }
                
                parent = parent.parentElement;
            }
        }
        
        // Look for aria-label
        const ariaLabel = input.getAttribute('aria-label');
        if (ariaLabel && ariaLabel !== 'Your answer') {
            console.log('✅ Found aria-label:', ariaLabel);
            return ariaLabel;
        }
        
        // Look for placeholder
        const placeholder = input.getAttribute('placeholder');
        if (placeholder && placeholder !== 'Your answer') {
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
        // Enhanced field detection with multiple sources
        const fieldLabel = field.getAttribute('data-google-field-label') || '';
        const fieldName = field.name || '';
        const fieldId = field.id || '';
        const placeholder = field.placeholder || '';
        const ariaLabel = field.getAttribute('aria-label') || '';
        
        console.log('=== FIELD MATCHING DEBUG ===');
        console.log('Field sources:', {
            label: fieldLabel,
            name: fieldName,
            id: fieldId,
            placeholder: placeholder,
            ariaLabel: ariaLabel
        });
        console.log('Available profile fields:', Object.keys(profile));
        console.log('Profile data:', profile);
        
        // Create combined search text for better matching
        const searchText = `${fieldLabel} ${fieldName} ${fieldId} ${placeholder} ${ariaLabel}`.toLowerCase();
        console.log('Combined search text:', searchText);
        
        // Enhanced regex patterns for better matching (similar to Chrome's autofill)
        const patterns = {
            firstName: /first.*name|fname|given.*name|initials|first$|first\s*name/i,
            lastName: /last.*name|lname|surname|family.*name|last$|second.*name|last\s*name/i,
            email: /e[-._]?mail|email.*address/i,
            phone: /phone|mobile|cell|telephone|tel$|contact.*number|phone.*number/i,
            address: /address|addr|street|location|home.*address/i,
            company: /company|organization|employer|workplace|business/i,
            jobTitle: /job.*title|position|role|occupation|title/i,
            linkedin: /linkedin|linked.*in/i,
            github: /github|git.*hub/i,
            website: /website|site|url|web.*site/i,
            skills: /skill|expertise|competency|ability/i,
            experience: /experience|work.*history|employment/i,
            education: /education|academic|degree|school|university/i,
            bio: /bio|biography|about|description/i
        };
        
        // Try pattern matching first
        for (const [profileField, pattern] of Object.entries(patterns)) {
            if (pattern.test(searchText) && profile[profileField]) {
                console.log(`✅ Matched ${profileField} using pattern:`, pattern);
                console.log(`Value: ${profile[profileField]}`);
                return profile[profileField];
            }
        }
        
        // Fallback: Check for partial matches in individual fields
        const individualFields = [
            { text: fieldLabel.toLowerCase(), name: 'label' },
            { text: fieldName.toLowerCase(), name: 'name' },
            { text: fieldId.toLowerCase(), name: 'id' },
            { text: placeholder.toLowerCase(), name: 'placeholder' },
            { text: ariaLabel.toLowerCase(), name: 'aria-label' }
        ];
        
        for (const fieldInfo of individualFields) {
            if (!fieldInfo.text) continue;
            
            // Check for first name variations
            if ((fieldInfo.text.includes('first') && fieldInfo.text.includes('name')) ||
                fieldInfo.text.includes('fname') ||
                (fieldInfo.text.includes('name') && !fieldInfo.text.includes('last') && !fieldInfo.text.includes('email') && !fieldInfo.text.includes('phone'))) {
                if (profile.firstName) {
                    console.log(`✅ Matched firstName via ${fieldInfo.name}: "${fieldInfo.text}"`);
                    return profile.firstName;
                }
            }
            
            // Check for email variations
            if (fieldInfo.text.includes('email') && profile.email) {
                console.log(`✅ Matched email via ${fieldInfo.name}: "${fieldInfo.text}"`);
                return profile.email;
            }
            
            // Check for phone variations
            if ((fieldInfo.text.includes('phone') || fieldInfo.text.includes('mobile') || 
                 fieldInfo.text.includes('cell') || fieldInfo.text.includes('tel')) && profile.phone) {
                console.log(`✅ Matched phone via ${fieldInfo.name}: "${fieldInfo.text}"`);
                return profile.phone;
            }
        }
        
        // Final fallback: Use available data intelligently
        console.log('No specific match found, checking available profile data...');
        
        // If we have firstName and this field doesn't look like email or phone, use firstName
        if (profile.firstName && !searchText.includes('email') && !searchText.includes('phone') && !searchText.includes('number')) {
            console.log('Using firstName as fallback for:', fieldLabel);
            return profile.firstName;
        }
        
        // If we have phone and this field looks like it could be a phone field
        if (profile.phone && (searchText.includes('phone') || searchText.includes('number') || searchText.includes('contact'))) {
            console.log('Using phone as fallback for:', fieldLabel);
            return profile.phone;
        }
        
        console.log('❌ No match found for field:', fieldLabel);
        return null;
    }

    isFieldEmpty(field) {
        console.log('=== Checking if field is empty ===');
        console.log('Field element:', field);
        console.log('Field tagName:', field.tagName);
        console.log('Field type:', field.type);
        
        // For Google Forms, check multiple sources for content
        if (window.location.href.includes('docs.google.com')) {
            // Check if it's a container div (Google Forms often use divs as input containers)
            if (field.tagName === 'DIV') {
                // Look for actual input elements within the container
                const inputs = field.querySelectorAll('input, textarea, div[role="textbox"], div[contenteditable="true"]');
                console.log('Found input elements in container:', inputs.length);
                
                for (const input of inputs) {
                    const inputValue = input.value || input.textContent || '';
                    console.log('Input value:', `"${inputValue}"`);
                    if (inputValue.trim() !== '') {
                        console.log('❌ Field is NOT empty (has input with value)');
                        return false;
                    }
                }
                
                // Check the container's own text content
                const containerText = field.textContent || '';
                console.log('Container text content:', `"${containerText}"`);
                
                // Filter out the label text and other non-input text
                const lines = containerText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                const hasInputContent = lines.some(line => 
                    line.length > 0 && 
                    !line.includes('*') && 
                    !line.includes('Required') && 
                    !line.includes('Your answer') &&
                    !line.includes('FIRST NAME') &&
                    !line.includes('Email') &&
                    !line.includes('Address') &&
                    !line.includes('Phone number') &&
                    !line.includes('Comments')
                );
                
                console.log('Has input content:', hasInputContent);
                return !hasInputContent;
            }
        }
        
        // For regular input elements
        const value = field.value || field.textContent || '';
        const isEmpty = value.trim() === '';
        console.log('Regular field value:', `"${value}"`);
        console.log('Is empty:', isEmpty);
        return isEmpty;
    }

    fillField(field, value) {
        try {
            console.log(`Filling field with: ${value}`);
            console.log('Field type:', field.type);
            console.log('Field tagName:', field.tagName);
            console.log('Field attributes:', {
                contenteditable: field.getAttribute('contenteditable'),
                role: field.getAttribute('role'),
                tagName: field.tagName
            });
            
            // For Google Forms, handle container divs
            if (window.location.href.includes('docs.google.com') && field.tagName === 'DIV') {
                console.log('Handling Google Forms container div...');
                
                // Find the actual input element within the container
                const inputs = field.querySelectorAll('input, textarea, div[role="textbox"], div[contenteditable="true"]');
                console.log('Found input elements in container:', inputs.length);
                
                if (inputs.length > 0) {
                    // Fill the first input element found
                    const inputElement = inputs[0];
                    console.log('Filling input element:', inputElement);
                    
                    if (inputElement.getAttribute('contenteditable') === 'true' || inputElement.getAttribute('role') === 'textbox') {
                        // For contenteditable elements
                        inputElement.textContent = value;
                        inputElement.innerHTML = value;
                    } else {
                        // For regular input elements
                        inputElement.value = value;
                        
                        // Use native setter for better compatibility with frameworks
                        try {
                            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                            nativeInputValueSetter.call(inputElement, value);
                        } catch (e) {
                            console.log('Native setter not available, using direct assignment');
                        }
                    }
                    
                    // Dispatch events on the actual input element
                    const events = ['input', 'change', 'keyup', 'blur', 'focus'];
                    events.forEach(eventType => {
                        try {
                            inputElement.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }));
                        } catch (e) {
                            console.log(`Failed to dispatch ${eventType} event:`, e);
                        }
                    });
                    
                    // Additional events for better framework compatibility
                    try {
                        inputElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                        inputElement.focus();
                        inputElement.blur();
                    } catch (e) {
                        console.log('Additional event dispatching failed:', e);
                    }
                    
                    console.log(`✅ Successfully filled Google Forms input with: ${value}`);
                    return;
                }
            }
            
            // Handle different field types for regular elements
            if (field.getAttribute('contenteditable') === 'true' || field.getAttribute('role') === 'textbox') {
                // For contenteditable elements
                field.textContent = value;
                field.innerHTML = value;
            } else {
                // For regular input elements
                field.value = value;
                
                // Use native setter for better compatibility with frameworks
                try {
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    nativeInputValueSetter.call(field, value);
                } catch (e) {
                    console.log('Native setter not available, using direct assignment');
                }
            }
            
            // Dispatch comprehensive set of events for better compatibility
            const events = ['input', 'change', 'keyup', 'blur', 'focus'];
            
            events.forEach(eventType => {
                try {
                    field.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }));
                } catch (e) {
                    console.log(`Failed to dispatch ${eventType} event:`, e);
                }
            });
            
            // Additional events for better framework compatibility
            try {
                // Trigger React/Vue/Angular change detection
                field.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                
                // Simulate user interaction
                field.focus();
                field.blur();
            } catch (e) {
                console.log('Additional event dispatching failed:', e);
            }
            
            console.log(`✅ Successfully filled field with: ${value}`);
            
        } catch (error) {
            console.error('❌ Error filling field:', error);
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
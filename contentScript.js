// contentScript.js

// Field mappings for jobs, internships, freelancing, and e-commerce/ordering forms
const fieldMappings = {
  fullName:       ['fullname', 'full_name', 'name', 'applicant_name'],
  email:          ['email', 'emailaddress', 'applicant_email'],
  phone:          ['phone', 'phonenumber', 'mobile'],
  portfolioURL:   ['portfolio', 'portfolio_url', 'website'],
  linkedin:       ['linkedin', 'linkedin_url', 'linkedinprofile'],
  github:         ['github', 'github_url', 'githubprofile'],
  resumeURL:      ['resume', 'resume_url', 'cv'],
  jobTitle:       ['job_title', 'jobtitle', 'position', 'role'],
  experienceYears:['experience', 'experience_years', 'years_of_experience'],
  skills:         ['skills', 'skillset', 'technical_skills', 'programming_languages'],
  education:      ['education', 'qualification', 'degree'],
  address:        ['address', 'address1', 'location'],
  city:           ['city', 'town', 'location_city'],
  state:          ['state', 'region'],
  zip:            ['zip', 'zipcode', 'postal_code'],
  country:        ['country', 'location_country'],
  coverLetter:    ['cover_letter', 'coverletter', 'application_letter'],

  // Generic and e-commerce fields
  creditCardNumber: ['cc_number', 'creditcardnumber', 'cardnumber', 'card_number'],
  expirationDate:   ['cc_expiration', 'expiration_date', 'exp_date'],
  cvv:              ['cvv', 'card_cvv', 'security_code'],
  billingZip:       ['billing_zip', 'billing_postalcode'],
  shippingMethod:   ['shipping_method', 'delivery_method'],
  couponCode:       ['coupon', 'coupon_code', 'promo_code']
};

// Listen for messages to trigger form filling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fillForm' && request.profileData) {
    const success = fillFormWithProfileData(request.profileData);
    sendResponse({ success });
  }
  return true;
});

function fillFormWithProfileData(profileData) {
  try {
    // Helper to find a form input or select for a given set of attribute keys
    const findInput = (keys) => {
      for (const key of keys) {
        let input = document.querySelector(`input[id*=\"${key}\"]`) ||
                    document.querySelector(`input[name*=\"${key}\"]`) ||
                    document.querySelector(`input[placeholder*=\"${key}\"]`) ||
                    document.querySelector(`input[aria-label*=\"${key}\"]`);
        // Try selects for dropdown fields (country, shipping method, etc.)
        if (!input) {
          input = document.querySelector(`select[id*=\"${key}\"]`) ||
                  document.querySelector(`select[name*=\"${key}\"]`);
        }
        // Try textareas for cover letters, education, skills, etc.
        if (!input) {
          input = document.querySelector(`textarea[id*=\"${key}\"]`) ||
                  document.querySelector(`textarea[name*=\"${key}\"]`) ||
                  document.querySelector(`textarea[placeholder*=\"${key}\"]`);
        }
        if (input) return input;
      }
      return null;
    };

    // For each field in the profile, try to fill the corresponding form input
    for (const [profileKey, formKeys] of Object.entries(fieldMappings)) {
      if (profileData[profileKey]) {
        const input = findInput(formKeys);
        if (input) {
          input.focus();
          input.value = profileData[profileKey];
          // For selects, try to select the matching value if possible
          if (input.tagName.toLowerCase() === 'select') {
            for (const opt of input.options) {
              if (opt.value && opt.value.toLowerCase().includes(profileData[profileKey].toLowerCase())) {
                input.value = opt.value;
                break;
              }
              if (opt.text && opt.text.toLowerCase().includes(profileData[profileKey].toLowerCase())) {
                input.value = opt.value;
                break;
              }
            }
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.blur();
        }
      }
    }
    return true;
  } catch (error) {
    console.error('Error filling form:', error);
    return false;
  }
}

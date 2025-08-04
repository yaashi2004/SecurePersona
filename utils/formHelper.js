// utils/formHelper.js

/**
 * Finds the first matching input, select, or textarea element for a set of keys.
 * @param {string[]} keys - Array of potential attribute substrings.
 * @returns {HTMLElement|null}
 */
export function findFormElement(keys) {
  for (const key of keys) {
    // Input elements
    let el = document.querySelector(`input[id*="${key}"]`)
          || document.querySelector(`input[name*="${key}"]`)
          || document.querySelector(`input[placeholder*="${key}"]`)
          || document.querySelector(`input[aria-label*="${key}"]`);
    if (el) return el;
    // Select dropdowns
    el = document.querySelector(`select[id*="${key}"]`)
       || document.querySelector(`select[name*="${key}"]`);
    if (el) return el;
    // Textareas
    el = document.querySelector(`textarea[id*="${key}"]`)
       || document.querySelector(`textarea[name*="${key}"]`)
       || document.querySelector(`textarea[placeholder*="${key}"]`);
    if (el) return el;
  }
  return null;
}

/**
 * Fills a form element with a given value.
 * Triggers appropriate events to simulate user input.
 * @param {HTMLElement} el - The form element to fill.
 * @param {string} value - The value to set.
 */
export function fillElement(el, value) {
  if (!el) return;
  el.focus();
  if (el.tagName.toLowerCase() === 'select') {
    // Try to match option
    for (const opt of el.options) {
      if (opt.value.toLowerCase().includes(value.toLowerCase()) ||
          opt.text.toLowerCase().includes(value.toLowerCase())) {
        el.value = opt.value;
        break;
      }
    }
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.blur();
}

/**
 * Fills an entire form based on a profile object and field mappings.
 * @param {Object} profileFields - Key/value pairs of profile data.
 * @param {Object} mappings - Mapping of profile keys to arrays of form attribute keys.
 * @returns {boolean} - True if at least one field was filled.
 */
export function fillForm(profileFields, mappings) {
  let filledAny = false;
  for (const [fieldKey, formKeys] of Object.entries(mappings)) {
    const value = profileFields[fieldKey];
    if (value) {
      const el = findFormElement(formKeys);
      if (el) {
        fillElement(el, value);
        filledAny = true;
      }
    }
  }
  return filledAny;
}

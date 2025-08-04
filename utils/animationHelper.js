// utils/animationHelper.js

/**
 * Adds an animation class to an element and returns a promise
 * that resolves when the animation ends.
 * @param {HTMLElement} element - The element to animate.
 * @param {string} animationClass - The CSS class triggering the keyframe animation.
 * @returns {Promise<void>}
 */
export function animateCSS(element, animationClass) {
  return new Promise((resolve) => {
    const handleAnimationEnd = (event) => {
      event.stopPropagation();
      element.classList.remove(animationClass);
      element.removeEventListener('animationend', handleAnimationEnd);
      resolve();
    };

    element.classList.add(animationClass);
    element.addEventListener('animationend', handleAnimationEnd);
  });
}

/**
 * Fades in an element by adding the 'visible' class and removing 'hidden'.
 * @param {HTMLElement} element
 */
export function fadeIn(element) {
  element.classList.remove('hidden');
  element.classList.add('visible');
}

/**
 * Fades out an element by adding the 'hidden' class and removing 'visible'.
 * Returns a promise that resolves after the CSS transition completes.
 * @param {HTMLElement} element
 * @returns {Promise<void>}
 */
export function fadeOut(element) {
  return new Promise((resolve) => {
    element.classList.remove('visible');
    element.classList.add('hidden');
    const duration = parseFloat(getComputedStyle(element).transitionDuration) * 1000;
    setTimeout(resolve, duration);
  });
}

/**
 * Slides down an element (for profile editor, password section, etc.).
 * @param {HTMLElement} element
 */
export function slideDown(element) {
  element.classList.remove('hidden');
  element.classList.add('visible');
}

/**
 * Slides up an element (hiding it) and returns a promise that resolves after transition.
 * @param {HTMLElement} element
 * @returns {Promise<void>}
 */
export function slideUp(element) {
  return new Promise((resolve) => {
    element.classList.remove('visible');
    element.classList.add('hidden');
    const duration = parseFloat(getComputedStyle(element).transitionDuration) * 1000;
    setTimeout(resolve, duration);
  });
}

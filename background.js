// background.js

// This background service worker listens for messages from popup or content script
// and coordinates activities like storing data, switching profiles, or triggering autofill.

// Listener for incoming messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProfiles') {
    // Retrieve all stored profiles from chrome.storage
    chrome.storage.local.get(['profiles', 'activeProfileId'], (data) => {
      sendResponse({
        profiles: data.profiles || [],
        activeProfileId: data.activeProfileId || null
      });
    });
    return true; // Inform Chrome we will send response asynchronously
  } else if (request.action === 'saveProfiles') {
    // Save updated profiles data
    chrome.storage.local.set({
      profiles: request.profiles,
      activeProfileId: request.activeProfileId
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'setActiveProfile') {
    // Update the currently active profile id
    chrome.storage.local.set({ activeProfileId: request.activeProfileId }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  // You can add more actions here as needed for your extension's logic

  // If action not recognized, do nothing
  return false;
});

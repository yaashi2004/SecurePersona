// background.js - SecurePersona Background Script

// Install event
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('SecurePersona installed:', details.reason);
  
  if (details.reason === 'install') {
    // Initialize default settings
    chrome.storage.local.set({
      profiles: [],
      activeProfileId: null,
      settings: {
        autoFillEnabled: true,
        encryptionEnabled: true
      }
    });
  }
});

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getProfiles':
      handleGetProfiles(sendResponse);
      break;
    case 'setActiveProfile':
      handleSetActiveProfile(request.activeProfileId, sendResponse);
      break;
    case 'saveProfile':
      handleSaveProfile(request.profile, sendResponse);
      break;
    case 'deleteProfile':
      handleDeleteProfile(request.profileId, sendResponse);
      break;
    case 'fillForm':
      handleFillForm(request.profileData, sender.tab, sendResponse);
      break;
    default:
      sendResponse({ error: 'Unknown action' });
  }
  
  // Return true to indicate we will send a response asynchronously
  return true;
});

async function handleGetProfiles(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['profiles', 'activeProfileId']);
    sendResponse({
      profiles: result.profiles || [],
      activeProfileId: result.activeProfileId || null
    });
  } catch (error) {
    console.error('Error getting profiles:', error);
    sendResponse({ error: error.message });
  }
}

async function handleSetActiveProfile(profileId, sendResponse) {
  try {
    await chrome.storage.local.set({ activeProfileId: profileId });
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error setting active profile:', error);
    sendResponse({ error: error.message });
  }
}

async function handleSaveProfile(profile, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['profiles']);
    let profiles = result.profiles || [];
    
    const existingIndex = profiles.findIndex(p => p.id === profile.id);
    if (existingIndex >= 0) {
      profiles[existingIndex] = profile;
    } else {
      profiles.push(profile);
    }
    
    await chrome.storage.local.set({ profiles });
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error saving profile:', error);
    sendResponse({ error: error.message });
  }
}

async function handleDeleteProfile(profileId, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['profiles', 'activeProfileId']);
    let profiles = result.profiles || [];
    
    profiles = profiles.filter(p => p.id !== profileId);
    
    const updateData = { profiles };
    
    // If the deleted profile was active, clear the active profile
    if (result.activeProfileId === profileId) {
      updateData.activeProfileId = null;
    }
    
    await chrome.storage.local.set(updateData);
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error deleting profile:', error);
    sendResponse({ error: error.message });
  }
}

async function handleFillForm(profileData, tab, sendResponse) {
  try {
    // Send message to content script to fill the form
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'fillForm',
      profileData: profileData
    });
    
    sendResponse(response);
  } catch (error) {
    console.error('Error filling form:', error);
    sendResponse({ error: error.message, success: false });
  }
}

// Context menu for easy access
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'fillForm',
    title: 'Fill form with SecurePersona',
    contexts: ['editable']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'fillForm') {
    try {
      const result = await chrome.storage.local.get(['activeProfileId', 'profiles']);
      
      if (!result.activeProfileId) {
        // Show notification to select a profile
        chrome.action.openPopup();
        return;
      }
      
      const activeProfile = result.profiles?.find(p => p.id === result.activeProfileId);
      if (activeProfile) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'fillForm',
          profileData: activeProfile.fields
        });
      }
    } catch (error) {
      console.error('Context menu fill error:', error);
    }
  }
});
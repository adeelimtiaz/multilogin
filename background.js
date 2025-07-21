// background.js (Manifest V3 - Service Worker)

const tabProfiles = {}; // tabId -> profile
const profileCookies = {}; // profile -> array of cookies

chrome.runtime.onInstalled.addListener(() => {
  // Only create context menus if this is our extension
  if (chrome.runtime.id) {
    chrome.contextMenus.create({
      id: "duplicatePageNewIdentity",
      title: "Duplicate Page in New Identity",
      contexts: ["page", "image"]
    });

    chrome.contextMenus.create({
      id: "openLinkNewIdentity",
      title: "Open Link in New Identity",
      contexts: ["link"]
    });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Verify the context menu action is from an authorized source
  if (!info.menuItemId || !(info.menuItemId === "duplicatePageNewIdentity" || info.menuItemId === "openLinkNewIdentity")) {
    console.error("Unauthorized context menu action");
    return;
  }
  
  // Validate URL before creating a new tab
  const url = info.linkUrl || info.pageUrl;
  
  try {
    // Ensure URL is valid and has an acceptable protocol
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      console.error("Unauthorized URL protocol");
      return;
    }
    
    chrome.tabs.create({ url }, newTab => {
      if (!newTab || !newTab.id) {
        console.error("Invalid tab creation response");
        return;
      }
      const profileId = `${newTab.id}_@@@_`;
      tabProfiles[newTab.id] = profileId;
      updateBadge(newTab.id, profileId);
    });
  } catch (e) {
    console.error("Invalid URL format", e);
  }
});

chrome.runtime.onConnect.addListener(port => {
  // Verify the connection is from a valid extension page or content script
  if (!port.sender || !port.sender.id || port.sender.id !== chrome.runtime.id) {
    console.error("Unauthorized connection attempt");
    port.disconnect();
    return;
  }
  
  port.onMessage.addListener((msg) => {
    // Verify message has valid type, structure and comes from a tab
    if (!msg || typeof msg !== 'object' || msg.type !== 3) {
      console.error("Invalid message format");
      return;
    }
    
    if (!port.sender || !port.sender.tab || !port.sender.tab.id) {
      console.error("Message from invalid source");
      return;
    }
    
    const tabId = port.sender.tab.id;
    let profile = tabProfiles[tabId];
    if (!profile) {
      profile = `${tabId}_@@@_`;
      tabProfiles[tabId] = profile;
    }
    port.postMessage({ type: 4, profile });
  });
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  // Verify the message is from a valid extension source
  if (!sender || !sender.id || sender.id !== chrome.runtime.id) {
    console.error("Unauthorized message attempt");
    return;
  }
  
  if (msg.type === "storeCookies" && sender.tab) {
    const profile = tabProfiles[sender.tab.id];
    if (!profile) return;
    profileCookies[profile] = msg.cookies;
  }
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  // Verify the message is from a valid extension source
  if (!sender || !sender.id || sender.id !== chrome.runtime.id) {
    console.error("Unauthorized script injection attempt");
    return;
  }
  
  if (msg.type === "inject_cookie_script" && sender.tab?.id) {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      files: ["inject.js"]
    });
  }
});

chrome.webNavigation.onCompleted.addListener(({ tabId, url }) => {
  // Verify this is a tab we're managing
  if (!tabId || !tabProfiles.hasOwnProperty(tabId)) {
    return;
  }
  
  const profile = tabProfiles[tabId];
  if (!profile || !profileCookies[profile]) return;
  
  // Validate URL before setting cookies
  try {
    new URL(url); // Will throw if URL is invalid
    for (const cookie of profileCookies[profile]) {
      chrome.cookies.set({
        url,
        name: cookie.name,
        value: cookie.value,
        path: "/"
      });
    }
  } catch (e) {
    console.error("Invalid URL in navigation event", e);
  }
}, { url: [{ urlMatches: '.*' }] });

chrome.tabs.onRemoved.addListener(tabId => {
  if (tabProfiles.hasOwnProperty(tabId)) {
    // Also clean up any associated profile cookies
    const profileId = tabProfiles[tabId];
    if (profileId && profileCookies[profileId]) {
      profileCookies[profileId] = null;
    }
    // Remove the tab profile mapping
    tabProfiles[tabId] = undefined;
  }
});

function updateBadge(tabId, profileId) {
  // Verify inputs are valid before updating badge
  if (!tabId || !profileId || typeof profileId !== 'string') {
    console.error("Invalid parameters for badge update");
    return;
  }
  
  const label = profileId.split("_@@@_")[0];
  chrome.action.setBadgeBackgroundColor({ color: "#006600", tabId });
  chrome.action.setBadgeText({ text: label, tabId });
}
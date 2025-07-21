// background.js (Manifest V3 - Service Worker)

const tabProfiles = {}; // tabId -> profile
const profileCookies = {}; // profile -> array of cookies

chrome.runtime.onInstalled.addListener(() => {
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
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = info.linkUrl || info.pageUrl;
  chrome.tabs.create({ url }, newTab => {
    const profileId = `${newTab.id}_@@@_`;
    tabProfiles[newTab.id] = profileId;
    updateBadge(newTab.id, profileId);
  });
});

chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener((msg) => {
    if (msg.type === 3 && port.sender.tab) {
      const tabId = port.sender.tab.id;
      let profile = tabProfiles[tabId];
      if (!profile) {
        profile = `${tabId}_@@@_`;
        tabProfiles[tabId] = profile;
      }
      port.postMessage({ type: 4, profile });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "storeCookies" && sender.tab) {
    const profile = tabProfiles[sender.tab.id];
    if (!profile) return;
    profileCookies[profile] = msg.cookies;
  }
});

chrome.webNavigation.onCompleted.addListener(({ tabId, url }) => {
  const profile = tabProfiles[tabId];
  if (!profile || !profileCookies[profile]) return;
  for (const cookie of profileCookies[profile]) {
    chrome.cookies.set({
      url,
      name: cookie.name,
      value: cookie.value,
      path: "/"
    });
  }
}, { url: [{ urlMatches: '.*' }] });

chrome.tabs.onRemoved.addListener(tabId => {
  delete tabProfiles[tabId];
});

function updateBadge(tabId, profileId) {
  const label = profileId.split("_@@@_")[0];
  chrome.action.setBadgeBackgroundColor({ color: "#006600", tabId });
  chrome.action.setBadgeText({ text: label, tabId });
}
// content.js

let port;
let profilePrefix = null;
let shortPrefix = null;

try {
  port = chrome.runtime.connect({ name: "profileConnection" });
  
  // Handle disconnection errors
  port.onDisconnect.addListener((p) => {
    if (chrome.runtime.lastError) {
      console.error("Connection error:", chrome.runtime.lastError);
    }
    // Attempt to reconnect after a short delay
    setTimeout(() => {
      try {
        port = chrome.runtime.connect({ name: "profileConnection" });
        port.postMessage({ type: MESSAGE_TYPES.REQUEST_PROFILE });
      } catch (e) {
        console.error("Failed to reconnect:", e);
      }
    }, 1000);
  });
} catch (e) {
  console.error("Failed to establish connection:", e);
  // Set default values to allow minimal functionality
  profilePrefix = "";
  shortPrefix = "";
}

// Define message type constants for better readability
const MESSAGE_TYPES = {
  REQUEST_PROFILE: 3,
  PROFILE_RESPONSE: 4,
  UPDATE_TITLE: 5,
  RESET_PROFILE: "3"
};

if (port) {
  port.onMessage.addListener((msg) => {
    if (msg && msg.type === MESSAGE_TYPES.PROFILE_RESPONSE) {
      if (!msg.profile) {
        window.location.reload();
      } else {
        setProfile(msg.profile);
      }
    }
  });

  try {
    port.postMessage({ type: MESSAGE_TYPES.REQUEST_PROFILE });
  } catch (e) {
    console.error("Failed to send initial profile request:", e);
  }
}

chrome.runtime.sendMessage({ type: "inject_cookie_script" });

function setProfile(profile) {
  profilePrefix = profile;
  shortPrefix = profilePrefix.split("_@@@_")[0];
}

function ensureProfile() {
  if (!profilePrefix) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", "https://translate.googleapis.com/translate_static/img/loading.gif", false);
      xhr.send();
      const PROFILE_HEADER_NAME = "6";
      const header = xhr.getResponseHeader(PROFILE_HEADER_NAME);
      if (header) setProfile(header);
    } catch (error) {
      console.error("Failed to ensure profile:", error);
      // Fallback to default behavior
      if (!profilePrefix) profilePrefix = "";
      if (!shortPrefix) shortPrefix = "";
    }
  }
}

// Define event name constants for better readability
const EVENTS = {
  SET_COOKIE: "7",
  GET_COOKIES: "8",
  SET_TITLE: "9"
};

document.addEventListener(EVENTS.SET_COOKIE, (event) => {
  // Verify the event is from a trusted source
  if (!event.isTrusted) {
    console.error("Unauthorized cookie modification attempt");
    return;
  }
  
  ensureProfile();
  const raw = event.detail;
  
  // Validate cookie data format before processing
  if (!raw || typeof raw !== 'string' || !raw.includes('=')) {
    console.error("Invalid cookie format");
    return;
  }
  
  document.cookie = profilePrefix ? profilePrefix + raw.trim() : raw;
  chrome.runtime.sendMessage({
    type: "storeCookies",
    cookies: [{ name: raw.split("=")[0], value: raw.split("=")[1] }]
  });
});

document.addEventListener(EVENTS.GET_COOKIES, (event) => {
  // Verify the event is from a trusted source
  if (!event.isTrusted) {
    console.error("Unauthorized cookie access attempt");
    return;
  }
  
  ensureProfile();
  const cookies = document.cookie.split("; ");
  let result = "";
  for (const cookie of cookies) {
    if (profilePrefix && cookie.startsWith(profilePrefix)) {
      result += (result ? "; " : "") + cookie.substring(profilePrefix.length);
    } else if (!profilePrefix && !cookie.includes("_@@@_")) {
      result += (result ? "; " : "") + cookie;
    }
  }
  try {
    localStorage.setItem("@@@cookies", result);
  } catch (e) {
    let store = document.getElementById("@@@cookies");
    if (!store) {
      store = document.createElement("div");
      store.id = "@@@cookies";
      store.style.display = "none";
      document.documentElement.appendChild(store);
    }
    store.innerText = result;
  }
});

document.addEventListener(EVENTS.SET_TITLE, (e) => {
  // Verify the event is from a trusted source
  if (!e.isTrusted) {
    console.error("Unauthorized title update attempt");
    return;
  }
  
  updateTitle(e.detail);
});

function updateTitle(t) {
  if (shortPrefix && !t.startsWith("[" + shortPrefix + "]")) {
    document.title = `[${shortPrefix}] ${t} [${shortPrefix}]`;
  } else {
    document.title = t;
  }
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  // Verify the message is from a valid extension source
  if (!sender || !sender.id || sender.id !== chrome.runtime.id) {
    console.error("Unauthorized message received");
    return;
  }
  
  if (msg.type === MESSAGE_TYPES.UPDATE_TITLE) {
    updateTitle(document.title);
  }
  if (msg.type === MESSAGE_TYPES.RESET_PROFILE) {
    setProfile("");
    document.title = document.title.replace(/\s*\[\d*\]\s*/g, "");
  }
});

window.addEventListener("unload", () => {
  document.title = document.title.replace(/\s*\[\d*\]\s*/g, "");
});

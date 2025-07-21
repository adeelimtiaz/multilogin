// content.js

let port = chrome.runtime.connect({ name: "3" });
let profilePrefix = null;
let shortPrefix = null;

port.onMessage.addListener((msg) => {
  if (msg.type === 4) {
    if (!msg.profile) {
      window.location.reload();
    } else {
      setProfile(msg.profile);
    }
  }
});

port.postMessage({ type: 3 });

chrome.runtime.sendMessage({ type: "inject_cookie_script" });

function setProfile(profile) {
  profilePrefix = profile;
  shortPrefix = profilePrefix.split("_@@@_")[0];
}

function ensureProfile() {
  if (!profilePrefix) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "https://translate.googleapis.com/translate_static/img/loading.gif", false);
    xhr.send();
    const header = xhr.getResponseHeader("6");
    if (header) setProfile(header);
  }
}

document.addEventListener("7", (event) => {
  ensureProfile();
  const raw = event.detail;
  document.cookie = profilePrefix ? profilePrefix + raw.trim() : raw;
  chrome.runtime.sendMessage({
    type: "storeCookies",
    cookies: [{ name: raw.split("=")[0], value: raw.split("=")[1] }]
  });
});

document.addEventListener("8", () => {
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

document.addEventListener("9", (e) => {
  updateTitle(e.detail);
});

function updateTitle(t) {
  if (shortPrefix && !t.startsWith("[" + shortPrefix + "]")) {
    document.title = `[${shortPrefix}] ${t} [${shortPrefix}]`;
  } else {
    document.title = t;
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 5) {
    updateTitle(document.title);
  }
  if (msg.type === "3") {
    setProfile("");
    document.title = document.title.replace(/\s*\[\d*\]\s*/g, "");
  }
});

window.addEventListener("unload", () => {
  document.title = document.title.replace(/\s*\[\d*\]\s*/g, "");
});

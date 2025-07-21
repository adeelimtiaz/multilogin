// Refactored for Manifest V3 - Service Worker Context

var f = {};
var g = [];
var l = [];
m("");
chrome.action.onClicked.addListener(function () {
    n++;
    chrome.storage.sync.set({ use: n });
    chrome.tabs.create({}, function (props) {
        p(props.id, props.id + "_@@@_");
    });
});
var q, n, r, s, t, u;

chrome.runtime.onInstalled.addListener(function (details) {
    chrome.storage.sync.get(["date", "use", "uid"], function (data) {
        q = data.date || (new Date).getTime();
        n = data.use || 0;
        r = data.uid || w();
        chrome.storage.sync.set({ date: q, use: n, uid: r });
    });

    chrome.storage.local.get(["mid", "orgVersion", "install"], function (data) {
        s = data.mid || w();
        t = data.orgVersion || chrome.runtime.getManifest().version;
        u = data.install;
        chrome.storage.local.set({ mid: s, orgVersion: t });

        chrome.storage.sync.get(function () {
            x(details);
        });
    });
});

function x(args) {
    if ("update" === args.reason) {
        if (args.previousVersion !== chrome.runtime.getManifest().version) {
            // Handle update logic
        }
    }
    if ("install" === args.reason && !u) {
        chrome.tabs.query({ url: "https://chrome.google.com/webstore*" }, function (tabs) {
            if (tabs && tabs[0]) {
                var tab = tabs[0];
                if (tab.openerTabId) {
                    chrome.tabs.get(tab.openerTabId, function (referrerTab) {
                        // handle install with referrer
                    });
                } else {
                    // handle install
                }
            }
        });
    }
}

function w() {
    return ("000000000000" + (Math.random() * Math.pow(36, 12)).toString(36)).substr(-12);
}

function m(value) {
    chrome.cookies.getAll({}, function (cookies) {
        cookies.forEach(function (cookie) {
            var name = cookie.name;
            if (!(value === null && name.indexOf("@@@") > 0)) {
                if (!(value === "" && name.indexOf("@@@") === -1)) {
                    if (!(value && name.substring(0, value.length) !== value)) {
                        chrome.cookies.remove({
                            url: (cookie.secure ? "https://" : "http://") + cookie.domain + cookie.path,
                            name: name
                        });
                    }
                }
            }
        });
    });
}

function A(key) {
    if (key > 0) {
        return f[key] || !g[key] ? "" : g[key];
    }
}

function p(tabId, profileId) {
    if (profileId) {
        g[tabId] = profileId;
        B(tabId, profileId);
    }
}

function B(tabId, profileId) {
    if (typeof profileId !== "undefined") {
        var badge = {
            text: profileId.substr(0, profileId.indexOf("_@@@_")),
            tabId: tabId
        };
        chrome.action.setBadgeBackgroundColor({
            color: "#006600",
            tabId: tabId
        });
        chrome.action.setBadgeText(badge);
    }
}

function F(info) {
    var url = info.pageUrl || info.linkUrl;
    chrome.tabs.create({ url: url }, function (tab) {
        p(tab.id, tab.id + "_@@@_");
    });
}

chrome.contextMenus.create({
    title: "Duplicate Page in New Identity",
    contexts: ["page", "image"],
    onclick: F
});
chrome.contextMenus.create({
    title: "Open Link in New Identity",
    contexts: ["link"],
    onclick: F
});

chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
        if (msg.type === 3 && port.sender.tab) {
            port.postMessage({
                type: 4,
                profile: A(port.sender.tab.id)
            });
        }
    });
});

chrome.webNavigation.onDOMContentLoaded.addListener(function (details) {
    if (details.tabId > -1 && details.frameId === 0) {
        chrome.tabs.sendMessage(details.tabId, { type: 5 });
    }
}, { urls: ["http://*/*", "https://*/*"] });
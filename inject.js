/**
 * MultiLogin Injection Script
 * Intercepts cookie and title operations to support multiple identities
 */
(() => {
  // Use meaningful constants for event names
  const EVENTS = {
    GET_COOKIES: "8",
    SET_COOKIE: "7",
    SET_TITLE: "9"
  };
  
  // Store original CustomEvent for creating events
  const CustomEventClass = CustomEvent;

  /**
   * Cookie property interceptor
   */
  // Get original cookie descriptor from prototype chain
  const originalCookieDesc = Object.getOwnPropertyDescriptor(Document.prototype, "cookie") ||
                             Object.getOwnPropertyDescriptor(HTMLDocument.prototype, "cookie");

  // Override the cookie property
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: function () {
      // Notify content script that cookies are being read
      document.dispatchEvent(new CustomEventClass(EVENTS.GET_COOKIES));
      
      // Retrieve cookies from storage
      let result = "";
      try {
        result = localStorage.getItem("@@@cookies");
        localStorage.removeItem("@@@cookies");
      } catch (e) {
        // Fallback to DOM storage if localStorage is unavailable
        const cookieElement = document.getElementById("@@@cookies");
        result = cookieElement?.innerText || "";
      }
      return result;
    },
    set: function (val) {
      // Notify content script about cookie being set
      document.dispatchEvent(new CustomEventClass(EVENTS.SET_COOKIE, { detail: val }));
      
      // Forward to original setter if available
      if (originalCookieDesc && typeof originalCookieDesc.set === "function") {
        originalCookieDesc.set.call(document, val);
      }
    }
  });

  /**
   * Title property interceptor
   */
  // Get original title descriptor from prototype chain
  const originalTitleDesc = Object.getOwnPropertyDescriptor(Document.prototype, "title") ||
                            Object.getOwnPropertyDescriptor(HTMLDocument.prototype, "title");

  // Override the title property
  Object.defineProperty(document, "title", {
    configurable: true,
    get: function () {
      return originalTitleDesc.get.call(document);
    },
    set: function (val) {
      // Notify content script about title change
      document.dispatchEvent(new CustomEventClass(EVENTS.SET_TITLE, { detail: val }));
      originalTitleDesc.set.call(document, val);
    }
  });
})();

(() => {
  const event = CustomEvent;

  // Backup real property descriptor
  const originalCookieDesc = Object.getOwnPropertyDescriptor(Document.prototype, "cookie") ||
                             Object.getOwnPropertyDescriptor(HTMLDocument.prototype, "cookie");

  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: function () {
      document.dispatchEvent(new event("8"));
      let result;
      try {
        result = localStorage.getItem("@@@cookies");
        localStorage.removeItem("@@@cookies");
      } catch (e) {
        result = document.getElementById("@@@cookies")?.innerText || "";
      }
      return result;
    },
    set: function (val) {
      document.dispatchEvent(new event("7", { detail: val }));
      // Forward the cookie to the real setter
      if (originalCookieDesc && typeof originalCookieDesc.set === "function") {
        originalCookieDesc.set.call(document, val);
      }
    }
  });

  // Hijack title
  const originalTitleDesc = Object.getOwnPropertyDescriptor(Document.prototype, "title") ||
                            Object.getOwnPropertyDescriptor(HTMLDocument.prototype, "title");

  Object.defineProperty(document, "title", {
    configurable: true,
    get: function () {
      return originalTitleDesc.get.call(document);
    },
    set: function (val) {
      document.dispatchEvent(new event("9", { detail: val }));
      originalTitleDesc.set.call(document, val);
    }
  });
})();

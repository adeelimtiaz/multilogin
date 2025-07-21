(() => {
  const event = CustomEvent;

  document.__defineSetter__("cookie", function(c) {
    document.dispatchEvent(new event("7", { detail: c }));
  });

  document.__defineGetter__("cookie", function() {
    document.dispatchEvent(new event("8"));
    let result;
    try {
      result = localStorage.getItem("@@@cookies");
      localStorage.removeItem("@@@cookies");
    } catch (e) {
      result = document.getElementById("@@@cookies")?.innerText || "";
    }
    return result;
  });

  let originalTitle = document.title;
  document.__defineSetter__("title", function(t) {
    originalTitle = t;
    document.dispatchEvent(new event("9", { detail: t }));
  });
  document.__defineGetter__("title", function() {
    return originalTitle;
  });
})();

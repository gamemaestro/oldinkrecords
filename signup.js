// Old Ink Records email list: send signups straight from the browser to our own Google Sheet
// (Apps Script web app). Google refuses these requests from Cloudflare's servers, so the
// Worker at /subscribe stays only as a no-JavaScript fallback.
(function () {
  var URL = "https://script.google.com/macros/s/AKfycbz01nViowjc9N7eZTjMwOLN-APJ-CNUNJGU0elmTdNUSYshCjPs_N9NF_NjbFGss2E/exec";
  var TOKEN = "ba13c2f44403906047db03d48bbf3b407770d520ba666f2e";
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  document.querySelectorAll("form.signup").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var trap = form.querySelector('[name="website"]');
      if (trap && trap.value.trim() !== "") { location.href = "/subscribed"; return; }
      var email = (form.querySelector('[name="email"]').value || "").trim().toLowerCase();
      if (!EMAIL.test(email)) { location.href = "/subscribe-error?r=email"; return; }
      var src = form.querySelector('[name="source"]');
      var btn = form.querySelector("button");
      if (btn) { btn.disabled = true; btn.textContent = "Joining…"; }
      fetch(URL, {
        method: "POST",
        mode: "no-cors",
        body: new URLSearchParams({ token: TOKEN, email: email, source: src ? src.value : "site" })
      }).then(function () { location.href = "/subscribed"; })
        .catch(function () { location.href = "/subscribe-error?r=browser-network"; });
    });
  });
})();

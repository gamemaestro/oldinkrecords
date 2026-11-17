// Old Ink Records: static site plus an in-house email list.
// POST /subscribe stores the address in Jacks's own Google Sheet (via Apps Script).
// Secrets (Cloudflare dashboard, type Secret): SHEET_URL, SHEET_TOKEN.
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/subscribe" && request.method === "POST") {
      return subscribe(request, env, url);
    }
    return env.ASSETS.fetch(request);
  },
};

async function subscribe(request, env, url) {
  const done = (path) => Response.redirect(new URL(path, url.origin).toString(), 303);
  let form;
  try { form = await request.formData(); } catch { return done("/subscribe-error"); }
  if ((form.get("website") || "").toString().trim() !== "") return done("/subscribed"); // bot trap
  const email = (form.get("email") || "").toString().trim().toLowerCase();
  const source = (form.get("source") || "site").toString().slice(0, 40);
  if (!EMAIL.test(email) || email.length > 254) return done("/subscribe-error");
  if (!env.SHEET_URL || !env.SHEET_TOKEN) return done("/subscribe-error");
  try {
    const res = await fetch(env.SHEET_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: env.SHEET_TOKEN, email, source }).toString(),
      redirect: "follow",
    });
    const text = await res.text();
    if (!res.ok || !text.includes('"ok":true')) return done("/subscribe-error");
  } catch { return done("/subscribe-error"); }
  return done("/subscribed");
}

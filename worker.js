// Old Ink Records: static site plus an in-house email list.
// POST /subscribe stores the address in Jacks's own Google Sheet (via Apps Script).
// Secrets (Cloudflare dashboard, type Secret): SHEET_URL, SHEET_TOKEN.
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/subscribe") {
      if (request.method !== "POST") return Response.redirect(new URL("/#letters", url.origin).toString(), 303);
      try { return await subscribe(request, env, url); }
      catch { return Response.redirect(new URL("/subscribe-error", url.origin).toString(), 303); }
    }
    return env.ASSETS.fetch(request);
  },
};

async function subscribe(request, env, url) {
  const done = (path) => Response.redirect(new URL(path, url.origin).toString(), 303);
  const fail = (code) => done("/subscribe-error?r=" + code);
  let form;
  try { form = await request.formData(); } catch { return fail("form"); }
  if ((form.get("website") || "").toString().trim() !== "") return done("/subscribed"); // bot trap
  const email = (form.get("email") || "").toString().trim().toLowerCase();
  const source = (form.get("source") || "site").toString().slice(0, 40);
  if (!EMAIL.test(email) || email.length > 254) return fail("email");
  if (!env.SHEET_URL) return fail("no-url");
  if (!env.SHEET_TOKEN) return fail("no-token");
  let res, text;
  try {
    res = await fetch(env.SHEET_URL.trim(), {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: env.SHEET_TOKEN.trim(), email, source }).toString(),
      redirect: "follow",
    });
    text = await res.text();
  } catch { return fail("network"); }
  if (text.includes('"ok":true')) return done("/subscribed");
  if (text.includes('unauthorized')) return fail("token");
  if (text.includes('"ok":false')) return fail("rejected");
  if (/<html/i.test(text)) return fail("google-" + res.status);
  return fail("status-" + res.status);
}

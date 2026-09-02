// وسيط رفع الوسائط — Cloudflare Worker
// يحفظ مفاتيح المستودع عنده، ولا يخرج منها شيء إلى المتصفّح.

const ALLOWED = [
  "https://marwanbalushi.com",
  "https://www.marwanbalushi.com",
  "https://marwanbalushi.github.io"
];

const TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/quicktime", "video/webm"
];

const MAX = 250 * 1024 * 1024;   // ٢٥٠ ميغابايت للملف الواحد

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : ALLOWED[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth, X-Filename",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

// مقارنة لا تكشف طول التطابق
function same(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const H = cors(origin);

    if (req.method === "OPTIONS") return new Response(null, { headers: H });
    if (req.method !== "POST")
      return new Response("Method not allowed", { status: 405, headers: H });
    if (!ALLOWED.includes(origin))
      return new Response("Forbidden origin", { status: 403, headers: H });
    if (!same(req.headers.get("X-Auth") || "", env.UPLOAD_KEY || ""))
      return new Response("Unauthorized", { status: 401, headers: H });

    const type = (req.headers.get("Content-Type") || "").split(";")[0].trim();
    if (!TYPES.includes(type))
      return new Response("Unsupported type", { status: 415, headers: H });

    const len = parseInt(req.headers.get("Content-Length") || "0", 10);
    if (len > MAX)
      return new Response("File too large", { status: 413, headers: H });

    // اسم نظيف: لا مسارات ولا حروف غريبة
    let raw = (req.headers.get("X-Filename") || "file").split(/[\\/]/).pop();
    raw = decodeURIComponent(raw).replace(/[^A-Za-z0-9._-]/g, "-").slice(-70);
    if (!/\.[A-Za-z0-9]{2,5}$/.test(raw)) {
      raw += type.startsWith("video") ? ".mp4" : ".jpg";
    }

    const stamp = Date.now().toString(36);
    const salt = Math.random().toString(36).slice(2, 8);
    const key = `${stamp}-${salt}-${raw}`;

    try {
      await env.MEDIA.put(key, req.body, {
        httpMetadata: { contentType: type, cacheControl: "public, max-age=31536000" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: String(e) }), {
        status: 500, headers: { ...H, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ ok: true, file: key }), {
      headers: { ...H, "Content-Type": "application/json" }
    });
  }
};

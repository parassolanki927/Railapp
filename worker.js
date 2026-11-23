// Cloudflare Worker: RailRadar key chhupavi, fakt jarur nu j allow kare
const ALLOW = "https://parassolanki927.github.io";
const OK = [
  /^\/v1\/trains\/between\/[A-Za-z]{1,10}\/[A-Za-z]{1,10}$/,
  /^\/v1\/trains\/[0-9A-Za-z_-]{1,20}\/live$/
];
export default {
  async fetch(req, env, ctx) {
    const o = req.headers.get("Origin") || "";
    const cors = { "Access-Control-Allow-Origin": o === ALLOW ? ALLOW : "null", "Vary": "Origin" };
    if (req.method === "OPTIONS")
      return new Response(null, { headers: { ...cors, "Access-Control-Allow-Methods": "GET" } });
    const u = new URL(req.url);
    if (req.method !== "GET" || o !== ALLOW || !OK.some(r => r.test(u.pathname)))
      return new Response(JSON.stringify({ success: false }), { status: 403, headers: cors });
    const key = new Request(u.toString());
    let res = await caches.default.match(key);
    if (!res) {
      const up = await fetch("https://api.railradar.in" + u.pathname + u.search,
        { headers: { Authorization: "Bearer " + env.RAILRADAR_KEY } });
      res = new Response(up.body, up);
      const age = u.pathname.endsWith("/live") ? 300 : 3600;
      res.headers.set("Cache-Control", up.ok ? "public, max-age=" + age : "no-store");
      if (up.ok) ctx.waitUntil(caches.default.put(key, res.clone()));
    }
    const out = new Response(res.body, res);
    Object.entries(cors).forEach(([k, v]) => out.headers.set(k, v));
    return out;
  }
};

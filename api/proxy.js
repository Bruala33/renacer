// Vercel Serverless Function: High-performance CORS proxy for Community Rhythm APIs
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' parameter" });
  }

  try {
    const targetUrl = decodeURIComponent(url);
    const method = req.method || "GET";
    const body = method !== "GET" && req.body ? JSON.stringify(req.body) : undefined;

    const response = await fetch(targetUrl, {
      method: method,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, */*",
        ...(body ? { "Content-Type": "application/json" } : {})
      },
      body: body
    });

    const data = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "application/octet-stream";

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");

    return res.status(response.status).send(Buffer.from(data));
  } catch (err) {
    return res.status(502).json({ error: `Proxy failed: ${err.message}` });
  }
}

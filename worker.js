export default {
  async fetch(request, env, ctx) {
    // 1. Manejo de Preflight CORS (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response("Falta el parámetro ?url=", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    try {
      // 2. Preparar cabeceras para la petición destino
      const forwardHeaders = new Headers();
      forwardHeaders.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
      forwardHeaders.set("Accept", "*/*");

      // Si la petición original incluye cabeceras relevantes (ej. Content-Type en POST), respetarlas
      const originalContentType = request.headers.get("content-type");
      if (originalContentType) {
        forwardHeaders.set("content-type", originalContentType);
      }

      // Reenviar método y cuerpo para POST
      const requestInit = {
        method: request.method,
        headers: forwardHeaders,
        redirect: "follow"
      };

      if (request.method === "POST" && request.body) {
        requestInit.body = request.body;
      }

      const response = await fetch(targetUrl, requestInit);

      // 3. Preparar cabeceras CORS universales
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Access-Control-Allow-Origin", "*");
      newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD");
      newHeaders.set("Access-Control-Allow-Headers", "*");
      newHeaders.set("Access-Control-Expose-Headers", "*");

      // 4. Streaming passthrough directo: Cero lecturas de buffer completo en memoria
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    }
  }
};

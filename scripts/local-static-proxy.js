const fs = require("node:fs");
const http = require("node:http");
const https = require("node:https");
const path = require("node:path");

const port = Number(process.env.PORT || 4300);
const apiTarget = process.env.API_TARGET || "http://localhost:3000";
const publicDir = path.resolve(process.env.PUBLIC_DIR || path.join(__dirname, "../", "dist", "browser"));
const keepApiPrefix = process.env.KEEP_API_PREFIX === "true";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function sendText(res, statusCode, body) {
  res.writeHead(statusCode, {
    "content-type": "text/plain; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

function proxyApi(req, res) {
  const strippedUrl = req.url.replace(/^\/api(?=\/|$)/, "") || "/";
  const targetPath = keepApiPrefix ? req.url : strippedUrl;
  const targetUrl = new URL(targetPath, apiTarget);
  const client = targetUrl.protocol === "https:" ? https : http;

  const headers = {
    ...req.headers,
    host: targetUrl.host,
    "x-forwarded-host": req.headers.host || "",
    "x-forwarded-proto": "http",
  };

  const proxyReq = client.request(
    targetUrl,
    {
      method: req.method,
      headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", (error) => {
    sendText(res, 502, `Could not proxy ${req.url} to ${apiTarget}: ${error.message}\n`);
  });

  req.pipe(proxyReq);
}

function resolveStaticPath(requestUrl) {
  const url = new URL(requestUrl, `http://localhost:${port}`);
  const decodedPath = decodeURIComponent(url.pathname);
  const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = path.join(publicDir, normalizedPath);

  if (!requestedPath.startsWith(publicDir)) {
    return null;
  }

  return requestedPath;
}

function serveFile(req, res, filePath) {
  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      sendText(res, 404, "Not found\n");
      return;
    }

    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    const headers = {
      "content-type": contentType,
      "content-length": stat.size,
    };

    if (/\.[a-f0-9]{16,}\./i.test(path.basename(filePath))) {
      headers["cache-control"] = "public, max-age=31536000, immutable";
    }

    res.writeHead(200, headers);

    if (req.method === "HEAD") {
      res.end();
      return;
    }

    fs.createReadStream(filePath).pipe(res);
  });
}

function serveStatic(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendText(res, 405, "Method not allowed\n");
    return;
  }

  let filePath;

  try {
    filePath = resolveStaticPath(req.url);
  } catch (error) {
    sendText(res, 400, `Bad request: ${error.message}\n`);
    return;
  }

  if (!filePath) {
    sendText(res, 403, "Forbidden\n");
    return;
  }

  fs.stat(filePath, (statError, stat) => {
    if (!statError && stat.isDirectory()) {
      serveFile(req, res, path.join(filePath, "index.html"));
      return;
    }

    if (!statError && stat.isFile()) {
      serveFile(req, res, filePath);
      return;
    }

    serveFile(req, res, path.join(publicDir, "index.html"));
  });
}

const server = http.createServer((req, res) => {
  if (req.url === "/api" || req.url.startsWith("/api/")) {
    proxyApi(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(port, () => {
  console.log(`Serving ${publicDir}`);
  console.log(`Frontend: http://localhost:${port}`);
  console.log(`Proxy: /api -> ${apiTarget}${keepApiPrefix ? " (keeping /api prefix)" : " (stripping /api prefix)"}`);
});

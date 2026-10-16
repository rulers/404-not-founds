import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import nextConfig from "../next.config.ts";
const root = resolve("out");
const prefix = nextConfig.basePath ?? "";
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
};
createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (
    prefix &&
    url.pathname !== prefix &&
    !url.pathname.startsWith(prefix + "/")
  ) {
    res.writeHead(404).end();
    return;
  }
  let path = resolve(
    root,
    "." + decodeURIComponent(url.pathname.slice(prefix.length) || "/"),
  );
  if (path !== root && !path.startsWith(root + sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if ((await stat(path)).isDirectory()) {
      if (!url.pathname.endsWith("/")) {
        res.writeHead(301, { Location: url.pathname + "/" }).end();
        return;
      }
      path = resolve(path, "index.html");
    }
    const body = await readFile(path);
    res
      .writeHead(200, {
        "Content-Type": types[extname(path)] ?? "application/octet-stream",
      })
      .end(body);
  } catch {
    res
      .writeHead(404, { "Content-Type": "text/html" })
      .end(await readFile(resolve(root, "404.html")));
  }
}).listen(3000, "0.0.0.0");

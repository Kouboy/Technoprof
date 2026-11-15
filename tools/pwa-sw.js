/* The build prepends RELEASE with the exact files for this version. */
const scope = new URL(self.registration.scope);
const prefix = `technoprof-offline:${scope.pathname}:`;
const cacheName = prefix + RELEASE.version;
const urlFor = (name) => new URL(name, scope).href;
const readyKey = urlFor(".offline-ready");
let preparation;
let downloaded = 0;
const listeners = new Set();

self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

async function readyCache() {
  const names = (await caches.keys()).filter((name) => name.startsWith(prefix));
  for (const name of [
    cacheName,
    ...names.filter((name) => name !== cacheName).reverse(),
  ]) {
    if (await caches.match(readyKey, { cacheName: name })) return name;
  }
}

async function prepare() {
  if (await caches.match(readyKey, { cacheName })) return;
  const cache = await caches.open(cacheName);
  try {
    for (const name of RELEASE.files) {
      const url = urlFor(name);
      const response = await fetch(url, { cache: "no-cache" });
      if (response.status !== 200 || response.redirected)
        throw new Error(`Download failed for ${name}`);
      await cache.put(url, response);
      downloaded++;
      for (const port of listeners)
        port.postMessage({ type: "progress", downloaded });
    }
    await cache.put(readyKey, new Response("ready"));
  } catch (error) {
    await caches.delete(cacheName);
    throw error;
  }
  // Keep the previous offline edition until every file of the update is ready.
  const names = await caches.keys();
  await Promise.allSettled(
    names
      .filter((name) => name.startsWith(prefix) && name !== cacheName)
      .map((name) => caches.delete(name)),
  );
}

self.addEventListener("message", (event) => {
  const port = event.ports[0];
  if (!port) return;
  if (event.data === "offline-status") {
    event.waitUntil(
      readyCache()
        .then((name) => {
          port.postMessage({
            type: "status",
            ready: name === cacheName,
            previous: !!name && name !== cacheName,
            bytes: RELEASE.bytes,
            total: RELEASE.files.length,
          });
        })
        .catch(() => port.postMessage({ type: "error" })),
    );
  } else if (event.data === "prepare-offline") {
    listeners.add(port);
    if (!preparation) {
      downloaded = 0;
      preparation = prepare().finally(() => {
        preparation = undefined;
      });
    }
    port.postMessage({ type: "progress", downloaded });
    event.waitUntil(
      preparation
        .then(
          () => port.postMessage({ type: "done" }),
          () => port.postMessage({ type: "error" }),
        )
        .finally(() => listeners.delete(port)),
    );
  }
});

async function serve(request, name) {
  // Let the host serve the current version and media ranges while online.
  try {
    const response = await fetch(request);
    if (response.ok) return response;
  } catch {
    // Use only a complete downloaded edition as the offline fallback.
  }
  const saved = await readyCache();
  const cached =
    saved && (await caches.match(urlFor(name), { cacheName: saved }));
  if (!cached)
    return new Response(
      "Téléchargez le jeu depuis les réglages pour jouer hors connexion.",
      {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  const range = request.headers.get("range");
  if (!range) return cached;
  const data = await cached.blob();
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  const start = match?.[1]
    ? Number(match[1])
    : match?.[2]
      ? Math.max(0, data.size - Number(match[2]))
      : data.size;
  const end =
    match?.[1] && match[2]
      ? Math.min(data.size - 1, Number(match[2]))
      : data.size - 1;
  if (start > end)
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${data.size}` },
    });
  return new Response(data.slice(start, end + 1), {
    status: 206,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Type":
        cached.headers.get("Content-Type") ||
        data.type ||
        "application/octet-stream",
      "Content-Range": `bytes ${start}-${end}/${data.size}`,
      "Content-Length": String(end - start + 1),
    },
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== scope.origin ||
    !url.pathname.startsWith(scope.pathname)
  )
    return;
  const name = url.pathname.slice(scope.pathname.length);
  if (request.mode === "navigate" && (!name || name === "index.html")) {
    event.respondWith(serve(request, "index.html"));
  } else if (
    RELEASE.files.includes(name) ||
    /^(assets|art|audio)\//.test(name)
  ) {
    event.respondWith(serve(request, name));
  }
});

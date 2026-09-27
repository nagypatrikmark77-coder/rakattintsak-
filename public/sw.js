// Rákattintsak? service worker.
// Egyetlen feladata: a megosztás menüből érkező POST /share-target kérést
// elfogja, a tartalmat helyben (Cache API) eltárolja, és átirányít a főoldalra.
// A tartalom így nem megy szerverre, csak amikor a főoldal ellenőrzést kér.

const SHARE_CACHE = "rakattintsak-share-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method === "POST" &&
    url.origin === self.location.origin &&
    url.pathname === "/share-target"
  ) {
    event.respondWith(handleShare(event.request));
  }
});

async function handleShare(request) {
  try {
    const form = await request.formData();
    const field = (name) => {
      const v = form.get(name);
      return typeof v === "string" ? v : "";
    };
    const image = form
      .getAll("image")
      .find((f) => f && typeof f !== "string" && f.type.startsWith("image/"));

    const cache = await caches.open(SHARE_CACHE);
    await cache.put(
      "/__shared/text",
      new Response(JSON.stringify({ title: field("title"), text: field("text"), url: field("url") }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
    if (image) {
      await cache.put("/__shared/image", new Response(image, { headers: { "Content-Type": image.type } }));
    } else {
      await cache.delete("/__shared/image");
    }
    return Response.redirect(new URL("/?shared=1", self.location.origin).href, 303);
  } catch {
    return Response.redirect(new URL("/?shared=failed", self.location.origin).href, 303);
  }
}

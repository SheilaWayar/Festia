const CACHE = "festia-v1";

// Al instalarse, se activa enseguida sin esperar
self.addEventListener("install", () => self.skipWaiting());

// Al activarse, borra cachés viejos y toma el control de las pestañas abiertas
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Solo se ocupa de GET de tu propio sitio.
  // Supabase, Mercado Pago, etc. van siempre directo a internet.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Páginas: primero internet; si no hay conexión, la última copia guardada
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copia));
          return res;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // Archivos estáticos (JS, CSS, imágenes): primero el caché, por velocidad
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
          return res;
        })
    )
  );
});
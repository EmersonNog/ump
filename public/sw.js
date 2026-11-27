/* Service worker do UMP Pagamentos: offline + notificações push. */
const VERSAO = "ump-v3";
const PAGINA_OFFLINE = "/offline";
const DESENVOLVIMENTO = new URL(self.location.href).searchParams.has("dev");
const PRECACHE = [
  PAGINA_OFFLINE,
  "/marca/ump-emblema.png",
  "/marca/ump-emblema-escuro.png",
  "/icons/icon-192.png",
  "/icons/badge-96.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSAO)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

function estatico(url) {
  if (DESENVOLVIMENTO) return false;
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Páginas: sempre da rede (dados de pagamento não ficam em cache); sem internet → tela offline.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(PAGINA_OFFLINE)));
    return;
  }

  // Arquivos versionados: cache primeiro.
  if (estatico(url)) {
    event.respondWith(
      caches.match(request).then(
        (emCache) =>
          emCache ||
          fetch(request).then((resposta) => {
            if (resposta.ok) {
              const copia = resposta.clone();
              caches.open(VERSAO).then((cache) => cache.put(request, copia));
            }
            return resposta;
          }),
      ),
    );
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let dados;
  try {
    dados = event.data.json();
  } catch {
    dados = { title: "UMP", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(dados.title || "UMP", {
      body: dados.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: dados.tag,
      renotify: Boolean(dados.tag),
      vibrate: [80, 40, 80],
      data: { url: dados.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      for (const janela of janelas) {
        if (new URL(janela.url).origin === self.location.origin && "focus" in janela) {
          return janela.navigate(destino).then((j) => (j || janela).focus());
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});

const CACHE_NAME = "spotify-clone-v1";

const ARQUIVOS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/firebase.js",
  "./manifest.json",
  "./img/icon-192.png",
  "./img/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(chaves => {
      return Promise.all(
        chaves
          .filter(chave => chave !== CACHE_NAME)
          .map(chave => caches.delete(chave))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then(respostaCache => {
      if (respostaCache) {
        return respostaCache;
      }

      return fetch(request)
        .then(resposta => {
          if (
            !resposta ||
            resposta.status !== 200 ||
            resposta.type === "opaque"
          ) {
            return resposta;
          }

          const respostaClone = resposta.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, respostaClone);
          });

          return resposta;
        })
        .catch(() => {
          return caches.match("./index.html");
        });
    })
  );
});

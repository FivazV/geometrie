// Le cache de l'application « Géométrie » : tout est gardé sur le téléphone à la première visite.
// À chaque visite avec connexion, la page servie vient du cache (instantané) et sa copie est rafraîchie en arrière-plan.
const CACHE = 'geometrie-2026-11-23a';
const FICHIERS = [
	"./",
	"index.html",
	"manifest.webmanifest",
	"mediatrice.html",
	"bissectrice.html",
	"cercle-circonscrit.html",
	"cercle-inscrit.html",
	"polices/polices.css",
	"polices/bricolage-grotesque-1.woff2",
	"polices/figtree-2.woff2",
	"polices/newsreader-3.woff2",
	"polices/source-sans-3-4.woff2",
	"icones/icone-180.png",
	"icones/icone-192.png",
	"icones/icone-512.png",
	"icones/icone-masque-512.png"
];
self.addEventListener('install', (e) => {
	e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
	e.waitUntil(
		caches
			.keys()
			.then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});
self.addEventListener('fetch', (e) => {
	if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
	e.respondWith(
		caches.open(CACHE).then(async (c) => {
			const enCache = await c.match(e.request, { ignoreSearch: true });
			const reseau = fetch(e.request)
				.then((r) => {
					if (r.ok) c.put(e.request, r.clone());
					return r;
				})
				.catch(() => enCache);
			return enCache || reseau;
		})
	);
});

// Le cache de l'application : tout est gardé sur le téléphone à la première visite.
// LES PAGES : le réseau d'abord — avec une connexion, l'élève voit toujours la dernière version, sans rien rafraîchir ;
// sans connexion (ou si le réseau traîne plus de 4 secondes), la copie gardée sur le téléphone.
// LE RESTE (polices, icônes) : la copie gardée d'abord, rafraîchie en arrière-plan.
const CACHE = 'geometrie-2026-11-27b';
const FICHIERS = [
	"./",
	"index.html",
	"espace.html",
	"mediatrice.html",
	"bissectrice.html",
	"cercle-circonscrit.html",
	"cercle-inscrit.html",
	"angles-triangles.html",
	"angles-quadrilateres.html",
	"remediation-1.html",
	"remediation-2.html",
	"remediation-3.html",
	"remediation-4.html",
	"remediation-5.html",
	"remediation-6.html",
	"remediation-7.html",
	"grandeurs.html",
	"notions-initiales.html",
	"manifest.webmanifest",
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
const estUnePage = (req) => req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
self.addEventListener('fetch', (e) => {
	if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
	e.respondWith(
		caches.open(CACHE).then(async (c) => {
			const enCache = await c.match(e.request, { ignoreSearch: true });
			const reseau = fetch(e.request, estUnePage(e.request) ? { cache: 'no-cache' } : undefined).then((r) => {
				if (r.ok) c.put(e.request, r.clone());
				return r;
			});
			if (!estUnePage(e.request)) {
				reseau.catch(() => {});
				return enCache || reseau;
			}
			if (!enCache) return reseau;
			const patience = new Promise((ok) => setTimeout(() => ok(enCache), 4000));
			return Promise.race([reseau.catch(() => enCache), patience]);
		})
	);
});

/**
 * CONSTRUIRE LA PETITE APPLICATION « GÉOMÉTRIE » (Vincent, 23.11.2026).
 *
 *   node construire.mjs
 *
 * Prend les animations de Vincent dans E:\Ecole\Espace\Application (jamais modifiées) et fabrique, dans `docs/`, un site
 * que GitHub Pages sert tel quel :
 *   - une page d'accueil avec la liste des animations ;
 *   - chaque animation, avec ses polices copiées dans le site (plus aucun appel vers Google depuis le téléphone des
 *     élèves) et un petit lien « ← Accueil » (une application installée n'a pas de bouton « retour » sur iPhone) ;
 *   - l'icône au grand F, le manifeste et le service de cache qui rendent l'application installable et utilisable
 *     hors connexion.
 *
 * Pour ajouter une animation : une ligne dans ANIMATIONS, puis relancer ce script, committer et pousser.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const SOURCE = 'E:/Ecole/Espace/Application';
const SORTIE = resolve(ICI, 'docs');
const VERSION = '2026-11-23a';

const ANIMATIONS = [
	{
		source: 'Mediatrice_au_compas_1.html',
		fichier: 'mediatrice.html',
		titre: 'La médiatrice',
		texte: 'Construire la médiatrice d’un segment, au compas et à la règle.'
	},
	{
		source: 'Bissectrice_au_compas_1.html',
		fichier: 'bissectrice.html',
		titre: 'La bissectrice',
		texte: 'Partager un angle en deux angles égaux, au compas et à la règle.'
	},
	{
		source: 'Cercle_circonscrit_au_compas_1.html',
		fichier: 'cercle-circonscrit.html',
		titre: 'Le cercle circonscrit',
		texte: 'Le cercle qui passe par les trois sommets d’un triangle.'
	},
	{
		source: 'Cercle_inscrit_au_compas_1.html',
		fichier: 'cercle-inscrit.html',
		titre: 'Le cercle inscrit',
		texte: 'Le cercle qui touche les trois côtés d’un triangle.'
	}
];

// ── Les polices, copiées une fois dans `polices/` (gardées d'une construction à l'autre) ─────────────────────────
const POLICES = resolve(ICI, 'polices');
const CSS_GOOGLE =
	'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..700&family=Figtree:wght@400;500;600&family=Newsreader:ital,wght@1,500&family=Source+Sans+3:wght@400;600;700&display=swap';
async function polices() {
	if (existsSync(resolve(POLICES, 'polices.css'))) return;
	mkdirSync(POLICES, { recursive: true });
	const css = await (
		await fetch(CSS_GOOGLE, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
			}
		})
	).text();
	// Seul le jeu « latin » est gardé : il porte toutes les lettres du français.
	const blocs = [...css.matchAll(/\/\* latin \*\/\s*(@font-face\s*\{[^}]*\})/g)].map((m) => m[1]);
	if (!blocs.length) throw new Error('polices : aucun bloc « latin » dans la réponse');
	let sortie = '/* Polices copiées dans le site : aucun appel extérieur depuis le téléphone. */\n';
	const vues = new Map();
	for (const bloc of blocs) {
		const url = /url\((https:[^)]+\.woff2)\)/.exec(bloc)?.[1];
		if (!url) throw new Error('polices : bloc sans fichier');
		if (!vues.has(url)) {
			const famille = /font-family:\s*'([^']+)'/.exec(bloc)[1].replace(/\s+/g, '-').toLowerCase();
			const nom = `${famille}-${vues.size + 1}.woff2`;
			writeFileSync(resolve(POLICES, nom), Buffer.from(await (await fetch(url)).arrayBuffer()));
			vues.set(url, nom);
		}
		sortie += bloc.replace(url, vues.get(url)) + '\n';
	}
	writeFileSync(resolve(POLICES, 'polices.css'), sortie);
	writeFileSync(resolve(POLICES, 'liste.json'), JSON.stringify([...vues.values()]));
	console.log(`polices : ${vues.size} fichiers copiés`);
}

// ── Les pièces communes ────────────────────────────────────────────────────────────────────────────────────────
const F_SVG = (taille, marge) => {
	// Un F fait de trois rectangles : aucun besoin d'une police pour le dessiner.
	const u = (taille - 2 * marge) / 10;
	const x = marge + 2.2 * u;
	const y = marge + 1.2 * u;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${taille}" height="${taille}" viewBox="0 0 ${taille} ${taille}">
<rect width="${taille}" height="${taille}" fill="#1d4e89"/>
<g fill="#ffffff">
<rect x="${x}" y="${y}" width="${1.9 * u}" height="${7.6 * u}"/>
<rect x="${x}" y="${y}" width="${5.8 * u}" height="${1.8 * u}"/>
<rect x="${x}" y="${y + 3.0 * u}" width="${4.6 * u}" height="${1.7 * u}"/>
</g></svg>`;
};
const TETE_COMMUNE = `<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#1d4e89">
<link rel="icon" href="icones/icone-192.png">
<link rel="apple-touch-icon" href="icones/icone-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Géométrie">`;
const SERVICE = `<script>if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js')}</script>`;
// (Dans le flux de la page, au-dessus du titre : en position fixe, il recouvrait le titre de l'animation.)
const RETOUR = `<div style="padding:12px 16px 0"><a href="./" style="display:inline-block;padding:8px 14px;border-radius:999px;background:#1d4e89;color:#fff;font:600 15px/1 system-ui,sans-serif;text-decoration:none">← Accueil</a></div>`;

function animation(a) {
	let s = readFileSync(resolve(SOURCE, a.source), 'utf8').replace(/\r\n/g, '\n');
	// Les appels à Google Fonts sortent ; la feuille locale entre.
	const avant = s.length;
	s = s.replace(/<link[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*/g, '');
	if (s.length === avant) throw new Error(`${a.source} : aucun lien de police trouvé`);
	if (/fonts\.(googleapis|gstatic)\.com/.test(s)) throw new Error(`${a.source} : il reste un appel à Google`);
	if (!s.includes('</head>') || !/<body[^>]*>/.test(s)) throw new Error(`${a.source} : page inattendue`);
	s = s.replace('</head>', () => `<link rel="stylesheet" href="polices/polices.css">\n${TETE_COMMUNE}\n</head>`);
	s = s.replace(/<body[^>]*>/, (m) => `${m}\n${RETOUR}`);
	s = s.replace('</body>', () => `${SERVICE}\n</body>`);
	writeFileSync(resolve(SORTIE, a.fichier), s);
}

const accueil = () => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Géométrie</title>
<link rel="stylesheet" href="polices/polices.css">
${TETE_COMMUNE}
<style>
:root{--fond:#eef2f6;--carte:#ffffff;--encre:#16222e;--doux:#566676;--trait:#d3dce5;--bleu:#1d4e89;--bleu-doux:#e2ecf7}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--fond:#0f1820;--carte:#18242f;--encre:#e7eef4;--doux:#9db0bf;--trait:#2b3b49;--bleu:#7fb2ea;--bleu-doux:#1b2f44;color-scheme:dark}}
:root[data-theme="dark"]{--fond:#0f1820;--carte:#18242f;--encre:#e7eef4;--doux:#9db0bf;--trait:#2b3b49;--bleu:#7fb2ea;--bleu-doux:#1b2f44;color-scheme:dark}
*{box-sizing:border-box}
html,body{margin:0}
body{background:var(--fond);color:var(--encre);font:17px/1.5 "Figtree","Segoe UI",system-ui,sans-serif;padding:0 16px 48px}
main{max-width:640px;margin:0 auto}
header{display:flex;align-items:center;gap:14px;padding:28px 0 18px}
header img{width:56px;height:56px;border-radius:14px;flex:none}
h1{font:700 1.9rem/1.1 "Bricolage Grotesque","Segoe UI",system-ui,sans-serif;margin:0}
header p{margin:2px 0 0;color:var(--doux)}
ul{list-style:none;margin:0;padding:0;display:grid;gap:12px}
li a{display:block;background:var(--carte);border:1px solid var(--trait);border-radius:14px;padding:16px 18px;color:inherit;text-decoration:none}
li a:active{background:var(--bleu-doux)}
li strong{display:block;font:700 1.2rem/1.25 "Bricolage Grotesque","Segoe UI",system-ui,sans-serif;color:var(--bleu)}
li span{color:var(--doux)}
details{margin-top:26px;background:var(--carte);border:1px solid var(--trait);border-radius:14px;padding:14px 18px}
summary{font-weight:600;cursor:pointer}
details p{margin:10px 0 0}
</style>
</head>
<body>
<main>
<header>
<img src="icones/icone-192.png" alt="">
<div><h1>Géométrie</h1><p>Les constructions au compas, pas à pas.</p></div>
</header>
<ul>
${ANIMATIONS.map((a) => `<li><a href="${a.fichier}"><strong>${a.titre}</strong><span>${a.texte}</span></a></li>`).join('\n')}
</ul>
<details>
<summary>Mettre cette page sur l’écran de mon téléphone</summary>
<p><strong>Android (Chrome)</strong> : touche les trois points en haut à droite, puis « Ajouter à l’écran d’accueil » ou « Installer l’application ».</p>
<p><strong>iPhone (Safari)</strong> : touche le bouton de partage (le carré avec une flèche), puis « Sur l’écran d’accueil ».</p>
<p>Une fois installée, l’application fonctionne aussi sans connexion.</p>
</details>
</main>
${SERVICE}
</body>
</html>
`;

const manifeste = () =>
	JSON.stringify(
		{
			name: 'Géométrie — constructions au compas',
			short_name: 'Géométrie',
			lang: 'fr',
			start_url: './',
			scope: './',
			display: 'standalone',
			background_color: '#eef2f6',
			theme_color: '#1d4e89',
			icons: [
				{ src: 'icones/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
				{ src: 'icones/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
				{ src: 'icones/icone-masque-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
			]
		},
		null,
		'\t'
	);

const service = (fichiers) => `// Le cache de l'application « Géométrie » : tout est gardé sur le téléphone à la première visite.
// À chaque visite avec connexion, la page servie vient du cache (instantané) et sa copie est rafraîchie en arrière-plan.
const CACHE = 'geometrie-${VERSION}';
const FICHIERS = ${JSON.stringify(fichiers, null, '\t')};
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
`;

// ── La construction ────────────────────────────────────────────────────────────────────────────────────────────
await polices();
rmSync(SORTIE, { recursive: true, force: true });
mkdirSync(resolve(SORTIE, 'polices'), { recursive: true });
mkdirSync(resolve(SORTIE, 'icones'), { recursive: true });

const listePolices = JSON.parse(readFileSync(resolve(POLICES, 'liste.json'), 'utf8'));
for (const f of ['polices.css', ...listePolices])
	copyFileSync(resolve(POLICES, f), resolve(SORTIE, 'polices', f));

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP ?? 'sharp');
for (const [nom, taille, marge] of [
	['icone-180.png', 180, 14],
	['icone-192.png', 192, 16],
	['icone-512.png', 512, 42],
	// « Masquable » : Android rogne l'icône en rond, le F reste dans la zone sûre.
	['icone-masque-512.png', 512, 96]
])
	await sharp(Buffer.from(F_SVG(taille, marge))).png().toFile(resolve(SORTIE, 'icones', nom));

for (const a of ANIMATIONS) animation(a);
writeFileSync(resolve(SORTIE, 'index.html'), accueil());
writeFileSync(resolve(SORTIE, 'manifest.webmanifest'), manifeste());
writeFileSync(resolve(SORTIE, '.nojekyll'), '');
writeFileSync(
	resolve(SORTIE, 'sw.js'),
	service([
		'./',
		'index.html',
		'manifest.webmanifest',
		...ANIMATIONS.map((a) => a.fichier),
		'polices/polices.css',
		...listePolices.map((f) => `polices/${f}`),
		'icones/icone-180.png',
		'icones/icone-192.png',
		'icones/icone-512.png',
		'icones/icone-masque-512.png'
	])
);
console.log(`construit : ${ANIMATIONS.length} animations dans ${SORTIE}`);

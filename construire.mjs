/**
 * CONSTRUIRE LA PETITE APPLICATION « F » (Vincent, 23.11.2026).
 *
 *   node construire.mjs
 *
 * Prend les animations de Vincent sur E: (jamais modifiées) et fabrique, dans `docs/`, un site que GitHub Pages sert
 * tel quel :
 *   - une page d'accueil avec une TUILE par domaine (aujourd'hui : ESPACE) ;
 *   - une page par domaine, avec la liste de ses animations — chacune sous l'INTITULÉ qu'elle affiche elle-même
 *     (son grand titre), pour que l'élève retrouve le nom de l'exercice ;
 *   - chaque animation, avec ses polices copiées dans le site (aucun appel vers Google depuis le téléphone des élèves)
 *     et un lien de retour vers son domaine (une application installée n'a pas de bouton « retour » sur iPhone) ;
 *   - l'icône au grand F, le manifeste et le service de cache qui rendent l'application installable et utilisable
 *     hors connexion.
 *
 * POUR AJOUTER UNE ANIMATION : une ligne dans la liste `animations` de sa tuile, puis relancer ce script, vérifier
 * (verifier.mjs), committer et pousser. POUR AJOUTER UN DOMAINE : une tuile de plus dans TUILES.
 * Le nom du fichier publié (`fichier`) ne change plus une fois en ligne : des téléphones l'ont en mémoire.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const SORTIE = resolve(ICI, 'docs');
const VERSION = '2026-11-27c';

const TUILES = [
	{
		nom: 'ESPACE',
		page: 'espace.html',
		couleur: 'bleu',
		texte: 'Les constructions pas à pas, et les corrections de la remédiation.',
		dossier: 'E:/Ecole/Espace/Application',
		// Une tuile range ses animations en RUBRIQUES. `numero` : le numéro de l'exercice, écrit devant l'intitulé
		// (deux exercices de remédiation portent le même titre que les animations de la première rubrique).
		rubriques: [
			{
				titre: 'Les constructions au compas',
				animations: [
					{ source: 'Mediatrice_au_compas_1.html', fichier: 'mediatrice.html' },
					{ source: 'Bissectrice_au_compas_1.html', fichier: 'bissectrice.html' },
					{ source: 'Cercle_circonscrit_au_compas_1.html', fichier: 'cercle-circonscrit.html' },
					{ source: 'Cercle_inscrit_au_compas_1.html', fichier: 'cercle-inscrit.html' }
				]
			},
			{
				// (26.11 : ces deux explications viennent d'un autre dossier que le reste de la tuile — `dossier` le dit.)
				titre: 'Les angles — explications',
				dossier: 'C:/Users/Enseignant/Desktop/MAT/Application_F',
				animations: [
					{ source: 'Explication_Angles_triangles.html', fichier: 'angles-triangles.html' },
					{ source: 'Explication_Angles_quadrilateres.html', fichier: 'angles-quadrilateres.html' }
				]
			},
			{
				titre: 'Remédiation — les corrections',
				animations: [
					{ numero: 1, source: 'Correction_Remediation_1_Bissectrice.html', fichier: 'remediation-1.html' },
					{ numero: 2, source: 'Correction_Remediation_2_Mediatrice.html', fichier: 'remediation-2.html' },
					{ numero: 3, source: 'Correction_Remediation_3_Cercle_circonscrit.html', fichier: 'remediation-3.html' },
					{ numero: 4, source: 'Correction_Remediation_4_Cercle_inscrit.html', fichier: 'remediation-4.html' },
					{ numero: 5, source: 'Correction_Remediation_5_Calcul_angles.html', fichier: 'remediation-5.html' },
					{ numero: 6, source: 'Correction_Remediation_6_Constructions_figures.html', fichier: 'remediation-6.html' },
					{ numero: 7, source: 'Correction_Remediation_7_Qui_suis_je.html', fichier: 'remediation-7.html' }
				]
			}
		]
	},
	{
		// (Sans rubrique, sa page dit que les animations arrivent bientôt.)
		nom: 'GRANDEURS ET MESURES',
		page: 'grandeurs.html',
		couleur: 'vert',
		texte: 'Le périmètre, l’aire, et comment écrire un calcul.',
		dossier: 'E:/Ecole/Maths_F',
		rubriques: [
			{
				// (27.11 : animation écrite d'après le document « GM_Notions_Initiales » de l'enseignant.)
				titre: 'Les notions initiales',
				animations: [{ source: 'GM_Notions_Initiales.html', fichier: 'notions-initiales.html' }]
			},
			{
				// (27.11 : écrite par Claude, validée par l'enseignant.)
				titre: 'Le triangle',
				animations: [{ source: 'GM_Triangle.html', fichier: 'triangle.html' }]
			}
		]
	}
];

// LES COULEURS DES TUILES. `fond` : la tuile, les boutons, les numéros ; `doux` : le fond d'une ligne touchée.
// En mode sombre, une teinte plus claire, posée sur le fond sombre. (Le vert : celui de l'enseignant, 26.11.)
const COULEURS = {
	bleu: { fond: '#1d4e89', doux: '#e2ecf7', sombre: '#7fb2ea', sombreDoux: '#1b2f44' },
	vert: { fond: '#52a93f', doux: '#e4efd7', sombre: '#8fcf7c', sombreDoux: '#1e3320' }
};

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
<meta name="apple-mobile-web-app-title" content="Maths">`;
const SERVICE = `<script>if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js')}</script>`;
// (Dans le flux de la page, au-dessus du titre : en position fixe, il recouvrait le titre de l'animation.)
const retour = (href, nom, couleur) =>
	`<div style="padding:12px 16px 0"><a href="${href}" style="display:inline-block;padding:8px 14px;border-radius:999px;background:${COULEURS[couleur].fond};color:#fff;font:600 15px/1 system-ui,sans-serif;text-decoration:none">← ${nom}</a></div>`;
const echapper = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Copie une animation dans le site ; rend l'intitulé qu'elle affiche (son grand titre). */
function animation(tuile, a) {
	let s = readFileSync(a.chemin, 'utf8').replace(/\r\n/g, '\n');
	// L'intitulé : le grand titre de la page, tel que l'élève le lit ; à défaut, le titre de l'onglet.
	const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(s)?.[1] ?? /<title>([^<]*)<\/title>/.exec(s)?.[1] ?? '';
	const intitule = h1
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	if (!intitule) throw new Error(`${a.source} : aucun intitulé trouvé`);
	// Les appels à Google Fonts sortent ; la feuille locale entre.
	const avant = s.length;
	s = s.replace(/<link[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*/g, '');
	if (s.length === avant) throw new Error(`${a.source} : aucun lien de police trouvé`);
	if (/fonts\.(googleapis|gstatic)\.com/.test(s)) throw new Error(`${a.source} : il reste un appel à Google`);
	if (!s.includes('</head>') || !/<body[^>]*>/.test(s)) throw new Error(`${a.source} : page inattendue`);
	s = s.replace('</head>', () => `<link rel="stylesheet" href="polices/polices.css">\n${TETE_COMMUNE}\n</head>`);
	s = s.replace(/<body[^>]*>/, (m) => `${m}\n${retour(tuile.page, tuile.nom[0] + tuile.nom.slice(1).toLowerCase(), tuile.couleur)}`);
	s = s.replace('</body>', () => `${SERVICE}\n</body>`);
	writeFileSync(resolve(SORTIE, a.fichier), s);
	return intitule;
}

const STYLE = `
:root{--fond:#eef2f6;--carte:#ffffff;--encre:#16222e;--doux:#566676;--trait:#d3dce5;--bleu:#1d4e89;--bleu-doux:#e2ecf7;--sur-bleu:#ffffff}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--fond:#0f1820;--carte:#18242f;--encre:#e7eef4;--doux:#9db0bf;--trait:#2b3b49;--bleu:#7fb2ea;--bleu-doux:#1b2f44;--sur-bleu:#0f1820;color-scheme:dark}}
:root[data-theme="dark"]{--fond:#0f1820;--carte:#18242f;--encre:#e7eef4;--doux:#9db0bf;--trait:#2b3b49;--bleu:#7fb2ea;--bleu-doux:#1b2f44;--sur-bleu:#0f1820;color-scheme:dark}
*{box-sizing:border-box}
html,body{margin:0}
body{background:var(--fond);color:var(--encre);font:17px/1.5 "Figtree","Segoe UI",system-ui,sans-serif;padding:0 16px 48px}
main{max-width:640px;margin:0 auto}
header{display:flex;align-items:center;gap:14px;padding:28px 0 18px}
header img{width:56px;height:56px;border-radius:14px;flex:none}
h1{font:700 1.9rem/1.1 "Bricolage Grotesque","Segoe UI",system-ui,sans-serif;margin:0}
header p{margin:2px 0 0;color:var(--doux)}
ul{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.tuiles a{display:block;background:var(--bleu);color:var(--sur-bleu);border-radius:18px;padding:26px 22px;text-decoration:none}
.tuiles strong{display:block;font:700 1.9rem/1.1 "Bricolage Grotesque","Segoe UI",system-ui,sans-serif;letter-spacing:.04em}
.tuiles span{display:block;margin-top:6px;opacity:.9}
h2{font:700 1.15rem/1.3 "Bricolage Grotesque","Segoe UI",system-ui,sans-serif;margin:26px 0 10px;color:var(--doux)}
.liste a{display:flex;align-items:center;gap:12px;background:var(--carte);border:1px solid var(--trait);border-radius:14px;padding:16px 18px;color:var(--bleu);text-decoration:none;font:700 1.15rem/1.3 "Bricolage Grotesque","Segoe UI",system-ui,sans-serif}
.numero{flex:none;width:32px;height:32px;border-radius:50%;background:var(--bleu);color:var(--sur-bleu);display:grid;place-items:center;font-size:1rem}
.liste a:active{background:var(--bleu-doux)}
.retour{display:inline-block;margin-top:14px;padding:8px 14px;border-radius:999px;background:var(--bleu);color:var(--sur-bleu);font:600 15px/1 system-ui,sans-serif;text-decoration:none}
details{margin-top:26px;background:var(--carte);border:1px solid var(--trait);border-radius:14px;padding:14px 18px}
summary{font-weight:600;cursor:pointer}
details p{margin:10px 0 0}
.bientot{background:var(--carte);border:1px dashed var(--trait);border-radius:14px;padding:18px;color:var(--doux);margin-top:10px}
${Object.entries(COULEURS)
	.map(
		([nom, c]) => `.${nom}{--bleu:${c.fond};--bleu-doux:${c.doux}}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .${nom}{--bleu:${c.sombre};--bleu-doux:${c.sombreDoux}}}
:root[data-theme="dark"] .${nom}{--bleu:${c.sombre};--bleu-doux:${c.sombreDoux}}`
	)
	.join('\n')}`;
const page = (titre, corps, couleur = 'bleu') => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<link rel="stylesheet" href="polices/polices.css">
${TETE_COMMUNE}
<style>${STYLE}
</style>
</head>
<body class="${couleur}">
<main>
${corps}
</main>
${SERVICE}
</body>
</html>
`;

const accueil = () =>
	page(
		'Maths',
		`<header>
<img src="icones/icone-192.png" alt="">
<div><h1>Maths</h1><p>Choisis un domaine.</p></div>
</header>
<ul class="tuiles">
${TUILES.map((t) => `<li><a class="${t.couleur}" href="${t.page}"><strong>${t.nom}</strong><span>${echapper(t.texte)}</span></a></li>`).join('\n')}
</ul>
<details>
<summary>Mettre cette page sur l’écran de mon téléphone</summary>
<p><strong>Android (Chrome)</strong> : touche les trois points en haut à droite, puis « Ajouter à l’écran d’accueil » ou « Installer l’application ».</p>
<p><strong>iPhone (Safari)</strong> : touche le bouton de partage (le carré avec une flèche), puis « Sur l’écran d’accueil ».</p>
<p>Une fois installée, l’application fonctionne aussi sans connexion. Les nouvelles animations arrivent toutes seules : il n’y a rien à mettre à jour.</p>
</details>`
	);

const domaine = (t, intitules) =>
	page(
		`${t.nom} — Maths`,
		`<a class="retour" href="./">← Accueil</a>
<header>
<div><h1>${t.nom}</h1>${t.rubriques.length ? `<p>${echapper(t.texte)}</p>` : ''}</div>
</header>
${t.rubriques.length ? '' : '<p class="bientot">Les premières animations arrivent bientôt.</p>'}
${t.rubriques
	.map(
		(r) => `<h2>${echapper(r.titre)}</h2>
<ul class="liste">
${r.animations
	.map(
		(a) =>
			`<li><a href="${a.fichier}">${a.numero ? `<span class="numero">${a.numero}</span>` : ''}<span class="intitule">${echapper(intitules.get(a.fichier))}</span></a></li>`
	)
	.join('\n')}
</ul>`
	)
	.join('\n')}`,
		t.couleur
	);

const manifeste = () =>
	JSON.stringify(
		{
			name: 'Maths — les animations',
			short_name: 'Maths',
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

const service = (fichiers) => `// Le cache de l'application : tout est gardé sur le téléphone à la première visite.
// LES PAGES : le réseau d'abord — avec une connexion, l'élève voit toujours la dernière version, sans rien rafraîchir ;
// sans connexion (ou si le réseau traîne plus de 4 secondes), la copie gardée sur le téléphone.
// LE RESTE (polices, icônes) : la copie gardée d'abord, rafraîchie en arrière-plan.
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
`;

// ── La construction ────────────────────────────────────────────────────────────────────────────────────────────
await polices();

// LES SOURCES, AVANT DE TOUCHER À QUOI QUE CE SOIT (23.11 : le disque E: était débranché, et le script avait déjà vidé
// `docs/` quand il s'en est aperçu). Chaque animation lue sur E: est recopiée dans `sources/` ; sans le disque, c'est
// cette copie qui sert. S'il manque une seule source, on s'arrête ici, `docs/` intact.
for (const t of TUILES) {
	const copies = resolve(ICI, 'sources', t.page.replace('.html', ''));
	mkdirSync(copies, { recursive: true });
	// (Une rubrique peut venir d'un autre dossier que sa tuile : `dossier` sur la rubrique passe devant celui de la tuile.)
	for (const a of t.rubriques.flatMap((r) => r.animations.map((x) => Object.assign(x, { dossier: r.dossier ?? t.dossier })))) {
		const origine = resolve(a.dossier, a.source);
		a.chemin = resolve(copies, a.source);
		if (existsSync(origine)) copyFileSync(origine, a.chemin);
		else if (existsSync(a.chemin)) console.log(`(disque absent : copie locale de ${a.source})`);
		else throw new Error(`source introuvable, sur le disque comme en copie locale : ${origine}`);
	}
}
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

const pages = ['index.html'];
for (const t of TUILES) {
	const animations = t.rubriques.flatMap((r) => r.animations);
	const intitules = new Map(animations.map((a) => [a.fichier, animation(t, a)]));
	writeFileSync(resolve(SORTIE, t.page), domaine(t, intitules));
	pages.push(t.page, ...animations.map((a) => a.fichier));
	console.log(
		`${t.nom} :\n${animations.map((a) => `  - ${a.numero ? a.numero + ' · ' : ''}${intitules.get(a.fichier)}`).join('\n')}`
	);
}
if (new Set(pages).size !== pages.length) throw new Error('deux pages portent le même nom de fichier');
writeFileSync(resolve(SORTIE, 'index.html'), accueil());
writeFileSync(resolve(SORTIE, 'manifest.webmanifest'), manifeste());
writeFileSync(resolve(SORTIE, '.nojekyll'), '');
writeFileSync(
	resolve(SORTIE, 'sw.js'),
	service([
		'./',
		...pages,
		'manifest.webmanifest',
		'polices/polices.css',
		...listePolices.map((f) => `polices/${f}`),
		'icones/icone-180.png',
		'icones/icone-192.png',
		'icones/icone-512.png',
		'icones/icone-masque-512.png'
	])
);
console.log(`construit dans ${SORTIE}`);

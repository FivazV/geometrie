/**
 * VÉRIFIER LE SITE DANS UN VRAI NAVIGATEUR, à la largeur d'un téléphone, servi sous /geometrie/ comme sur GitHub Pages.
 *
 *   PLAYWRIGHT=<chemin de @playwright/test> CHROMIUM_PATH=<chrome.exe> node verifier.mjs
 *
 * Le chemin de l'élève : l'accueil, chaque tuile, chaque animation de la tuile, et le retour. Vérifie : aucune erreur
 * de page, aucun appel hors du site, pas de défilement horizontal, la police chargée, le cache en place, tout rouvert
 * SANS connexion — et qu'une page modifiée sur le serveur est vue dès l'ouverture suivante, sans rafraîchir.
 */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(ICI, 'docs');
const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css',
	'.js': 'text/javascript',
	'.png': 'image/png',
	'.woff2': 'font/woff2',
	'.webmanifest': 'application/manifest+json'
};
// Pour l'essai de mise à jour : une page que le serveur sert modifiée à la demande.
let ajout = '';
const serveur = createServer((req, res) => {
	const chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
	if (!chemin.startsWith('/geometrie/')) return res.writeHead(404).end();
	let f = resolve(DOCS, '.' + chemin.slice('/geometrie'.length));
	if (existsSync(f) && statSync(f).isDirectory()) f = resolve(f, 'index.html');
	if (!f.startsWith(DOCS) || !existsSync(f)) return res.writeHead(404).end();
	res.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream' });
	let corps = readFileSync(f);
	if (ajout && f.endsWith('index.html'))
		corps = Buffer.from(corps.toString('utf8').replace('</main>', `<p id="nouveau">${ajout}</p></main>`));
	res.end(corps);
}).listen(5199);

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT ?? '@playwright/test');
const BASE = 'http://localhost:5199/geometrie/';
const CAPTURES = resolve(ICI, 'captures');
mkdirSync(CAPTURES, { recursive: true });

const problemes = [];
const navigateur = await chromium.launch(
	process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const contexte = await navigateur.newContext({ viewport: { width: 390, height: 844 } });
const page = await contexte.newPage();
let horsConnexion = false;
page.on('pageerror', (e) => problemes.push(`erreur de page : ${e.message}`));
page.on('request', (r) => {
	if (!r.url().startsWith(BASE) && !r.url().startsWith('data:'))
		problemes.push(`appel hors du site : ${r.url()}`);
});
page.on('response', (r) => !horsConnexion && r.status() >= 400 && problemes.push(`${r.status()} : ${r.url()}`));
const debordement = () =>
	page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.screenshot({ path: resolve(CAPTURES, 'accueil.png'), fullPage: true });
const tuiles = await page.locator('.tuiles a').evaluateAll((as) =>
	as.map((a) => ({ href: a.getAttribute('href'), nom: a.querySelector('strong').textContent }))
);
if (!tuiles.length) problemes.push('accueil : aucune tuile');
const toutes = [''];

for (const tuile of tuiles) {
	await page.goto(BASE, { waitUntil: 'networkidle' });
	await page.locator(`.tuiles a[href="${tuile.href}"]`).click();
	await page.waitForLoadState('networkidle');
	await page.screenshot({ path: resolve(CAPTURES, tuile.href.replace('.html', '.png')), fullPage: true });
	if ((await debordement()) > 2) problemes.push(`${tuile.href} : défilement horizontal`);
	toutes.push(tuile.href);
	const animations = await page.locator('.liste a').evaluateAll((as) =>
		as.map((a) => ({
			href: a.getAttribute('href'),
			intitule: a.querySelector('.intitule').textContent.trim()
		}))
	);
	if (!animations.length) problemes.push(`${tuile.nom} : aucune animation`);
	console.log(`${tuile.nom} : ${animations.length} animations`);
	for (const a of animations) {
		await page.goto(BASE + tuile.href, { waitUntil: 'networkidle' });
		await page.locator(`.liste a[href="${a.href}"]`).click();
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1200);
		// L'intitulé de la liste est celui que la page affiche.
		const h1 = (await page.locator('h1').first().innerText()).replace(/\s+/g, ' ').trim();
		if (h1 !== a.intitule) problemes.push(`${a.href} : la liste dit « ${a.intitule} », la page « ${h1} »`);
		if ((await debordement()) > 2) problemes.push(`${a.href} : défilement horizontal`);
		if (!(await page.evaluate(() => document.fonts.check('700 20px "Bricolage Grotesque"'))))
			problemes.push(`${a.href} : la police du titre n’est pas chargée`);
		await page.screenshot({ path: resolve(CAPTURES, a.href.replace('.html', '.png')) });
		console.log(`  - ${a.intitule}`);
		toutes.push(a.href);
		// Le retour mène au domaine.
		await page.locator('a', { hasText: '← ' }).first().click();
		await page.waitForLoadState('networkidle');
		if (!page.url().endsWith('/' + tuile.href)) problemes.push(`${a.href} : le retour mène à ${page.url()}`);
	}
	await page.locator('a.retour').click();
	await page.waitForLoadState('networkidle');
	if (!page.url().endsWith('/geometrie/')) problemes.push(`${tuile.href} : « ← Accueil » mène à ${page.url()}`);
}

// Le cache est en place.
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => navigator.serviceWorker.ready);
await page.waitForTimeout(1500);
await page.reload({ waitUntil: 'networkidle' });

// Une page modifiée sur le serveur est vue à l'ouverture suivante, sans rafraîchir deux fois.
ajout = 'une nouveauté';
await page.goto(BASE, { waitUntil: 'networkidle' });
if ((await page.locator('#nouveau').count()) !== 1)
	problemes.push('mise à jour : la page modifiée n’est pas vue à la première ouverture');
else console.log('mise à jour : vue dès la première ouverture');
ajout = '';
await page.goto(BASE, { waitUntil: 'networkidle' });

// Tout rouvrir SANS connexion.
horsConnexion = true;
await contexte.setOffline(true);
for (const lien of toutes) {
	try {
		await page.goto(BASE + lien, { waitUntil: 'load', timeout: 8000 });
		if (!(await page.locator('body').innerText()).trim())
			problemes.push(`hors connexion : ${lien || 'accueil'} est vide`);
	} catch (e) {
		problemes.push(`hors connexion : ${lien || 'accueil'} ne s’ouvre pas (${e.message.split('\n')[0]})`);
	}
}
console.log(`hors connexion : ${toutes.length} pages rouvertes`);

await navigateur.close();
serveur.close();
if (problemes.length) {
	console.error('PROBLÈMES :\n- ' + [...new Set(problemes)].join('\n- '));
	process.exit(1);
}
console.log('Tout est en ordre.');

/**
 * VÉRIFIER LE SITE DANS UN VRAI NAVIGATEUR, à la largeur d'un téléphone, servi sous /geometrie/ comme sur GitHub Pages.
 *
 *   PLAYWRIGHT=<chemin de @playwright/test> CHROMIUM_PATH=<chrome.exe> node verifier.mjs
 *
 * Vérifie : aucune erreur de page, aucun appel hors du site, chaque animation s'ouvre depuis l'accueil et y revient,
 * le cache se met en place, et tout se rouvre SANS connexion.
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
const serveur = createServer((req, res) => {
	const chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
	if (!chemin.startsWith('/geometrie/')) return res.writeHead(404).end();
	let f = resolve(DOCS, '.' + chemin.slice('/geometrie'.length));
	if (existsSync(f) && statSync(f).isDirectory()) f = resolve(f, 'index.html');
	if (!f.startsWith(DOCS) || !existsSync(f)) return res.writeHead(404).end();
	res.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream' });
	res.end(readFileSync(f));
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
page.on('pageerror', (e) => problemes.push(`erreur de page : ${e.message}`));
page.on('request', (r) => {
	if (!r.url().startsWith(BASE) && !r.url().startsWith('data:'))
		problemes.push(`appel hors du site : ${r.url()}`);
});
page.on('response', (r) => r.status() >= 400 && problemes.push(`${r.status()} : ${r.url()}`));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.screenshot({ path: resolve(CAPTURES, 'accueil.png'), fullPage: true });
const liens = await page.locator('ul a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
if (liens.length !== 4) problemes.push(`accueil : ${liens.length} animations au lieu de 4`);

for (const lien of liens) {
	await page.goto(BASE, { waitUntil: 'networkidle' });
	await page.locator(`ul a[href="${lien}"]`).click();
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(1500);
	const titre = await page.title();
	const debordement = await page.evaluate(
		() => document.documentElement.scrollWidth - document.documentElement.clientWidth
	);
	if (debordement > 2) problemes.push(`${lien} : défilement horizontal de ${debordement} px`);
	const police = await page.evaluate(() => document.fonts.check('700 20px "Bricolage Grotesque"'));
	if (!police) problemes.push(`${lien} : la police du titre n’est pas chargée`);
	await page.screenshot({ path: resolve(CAPTURES, lien.replace('.html', '.png')) });
	console.log(`${lien} : « ${titre} »`);
	await page.locator('a', { hasText: '← Accueil' }).click();
	await page.waitForLoadState('networkidle');
	if (!page.url().endsWith('/geometrie/')) problemes.push(`${lien} : « ← Accueil » mène à ${page.url()}`);
}

// Le cache, puis tout rouvrir SANS connexion.
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => navigator.serviceWorker.ready);
await page.waitForTimeout(1500);
await page.reload({ waitUntil: 'networkidle' });
await contexte.setOffline(true);
for (const lien of ['', ...liens]) {
	try {
		await page.goto(BASE + lien, { waitUntil: 'load', timeout: 8000 });
		if (!(await page.locator('body').innerText()).trim())
			problemes.push(`hors connexion : ${lien || 'accueil'} est vide`);
	} catch (e) {
		problemes.push(`hors connexion : ${lien || 'accueil'} ne s’ouvre pas (${e.message.split('\n')[0]})`);
	}
}
console.log('hors connexion : accueil et', liens.length, 'animations rouverts');

await navigateur.close();
serveur.close();
if (problemes.length) {
	console.error('PROBLÈMES :\n- ' + [...new Set(problemes)].join('\n- '));
	process.exit(1);
}
console.log('Tout est en ordre.');

/**
 * LE QR CODE ET LA FEUILLE À PROJETER OU À IMPRIMER.
 *
 *   QRCODE=<chemin de qrcode> PLAYWRIGHT=<chemin de @playwright/test> CHROMIUM_PATH=<chrome.exe> node qr.mjs <dossier de sortie>
 *
 * Écrit : geometrie-qr.png (le code seul, 1200 px) et geometrie-qr-feuille.pdf (A4 : le code, l'adresse, les deux
 * marches à suivre pour installer).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const ADRESSE = 'https://fivazv.github.io/geometrie/';
const SORTIE = resolve(process.argv[2] ?? 'qr');
mkdirSync(SORTIE, { recursive: true });
const require = createRequire(import.meta.url);
const QR = require(process.env.QRCODE ?? 'qrcode');
const { chromium } = require(process.env.PLAYWRIGHT ?? '@playwright/test');

// Correction d'erreur « Q » : le code reste lisible sur une feuille un peu froissée ou un écran de biais.
const options = { errorCorrectionLevel: 'Q', margin: 4, color: { dark: '#000000', light: '#ffffff' } };
writeFileSync(resolve(SORTIE, 'geometrie-qr.png'), await QR.toBuffer(ADRESSE, { ...options, width: 1200 }));
const svg = await QR.toString(ADRESSE, { ...options, type: 'svg' });

const feuille = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
@page{size:A4;margin:18mm}
body{font-family:"Segoe UI",Arial,sans-serif;color:#16222e;margin:0;text-align:center}
h1{font-size:34pt;margin:0 0 4mm}
.sous{font-size:15pt;color:#445566;margin:0 0 8mm}
.qr{width:120mm;height:120mm;margin:0 auto}
.qr svg{width:100%;height:100%}
.adresse{font:600 15pt Consolas,monospace;margin:5mm 0 9mm}
.marches{display:flex;gap:8mm;text-align:left}
.marche{flex:1;border:1px solid #c5d0db;border-radius:4mm;padding:5mm 6mm}
.marche h2{font-size:14pt;margin:0 0 2mm;color:#1d4e89}
.marche ol{margin:0;padding-left:6mm;font-size:12pt;line-height:1.45}
.pied{font-size:11pt;color:#445566;margin-top:7mm}
</style></head><body>
<h1>Maths</h1>
<p class="sous">Les constructions au compas pas à pas, et les corrections de la remédiation.</p>
<div class="qr">${svg}</div>
<p class="adresse">fivazv.github.io/geometrie</p>
<div class="marches">
<div class="marche"><h2>Android (Chrome)</h2><ol><li>Scanne le code avec l’appareil photo.</li><li>Touche les trois points en haut à droite.</li><li>« Ajouter à l’écran d’accueil » ou « Installer l’application ».</li></ol></div>
<div class="marche"><h2>iPhone (Safari)</h2><ol><li>Scanne le code avec l’appareil photo.</li><li>Touche le bouton de partage (le carré avec une flèche).</li><li>« Sur l’écran d’accueil ».</li></ol></div>
</div>
<p class="pied">Aucun compte, aucune inscription. Une fois installée, l’application fonctionne aussi sans connexion.</p>
</body></html>`;

const navigateur = await chromium.launch(
	process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const page = await navigateur.newPage();
await page.setContent(feuille);
await page.pdf({ path: resolve(SORTIE, 'geometrie-qr-feuille.pdf'), format: 'A4', printBackground: true });
await page.setViewportSize({ width: 794, height: 1123 });
await page.screenshot({ path: resolve(SORTIE, 'apercu-feuille.png') });
await navigateur.close();
console.log('écrit dans', SORTIE);

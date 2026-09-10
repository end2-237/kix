// Planches de présentation (PNG) : écrans mobiles, écrans web.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const abs = (f) => 'file://' + path.resolve('preview', f);
const label = (t) => `<div style="font:500 13px 'Outfit',system-ui;color:#8C8F97;letter-spacing:.04em;padding-top:10px">${t}</div>`;
const shot = async (browser, html, out, width) => {
  fs.writeFileSync('preview/_p.html', `<style>${fs.readFileSync('assets/fonts.css', 'utf8')}
  body{margin:0;background:#08080A;font-family:'Outfit',system-ui}
  img{display:block;border-radius:14px}</style>${html}`);
  const p = await browser.newPage({ viewport: { width, height: 400 }, deviceScaleFactor: 2 });
  await p.goto('file://' + path.resolve('preview/_p.html'));
  await p.waitForTimeout(300);
  await p.screenshot({ path: out, fullPage: true });
  await p.close();
  console.error(`  ${out}`);
};

const b = await chromium.launch();

const phones = [
  ['Main', 'Accueil'], ['Recharge', 'Recharge de jetons'], ['Pass', 'KIX Pass · QR'], ['Scan', 'KIX Scan · gérant'],
  ['Shop', 'KIX Shop'], ['Event', 'KIX Events'], ['Rewards', 'KIX Rewards'],
];
const cell = ([f, t]) => `<figure style="margin:0">${`<img src="${abs(f + '.png')}" style="width:330px">`}${label(t)}</figure>`;
await shot(b,
  `<div style="padding:36px 40px 30px 40px">
     <div style="font:700 26px 'Space Grotesk',system-ui;color:#F4F4F2;letter-spacing:-.02em">KIX — écrans mobiles</div>
     <div style="font:400 14px 'Outfit',system-ui;color:#8C8F97;padding-top:6px">390 × 844 · mobile-first · cyber-urban dark</div>
     <div style="display:flex;flex-wrap:wrap;gap:26px;padding-top:26px">${phones.map(cell).join('')}</div>
   </div>`,
  'preview/KIX-ecrans-mobiles.png', 1520);

const webs = [['WebHome', 'Web · accueil'], ['WebScan', 'Web · espace gérant (KIX Scan)'], ['WebShop', 'Web · KIX Shop']];
await shot(b,
  `<div style="padding:36px 40px 30px 40px">
     <div style="font:700 26px 'Space Grotesk',system-ui;color:#F4F4F2;letter-spacing:-.02em">KIX — équivalent web</div>
     <div style="font:400 14px 'Outfit',system-ui;color:#8C8F97;padding-top:6px">1440 × 900 · mêmes tokens et composants qu'en mobile</div>
     <div style="display:flex;flex-direction:column;gap:24px;padding-top:26px">
       ${webs.map(([f, t]) => `<figure style="margin:0"><img src="${abs(f + '.png')}" style="width:1240px">${label(t)}</figure>`).join('')}
     </div>
   </div>`,
  'preview/KIX-ecrans-web.png', 1320);

await b.close();

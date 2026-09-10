// Rend chaque artboard compilé en PNG (aperçu local, hors canvas).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const sizes = JSON.parse(fs.readFileSync('src/canvas.json', 'utf8')).artboards
  .reduce((m, a) => ((m[a.file] = a), m), {});
const only = process.argv.slice(2);
const outDir = process.env.PREVIEW_DIR || 'preview';
const dpr = Number(process.env.PREVIEW_DPR || 2);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
for (const f of fs.readdirSync('build').filter((f) => f.endsWith('.dc.html'))) {
  if (only.length && !only.some((o) => f.startsWith(o))) continue;
  const a = sizes[f] || { w: 390, h: 844 };
  const page = await browser.newPage({ viewport: { width: a.w, height: a.h }, deviceScaleFactor: dpr });
  await page.goto('file://' + path.resolve('build', f));
  await page.addStyleTag({ content: 'x-dc{display:block} helmet{display:none}' });
  await page.waitForTimeout(400);
  const out = path.join(outDir, f.replace('.dc.html', '.png'));
  await page.screenshot({ path: out });
  await page.close();
  console.error(`  ${out}`);
}
await browser.close();

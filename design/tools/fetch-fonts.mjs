// Télécharge les faces latines (woff2) utilisées par KIX et les inline en data-URI.
// Sortie : assets/fonts.css — injecté dans chaque artboard par tools/build.mjs.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const URL = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Outfit:wght@400;500;600&display=swap';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const css = execFileSync('curl', ['-sS', '-A', UA, URL], { encoding: 'utf8' });
const blocks = css.split('/*').filter((b) => b.startsWith(' latin */'));
const out = [];
for (const block of blocks) {
  const family = /font-family: '([^']+)'/.exec(block)[1];
  const weight = /font-weight: (\d+)/.exec(block)[1];
  const url = /src: url\((https:[^)]+)\)/.exec(block)[1];
  const buf = execFileSync('curl', ['-sS', '-A', UA, url], { maxBuffer: 1 << 24 });
  out.push(
    `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;` +
      `src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2');}`
  );
  console.error(`  ${family} ${weight} — ${(buf.length / 1024).toFixed(1)} KB`);
}
fs.writeFileSync('assets/fonts.css', out.join('\n') + '\n');
console.error(`assets/fonts.css : ${out.length} faces, ${(fs.statSync('assets/fonts.css').size / 1024).toFixed(0)} KB`);

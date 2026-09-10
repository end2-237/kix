// Compile les artboards : src/*.dc.html -> build/*.dc.html
//  <!--KIX-BASE-->        : polices inline + reset commun
//  <!--QR:taille:graine--> : QR décoratif (SVG) déterministe
import fs from 'node:fs';
import path from 'node:path';

const fonts = fs.readFileSync('assets/fonts.css', 'utf8').trim();

const base = `<style>
${fonts}
*{box-sizing:border-box}
body{margin:0;background:#0B0B0D;color:#F4F4F2;font-family:'Outfit',"Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
h1,h2,h3,.display{font-family:'Space Grotesk',"Helvetica Neue",Helvetica,Arial,sans-serif;font-weight:700;margin:0;letter-spacing:-0.02em}
p{margin:0}
a{color:#3DF08A;text-decoration:none}
a:hover{color:#7CF7B4}
::-webkit-scrollbar{width:0;height:0}
</style>`;

// --- QR décoratif : rien d'encodé, juste la texture visuelle d'un QR ---
function qr(size, seed) {
  const N = 29, q = 2, cell = size / (N + q * 2);
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const finder = (x, y) =>
    `<rect x="${(x + q) * cell}" y="${(y + q) * cell}" width="${cell * 7}" height="${cell * 7}" rx="${cell * 1.6}" fill="none" stroke="#0B0B0D" stroke-width="${cell}"/>` +
    `<rect x="${(x + q + 2) * cell}" y="${(y + q + 2) * cell}" width="${cell * 3}" height="${cell * 3}" rx="${cell * 0.7}" fill="#0B0B0D"/>`;
  const inFinder = (c, r) =>
    (c < 8 && r < 8) || (c > N - 9 && r < 8) || (c < 8 && r > N - 9);
  let m = '';
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (!inFinder(c, r) && rnd() > 0.52)
        m += `<rect x="${(c + q) * cell}" y="${(r + q) * cell}" width="${cell}" height="${cell}" rx="${cell * 0.28}" fill="#0B0B0D"/>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="QR code du jeton">` +
    `<rect width="${size}" height="${size}" rx="${cell * 3}" fill="#FFFFFF"/>${m}` +
    finder(0, 0) + finder(N - 7, 0) + finder(0, N - 7) + `</svg>`;
}

fs.mkdirSync('build', { recursive: true });
for (const f of fs.readdirSync('build')) fs.unlinkSync(path.join('build', f));

for (const img of fs.readdirSync('assets/img'))
  fs.copyFileSync(path.join('assets/img', img), path.join('build', img));

let n = 0;
for (const f of fs.readdirSync('src')) {
  const src = fs.readFileSync(path.join('src', f), 'utf8');
  if (!f.endsWith('.dc.html')) { fs.writeFileSync(path.join('build', f), src); continue; }
  const out = src
    .replace('<!--KIX-BASE-->', base)
    .replace(/<!--QR:(\d+):([a-zA-Z0-9_-]+)-->/g, (_, size, seed) => qr(Number(size), seed));
  fs.writeFileSync(path.join('build', f), out);
  n++;
  console.error(`  ${f} — ${(out.length / 1024).toFixed(0)} KB`);
}
console.error(`build/ : ${n} artboards`);

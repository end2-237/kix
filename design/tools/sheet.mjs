// Assemble des aperçus en une planche unique (revue rapide).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const files = process.argv.slice(2);
const scale = Number(process.env.SHEET_SCALE || 1);
const cells = files.map((f) => `<figure style="margin:0"><img src="${path.resolve('preview', f + '.png')}" style="display:block;width:${390 * scale}px"><figcaption style="font:12px system-ui;color:#888;padding:4px 0">${f}</figcaption></figure>`).join('');
fs.writeFileSync('preview/_sheet.html', `<body style="background:#1a1a1c;margin:0"><div style="display:flex;gap:16px;padding:16px;align-items:flex-start">${cells}</div></body>`);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 200, height: 200 } });
await p.goto('file://' + path.resolve('preview/_sheet.html'));
await p.waitForTimeout(300);
await p.screenshot({ path: 'preview/_sheet.png', fullPage: true });
await b.close();

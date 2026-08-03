import { homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(join(resolve(dirname(fileURLToPath(import.meta.url))), 'courtyard.html')).href;
const b = await chromium.launch();
for (const seed of [7,42,1234,5]){
  const p = await b.newPage();
  await p.goto(`${PAGE}?seed=${seed}&t=0&pause`); await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    window.__reseed();
    const seen = new Set(); let kneels = 0, spawns = 0, prevK = new Set();
    for (let s = 0; s < 400; s++){
      window.__warp(2.5);
      const cur = new Set();
      for (const a of agents) if (a.kind === 'allot'){ cur.add(a); if (!prevK.has(a)) spawns++; if (a.state==='kneel') seen.add(a); }
      prevK = cur;
    }
    return { spawns, kneels: seen.size, days: window.__census().clock.day };
  });
  console.log(`seed ${String(seed).padStart(4)}  allot spawns ${String(r.spawns).padStart(3)}  reached-kneel ${String(r.kneels).padStart(3)}  over ${r.days} days  = ${(r.spawns/r.days).toFixed(2)}/day spawned, ${(r.kneels/r.days).toFixed(2)}/day knelt`);
  await p.close();
}
await b.close();

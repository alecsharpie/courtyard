#!/usr/bin/env node
/* skip-shots.mjs — the brief's success criterion, timed and photographed:
 * "A viewer thirty seconds into the page can see the courtyard in winter and come back."
 * Clicks the season the way a person would and stopwatches it in REAL seconds. */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(resolve(HERE, '../../../..', 'courtyard.html')).href;
const CLIP = { x: 180, y: 300, width: 700, height: 560 };
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
await p.goto(PAGE + '?seed=42');
await p.waitForFunction(() => !!window.__census && window.__census().life.people > 2);
const t0 = Date.now();
const seen = [];
for (let k = 0; k < 4; k++) {
  await p.evaluate(() => new Promise(res => {
    const el = document.getElementById('season'); el.click();
    const w = () => el.disabled ? requestAnimationFrame(w) : res(); requestAnimationFrame(w);
  }));
  const c = await p.evaluate(() => ({ ...window.__census().clock,
    label: document.getElementById('season').textContent, blooms: window.__census().planting.blooming }));
  const secs = (Date.now() - t0) / 1000;
  seen.push({ k: k + 1, secs: +secs.toFixed(1), label: c.label, phase: +c.season.toFixed(3),
              hour: +c.hour.toFixed(2), blooms: c.blooms });
  await p.screenshot({ path: join(resolve(HERE, '../../../..'), 'shots', `skip-${k + 1}-${c.label.replace(/ /g, '-').toLowerCase()}.png`), clip: CLIP });
  await p.screenshot({ path: join(resolve(HERE, '../../../..'), 'shots', `skip-${k + 1}-wide.png`) });
}
console.table(seen);
const winter = seen.find(s => /winter/i.test(s.label));
console.log(winter ? `\nWinter reached ${winter.secs}s after the first click (${winter.k} clicks), ${winter.blooms} blooms`
                   : '\nNO WINTER REACHED');
console.log(`Full year, back to ${seen[3].label} at hour ${seen[3].hour}, in ${seen[3].secs}s of clicking.`);
await b.close();

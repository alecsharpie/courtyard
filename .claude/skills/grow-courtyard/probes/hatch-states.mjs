/* The hatch is the one piece up here with TWO states and it is drawn live, not into the
 * ground cache — so it is the piece a single screenshot is least able to vouch for.
 * Finds a bay, prints where its hatch lands on screen, and pins one frame with the lid
 * SHUT (nobody up) and one with it OPEN (a tenant on the leads). */
import path from 'path'; import fs from 'fs';
import { homedir } from 'node:os'; import { pathToFileURL } from 'node:url';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = path.resolve(new URL('.', import.meta.url).pathname, '../../../..');
const br = await chromium.launch();
const p = await br.newPage();
await p.setViewportSize({ width: 1600, height: 950 });
await p.goto('file://' + path.join(REPO, 'courtyard.html') + '?seed=42&t=0&pause');
await p.waitForTimeout(400);
for (const want of ['shut', 'open']){
  const r = await p.evaluate((want) => {
    window.__reseed();
    for (let i = 0; i < 20000; i++){
      window.__warp(0.25);
      const t = agents.find(a => a.tenant && a.state !== 'walk');
      const ok = want === 'open' ? !!t : (!t && daylight > 0.5);
      if (ok){
        drawScene(simT, 1 / 30);
        const h = (want === 'open' ? t.bay : LEADS_BAYS[2]);
        const hh = HATCHES.find(q => q.bay === h);
        const [sx, sy] = project(hh.x, hh.y, roofWalkZ(hh.x, hh.y));
        return { sx:Math.round(sx), sy:Math.round(sy), busy:h.busy, hour:+hour.toFixed(2),
                 name:leadsName(Math.floor(hh.x), Math.floor(hh.y)), dpr:window.devicePixelRatio,
                 url:document.querySelector('canvas').toDataURL() };
      }
    }
    return null;
  }, want);
  if (!r){ console.log(want + ': not found'); continue; }
  const { url, ...meta } = r; console.log(want, JSON.stringify(meta));
  fs.writeFileSync(path.join(REPO, 'shots', `hatch-${want}.png`), Buffer.from(url.split(',')[1], 'base64'));
}
await br.close();

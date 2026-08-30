#!/usr/bin/env node
/* probe: the frozen fountain. Per day of a year: fountainIce, fountainJet, and what the
 * plume actually DRAWS (jet strokes + droplet arcs, counted by wrapping ctx). Plus a
 * pixel hash of the plaza crop at midsummer noon and midwinter noon, HEAD vs here. */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const FILES = { head: '/tmp/courtyard-head.html', here: join(REPO, 'courtyard.html') };
const browser = await chromium.launch();
const seed = process.argv[2] || 7;
for (const [label, file] of Object.entries(FILES)){
  const page = await browser.newPage({ viewport:{ width:1200, height:720 } });
  const errs=[]; page.on('pageerror', e=>errs.push(String(e)));
  await page.goto(`${pathToFileURL(file).href}?pause&seed=${seed}&t=0`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const out = await page.evaluate(() => {
    const has = n => { try { return typeof eval(n) === 'function'; } catch { return false; } };
    const rows = [];
    const save = [seasonPhase, warmth];
    for (let d = 0; d < 28; d++){
      seasonPhase = (d / 28) % 1; warmth = 0.5 - 0.5 * Math.cos(2 * Math.PI * seasonPhase);
      // count what the plume draws at one instant (t = 3.1), wind held at 0 by reading windF
      let strokes = 0, arcs = 0;
      const S = ctx.stroke, A = ctx.arc;
      ctx.stroke = function(){ strokes++; return S.apply(this, arguments); };
      ctx.arc = function(){ arcs++; return A.apply(this, arguments); };
      drawFountain(null, 3.1);
      ctx.stroke = S; ctx.arc = A;
      rows.push({ d, ice: +fountainIce().toFixed(3), jet: has('fountainJet') ? +fountainJet().toFixed(3) : 1,
        play: +fountainPlay().toFixed(3), jets: strokes - 3, drops: arcs, wind: +windF().toFixed(2) });
    }
    [seasonPhase, warmth] = save;
    return rows;
  });
  // crops at midsummer / midwinter noon: pixel hash of the plaza
  const crops = {};
  for (const [name, day] of [['summer', 6], ['winter', 19]]){
    const h = await page.evaluate(async t => {
      window.__reseed(); window.__setTime(0); window.__warp(t);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const a = project(FOUNTAIN.x - 7, FOUNTAIN.y - 8, 0), b = project(FOUNTAIN.x + 7, FOUNTAIN.y + 9, 0);
      // gcv, not cv: the live plume sits in this crop and made the summer hash noisy (#77, c116); the cache is what the skin lives on
      const d = gcv.getContext("2d").getImageData((a[0] + (typeof gview === "undefined" ? 0 : gview.pad)) * DPR, a[1] * DPR, (b[0]-a[0])*DPR, (b[1]-a[1])*DPR).data;
      let s = 0; for (let i = 0; i < d.length; i += 7) s = (s * 31 + d[i]) >>> 0;
      return { hash: s, ice: +fountainIce().toFixed(3), hour: +__census().clock.hour.toFixed(2), wind: +windF().toFixed(2) };
    }, day * 55 + 13.75);
    crops[name] = h;
  }
  console.log(label, 'errs', errs, 'crops', JSON.stringify(crops));
  console.log(' day  ice   jet   play  jets drops wind');
  for (const r of out) if (label === 'here' || r.d % 4 === 0) console.log(' ', String(r.d).padStart(3), r.ice.toFixed(3), r.jet.toFixed(3), r.play.toFixed(3), String(r.jets).padStart(4), String(r.drops).padStart(5), r.wind);
  await page.close();
}
await browser.close();

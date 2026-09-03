/* The brief's success line, as a picture: a figure standing on our own roof at the
 * bottom of the wide shot. Warps until a tenant is actually up on the leads doing the
 * named act, then pins the instant and reads the canvas in the SAME evaluate as the
 * draw — a ?pause'd page still runs rAF, so a screenshot taken after the evaluate is
 * a different frame from the one that was measured.
 * usage: node probe-leads-shot.mjs <act> [seed]   act = sun|peg|take|lean */
import path from 'path'; import fs from 'fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = path.resolve(new URL('.', import.meta.url).pathname, '../../../..');
const WANT = process.argv[2] || 'sun', SEED = +(process.argv[3] || 42);
const br = await chromium.launch();
const p = await br.newPage();
await p.setViewportSize({ width: 1600, height: 950 });
await p.goto('file://' + path.join(REPO, 'courtyard.html') + `?seed=${SEED}&t=0&pause`);
await p.waitForTimeout(400);
const r = await p.evaluate((WANT) => {
  window.__reseed();
  for (let i = 0; i < 20000; i++){
    window.__warp(0.25);
    const t = agents.find(a => a.tenant && a.act === WANT && a.state !== 'walk');
    if (t){
      drawScene(simT, 1 / 30);        // pin the instant that was measured
      return { hit:1, day:__census().clock.day, hour:+hour.toFixed(2), act:t.act,
               x:+t.x.toFixed(2), y:+t.y.toFixed(2), z:+t.z.toFixed(2),
               scale:+nearScale(t.y).toFixed(2), depth:+(t.y - t.z * LIFT).toFixed(2),
               name:personName(t), url:document.querySelector('canvas').toDataURL() };
    }
  }
  return { hit:0 };
}, WANT);
if (!r.hit){ console.log(`no tenant ever did "${WANT}" on seed ${SEED}`); await br.close(); process.exit(1); }
const { url, ...meta } = r;
console.log(JSON.stringify(meta));
fs.writeFileSync(path.join(REPO, 'shots', `leads-${WANT}.png`), Buffer.from(url.split(',')[1], 'base64'));
console.log(`-> shots/leads-${WANT}.png`);
await br.close();

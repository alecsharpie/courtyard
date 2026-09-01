/* A close look at ONE bird and the cat, at the shipping framing, upscaled by the browser
 * so my eye sees what a viewer's eye sees at 3x rather than a 5 px smudge.
 * usage: node probe-roof-zoom.mjs <simT> <tag> [seed] */
import path from 'path'; import { homedir } from 'node:os'; import { pathToFileURL } from 'node:url';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = path.resolve(new URL('.', import.meta.url).pathname, '../../../..');
const ART = path.join(REPO, 'courtyard.html');
const T = +(process.argv[2] || 340), TAG = process.argv[3] || 'day', SEED = +(process.argv[4] || 42);
const br = await chromium.launch();
const p = await br.newPage({ deviceScaleFactor: 4 });
await p.setViewportSize({ width: 1600, height: 950 });
await p.goto('file://' + ART + `?seed=${SEED}&t=0&pause`); await p.waitForTimeout(350);
const clip = await p.evaluate((T) => {
  window.__reseed(); window.__warp(T); drawScene(simT, 1/30);
  const r = cv.getBoundingClientRect(), k = r.width / (cv.width / DPR);
  const subs = [];
  if (catA && catA.y > 78) subs.push(project(catA.x, catA.y, catA.z || 0));   // the cat first if it is up
  for (const b of birds) if (b.roof && b.state === 'hop') subs.push(project(b.x, b.y, b.z));
  if (!subs.length) return null;
  const cx = subs[0][0], cy = subs[0][1];
  return { x: r.left + (cx - 60) * k, y: r.top + (cy - 22) * k, width: 120 * k, height: 44 * k,
           n: subs.length, hour: +hour.toFixed(2) };
}, T);
if (!clip){ console.log('nothing on the roof at that instant'); }
else { await p.screenshot({ path: `shots/roofzoom-${TAG}.png`, clip });
       console.log(`t=${T} hour ${clip.hour}: ${clip.n} on the roof -> shots/roofzoom-${TAG}.png`); }
await br.close();

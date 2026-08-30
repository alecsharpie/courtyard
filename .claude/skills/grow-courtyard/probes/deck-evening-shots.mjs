// #85: a stayer at the deck rail at sunDown + 1 h — pinned by warping inside ONE evaluate and
// calling drawScene() ourselves (never an rAF frame); 3x for legibility (its own world — a still only)
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = new URL('../../../../courtyard.html', import.meta.url).pathname;
const br = await chromium.launch();
const want = process.argv[2] ? [process.argv[2].split(',').map(Number)] : [[3, 4], [1, 6]];
for (const [seed, d] of want){
  const p = await br.newPage({ viewport:{width:1600,height:950}, deviceScaleFactor:3 });
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const info = await p.evaluate((d) => {
    window.__reseed(); window.__warp(d * 55);
    let n = 0; while (n++ < 4000 && !(day === d && hourEve() >= sunDown + 1)) window.__warp(0.25);
    drawScene(simT, 1/30);
    const st = agents.filter(a => a.stay && a.state === 'stand');
    const r = document.querySelector('canvas').getBoundingClientRect();
    const a = project(RIVER_X0 - 3, 25, 0), c = project(RIVER_X1 + 6, 37, 0);
    return { day, hour:+hour.toFixed(2), rel:+(hourEve() - sunDown).toFixed(2), stayers: st.map(a => [+a.x.toFixed(1), +a.y.toFixed(1), personName(a)]), boat: boat ? [+boat.x.toFixed(1), +boat.y.toFixed(1)] : null,
             clip:{x:r.x + a[0] - 10, y:r.y + a[1] - 70, w:c[0] - a[0] + 20, h:c[1] - a[1] + 90} };
  }, d);
  const f = `shots/b83-deck-evening-s${seed}d${d}-3x.png`;
  await p.screenshot({path:f, clip:{x:info.clip.x, y:info.clip.y, width:info.clip.w, height:info.clip.h}});
  console.log('seed', seed, 'day', d, JSON.stringify(info), '->', f);
  await p.close();
}
await br.close();

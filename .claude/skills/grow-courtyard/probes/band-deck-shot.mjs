// #89: a listener from the concert standing on the deck's east post — warp until one is standing, draw, crop
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = new URL('../../../../courtyard.html', import.meta.url).pathname;
const br = await chromium.launch();
const seed = +(process.argv[2] || 1);
const p = await br.newPage({ viewport:{width:1600,height:950} });
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil:'load' });
await p.waitForFunction(() => typeof window.__warp === 'function');
const info = await p.evaluate(() => {
  window.__reseed(); window.__warp(4 * 55);
  let n = 0, chose = 0, stood = 0;
  while (n++ < 4 * 55 / 0.25){ window.__warp(0.25);
    for (const a of agents){ if (a.fromBand && !a.__c){ a.__c = 1; chose++; } }
    if (agents.some(a => a.fromBand && a.state === 'stand' && a.stopped)){ stood = 1; break; } }
  drawScene(simT, 1/30);
  const st = agents.filter(a => a.fromBand);
  const r = document.querySelector('canvas').getBoundingClientRect();
  const a = project(RIVER_X0 - 3, 25, 0), c = project(FAR_WALK + 5, 48, 0);
  return { stood, chose, day, hour:+hour.toFixed(2), rel:+(hourEve() - sunDown).toFixed(2), who: st.map(a => [+a.x.toFixed(1), +a.y.toFixed(1), a.state, personName(a)]),
           clip:{x:r.x + a[0] - 10, y:r.y + a[1] - 70, w:c[0] - a[0] + 20, h:c[1] - a[1] + 90} };
});
const f = `shots/b87-band-deck-s${seed}.png`;
await p.screenshot({path:f, clip:{x:info.clip.x, y:info.clip.y, width:info.clip.w, height:info.clip.h}});
console.log(JSON.stringify(info), '->', f);
await br.close();

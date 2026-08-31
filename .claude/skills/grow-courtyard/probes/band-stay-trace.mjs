// #89: follow every concert stayer (a.fromBand) from the choice to its end — state changes, greet/listen delays, whether it stood on its post. Found the 2.7 h greet between two listeners on the same towpath.
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = new URL('../../../../courtyard.html', import.meta.url).pathname;
const br = await chromium.launch();
for (const seed of [1,2,3,4,5,6,7,8,9,10]){
  const page = await br.newPage({ viewport:{width:1200,height:720} });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(() => {
    window.__reseed(); window.__warp(4 * 55);
    const out = [];
    for (let i = 0; i < 4 * 55 / 0.25; i++){ window.__warp(0.25);
      for (const a of agents){
        if (a.fromBand && !a.__t){ a.__t = {day, rel0:+(hourEve()-sunDown).toFixed(2), post:[a.stop.x, a.stop.y], ev:[]}; out.push(a.__t); }
        if (a.__t && !a.__t.end){
          const t = a.__t; const st = a.state + (a.greet > 0 ? '/greet' : '') + (a.listen > 0 ? '/listen' : '');
          if (t.last !== st){ t.ev.push(`${st}@${(hourEve()-sunDown).toFixed(2)}(${a.x.toFixed(1)},${a.y.toFixed(1)})`); t.last = st; }
          if (a.stopped && a.state !== 'walk'){ t.end = 'stopped'; t.at = [+a.x.toFixed(2), +a.y.toFixed(2)]; }
          if (a.done){ t.end = 'done'; t.at = [+a.x.toFixed(2), +a.y.toFixed(2)]; }
        }
      }
      for (const t of out) if (!t.end && !agents.some(a => a.__t === t)) t.end = 'gone';
    }
    return out.map(t => ({...t, wx: undefined}));
  });
  for (const t of r) if (t.end !== 'stopped' || Math.hypot(t.at[0]-t.post[0], t.at[1]-t.post[1]) > 0.7) console.log(`seed ${seed} day ${t.day} chose ${t.rel0} post ${t.post} end ${t.end} at ${t.at} :: ${t.ev.join(' ')}`);
  console.log(`seed ${seed}: ${r.length} stayers, ${r.filter(t => t.end === 'stopped' && Math.hypot(t.at[0]-t.post[0], t.at[1]-t.post[1]) <= 0.7).length} stood on the post`);
  await page.close();
}
await br.close();

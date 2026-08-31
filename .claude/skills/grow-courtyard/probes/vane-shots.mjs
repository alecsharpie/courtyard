import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = resolve('courtyard.html');
const b = await chromium.launch();
for (const [name, w, s] of [['calm', 0, 1], ['west', 1, 1], ['east', 1, -1], ['north', 0.5, 1]]){
  const q = await b.newPage({ viewport:{width:1600, height:950}, deviceScaleFactor: 3 });
  q.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await q.goto(pathToFileURL(HERE).href + '?pause&seed=7&t=0'); await q.waitForFunction(() => window.__warp);
  const box = await q.evaluate(async ([w, s]) => { window.__reseed(); window.__warp(2 * 55 + 6); windF = () => w; windSign = s; vaneWob = () => 0;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const r = document.querySelector('canvas').getBoundingClientRect();
    return VANES.map(v => { const c = project(v.x, v.y, v.z); return { x: r.left + c[0] - 30, y: r.top + c[1] - 22, width: 60, height: 44, name: vaneName(v) }; }); }, [w, s]);
  await q.screenshot({ path: `shots/b89-vane-clock-${name}.png`, clip: box[0] });
  await q.screenshot({ path: `shots/b89-vane-church-${name}.png`, clip: box[1] });
  console.log(name, '|', box[0].name, '|', box[1].name);
  await q.close();
}
await b.close();

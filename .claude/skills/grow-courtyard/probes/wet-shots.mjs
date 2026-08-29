import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
async function shot(file, T, name, force){
  const p = await b.newPage({ viewport:{width:1600, height:950} });
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=7&t=0&pause'); await p.waitForFunction(() => window.__warp);
  await p.evaluate(([T, force]) => { window.__reseed(); window.__warp(T - 1/30); window.__warp(1/30); if (force != null && typeof wetness === 'number'){ wetness = force; groundDirty = true; } drawScene(simT, 1/30); }, [T, force]);
  await p.screenshot({ path: 'shots/' + name + '.png', clip: {x: 700, y: 250, width: 900, height: 600} });
  await p.close();
}
const H = 55 / 24, END = 496.87;
await shot('/tmp/head.html', END + 1 * H, 'wet-day-head');
await shot('courtyard.html', END + 1 * H, 'wet-day-tree');
const NIGHT = 330 + 55 * 17 / 24;
await shot('courtyard.html', NIGHT, 'wet-night-dry', 0);
await shot('courtyard.html', NIGHT, 'wet-night-wet', 1);
await b.close();

import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(resolve(process.cwd(), process.argv[2] || 'courtyard.html')).href;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport:{width:1600,height:950}, deviceScaleFactor:1 });
const p = await ctx.newPage();
await p.goto(`${PAGE}?seed=42&t=0&pause`, { waitUntil:'load' });
await p.waitForFunction(() => typeof window.__warp === 'function');
const r = await p.evaluate(() => {
  const XS = [0, 10, 20, 24, 26, 30, 40, 60, 80, 88, 90, 95, 105, 111, 130, 140];
  const out = { rows: [], walls: [], solid: [] };
  for (const y of [80,81,82,83,84,85,86,87]){
    out.rows.push({ y, z: XS.map(x => +nearZ(x, y).toFixed(2)),
                       d: XS.map(x => +(y + 0.5 - nearZ(x, y)*LIFT).toFixed(2)) });
  }
  out.xs = XS;
  out.walls = [partyWalls(XLO, QUAY_X0), partyWalls(RIVER_X1, XHI)];
  out.solid = [86, 87].map(y => XS.map(x => solidC(x, y) ? 1 : 0));
  out.NEAR_HOUSE = NEAR_HOUSE; out.XLO = XLO; out.XHI = XHI; out.QUAY_X0 = QUAY_X0; out.RIVER_X1 = RIVER_X1;
  out.stacks = out.walls[0].filter(bx => nearStack(bx));
  return out;
});
console.log('xs        ', r.xs.join('\t'));
for (const q of r.rows) console.log('z  row '+q.y, q.z.join('\t'));
for (const q of r.rows) console.log('d  row '+q.y, q.d.join('\t'));
console.log('solid 86  ', r.solid[0].join('\t'));
console.log('solid 87  ', r.solid[1].join('\t'));
console.log('walls W', JSON.stringify(r.walls[0]));
console.log('walls E', JSON.stringify(r.walls[1]));
console.log('stacks ', JSON.stringify(r.stacks), 'NEAR_HOUSE', r.NEAR_HOUSE);
await browser.close();

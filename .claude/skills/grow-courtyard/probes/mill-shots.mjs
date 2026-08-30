import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1600,height:950}, deviceScaleFactor: 2});
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
// [tag, simT]: day 4 noon, day 4 03:00, midwinter noon (season phase 0 = day 13 of 26 from start 0.25 → 0.75 of a cycle later)
for (const [tag, t] of [['noon', 175], ['night', 55 * 3 + 47], ['winter', 1055]]){
  await p.goto(pathToFileURL(resolve('courtyard.html')).href + '?pause&seed=42');
  await p.waitForFunction(() => window.__warp);
  const info = await p.evaluate((t) => {
    window.__reseed(); window.__setTime(t); window.__warp(2);
    const a0 = millAng; window.__warp(1); const a1 = millAng;
    const r = document.querySelector('canvas').getBoundingClientRect();
    const a = project(RIVER_X1 - 5, 14, 0), c = project(MILL.x1 + 4, 30, 0);
    return {simT: simT.toFixed(1), hour: hour.toFixed(2), season: season().toFixed(3), run: riverRun().toFixed(3), skin: fountainSkin().toFixed(3),
            spin: millSpin().toFixed(3), dAng: (a1 - a0).toFixed(3), nightF: nightF.toFixed(2), lit: windowLit(MILL_WIN[0], MILL_WIN[1]),
            wallCells: [...Array(WH).keys()].reduce((n, y) => n + [...Array(GW).keys()].filter(x => millAt(x, y) && grid[y*GW+x] === WALL).length, 0),
            faces: FACES.filter(f => f.sa === MILL_WIN[0] && f.sb === MILL_WIN[1]).length,
            name: nameAt(131, 21), wheelName: millWheelName(),
            clip:{x:r.x + a[0] - 10, y:r.y + a[1] - 70, w:c[0] - a[0] + 20, h:c[1] - a[1] + 80}};
  }, t);
  await p.waitForTimeout(250);
  await p.screenshot({path:`shots/b76-mill-${tag}.png`, clip:{x:info.clip.x, y:info.clip.y, width:info.clip.w, height:info.clip.h}});
  delete info.clip; console.log(tag, JSON.stringify(info));
}
await b.close();

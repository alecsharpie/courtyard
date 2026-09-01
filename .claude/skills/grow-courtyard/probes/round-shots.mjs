// 3x crops of the lane's west end on seed 42, warped from the DEFAULT start: the round at the doors (sunUp+1.35, +2.2), the lapse landing (+0.5), marks gone (09:45)
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = resolve(process.argv[2] || 'courtyard.html'); const tag = process.argv[3] || 'b97';
const b = await chromium.launch();
for (const [name, day, rel, abs] of [['landing', 5, 0.5], ['door4', 5, 1.35], ['door8', 5, 3.1], ['marks', 5, null, 8.0], ['gone', 5, null, 9.75], ['winter-door8', 18, 2.9]]){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 3 });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + '?pause&seed=42');
  await p.waitForFunction(() => window.__warp);
  const info = await p.evaluate(({ day, rel, abs }) => {
    window.__reseed(); window.__setTime(day * DAY_LEN + DAY_LEN * (20 - 6) / 24);
    const s = sunAt(simT + DAY_LEN * 0.4); const tgt = abs !== undefined && abs !== null ? abs : s.up + rel;
    window.__warp((((tgt - hour) % 24) + 24) % 24 / 24 * DAY_LEN);
    drawScene(simT, 1 / 30);
    const e = agents.find(a => a.round);
    const a = project(-1, 63, 0), c = project(13, 67.5, 0);
    const r = document.getElementById('cv').getBoundingClientRect();
    const tl = project(-1, 62.5, 2.5);
    return { hour: +hour.toFixed(2), sunUp: +sunUp.toFixed(2), round: e ? { x: +e.x.toFixed(2), y: +e.y.toFixed(2), st: e.state, left: e.left } : null,
      marks: roundMarks.filter(m => simT < m.until).map(m => m.x), clip: { x: r.left + tl[0], y: r.top + tl[1], width: c[0] - tl[0], height: c[1] - tl[1] }, nightF: +nightF.toFixed(2) };
  }, { day, rel, abs });
  const clip = info.clip; clip.x = Math.max(0, clip.x); clip.y = Math.max(0, clip.y);
  await p.screenshot({ path: `shots/${tag}-round-${name}.png`, clip });
  console.log(name, JSON.stringify({ hour: info.hour, sunUp: info.sunUp, round: info.round, marks: info.marks, nightF: info.nightF }));
  await p.close();
}
await b.close();

/* probe: 3 clipped crops of the bonfire (19h flames, 21h, 23:30 embers) on seed 42 day 14 with
 * luminance samples at the fire, 2 cells off, 8 cells off and under a lane lamp. VW=1200 VH=720
 * DSF=1 matches bonfire-year.mjs's world; the 1600×950 3× page is a DIFFERENT seeded world. */import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(resolve(REPO, process.env.FILE || 'courtyard.html')).href;
const LABEL = process.argv[2] || 'b91';
const browser = await chromium.launch();
for (const [name, t] of [['dusk19', 799.8], ['night21', 804.375], ['embers23', 770 + 17.5 * 55 / 24]]) {
  const ctx = await browser.newContext({ viewport: { width: +(process.env.VW || 1600), height: +(process.env.VH || 950) }, deviceScaleFactor: +(process.env.DSF || 3) });
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('PAGE ERROR', String(e)));
  await p.goto(`${PAGE}?seed=42&t=0&pause`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(secs => {
    window.__reseed(); window.__warp(secs);
    drawScene(simT, 1 / 30);
    const cv = document.getElementById('cv'), c = cv.getContext('2d');
    const dpr = cv.width / cv.getBoundingClientRect().width;
    const px = (gx, gy) => { const [sx, sy] = project(gx, gy, 0); const d = c.getImageData(Math.round(sx * dpr), Math.round(sy * dpr), 1, 1).data; return [d[0], d[1], d[2]]; };
    const lum = v => +(0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]).toFixed(0);
    const fire = px(BONFIRE.x, BONFIRE.y + 0.9), near = px(BONFIRE.x + 2, BONFIRE.y + 1.5), far = px(BONFIRE.x, BONFIRE.y + 8), lamp = px(LANE_LAMPS ? LANE_LAMPS[0][0] : 20, LANE_LAMPS ? LANE_LAMPS[0][1] + 1 : 62);
    const [sx, sy] = project(BONFIRE.x, BONFIRE.y, 0), rc = cv.getBoundingClientRect();
    return { off: [rc.left, rc.top], hour: +hour.toFixed(2), nightF: +nightF.toFixed(2), fire: +bon.fire.toFixed(2), ember: +bon.ember.toFixed(2), on: bon.on, wind: +windF().toFixed(2), dir: windDir(), cloud: +cloudCover().toFixed(2), fireLum: lum(fire), near, nearLum: lum(near), farLum: lum(far), lampLum: lum(lamp), screen: [Math.round(sx), Math.round(sy)], holder: agents.filter(a => a.tend).map(a => a.state) };
  }, t);
  console.log(name, JSON.stringify(r));
  const sx = r.screen[0] + r.off[0], sy = r.screen[1] + r.off[1];
  await p.screenshot({ path: `${REPO}shots/${LABEL}-bonfire-${name}.png`, clip: { x: sx - 110, y: sy - 150, width: 220, height: 230 } });
  await ctx.close();
}
await browser.close();

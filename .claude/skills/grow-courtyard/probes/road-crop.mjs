/* A magnified crop of the carriageway, A above B, so the bond can be READ rather than
 * inferred from a number. Crops the lane's rows and the cross street's at 3x.
 *   node .claude/skills/grow-courtyard/probes/road-crop.mjs [A] [B] */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const files = [process.argv[2] || '/tmp/head.html', process.argv[3] || 'courtyard.html'];
const T = +(process.env.T || 55 * 3 + (10.4 - 6) * (55 / 24));
const W = +(process.env.VW || 1600), H = +(process.env.VH || 950);
const ZOOM = +(process.env.Z || 3);
const browser = await chromium.launch();
const tag = process.env.TAG || '';
for (let n = 0; n < files.length; n++){
  const ctx = await browser.newContext({ viewport:{ width:W, height:H }, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  await p.goto(pathToFileURL(resolve(process.cwd(), files[n])).href + `?seed=42&t=${T}&pause&lx0=${process.env.LX0||10}&lx1=${process.env.LX1||32}`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  for (const [name, box] of [['lane', 'lane'], ['xs', 'xs']]){
    const url = await p.evaluate(({ box, ZOOM }) => {
      __reseed(); drawScene(simT, 1/30);
      const LX0 = +(new URLSearchParams(location.search).get('lx0') || 10), LX1 = +(new URLSearchParams(location.search).get('lx1') || 32);
      const x0 = box === 'lane' ? Math.round(project(LX0, LN_ROAD0 - 1.5, 0)[0]) : Math.round(project(XS_W0 - 1, 40, 0)[0]);
      const x1 = box === 'lane' ? Math.round(project(LX1, LN_ROAD0 - 1.5, 0)[0]) : Math.round(project(XS_E1 + 1, 40, 0)[0]);
      const y0 = box === 'lane' ? Math.round(project(10, LN_ROAD0 - 1.5, 0)[1]) : Math.round(project(70, 38, 0)[1]);
      const y1 = box === 'lane' ? Math.round(project(10, LN_ROAD1 + 1.5, 0)[1]) : Math.round(project(70, 52, 0)[1]);
      const w = x1 - x0, h = y1 - y0;
      const o = document.createElement('canvas');
      o.width = w * ZOOM; o.height = h * ZOOM;
      const og = o.getContext('2d'); og.imageSmoothingEnabled = false;
      og.drawImage(cv, x0, y0, w, h, 0, 0, w * ZOOM, h * ZOOM);
      return o.toDataURL();
    }, { box, ZOOM });
    const fs = await import('node:fs');
    fs.writeFileSync(`shots/${tag}road-${name}-${n ? 'B' : 'A'}.png`, Buffer.from(url.split(',')[1], 'base64'));
    console.log(`  -> shots/${tag}road-${name}-${n ? 'B' : 'A'}.png`);
  }
  await ctx.close();
}
await browser.close();

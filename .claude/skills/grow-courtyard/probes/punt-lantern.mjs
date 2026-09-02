#!/usr/bin/env node
/* punt-lantern — b141: is the punt's lantern a FLAME at 22h, or is it slate?
 *
 *   node probe-punt-lantern.mjs [file] [--hour 22]
 *
 * The scheduling question (does a punt go out at 22h) is #131's and is answered
 * elsewhere; this isolates the DRAW. The hull is placed mid-channel off its mooring
 * with leg 2 set by hand, the clock pinned, drawScene run once, and the CANVAS read in
 * the same evaluate — the lamp's own screen point, computed the same way in both builds
 * so HEAD needs no register to be measured. A control point on the open water 40 px away
 * shows the reading can be dark, and a noon reading shows it can be bright.
 */
import { homedir } from 'node:os'; import { resolve, join, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 ? +process.argv[i + 1] : d; };
const f = process.argv.find((s, i) => i > 1 && s.endsWith('.html'));
const FILE = resolve(f || resolve(HERE, '../../../../courtyard.html'));
const HOUR = arg('--hour', 22), SHOT = process.argv.includes('--shot');
const br = await chromium.launch();
const p = await br.newPage({ viewport:{ width:1600, height:950 } });
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto(pathToFileURL(FILE).href + `?pause&seed=42`, { waitUntil:'load' });
await p.waitForFunction(() => typeof window.__warp === 'function');
const out = await p.evaluate(`(() => {
  window.__reseed(); window.__warp(5 * 55 - simT);
  const read = h => {
    __setTime(((h - 6) % 24) * 55 / 24);   // __setTime takes sim SECONDS, and the day rolls at hour 6
    const P = (typeof PUNTS !== 'undefined') ? PUNTS[0] : punt;
    P.leg = 2; P.x = 126.5; P.y = 39.4;                  // off the mooring, mid-channel
    drawScene(simT, 1 / 30);
    const s = cellW / 13, hh = 9.5 * s;
    const [x, y] = project(P.x, P.y, 0);                 // the lamp, solved the way the hull draws it
    const lx = x - 2.4 * s, ly = y + hh - 1.5 * s - 6.5 * s;
    const px = (ax, ay) => { const d = ctx.getImageData(Math.round(ax * DPR), Math.round(ay * DPR), 1, 1).data;
                             return [d[0], d[1], d[2]]; };
    const lamp = px(lx, ly), water = px(lx - 40, ly + 26);
    const reg = (typeof PUNT_LAMPS !== 'undefined') ? PUNT_LAMPS.length : 'no register';
    return {hour:+hour.toFixed(2), nightF:+nightF.toFixed(3), lampF:+(typeof puntLampF === 'function' ? puntLampF(P) : 0).toFixed(3),
            lamp, water, warmth:+(lamp[0] - lamp[2]).toFixed(1), registered:reg,
            at:[Math.round(lx), Math.round(ly)]};
  };
  return {night:read(${HOUR}), noon:read(12.5)};
})()`);
console.log(FILE.split('/').pop());
for (const k of ['night', 'noon']){
  const o = out[k];
  console.log(`  ${k.padEnd(6)} h${o.hour} nightF ${o.nightF} lampF ${o.lampF}  lamp rgb(${o.lamp}) warmth R-B ${o.warmth}` +
              `  · water control rgb(${o.water})  · PUNT_LAMPS ${o.registered}  @${o.at}`);
}
if (SHOT){
  // the crop is cut in the SAME evaluate as the draw and handed back as a dataURL: a
  // page.screenshot clip is in PAGE pixels and rAF has already redrawn by the time it
  // fires, so the two coordinate systems do not meet (LAW)
  const url = await p.evaluate(`(() => {
    __setTime(((${HOUR} - 6) % 24) * 55 / 24);
    const P = (typeof PUNTS !== 'undefined') ? PUNTS[0] : punt;
    P.leg = 2; P.x = 126.5; P.y = 39.4; drawScene(simT, 1/30);
    const s = cellW / 13, hh = 9.5 * s, [x, y] = project(P.x, P.y, 0);
    const lx = x - 2.4 * s, ly = y + hh - 8 * s, W = 240, H = 200;
    const c = document.createElement('canvas'); c.width = W * DPR; c.height = H * DPR;
    c.getContext('2d').drawImage(ctx.canvas, Math.round((lx - W / 2) * DPR), Math.round((ly - H / 2) * DPR),
                                 W * DPR, H * DPR, 0, 0, W * DPR, H * DPR);
    return c.toDataURL();
  })()`);
  const out = resolve(HERE, '../../../../shots', 'b141-lantern-' + (f ? 'head' : 'cand') + '.png');
  (await import('node:fs')).writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log('  -> ' + out);
}
await br.close();

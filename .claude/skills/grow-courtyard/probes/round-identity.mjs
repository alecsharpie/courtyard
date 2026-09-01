// identity control: canvas hash HEAD vs tree, at seed 7 day 6 08:00 (the round OUT) and noon. Tree twice: as built, and with updateRound forced to a no-op (must equal HEAD).
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
async function hashes(file, force){
  const p = await b.newPage({ viewport:{width:1600, height:950} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=7&t=0&pause'); await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate((force) => {
    if (force && typeof updateRound === 'function') updateRound = () => {};
    const hashCv = () => { const d = ctx.getImageData(0,0,W*DPR,H*DPR).data; let h=0; for (let i=0;i<d.length;i+=4){ h=(h*31 + d[i] + d[i+1]*7 + d[i+2]*13)|0; } return h; };
    const out = {};
    window.__reseed(); window.__warp(5 * DAY_LEN + DAY_LEN * (20 - 6) / 24);
    window.__warp((((8 - hour) % 24) + 24) % 24 / 24 * DAY_LEN); drawScene(simT, 1/30); out.h0800 = { hour: +hour.toFixed(2), hash: hashCv(), people: agents.length, round: !!(typeof mround !== 'undefined' && mround) };
    window.__warp((((12 - hour) % 24) + 24) % 24 / 24 * DAY_LEN); drawScene(simT, 1/30); out.noon = { hour: +hour.toFixed(2), hash: hashCv(), people: agents.length };
    return out; }, force);
  await p.close(); return r;
}
console.log('HEAD          ', JSON.stringify(await hashes('/tmp/courtyard-head.html', false)));
console.log('tree forced-off', JSON.stringify(await hashes('courtyard.html', true)));
console.log('tree as built  ', JSON.stringify(await hashes('courtyard.html', false)));
await b.close();

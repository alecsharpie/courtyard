import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const B = { HEAD: pathToFileURL('/tmp/head-courtyard.html').href, tree: pathToFileURL(resolve(HERE, '../../../..', 'courtyard.html')).href };
const b = await chromium.launch();
const run = async url => {
  const p = await b.newPage({ viewport:{width:1600,height:950} });
  await p.goto(url+'?pause&seed=42');
  await p.waitForFunction('typeof window.__census === "function"');
  await p.evaluate(() => { __reseed(); __warp(625); });
  const us = await p.evaluate(() => {
    // the worst case for the new pass: a point ON the near roof, where every piece is asked
    const f = ROOF_FURN.find(v => v.kind === 'tank');
    const q = project(f.x, f.y + 0.55, nearZ(Math.floor(f.x), Math.floor(f.y)) + 0.76);
    for (let i=0;i<2000;i++) lookAt(q);                      // warm
    const t0 = performance.now(); for (let i=0;i<20000;i++) lookAt(q);
    return (performance.now()-t0)/20000*1000;
  });
  await p.close(); return us;
};
const out = {};
for (const k of ['HEAD','tree','HEAD','tree','HEAD','tree']) (out[k] ||= []).push(await run(B[k]));
for (const k of ['HEAD','tree']) console.log(k, out[k].map(v=>v.toFixed(1)+'us').join('  '), ' median', out[k].sort((a,b)=>a-b)[1].toFixed(1)+'us');
console.log('a frame is 16667us; lookAt runs ONCE per frame, and only while a pointer is over the canvas');
await b.close();

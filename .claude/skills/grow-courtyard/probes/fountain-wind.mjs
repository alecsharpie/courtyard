import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const SEEDS = [3,7,11,19,42,1234,5,9,13,21];
const b = await chromium.launch();
for (const [label,file] of [['HEAD','/tmp/courtyard-head.html'],['HERE',resolve('courtyard.html')]]){
  const tot = {windy:{stand:0,sit:0}, calm:{stand:0,sit:0}}; let fs = null;
  for (const seed of SEEDS){
    const p = await b.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
    await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}`);
    await p.waitForFunction(() => window.__warp);
    const out = await p.evaluate(() => {
      window.__reseed(); window.__setTime(0);
      const seen = new WeakSet(); const r = {windy:{stand:0,sit:0}, calm:{stand:0,sit:0}, fs:[]};
      for (let d = 0; d < 20; d++){
        for (let i = 0; i < 550; i++){
          window.__warp(0.1);
          for (const a of agents) if (a.kind === 'plaza' && a.stop && !seen.has(a)){ seen.add(a); r[isWindy()?'windy':'calm'][a.stop.act]++; }
        }
        r.fs.push([d, isWindy()?'W':'c', +fountainStand().toFixed(3)]);
      }
      return r;
    });
    await p.close(); if (errs.length) console.log(label, seed, 'ERR', errs);
    for (const k of ['windy','calm']){ tot[k].stand += out[k].stand; tot[k].sit += out[k].sit; }
    fs = out.fs;
  }
  console.log(label, 'fountainStand by day:', fs.map(x=>x.join('')).join(' '));
  for (const k of ['calm','windy']) console.log(label.padEnd(5), k.padEnd(6), 'spawned stand', tot[k].stand, 'sit', tot[k].sit, 'share stand', (tot[k].stand/(tot[k].stand+tot[k].sit)).toFixed(3));
}
await b.close();

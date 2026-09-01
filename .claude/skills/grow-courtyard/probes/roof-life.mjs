/* Does anything LIVE on the near roof? The predicate is the inventory's own line —
 * "NOTHING LIVING GOES SOUTH OF LN_WALK_S (79)" — so the control is exact: on HEAD this
 * must read 0.0% everywhere, and a zero is evidence only because the same probe reads
 * non-zero on the candidate. HEAD is regenerated from `git show` inside the probe, so
 * the fixture is never whatever last wrote it.
 * usage: node probe-roof-life.mjs [seeds=10] [days=6] */
import path from 'path'; import fs from 'fs';
import { execSync } from 'child_process';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = path.resolve(new URL('.', import.meta.url).pathname, '../../../..');
const ART = path.join(REPO, 'courtyard.html');

const N = +(process.argv[2] || 10), DAYS = +(process.argv[3] || 6);
const HEAD = path.resolve('.probe-head.html');
fs.writeFileSync(HEAD, execSync('git show HEAD:courtyard.html', { cwd: REPO }, { maxBuffer: 1 << 28 }));

const br = await chromium.launch();
async function run(file, label){
  const url = 'file://' + path.resolve(file);
  let dayS = 0, dayHit = 0, nightS = 0, nightHit = 0, catRidge = 0, roost = 0;
  const perch = {}; let maxAtOnce = 0;
  for (let seed = 1; seed <= N; seed++){
    const p = await br.newPage();
    await p.setViewportSize({ width: 1200, height: 720 });
    await p.goto(`${url}?seed=${seed}&t=0&pause`); await p.waitForTimeout(350);
    const r = await p.evaluate((DAYS) => {
      window.__reseed();
      const S = { dayS:0, dayHit:0, nightS:0, nightHit:0, catRidge:0, roost:0, perch:{}, maxAtOnce:0 };
      // south of the lane AND on the block — the rowboat runs downriver to row 92 between
      // the block's two halves, so a bare `y > 79` reads the boat as life on the roof (HEAD 4.6%)
      const onBlock = e => e.y > 79 && !(e.x >= QUAY_X0 && e.x < RIVER_X1);
      while (window.__census().clock.day < DAYS){
        window.__warp(0.25);
        const es = window.__entities().filter(e => e.kind !== 'raindrop' && onBlock(e));
        const night = nightF > 0.5, lit = daylight > 0.3;
        S.maxAtOnce = Math.max(S.maxAtOnce, es.length);
        for (const e of es) if (e.perch) S.perch[e.perch] = (S.perch[e.perch] || 0) + 1;
        if (lit){ S.dayS++; if (es.length) S.dayHit++; }
        if (night){
          S.nightS++;
          const cat = es.some(e => e.kind === 'cat');
          const bird = es.some(e => e.kind === 'bird' && e.act === 'hop');
          if (cat || bird) S.nightHit++;
          if (es.some(e => e.kind === 'cat' && (e.act === 'ridge' || e.act === 'climb'))) S.catRidge++;
          if (bird) S.roost++;
        }
      }
      return S;
    }, DAYS);
    dayS += r.dayS; dayHit += r.dayHit; nightS += r.nightS; nightHit += r.nightHit;
    catRidge += r.catRidge; roost += r.roost; maxAtOnce = Math.max(maxAtOnce, r.maxAtOnce);
    for (const k in r.perch) perch[k] = (perch[k] || 0) + r.perch[k];
    await p.close();
  }
  const pc = (a, b) => b ? (100 * a / b).toFixed(1).padStart(5) + '%' : '  n/a';
  console.log(`${label.padEnd(10)} daylit samples with life on the roof ${pc(dayHit, dayS)} (${dayHit}/${dayS})`);
  console.log(`${' '.repeat(10)} after dark, cat OR roosting bird       ${pc(nightHit, nightS)} (${nightHit}/${nightS})`);
  console.log(`${' '.repeat(10)}   of which cat on the roof ${pc(catRidge, nightS)} · roosting bird ${pc(roost, nightS)}`);
  console.log(`${' '.repeat(10)} most on the roof at once: ${maxAtOnce} · perches: ${JSON.stringify(perch)}`);
}
await run(HEAD, 'HEAD');
await run('courtyard.html', 'candidate');
await br.close();
fs.unlinkSync(HEAD);

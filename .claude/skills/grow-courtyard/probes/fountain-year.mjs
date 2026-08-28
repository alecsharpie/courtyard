#!/usr/bin/env node
/* probe: the fountain's year. (1) anchor identity vs HEAD — terms and the cached
 * ground layer byte-identical at SEASON_START; (2) continuity — largest step in
 * fountainPlay/fountainIce/basin colour over a folded year at 1/400 phase; (3) the
 * stand share at midwinter/anchor/midsummer. */
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const browser = await chromium.launch();
async function run(file){
  const page = await browser.newPage({ viewport:{ width:1200, height:720 } });
  const errs=[]; page.on('pageerror', e=>errs.push(String(e)));
  await page.goto(pathToFileURL(resolve(file)).href + '?pause&seed=42', { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const out = await page.evaluate(() => {
    window.__reseed(); window.__setTime(0); drawGround();
    const has = n => { try { return typeof eval(n) === 'function'; } catch { return false; } };
    const cells = [];
    for (let y = 26; y < 34; y++) for (let x = 102; x < 109; x++) if (grid[y*GW+x] === WATER)
      cells.push(groundCol(x, y, WATER, hash(x, y), 0));
    const g = document.querySelector('canvas');
    const r = { phase: seasonPhase, warmth,
      play: has('fountainPlay') ? fountainPlay() : 1,
      ice: has('fountainIce') ? fountainIce() : 0,
      stand: has('fountainStand') ? fountainStand() : 1,
      basin: cells.join('|'), nBasin: cells.length,
      ground: (typeof gcv !== 'undefined' ? gcv : null) && gcv.toDataURL() };
    if (has('fountainPlay')){
      // folded year at 1/400 phase: largest step in each term
      const save = [seasonPhase, warmth]; let mp=0, mi=0, mc=0, prev=null;
      for (let i = 0; i <= 400; i++){
        seasonPhase = (i/400) % 1; warmth = 0.5 - 0.5*Math.cos(2*Math.PI*seasonPhase);
        const c = [fountainPlay(), fountainIce(), cparse(groundCol(105, 30, WATER, 0.5, 0))];
        if (prev){ mp=Math.max(mp,Math.abs(c[0]-prev[0])); mi=Math.max(mi,Math.abs(c[1]-prev[1]));
          mc=Math.max(mc, Math.max(...c[2].map((v,j)=>Math.abs(v-prev[2][j])))); }
        prev = c;
      }
      const at = p => { seasonPhase=p; warmth=0.5-0.5*Math.cos(2*Math.PI*p);
        return {play:+fountainPlay().toFixed(3), ice:+fountainIce().toFixed(3), stand:+fountainStand().toFixed(3),
          standShare:+(0.5*fountainStand()).toFixed(3), basin:groundCol(105,30,WATER,0.5,0)}; };
      r.year = { maxStepPlay: mp, maxStepIce: mi, maxStepBasinRGB: mc, winter: at(0), anchor: at(0.25), summer: at(0.5), autumn: at(0.75) };
      [seasonPhase, warmth] = save;
    }
    return r;
  });
  await page.close();
  out.errs = errs; out.groundHash = out.ground ? createHash('sha1').update(out.ground).digest('hex').slice(0,12) : 'n/a'; delete out.ground;
  return out;
}
const head = await run('/tmp/courtyard-head.html'), here = await run(new URL('../../../../courtyard.html', import.meta.url).pathname);
console.log('HEAD  phase', head.phase, 'basin cells', head.nBasin, 'ground', head.groundHash, head.errs);
console.log('HERE  phase', here.phase, 'play', here.play, 'ice', here.ice, 'stand', here.stand, 'ground', here.groundHash, here.errs);
console.log('anchor identity: terms', Math.abs(here.play - 1) < 1e-12 && here.ice === 0 && Math.abs(here.stand - 1) < 1e-12 ? 'EXACT (residue ' + (here.play - 1).toExponential(1) + ', the clock phase not the algebra)' : 'FAIL',
  '· basin colours', head.basin === here.basin ? 'IDENTICAL' : 'DIFFER', '· ground layer', head.groundHash === here.groundHash ? 'IDENTICAL' : 'DIFFER');
console.log(JSON.stringify(here.year, null, 1));
await browser.close();

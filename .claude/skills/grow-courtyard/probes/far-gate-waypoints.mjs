/* #119 success criterion: does the far-bank arrival come THROUGH the gate?
 * Measure wp[0] (first waypoint after the spawn point) and the second-to-last
 * (the way OUT) on HEAD vs the tree, at the morning lapse hour, many seeds. */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const ROOT = process.cwd();
writeFileSync('/tmp/head-courtyard.html', execSync('git show HEAD:courtyard.html', { cwd: ROOT, maxBuffer: 1 << 26 }));
const B = { HEAD: '/tmp/head-courtyard.html', tree: join(ROOT, 'courtyard.html') };
const b = await chromium.launch();
for (const [name, file] of Object.entries(B)){
  const first = new Map(), out = new Map(); let n = 0, branches = new Map();
  for (const seed of [3,7,11,42,101,1234,5,19,23,77]){
    const pg = await (await b.newContext({viewport:{width:1600,height:950}})).newPage();
    await pg.goto(pathToFileURL(file).href + `?pause&seed=${seed}`); await pg.waitForTimeout(600);
    const r = await pg.evaluate(() => {
      __reseed(); __setTime(0); const seen = [];
      // run six days; every far agent that ever exists gets its route recorded once
      const known = new Set();
      for (let i = 0; i < 6 * 55 * 4; i++){
        __warp(0.25);
        for (const a of agents) if (a.far && !known.has(a)){
          known.add(a);
          seen.push({ at: a.farAt, wp0: a.wp[0].map(v => +v.toFixed(1)),
                      outLast: a.wp[a.wp.length - 2].map(v => +v.toFixed(1)) });
        }
      }
      return seen;
    });
    for (const s of r){ n++;
      first.set(JSON.stringify(s.wp0), (first.get(JSON.stringify(s.wp0)) || 0) + 1);
      out.set(JSON.stringify(s.outLast), (out.get(JSON.stringify(s.outLast)) || 0) + 1);
      branches.set(s.at, (branches.get(s.at) || 0) + 1); }
    await pg.close();
  }
  console.log(`\n${name}: ${n} far arrivals over 10 seeds x 6 days`);
  console.log('  branches   :', [...branches].map(([k,v]) => `${k} ${v}`).join('  '));
  console.log('  wp[0] (in) :', [...first].map(([k,v]) => `${k} x${v}`).join('  '));
  console.log('  wp[-2](out):', [...out].map(([k,v]) => `${k} x${v}`).join('  '));
}
await b.close();

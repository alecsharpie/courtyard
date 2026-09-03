/* #169 — did the frontage gate cost the cafe its custom, and do the two new errands
 * actually turn up? Presence, not a per-instant crop: every agent bound for or seated
 * at a CAFE_TABLE is sampled every 0.25 s of warped sim time over a whole year x seeds,
 * and summed as agent-hours. HEAD is fetched from git and run in the same session. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process'; import fs from 'node:fs';
const REPO = resolve(new URL('.', import.meta.url).pathname, '../../../..');
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i!==-1&&process.argv[i+1]?process.argv[i+1]:d;};
const NDAYS=+arg('--days',26), DAY0=+arg('--day0',2);
const SEEDS=arg('--seeds','3,11,23,42,77,101').split(',').map(Number);
const files=[];
{ const h=resolve(REPO,'.probe-head.html');
  fs.writeFileSync(h, execSync('git show HEAD:courtyard.html',{cwd:REPO,maxBuffer:1<<28})); files.push(['HEAD',h]); }
files.push(['CAND', resolve(REPO,'courtyard.html')]);
const br = await chromium.launch();
for (const [label, FILE] of files){
  const tot = { cafeH:0, seatedH:0, openerH:0, drayH:0, days:0, openerDays:0, drayDays:0,
                caskH:0, bareH:0, sat:0, unset:0, steps:0 };
  for (const seed of SEEDS){
    const page = await br.newPage({ viewport:{width:1200,height:720} });
    page.on('pageerror', e => console.log('PAGEERROR', seed, e.message));
    await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}`, { waitUntil:'load' });
    await page.waitForFunction(() => typeof window.__warp === 'function');
    const r = await page.evaluate(([DAY0,NDAYS]) => {
      window.__reseed(); window.__warp(DAY0*55 - simT);
      const H = 0.25 * 24 / 55;                       // sim hours in one 0.25 s sample
      const o = { cafeH:0, seatedH:0, openerH:0, drayH:0, days:0, openerDays:0, drayDays:0,
                  caskH:0, bareH:0, sat:0, unset:0, steps:0 };
      const seen = new Set(); let dPrev = day;
      while (day < DAY0 + NDAYS){
        window.__warp(0.25); o.steps++;
        if (day !== dPrev){ o.days++; dPrev = day; }
        const cafe = agents.filter(a => a.cafe || a.table || a.tableRef);
        o.cafeH += cafe.length * H;
        o.seatedH += cafe.filter(a => a.state === 'sit').length * H;
        // a guest seated at a table the clock says is folded away — must never happen
        for (const a of agents) if (a.tableRef && a.state === 'sit'){
          o.sat++; const i = CAFE_TABLES.indexOf(a.tableRef);
          if (a.tableRef.p !== undefined && a.tableRef.p < 0.9) o.unset++;
        }
        if (CAFE_TABLES[0].p !== undefined){
          if (front){ o.openerH += H; if (!seen.has('o'+day)){ seen.add('o'+day); o.openerDays++; } }
          if (dray){ o.drayH += H; if (!seen.has('d'+day)){ seen.add('d'+day); o.drayDays++; } }
          if (casksOut()) o.caskH += H;
          if (CAFE_TABLES[0].p < 0.05) o.bareH += H;
        }
      }
      return o;
    }, [DAY0,NDAYS]);
    for (const k in r) tot[k] += r[k];
    await page.close();
  }
  const d = tot.days || 1;
  console.log(`\n===== ${label} =====  ${tot.days} day-rolls over ${SEEDS.length} seeds`);
  console.log(`  cafe presence   ${(tot.cafeH/d).toFixed(3)} agent-h per day   (seated ${(tot.seatedH/d).toFixed(3)})`);
  console.log(`  opener          ${(100*tot.openerDays/d).toFixed(1)}% of days, ${(tot.openerH/d).toFixed(2)} h/day on frame`);
  console.log(`  drayman         ${(100*tot.drayDays/d).toFixed(1)}% of days, ${(tot.drayH/d).toFixed(2)} h/day on frame`);
  console.log(`  casks on the footway ${(tot.caskH/d).toFixed(2)} h/day · frontage BARE ${(tot.bareH/d).toFixed(2)} h/day`);
  console.log(`  seated-at-a-table samples ${tot.sat}, of them at a table the clock had folded: ${tot.unset}`);
}
await br.close();

/* Does the horn get a SUBJECT? sayAt() only speaks when its cell is inView(), so the
 * question is not "is announce called" but "does the town say it where you are looking".
 * Warp a barge day at two cameras and collect every line the ticker actually showed. */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(join(process.cwd(), 'courtyard.html')).href;
const seed = +(process.argv[2] || 7), days = +(process.argv[3] || 8);
const b = await chromium.launch();
for (const where of ['Wide', 'Plaza', 'Courtyard']){
  const pg = await b.newPage({ viewport: { width: 1600, height: 950 } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(PAGE + `?pause&seed=${seed}&t=0`);
  await pg.waitForFunction('window.__census');
  const lines = await pg.evaluate(async ([days, where]) => {
    window.__reseed();
    whereN = QUARTERS.findIndex(q => q.name === where); viewSnap();
    const seen = []; let last = '';
    for (let i = 0; i < days * 55 / 0.25; i++){
      window.__warp(0.25);
      tickTicker();                                  // the ticker's own half-second bucket
      const txt = document.querySelector('#ticker').textContent;
      if (txt && txt !== last){ seen.push(txt); last = txt; }
    }
    return seen;
  }, [days, where]);
  await pg.close();
  if (errs.length){ console.log('PAGE ERROR ' + errs[0]); process.exit(1); }
  const barge = lines.filter(l => /barge|bollard|wharf/i.test(l));
  const counts = {};
  for (const l of barge) counts[l] = (counts[l] || 0) + 1;
  console.log(`\n=== ${where} · ${days} days · ${lines.length} lines shown, ${barge.length} about the barge`);
  for (const k of Object.keys(counts)) console.log(`  ${String(counts[k]).padStart(2)}x  ${k}`);
}
await b.close();

/* day-control — did this change touch the DAY?
 *
 *   git show HEAD:courtyard.html > /tmp/courtyard-head.html
 *   node .claude/skills/grow-courtyard/probes/day-control.mjs
 *
 * Written for #33 (an evening place that must add nobody at noon), but the question is
 * general: any change to population, caps or rates owes an answer at midday, and the
 * census ladder cannot give one because two of its three ages sit at hour 21.27.
 *
 * At the census's own noon cell (warp 625, hour 14.73) and at a true midday, it compares
 * HEAD against the working tree on the count AND on the MIX OF KINDS — "the day is
 * untouched" is a claim about who is about, not only how many. Expect the kinds to
 * shuffle: a single new R() draw displaces the whole seeded stream, so read the totals
 * and the presence/absence of a kind, not its exact number. `tap` is the direct test —
 * an evening feature contributing anybody at noon is a failure with no interpretation. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILES = [['HEAD', '/tmp/courtyard-head.html'], ['now', 'courtyard.html']];
const SEEDS = [7, 42, 1234, 3, 11];
const MARKS = [['censusNoon', 625], ['midday', 6 * 55 + (12 - 6) / 24 * 55]];

const b = await chromium.launch();
for (const [label, t] of MARKS){
  for (const [name, file] of FILES){
    const tot = {}; let people = 0, street = 0, court = 0, tap = 0;
    for (const seed of SEEDS){
      const p = await b.newPage();
      p.on('pageerror', e => console.log('PAGE ERROR', e.message));
      await p.goto(pathToFileURL(resolve(file)).href + `?pause&seed=${seed}&t=0`);
      await p.waitForFunction(() => window.__warp);
      const o = await p.evaluate(tt => {
        window.__reseed(); window.__warp(tt);
        const k = {};
        for (const a of agents) k[a.kind] = (k[a.kind] || 0) + 1;
        return {hour:+hour.toFixed(2), k, n:agents.length,
                street:agents.filter(a => a.street).length,
                court:agents.filter(a => !a.street).length,
                tap:agents.filter(a => a.tap).length};
      }, t);
      for (const [kk, v] of Object.entries(o.k)) tot[kk] = (tot[kk] || 0) + v;
      people += o.n; street += o.street; court += o.court; tap += o.tap;
      await p.close();
    }
    const mix = Object.entries(tot).sort((a, b2) => b2[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' ');
    console.log(`${label.padEnd(11)} ${name.padEnd(5)} people ${String(people).padStart(3)}  street ${String(street).padStart(3)}  court ${String(court).padStart(3)}  tap ${tap}`);
    console.log(`                  ${mix}`);
  }
}
await b.close();

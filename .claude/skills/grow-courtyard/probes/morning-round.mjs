// Run from the repo root: node .claude/skills/grow-courtyard/probes/morning-round.mjs [courtyard.html]  (#98)
// the morning round: 10 seeds x summer + winter day. In at sunUp-0.3? doors delivered and when, out when,
// x at sunUp+0.5, marks at 07:30 / 09:30, the name on the step, the lapse landing from 20:00 (evening, then morning).
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = resolve(process.argv[2] || 'courtyard.html');
const SEEDS = [1, 2, 3, 5, 7, 11, 13, 42, 77, 99];
const b = await chromium.launch();
const all = [];
for (const seed of SEEDS){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  p.on('pageerror', e => console.log('PAGE ERROR', seed, e.message));
  await p.goto(pathToFileURL(file).href + '?pause&seed=' + seed);
  await p.waitForFunction(() => window.__warp);
  const out = await p.evaluate(() => {
    const res = [];
    for (const [label, d] of [['summer', 5], ['winter', 18]]){
      window.__reseed(); window.__setTime(d * DAY_LEN + DAY_LEN * (20 - 6) / 24);   // 20:00 the evening before
      const r = { label, seed: undefined, first: null, deliveries: [], last: null, atHalf: null, m0730: null, m0930: null, name: null, snowAtDawn: null, rainAtDawn: null, umbrella: 0, maxStep: 0, standSteps: 0, greets: 0 };
      let prev = null, seenLeft = 0, su = null;
      for (let i = 0; i < 22 * 4 * 4; i++){                    // 22 h in 0.25 s steps
        window.__warp(0.25);
        const e = agents.find(a => a.round);
        if (su === null && hour > 22) su = null;
        if (e){
          if (!r.first){ su = sunUp; r.sunUp = +sunUp.toFixed(2); r.first = { h: +hour.toFixed(2), rel: +(hour - sunUp).toFixed(2), x: +e.x.toFixed(1), doors: e.doors, raining, snow: +snowCover.toFixed(2) }; }
          if (e.left > seenLeft){ seenLeft = e.left; r.deliveries.push({ h: +hour.toFixed(2), rel: +(hour - su).toFixed(2), x: +e.x.toFixed(1) }); }
          if (prev){ const st = Math.hypot(e.x - prev.x, e.y - prev.y); if (st > r.maxStep) r.maxStep = +st.toFixed(2); }
          if (e.state === 'stand') r.standSteps++;
          if (e.greet > 0) r.greets++;
          if (e.umbrella) r.umbrella++;
          prev = { x: e.x, y: e.y };
          r.last = { h: +hour.toFixed(2), rel: +(hour - su).toFixed(2), x: +e.x.toFixed(1), left: e.left };
          if (r.atHalf === null && hour >= su + 0.5 && hour < su + 0.5 + 0.2) r.atHalf = { x: +e.x.toFixed(1), y: +e.y.toFixed(1), act: e.state };
        } else if (r.first && !r.done){ r.done = { h: +hour.toFixed(2), rel: +(hour - su).toFixed(2) }; }
        if (r.m0730 === null && hour >= 7.5 && hour < 7.7 && (r.first || hour > sunUp)) r.m0730 = { marks: roundMarks.filter(m => simT < m.until).map(m => m.x), day };
        if (r.m0930 === null && hour >= 9.5 && hour < 9.7 && (r.first || hour > sunUp)) r.m0930 = { marks: roundMarks.filter(m => simT < m.until).map(m => m.x), day };
        if (r.name === null && roundMarkAt(4)) r.name = nameAt(4, 65);
        if (r.snowAtDawn === null && hour >= sunUp - 0.3 && hour < sunUp - 0.3 + 0.2){ r.snowAtDawn = +snowCover.toFixed(2); r.rainAtDawn = raining; }
      }
      res.push(r);
    }
    // the lapse: from 20:00 day 5, the clock tap twice (evening, then the morning)
    window.__reseed(); window.__setTime(5 * DAY_LEN + DAY_LEN * (20 - 6) / 24);
    let tg = eveningTarget(); window.__warp(tg.hours / 24 * DAY_LEN);
    tg = eveningTarget(); window.__warp(tg.hours / 24 * DAY_LEN);
    const e = agents.find(a => a.round);
    const landing = { hour: +hour.toFixed(2), rel: +(hour - sunUp).toFixed(2), round: e ? { x: +e.x.toFixed(1), y: +e.y.toFixed(1), act: e.state, left: e.left } : null,
      line: mround && mistF() > 0.5 ? 'round+mist' : mround ? 'round' : mistF() > 0.5 ? 'mist' : 'plain', snow: +snowCover.toFixed(2) };
    return { res, landing };
  });
  for (const r of out.res){
    console.log(`seed ${seed} ${r.label} sunUp ${r.sunUp}  in ${r.first ? r.first.rel + ' (h ' + r.first.h + ', doors ' + r.first.doors + (r.first.raining ? ', RAIN' : '') + (r.first.snow > 0 ? ', snow ' + r.first.snow : '') + ')' : 'NO ROUND (snow ' + r.snowAtDawn + ' rain ' + r.rainAtDawn + ')'}` +
      `  deliveries ${r.deliveries.map(d => 'x' + d.x + '@+' + d.rel).join(' ')}  out ${r.done ? '+' + r.done.rel + ' (h ' + r.done.h + ')' : 'STILL OUT at ' + (r.last && r.last.h)}` +
      `  @+0.5: ${r.atHalf ? 'x' + r.atHalf.x + ' ' + r.atHalf.act : '-'}  marks 07:30 [${r.m0730 && r.m0730.marks}] 09:30 [${r.m0930 && r.m0930.marks}]  name '${r.name}'  maxStep ${r.maxStep} umbrellaSteps ${r.umbrella} greets ${r.greets}`);
  }
  console.log(`  landing: h ${out.landing.hour} (sunUp+${out.landing.rel}) round ${JSON.stringify(out.landing.round)} line ${out.landing.line}`);
  all.push({ seed, ...out });
  await p.close();
}
await b.close();

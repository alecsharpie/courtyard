#!/usr/bin/env node
/* #158 — the east SHARE at the CHOICE, and what the plaza's DOOR does with it.
 *
 *   node probe-plaza-door.mjs [--seeds 7,42,...] [--days 20] [--cap-lane K]
 *
 * LAW: measure a share at the CHOICE, never by presence, which weights a branch by its
 * dwell. town-caps.mjs reports presence per place; this counts the ROLL — how many lane
 * spawns land in each east band, and, for the plaza band alone, how many of them are
 * ADMITTED (a free stand or a free bench) versus REFUSED and re-routed to the quay rail.
 * The counters are inserted into a temp copy of the file; nothing ships instrumented.
 */
import { homedir } from 'node:os';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(arg('--file', 'courtyard.html'));
const SEEDS = arg('--seeds', '7,42,1234,555,90210,31337,8').split(',').map(Number);
const DAYS = +arg('--days', 20);
const CAPLANE = arg('--cap-lane', null);

let src = readFileSync(SRC, 'utf8');
const sub = (find, to) => {
  if (src.split(find).length !== 2){ console.error('anchor not unique/found:', JSON.stringify(find.slice(0, 60))); process.exit(2); }
  src = src.replace(find, to);
};
if (CAPLANE){
  const re = /const laneCap = 1 \+ Math\.round\(maturity\(\) \* \(1\.6 \+ [\d.]+ \*/;
  if (!re.test(src)){ console.error('laneCap rewrite matched nothing'); process.exit(2); }
  src = src.replace(re, `const laneCap = 1 + Math.round(maturity() * (1.6 + ${CAPLANE} *`);
}
sub('function spawnLaneAgent(room, cap){',
  'const __EC={roll:0,pullSum:0,capSum:0,plazaRoll:0,plazaIn:0,plazaRef:0,stand:0,bench:0,crumbs:0,two:0,quayRoll:0,greenRoll:0,paraRoll:0,cycleRoll:0,tail:0};window.__EC=__EC;\nfunction spawnLaneAgent(room, cap){');
sub('  const roll = R(), sun = daylight > 0.3;',
  '  const roll = R(), sun = daylight > 0.3;\n  __EC.roll++; __EC.capSum += (cap===undefined?EAST_CAP0:cap); __EC.pullSum += eastPull(cap===undefined?EAST_CAP0:cap);');
/* the DOOR's own line. #160 replaced the two-place fork with one table and one claim,
 * so the anchor moved; read which build the file under test uses and instrument that
 * one, the way town-caps.mjs reads laneCount's definition. Both count the same three
 * things: chose / admitted / refused, at the CHOICE. */
const DOOR160 = src.includes('const v = plazaVisit(a, 1.0, null, true);');
if (DOOR160) sub('    const v = plazaVisit(a, 1.0, null, true);',
  '    const v = plazaVisit(a, 1.0, null, true);\n    __EC.plazaRoll++; if (v){ __EC.plazaIn++; if (v.p.k===\'stand\') __EC.stand++; else if (v.p.k===\'bench\') __EC.bench++; else __EC.crumbs++; if (v.p2) __EC.two++; } else __EC.plazaRef++;');
else sub('    const bn = st ? null : freeBench();',
  '    const bn = st ? null : freeBench();\n    __EC.plazaRoll++; if (st||bn) __EC.plazaIn++; else __EC.plazaRef++; if (st) __EC.stand++; if (bn) __EC.bench++;');
sub("    // along the quay to watch the river\n    a.kind = 'quay';", "    // along the quay to watch the river\n    __EC.quayRoll++; a.kind = 'quay';");
sub("    // over the bridge to the church green on the far bank\n    a.kind = 'green';", "    // over the bridge to the church green on the far bank\n    __EC.greenRoll++; a.kind = 'green';");
sub("    // halfway over and no further: the lane already CARRIES everyone across the", "    __EC.paraRoll++;\n    // halfway over and no further: the lane already CARRIES everyone across the");
sub("    a.kind = 'cyclist'; a.speed = 5.5 + R() * 1.5; a.cycle = true;", "    __EC.cycleRoll++; a.kind = 'cyclist'; a.speed = 5.5 + R() * 1.5; a.cycle = true;");
sub('    // plain passer-by; sometimes pauses to peer through the arch',
  '    __EC.tail++;\n    // plain passer-by; sometimes pauses to peer through the arch');

const FILE = join(dirname(SRC), `.door-probe-${process.pid}.html`);
writeFileSync(FILE, src);

const browser = await chromium.launch();
const rows = [];
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(FILE).href + `?seed=${seed}&pause`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(async () => {
    __reseed();
    while (day < 1) __warp(1);
    for (const k in __EC) __EC[k] = 0;          // the warm-up rolls are not the sample
    const d0 = day;
    while (day < d0 + ${DAYS}) __warp(1);
    return { ...__EC, peakCap: 0 };
  })()`);
  if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
  rows.push({ seed, ...r });
  await page.close();
}
await browser.close();
unlinkSync(FILE);

const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2)) * a.length / (a.length - 1)); };
const M = k => mean(rows.map(r => r[k]));
const LABEL = CAPLANE ? `lane=${CAPLANE}` : 'HEAD';
const f2 = x => x.toFixed(2);
console.log(`\n=== plaza-door  [${LABEL}]  ${SEEDS.length} seeds x ${DAYS} days ===`);
console.log(`  lane spawns rolling the east cascade   ${f2(M('roll'))}   mean laneCap at the roll ${f2(M('capSum') / M('roll'))}  mean eastPull ${(M('pullSum') / M('roll')).toFixed(3)}`);
console.log(`\n-- the roll, per band (counts per run, and share of the roll) --`);
for (const [k, n] of [['plazaRoll','plaza'],['quayRoll','quay'],['greenRoll','green'],['paraRoll','parapet'],['cycleRoll','cyclist'],['tail','plain passer-by']])
  console.log(`  ${n.padEnd(16)} ${f2(M(k)).padStart(7)}   ${(100 * M(k) / M('roll')).toFixed(1)}%`);
console.log(`\n-- the plaza's DOOR (${DOOR160 ? 'PLAZA_PLACES, one claim' : '3 FOUNT_STANDS + 2 PLAZA_BENCHES'}), shared with every other caller --`);
console.log(`  chose the plaza  ${f2(M('plazaRoll'))}   ADMITTED ${f2(M('plazaIn'))} (${(100*M('plazaIn')/M('plazaRoll')).toFixed(1)}%)   REFUSED -> quay ${f2(M('plazaRef'))} (${(100*M('plazaRef')/M('plazaRoll')).toFixed(1)}%)`);
console.log(`  of the admitted: stand ${f2(M('stand'))}  bench ${f2(M('bench'))}  crumbs ${f2(M('crumbs'))}   and ${f2(M('two'))} took a SECOND act (${M('plazaIn') ? (100*M('two')/M('plazaIn')).toFixed(1) : '0.0'}%)`);
console.log(`  quay arrivals in all: ${f2(M('quayRoll') + M('plazaRef'))} = ${f2(M('quayRoll'))} own band + ${f2(M('plazaRef'))} the plaza turned away`);
console.log(`\n  per seed  plazaRoll/plazaIn/plazaRef: ` + rows.map(r => `${r.seed}:${r.plazaRoll}/${r.plazaIn}/${r.plazaRef}`).join('  '));
if (argv.includes('--json')) console.log('JSON ' + JSON.stringify({ label: LABEL, seeds: SEEDS, days: DAYS,
  roll: +f2(M('roll')), pull: +(M('pullSum')/M('roll')).toFixed(3),
  plazaRoll: +f2(M('plazaRoll')), plazaIn: +f2(M('plazaIn')), plazaRef: +f2(M('plazaRef')), two: +f2(M('two')),
  plazaInSd: +f2(sd(rows.map(r => r.plazaIn))), plazaRollSd: +f2(sd(rows.map(r => r.plazaRoll))),
  quayRoll: +f2(M('quayRoll')), greenRoll: +f2(M('greenRoll')), paraRoll: +f2(M('paraRoll')), tail: +f2(M('tail')) }));

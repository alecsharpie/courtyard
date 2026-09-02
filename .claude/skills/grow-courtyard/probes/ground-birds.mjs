/* #118: what does the lawn/lane band actually deliver, and what did its cap MEAN?
 * The band's members are the same set on both builds — a bird that is not plaza, not
 * roof and not the belfry's wheeling flush — so HEAD and candidate are measured by one
 * definition and only the CAP PREDICATE differs. Presence is the reading (mean per
 * daylight, dry sample), never a per-instant crop; `open` is the gate's own value at
 * that sample, and `foreign` is the share of shut samples that HEAD shuts on birds
 * belonging to another band. Candidate caps are swept so the re-price is measured.
 * usage: node probes/ground-birds.mjs [seeds=12] [days=6] [caps=3,4,5] */
import path from 'path'; import fs from 'fs';
import { execSync } from 'child_process';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = path.resolve(new URL('.', import.meta.url).pathname, '../../../..');
const N = +(process.argv[2] || 12), DAYS = +(process.argv[3] || 6);
const CAPS = (process.argv[4] || '3,4,5').split(',').map(Number);

const HEAD = path.resolve('.probe-head.html');
fs.writeFileSync(HEAD, execSync('git show HEAD:courtyard.html', { cwd: REPO, maxBuffer: 1 << 28 }));
const CUR = fs.readFileSync(path.join(REPO, 'courtyard.html'), 'utf8');
const variants = [['HEAD', HEAD]];
for (const c of CAPS){
  const f = path.resolve(`.probe-cap${c}.html`);
  const out = CUR.replace('const GROUND_BIRDS = 3;', `const GROUND_BIRDS = ${c};`);
  if (out === CUR && c !== 3) throw new Error('cap const not found — cannot sweep');
  fs.writeFileSync(f, out);
  variants.push([`cap ${c}`, f]);
}

const br = await chromium.launch();
async function run(file, label){
  const T = { n:0, g:0, r:0, p:0, seen:0, open:0, foreign:0, shut:0, max:0, hist:[0,0,0,0,0,0] };
  for (let seed = 1; seed <= N; seed++){
    const p = await br.newPage();
    await p.setViewportSize({ width: 1200, height: 720 });
    await p.goto('file://' + file + `?seed=${seed}&t=0&pause`); await p.waitForTimeout(300);
    const r = await p.evaluate((DAYS) => {
      window.__reseed();
      const S = { n:0, g:0, r:0, p:0, seen:0, open:0, foreign:0, shut:0, max:0, hist:[0,0,0,0,0,0] };
      while (window.__census().clock.day < DAYS){
        window.__warp(0.25);
        if (!(daylight > 0.3) || raining) continue;      // the band's own window
        const bs = window.__entities().filter(e => e.kind === 'bird');
        const g = bs.filter(b => !b.plaza && !b.roof && b.act !== 'wheel').length;
        const rf = bs.filter(b => b.roof).length, pl = bs.filter(b => b.plaza).length;
        S.n++; S.g += g; S.r += rf; S.p += pl;
        if (g) S.seen++;
        S.max = Math.max(S.max, g);
        S.hist[Math.min(5, g)]++;
        // the gate as HEAD wrote it: every bird that is not plaza, capped at 3
        const headCount = bs.filter(b => !b.plaza).length;
        if (headCount < 3) S.open++; else { S.shut++; if (g < 3) S.foreign++; }
      }
      return S;
    }, DAYS);
    for (const k of ['n','g','r','p','seen','open','foreign','shut']) T[k] += r[k];
    T.max = Math.max(T.max, r.max);
    for (let i = 0; i < 6; i++) T.hist[i] += r.hist[i];
    await p.close();
  }
  const f2 = x => x.toFixed(2).padStart(5);
  const pc = (a, b) => b ? (100 * a / b).toFixed(1).padStart(5) + '%' : '  n/a';
  console.log(`${label.padEnd(8)} n=${String(T.n).padStart(6)}  mean present: ground ${f2(T.g/T.n)}  roof ${f2(T.r/T.n)}  plaza ${f2(T.p/T.n)}`);
  console.log(`${' '.repeat(8)} samples with >=1 ground bird ${pc(T.seen, T.n)}  ·  most at once ${T.max}`);
  console.log(`${' '.repeat(8)} HEAD's gate open ${pc(T.open, T.n)}  ·  shut on foreign birds ${pc(T.foreign, T.shut)} of shut`);
  console.log(`${' '.repeat(8)} ground birds present 0..5+: ${T.hist.map((h,i)=>`${i}:${(100*h/T.n).toFixed(1)}%`).join(' ')}`);
}
for (const [label, file] of variants) await run(file, label);
await br.close();
for (const [, f] of variants) fs.unlinkSync(f);

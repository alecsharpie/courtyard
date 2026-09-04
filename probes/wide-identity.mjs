/* wide-identity.mjs — is the WIDE frame the same bytes it was before the change?
 * The brief's one hard constraint. Full-canvas PNG (toDataURL, read in the same evaluate
 * as the draw) at rest at whereN 0, four framings x four instants, HEAD against the
 * working tree. A single byte of difference is a fail.
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const SIZES = [[1600, 950], [1200, 700], [900, 560], [390, 844]];
const TS = [120, 175, 200, 460];                        // morning, midday, night, another day
const files = { HEAD: '/tmp/probe-wide-head.html', CAND: '/tmp/probe-wide-cand.html' };
writeFileSync(files.HEAD, execFileSync('git', ['show', 'HEAD:courtyard.html'], { maxBuffer: 1 << 28 }).toString());
writeFileSync(files.CAND, readFileSync('courtyard.html', 'utf8'));

const b = await chromium.launch();
const shoot = async (file, W, H) => {
  const pg = await b.newPage({ viewport: { width: W, height: H } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(pathToFileURL(file).href + '?pause&seed=7&t=0');
  await pg.waitForFunction('window.__census');
  const out = await pg.evaluate((TS) => {
    const cv = document.querySelector('canvas');
    window.__reseed();
    return TS.map(t => { window.__setTime(t); drawScene(t, 1 / 30); return cv.toDataURL(); });
  }, TS);
  await pg.close();
  return { out, errs };
};
let bad = 0;
for (const [W, H] of SIZES){
  const a = await shoot(files.HEAD, W, H), c = await shoot(files.CAND, W, H);
  const md = (s) => createHash('md5').update(s).digest('hex').slice(0, 10);
  const marks = a.out.map((s, i) => (s === c.out[i] ? '=' : (bad++, 'X ' + md(s) + '/' + md(c.out[i]))));
  console.log(`${W}x${H}  t ${TS.join(' ')}   ${marks.join('  ')}${a.errs.length || c.errs.length ? '  PAGE ERRORS' : ''}`);
}
await b.close();
console.log(bad ? `FAIL — ${bad} frame(s) differ at Wide` : 'PASS — every Wide frame is byte-identical to HEAD');

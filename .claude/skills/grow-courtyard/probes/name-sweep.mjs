/* Does every drawn thing in the frame yard ANSWER the pointer? Drives the REAL mouse over
 * the yard's screen box and reads the sill's own line — end to end through the page's
 * hover path, not through a hook written for the probe. A drawn thing with no name is a
 * hole in the town's one promise about itself. */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const arg = (k, d) => { const a = process.argv.find(s => s.startsWith(k + '=')); return a ? a.slice(k.length + 1) : d; };
const t = +arg('--t', 175);
const [X0,Y0,X1,Y1] = arg('--box','585,462,732,556').split(',').map(Number);
const STEP = +arg('--step', 5);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
await p.goto(pathToFileURL(join(REPO, 'courtyard.html')).href + '?seed=42&pause&t=0');
await p.waitForFunction('window.__census');
await p.evaluate(t => { window.__reseed(); window.__setTime(0); window.__warp(t, 0.05); }, t);
await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
/* A dense HOVER sweep of the yard's screen box, read out of the sill's own #naming slot.
 * Printed as a map, one glyph a sample, because what matters is not that a name EXISTS but
 * that there is no HOLE in the picture where a drawn thing says nothing. */
const read = () => p.evaluate(() => (document.querySelector('#naming') || {}).textContent || '');
/* WARM UP FIRST. updateNaming refuses the pointer while a standing news line is still
 * inside its dwell (`innerWidth > 640 && now - lineAt < lineDwell`), so the first ~15
 * samples of a cold sweep come back EMPTY over ground that names itself perfectly well.
 * That is the instrument lying, not a hole in the town: hold one point until it answers
 * before the sweep starts, and separate NOT MEASURED from NOTHING THERE. */
await p.mouse.move(X0, Y1);
for (let k = 0; k < 60; k++){ if (await read()) break; await p.waitForTimeout(200); }
const names = new Map(); const glyphs = '.abcdefghijklmnopqrstuvwxyz';
const rows2 = [];
for (let y = Y0; y <= Y1; y += STEP){
  let line = '';
  for (let x = X0; x <= X1; x += STEP){
    await p.mouse.move(x, y);
    await p.waitForTimeout(150);
    const n = await read();
    if (!names.has(n)) names.set(n, names.size);
    line += glyphs[names.get(n)] || '?';
  }
  rows2.push([y, line]);
}
await b.close();
console.log(`hover sweep ${X0}..${X1} x ${Y0}..${Y1} step ${STEP}, t=${t}`);
for (const [y, line] of rows2) console.log(String(y).padStart(4), line);
console.log('');
for (const [n, i] of names) console.log(`  ${glyphs[i]}  ${n || '(NOTHING)'}`);
process.exit(0);

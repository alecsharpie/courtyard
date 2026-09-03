/* ease-land.mjs — does the camera announce its own arrival?
 *
 * A move holds ONE wide paint of the ground and the distance and repaints the
 * destination on the frame the ease stops, so the last frame of a move is a 1.4-2.6x
 * magnification of a cache and the next one is full detail. Nothing MOVES between those
 * two frames; the picture simply gets sharper, all at once.
 *
 * So: freeze the world, move the camera, and diff CONSECUTIVE frames. Through the ease
 * the diff is the camera's own motion and falls smoothly to nothing as viewEase()
 * flattens out; a repaint at the landing shows as a SPIKE against neighbours that are
 * almost still. The number quoted is that spike as a RATIO to the last eased frame's
 * own diff — how many times bigger the arrival is than the last of the movement it is
 * supposed to be the end of. 1 is "you cannot tell it landed".
 *
 * Every frame is drawn at ONE pinned instant with a fixed real dt, so the only thing
 * that changes down the series is the camera.
 *
 *   node probes/ease-land.mjs [seed] [simT] [quarter]
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const seed = +(process.argv[2] || 7), T = +(process.argv[3] || 175);
const QS = (process.argv[4] ? [+process.argv[4]] : [1, 2, 3, 4]);
const W = 1600, H = 950, RDT = 1 / 60, AFTER = 24;
const files = { HEAD: '/tmp/probe-land-head.html', CAND: '/tmp/probe-land-cand.html' };
writeFileSync(files.HEAD, execFileSync('git', ['show', 'HEAD:courtyard.html']).toString());
writeFileSync(files.CAND, readFileSync('courtyard.html', 'utf8'));

const b = await chromium.launch();
async function film(file, q){
  const pg = await b.newPage({ viewport: { width: W, height: H } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(pathToFileURL(file).href + `?pause&seed=${seed}&t=0`);
  await pg.waitForFunction('window.__census');
  const out = await pg.evaluate(({ T, q, RDT, AFTER }) => {
    const cv = document.querySelector('canvas');
    const SW = 400, SH = 240;
    const sm = document.createElement('canvas'); sm.width = SW; sm.height = SH;
    const stx = sm.getContext('2d', { willReadFrequently: true });
    const read = () => { stx.drawImage(cv, 0, 0, SW, SH); return stx.getImageData(0, 0, SW, SH).data; };
    const diff = (a, c) => { let s = 0; for (let i = 0; i < a.length; i += 4)
      s += Math.abs(a[i] - c[i]) + Math.abs(a[i + 1] - c[i + 1]) + Math.abs(a[i + 2] - c[i + 2]);
      return s / (a.length / 4 * 3); };
    window.__reseed(); window.__warp(T);
    window.__where(0); drawScene(T, 1 / 30);          // start wide, at rest, ground painted
    window.__where(q);                                 // …and move
    const ds = [], marks = [], keep = [];
    let prev = read();
    // VIEW_SECS is 0.9; run past it far enough to hold the whole of any dissolve
    const n = Math.ceil(0.9 / RDT) + AFTER;
    for (let i = 0; i < n; i++){
      const st = window.__where(undefined, RDT);
      drawScene(T, 1 / 30);
      const cur = read(); ds.push(diff(prev, cur)); prev = cur;
      marks.push(st.easing ? 'e' : (st.fade > 0 ? 'f' : '.'));
      keep.push(cur);
    }
    /* The SHEET is the difference series, not the frames: two pictures compared in turn
     * cannot be judged for sharpness by eye, and what this is about is a step BETWEEN
     * two frames. Each tile is |frame i - frame i-1| at 24x, so a tile that is dark is a
     * frame that changed nothing and the landing's crisp is a tile that lights up. */
    const last = marks.lastIndexOf('e');
    const from = last - 3, N = 12, GAP = 2;
    const sheet = document.createElement('canvas');
    sheet.width = N * (SW / 2 + GAP); sheet.height = SH / 2 + 16;
    const shx = sheet.getContext('2d');
    shx.fillStyle = '#111'; shx.fillRect(0, 0, sheet.width, sheet.height);
    const tile = document.createElement('canvas'); tile.width = SW; tile.height = SH;
    const ttx = tile.getContext('2d');
    for (let j = 0; j < N; j++){
      const i = from + j; if (i < 1 || i >= keep.length) continue;
      const a = keep[i - 1], c = keep[i], im = ttx.createImageData(SW, SH);
      for (let k = 0; k < a.length; k += 4){
        for (let ch = 0; ch < 3; ch++) im.data[k + ch] = Math.min(255, Math.abs(a[k + ch] - c[k + ch]) * 24);
        im.data[k + 3] = 255;
      }
      ttx.putImageData(im, 0, 0);
      const x = j * (SW / 2 + GAP);
      shx.drawImage(tile, x, 16, SW / 2, SH / 2);
      shx.fillStyle = i === last ? '#ffd479' : i === last + 1 ? '#7fd4ff' : '#888';
      shx.font = '11px monospace';
      shx.fillText((i - last >= 0 ? '+' : '') + (i - last), x + 3, 12);
    }
    return { ds, marks, sheet: sheet.toDataURL() };
  }, { T, q, RDT, AFTER });
  if (errs.length){ console.log('PAGE ERROR', file, errs[0]); process.exit(1); }
  await pg.close();
  return out;
}

console.log(`\nconsecutive-frame difference across a camera ease — seed ${seed}, simT ${T}, pinned instant\n`);
const QN = ['Wide', 'Courtyard', 'Street', 'Plaza', 'Far bank'];
for (const q of QS){
  const r = {};
  for (const [k, f] of Object.entries(files)){ r[k] = await film(f, q);
    writeFileSync(`shots/ease-land-q${q}-${k.toLowerCase()}.png`,
      Buffer.from(r[k].sheet.split(',')[1], 'base64')); }
  console.log(`  Wide -> ${QN[q]}`);
  for (const k of ['HEAD', 'CAND']){
    const { ds, marks } = r[k];
    const last = marks.lastIndexOf('e');               // the last frame still easing
    const tail = ds.slice(Math.max(0, last - 4), last + 1);
    const base = tail.sort((a, c) => a - c)[tail.length >> 1] || 1e-6;
    const after = ds.slice(last + 1);
    const peak = Math.max(...after), at = ds.indexOf(peak, last + 1);
    console.log('    ' + k.padEnd(6) + 'last eased frame ' + base.toFixed(3)
      + '   biggest frame AFTER it ' + peak.toFixed(3) + ' (frame +' + (at - last) + ')'
      + '   ratio ' + (peak / base).toFixed(1) + 'x');
    console.log('      ' + ds.map((d, i) => (i > last - 6 && i < last + 14)
      ? (d < 0.05 ? '.' : d < 0.3 ? ':' : d < 1 ? 'o' : d < 3 ? 'O' : '#') : '').join('')
      + '   (frames ' + (last - 5) + '..' + (last + 13) + ', landing at ' + last + ')');
  }
}
await b.close();

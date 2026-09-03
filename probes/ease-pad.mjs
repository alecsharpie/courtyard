/* ease-pad.mjs — how big a cache each of the two paddings actually asks for.
 * DEST: the shipped scheme (cache painted in the ease's destination) needs padding on
 * BOTH axes to hold what an intermediate frame reaches. WIDE: the ground cache's scheme
 * (cache painted in the wide view, scaled through the ease) needs padding on x only,
 * because the backdrop's content lives inside the wide canvas's own y band.
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const SIZES = [[1600, 950], [1200, 700], [900, 560], [1600, 1200], [390, 844]];
const b = await chromium.launch();
for (const [W, H] of SIZES){
  const pg = await b.newPage({ viewport: { width: W, height: H } });
  await pg.goto(pathToFileURL(process.cwd() + '/courtyard.html').href + '?pause&seed=7&t=0');
  await pg.waitForFunction('window.__census');
  const out = await pg.evaluate(({ W, H }) => {
    const V = [], names = [];
    for (let n = 0; n < 5; n++){ V.push(viewFor(n)); names.push(QUARTERS[n].name); }
    const rows = [];
    for (let n = 0; n < 5; n++){
      const a = V[n], t = V[(n + 1) % 5], k0 = a.s / t.s;
      const dx0 = a.ox - k0 * t.ox, dy0 = a.tp - k0 * t.tp;
      const padX = Math.ceil(Math.max(0, dx0 / k0, (W - dx0) / k0 - W));
      const padY = Math.ceil(Math.max(0, dy0 / k0, (H - dy0) / k0 - H));
      // the wide scheme: the two endpoint frames, mapped into WIDE screen space
      const wp = (v) => [v.ox / v.s - originX0, originX0 + (W - v.ox) / v.s - W];
      const padW = Math.ceil(Math.max(0, ...wp(a), ...wp(t)));
      rows.push({ move: names[n] + '->' + names[(n + 1) % 5],
        s: +a.s.toFixed(2) + '->' + +t.s.toFixed(2), tp: Math.round(a.tp) + '->' + Math.round(t.tp),
        padX, padY, destMpx: +(((W + 2 * padX) * (H + 2 * padY)) / 1e6).toFixed(2),
        padW, wideMpx: +(((W + 2 * padW) * H) / 1e6).toFixed(2) });
    }
    return { rows, base: { topPad0: Math.round(topPad0), cellH0: +cellH0.toFixed(2), plainMpx: +(W * H / 1e6).toFixed(2), gpad: groundPad() } };
  }, { W, H });
  console.log(`\n${W}x${H}  topPad0 ${out.base.topPad0}  cellH0 ${out.base.cellH0}  groundPad ${out.base.gpad}  frame ${out.base.plainMpx} Mpx`);
  for (const r of out.rows)
    console.log(`  ${r.move.padEnd(22)} s ${r.s.padEnd(12)} tp ${r.tp.padEnd(12)} | dest pad ${String(r.padX).padStart(5)},${String(r.padY).padStart(5)} = ${String(r.destMpx).padStart(6)} Mpx | wide pad ${String(r.padW).padStart(5)} = ${String(r.wideMpx).padStart(6)} Mpx`);
  await pg.close();
}
await b.close();

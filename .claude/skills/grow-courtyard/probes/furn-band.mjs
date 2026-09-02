/* furn-band.mjs (#123) — where the working roof's furniture lands, per framing.
 *
 * The band has two ends and both can silently break. SOUTH: sillTop() eats the bottom
 * of every frame and the world depth it lands at is a function of the WINDOW — 81.79 at
 * 1280x700, off the end of the world at 1600x950 — so anything bounded in rows vanishes
 * at a short one (measured on HEAD before #123: 0 of 21 on-canvas pieces visible at two
 * of the five tracked framings). NORTH: LIFT carries a cell of height 1.15 of depth
 * north, so a tall thing standing safely on the roof still reaches over the parapet into
 * the lane, where the live walkers are drawn ON TOP of it because our side of the
 * picture is ground-cache work.
 *
 * Reports the DRAWN box (what "on screen" means) separately from roofFurnAt()'s hit box,
 * which is deliberately a little larger. Geometry only — no seeded draw, so it is
 * directly comparable between builds.
 *
 *   node probes/furn-band.mjs [page.html] [--v] */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(resolve(process.cwd(), process.argv[2] || 'courtyard.html')).href;
const FRAMES = [[1600,950,'wide'],[1440,900,'laptop'],[1280,700,'shortest'],[1200,720,'short'],[390,844,'phone']];
const verbose = process.argv.includes('--v');
const b = await chromium.launch();
for (const [w,h,name] of FRAMES){
  const ctx = await b.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  await p.goto(`${PAGE}?seed=42&t=0&pause`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(() => {
    const st = sillTop(), out = { st:+st.toFixed(1), H, pieces: [] };
    for (const f of ROOF_FURN){
      const line = f.kind === 'line';
      const cx = line ? (f.x + f.x1) / 2 : f.x;
      const z = nearZ(clamp(Math.floor(cx), 0, GW - 1), Math.floor(f.y));
      const bx = line ? null : FURN_BOX[f.kind];
      const x0 = line ? f.x : f.x - bx.w, d = line ? 0.30 : bx.d;
      const zt = z + (line ? WASH_H : f.kind === 'tank' ? bx.legh + bx.hgt : bx.base + bx.hgt + bx.rid);
      const zb = line ? zt - (WASH_DROP + WASH_DROP_R) : z;
      const top = project(x0, f.y - d, zt)[1], bot = project(x0, f.y + d, zb)[1];
      // the DRAWN picture, which is what "on screen" means; the box above is the HIT box
      const e = furnEdges(f.kind);
      const dTop = project(x0, f.y - e.dy, z + e.dzHi)[1], dBot = project(x0, f.y + e.dy, z + e.dzLo)[1];
      const onX = project(cx, f.y, zt)[0];
      out.pieces.push({ kind:f.kind, x:+cx.toFixed(1), y:+f.y.toFixed(2),
        depth:+(f.y - z*LIFT).toFixed(2), top:+top.toFixed(0), bot:+bot.toFixed(0),
        vis:+Math.max(0, Math.min(1, (st - dTop) / Math.max(1e-6, dBot - dTop))).toFixed(2),
        hit:+Math.max(0, Math.min(1, (st - top) / Math.max(1e-6, bot - top))).toFixed(2),
        offX: onX < 0 || onX > W,
        topD:+((f.y - e.dy) - (z + e.dzHi)*LIFT).toFixed(2) });
    }
    out.laneD = LN_WALK_S; out.copeD = +(PARA_Y - PARA_Z*LIFT).toFixed(2);
    return out;
  });
  const on = r.pieces.filter(q => !q.offX);
  const full = on.filter(q => q.vis >= 0.999).length;
  const maj  = on.filter(q => q.vis >= 0.5).length;
  const any  = on.filter(q => q.vis > 0).length;
  const none = on.filter(q => q.vis === 0).length;
  console.log(`\n== ${name} ${w}x${h}  sillTop=${r.st}  pieces=${r.pieces.length} (${r.pieces.length-on.length} off-canvas in x)`);
  const hfull = on.filter(q => q.hit >= 0.999).length;
  console.log(`   of ${on.length} on-canvas:  DRAWN fully visible ${full}   >=50% ${maj}   any ${any}   COVERED ${none}   (hit box whole: ${hfull})`);
  const north = Math.min(...on.map(q => q.topD));
  console.log(`   northmost drawn point depth ${north.toFixed(2)}  (parapet coping ${r.copeD}, lane's south walking line ${r.laneD}) — ${north > r.laneD ? 'CLEAR' : 'IN THE ROAD'}`);
  if (verbose) for (const q of on)
    console.log(`   ${q.kind.padEnd(5)} x${String(q.x).padStart(6)} y${q.y} depth ${q.depth}  top ${String(q.top).padStart(4)} bot ${String(q.bot).padStart(4)}  vis ${q.vis}`);
  await ctx.close();
}
await b.close();

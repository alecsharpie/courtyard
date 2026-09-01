/* probe-lowroof.mjs — where the lower near roof actually lands, per framing.
 * Rows 79..87 x a few x, projected; sill line; how much canvas the band below the
 * ridge occupies. Run on HEAD and on a candidate: geometry only, no seeded draw. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(resolve(process.cwd(), process.argv[2] || 'courtyard.html')).href;
const FRAMES = [[1600,950,'wide'],[390,844,'phone'],[1200,720,'short'],[1280,700,'shortest']];
const browser = await chromium.launch();
for (const [w,h,name] of FRAMES){
  const ctx = await browser.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  await p.goto(`${PAGE}?seed=42&t=0&pause`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(() => {
    const st = sillTop(), out = { sillTop:+st.toFixed(1), H, W, cellH:+cellH.toFixed(2), cellW:+cellW.toFixed(2), rows:[] };
    for (let y = 79; y <= 88; y++){
      const zs = [10, 40, 70, 100].map(x => nearZ(x, y));
      const z = zs[1];
      const sy = project(20.5, y + 0.5, nearZ(20, y))[1];
      out.rows.push({ y, z:+z.toFixed(2), depth:+(y - z*LIFT).toFixed(2), sy:+sy.toFixed(0),
                      vis: sy <= st, frac:+((st - sy)/H).toFixed(3) });
    }
    // depth at which the sill line sits, solved on the pitch at x=20
    let sd = null;
    for (let y = 79; y <= 88; y += 0.02){ const sy = project(20.5, y, nearZ(20, Math.floor(y)))[1];
      if (sy > st){ sd = +(y - nearZ(20, Math.floor(y))*LIFT).toFixed(2); break; } }
    out.sillDepth = sd;
    // rows per screen-row: how tall row 85..87 is on screen
    const a = project(20.5, 84.6, nearZ(20,84))[1], b = project(20.5, 87.9, nearZ(20,87))[1];
    out.belowRidgePx = +(Math.min(b, st) - a).toFixed(0);
    out.belowRidgeFrac = +((Math.min(b, st) - a)/H).toFixed(3);
    return out;
  });
  console.log(`\n== ${name} ${w}x${h}  H=${r.H} sillTop=${r.sillTop} sillDepth=${r.sillDepth} cell=${r.cellW}x${r.cellH}`);
  console.log(`   below ridge (84.6..87.9) visible: ${r.belowRidgePx}px = ${(r.belowRidgeFrac*100).toFixed(1)}% of canvas height`);
  for (const q of r.rows) console.log(`   row ${q.y}  z ${q.z}  depth ${q.depth}  sy ${q.sy}  ${q.vis?'VIS':'hidden'}`);
  await ctx.close();
}
await browser.close();

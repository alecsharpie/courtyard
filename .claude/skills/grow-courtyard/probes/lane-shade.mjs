/* #151 — what the town's OWN buildSunShade puts on the LANE, HEAD vs candidate.
 * shade-diff.mjs grades the picture; this grades the mask, which is the thing the
 * near block's casting height actually moves. Three reads no pixel diff can give:
 *
 *  1. shOpen, byte-compared across the two builds. The near block has TWO heights —
 *     the DRAWN one the occlusion walk reads and the CAST one the march reads — and
 *     conflating them clears shOpen off the near lane and DELETES shade. If this line
 *     says anything but `true`, the casting height has leaked into the walk.
 *  2. Every mask sub-cell attributed by grid class and by which side of the lane it
 *     is on, so "north of the lane is untouched" is a number and not an opinion.
 *  3. The shade's northern edge on the lane, per instant, over four seasons — the
 *     thing that is supposed to retreat under the parapet toward noon.
 *
 *   node .../probes/lane-shade.mjs [base] [cand]      (base defaults to /tmp/head.html) */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const browser = await chromium.launch();
async function grab(file){
  const ctx = await browser.newContext({ viewport:{ width:1600, height:950 }, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  await p.goto(pathToFileURL(resolve(process.cwd(), file)).href + '?seed=42&pause', { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(() => {
    const openSig = Array.from(shOpen).join('');
    const rows = [];
    for (const [day, hour] of [[0,7],[0,9],[0,13],[0,17],[0,19],[6,8],[6,13],[6,18],[13,19],[19,7],[19,13],[19,15]]){
      __reseed(); __setTime(day * DAY_LEN + (hour - 6) * (DAY_LEN / 24));
      drawScene(simT, 1/30);
      const q = { road:0, walk:0, court:0, other:0, north:0 };
      const SUB = BSH_SUB, MW = BSH_W;
      for (let y = 0; y < WH; y++) for (let mx = 0; mx < MW; mx++){
        if (!shMask[y*MW+mx]) continue;
        const g = grid[y*GW + ((mx/SUB)|0)];
        if (y >= LN_WALK_N && y < LN_WALK_S){ if (g === 7) q.road++; else if (g === 6) q.walk++; else q.other++; }
        else if (y < LN_WALK_N) q.north++;
        else q.court++;      // south of the lane. shOpen is WATER-ONLY there (rows 79..87,
                             // 15 cells each), so every one of these lands on the river.
      }
      // the shade's northern edge on the lane, per the south footway's own columns
      let edge = 99;
      for (let y = LN_WALK_N; y < LN_WALK_S; y++) for (let mx = 0; mx < MW; mx++) if (shMask[y*MW+mx]){ edge = Math.min(edge, y); break; }
      rows.push({ day, hour, f:+sunShadeF().toFixed(3), ...q, edge });
    }
    return { openSig, rows };
  });
  await ctx.close();
  return r;
}
const A = await grab(process.argv[2] || '/tmp/head.html');
const B = await grab(process.argv[3] || 'courtyard.html');
await browser.close();
console.log('shOpen identical HEAD vs cand:', A.openSig === B.openSig,
  A.openSig === B.openSig ? '' : ' differing cells: ' + [...A.openSig].filter((c,i)=>c!==B.openSig[i]).length);
console.log('\nshMask sub-cells, by where they land   (HEAD -> cand)');
console.log('day hr  sunShadeF |    lane ROAD |    lane SIDE |  north of lane | south of lane | N edge');
for (let i = 0; i < A.rows.length; i++){
  const a = A.rows[i], b = B.rows[i];
  const c = (k) => `${a[k]} -> ${b[k]}`.padStart(14);
  console.log(`${String(a.day).padStart(3)} ${String(a.hour).padStart(2)}  ${String(a.f).padStart(9)} |${c('road')}|${c('walk')}|${c('north')}|${c('court')}| ${a.edge} -> ${b.edge}`);
}

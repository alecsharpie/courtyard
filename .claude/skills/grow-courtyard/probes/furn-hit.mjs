/* furn-hit.mjs (#123) — does each piece of roof furniture still answer for ITSELF?
 *
 * roofFurnAt() is asked at the point each piece is DISPLAYED at, on HEAD and on the
 * tree, at the framing where the whole roof shows and at the shortest one. Two ways to
 * lose a piece: the sill covers it (HEAD, 21 of 21 at 1280x700), or a neighbour's hit
 * box swallows it — a washing line's box spans its whole run, so once the band was one
 * depth deep the cords answered for the tanks and lofts standing behind them, 4 of 21,
 * until the cords were shortened clear of them. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
// regenerate HEAD inside the probe — a fixture on disk is a fixture nobody re-pinned
writeFileSync('/tmp/head-courtyard.html', execSync('git show HEAD:courtyard.html', {cwd: process.cwd(), maxBuffer: 1 << 26}));
const b = await chromium.launch();
for (const [page, tag] of [['/tmp/head-courtyard.html','HEAD'], ['courtyard.html','tree']]){
  for (const [w,h,fr] of [[1600,950,'wide'],[1280,700,'shortest']]){
    const ctx = await b.newContext({ viewport:{width:w,height:h} });
    const p = await ctx.newPage();
    await p.goto(`${pathToFileURL(resolve(process.cwd(), page)).href}?seed=42&t=0&pause`, {waitUntil:'load'});
    await p.waitForFunction(() => typeof window.__warp === 'function');
    const r = await p.evaluate(() => {
      __reseed(); __warp(230); drawScene(230, 1/30);
      const z0 = f => nearZ(clamp(Math.floor(f.kind==='line' ? (f.x+f.x1)/2 : f.x),0,GW-1), Math.floor(f.y));
      // the point the piece is DISPLAYED at: the middle of its own visible body
      const at = f => f.kind==='tank' ? project(f.x, f.y + 0.55, z0(f) + 0.76)
                    : f.kind==='loft' ? project(f.x, f.y + 0.42, z0(f) + 0.56)
                    : project((f.x + f.x1)/2, f.y, z0(f) + WASH_H - 0.42);
      let own = 0, other = 0, none = 0, off = 0, hidden = 0; const wrong = [];
      for (const f of ROOF_FURN){
        const q = at(f);
        if (q[0] < 4 || q[0] > W - 4){ off++; continue; }
        if (nearHidden(f.y, q[1])){ hidden++; continue; }
        const got = roofFurnAt(q);
        if (got === f) own++;
        else if (got){ other++; wrong.push(`${f.kind}@${f.x.toFixed(0)} -> ${got.kind}`); }
        else { none++; wrong.push(`${f.kind}@${f.x.toFixed(0)} -> nothing`); }
      }
      return {own, other, none, off, hidden, n: ROOF_FURN.length, wrong};
    });
    console.log(`${tag} ${fr}: of ${r.n} pieces — ${r.off} off-canvas, ${r.hidden} behind the sill; ` +
                `answers for ITSELF ${r.own}, for another ${r.other}, nothing ${r.none}`);
    if (r.wrong.length) console.log(`    ${r.wrong.join(', ')}`);
    await ctx.close();
  }
}
await b.close();

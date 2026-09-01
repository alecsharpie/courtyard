/* drawSill is baked into the GROUND CACHE and every live item sorts after it, so anything
 * that projects below sillTop() is drawn ON TOP of the painted sill — cue c156's exact
 * fault. ROOF_S was chosen so the band clears the sill at the SHORTEST framing; this
 * asserts it over a full run at all three tracked framings. Margin printed, not a bare 0.
 * usage: node probe-roof-sill.mjs */
import path from 'path'; import { homedir } from 'node:os'; import { pathToFileURL } from 'node:url';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = path.resolve(new URL('.', import.meta.url).pathname, '../../../..');
const ART = path.join(REPO, 'courtyard.html');
const br = await chromium.launch();
for (const [w, h] of [[1600,950],[1200,720],[390,844]]){
  let worst = Infinity, at = null, n = 0;
  for (const seed of [3, 11, 29]){
    const p = await br.newPage(); await p.setViewportSize({ width: w, height: h });
    await p.goto('file://' + ART + `?seed=${seed}&t=0&pause`); await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      window.__reseed(); let worst = Infinity, at = null, n = 0;
      for (let i = 0; i < 2000; i++){
        window.__warp(0.25);
        const st = sillTop();
        const put = (x, y, z, tag) => { n++;
          const m = st - project(x, y, z)[1];     // + = above the sill, - = drawn over it
          if (m < worst){ worst = m; at = tag + ' y=' + y.toFixed(2); } };
        for (const b of birds) if (b.roof) put(b.x, b.y, b.z, 'bird/' + b.perch);
        if (catA && catA.y > 78) put(catA.x, catA.y, catA.z || 0, 'cat/' + catA.leg);
      }
      return { worst, at, n };
    });
    if (r.n && r.worst < worst){ worst = r.worst; at = r.at; }
    n += r.n; await p.close();
  }
  const ok = worst > 0;
  console.log(`${w}x${h}  ${String(n).padStart(6)} samples  closest approach to sillTop: ${worst.toFixed(1)} css px  (${at})  ${ok ? 'PASS — clear of the sill' : 'FAIL — drawn over the sill'}`);
}
await br.close();

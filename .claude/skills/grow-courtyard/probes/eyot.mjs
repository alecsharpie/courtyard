// probe-eyot.mjs — b85: (1) boat frames inside the eyot over ten seeds, one spawn→despawn each;
// (2) swan samples on the turf (must be 0) and preens against the eyot's shore (must be > 0);
// (3) the naming. All stepping inside ONE evaluate per seed; the cell test is the page's own onEyot().
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
import { pathToFileURL } from 'node:url';
const { chromium } = (await import(pathToFileURL(join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js')).href)).default;
const PAGE = pathToFileURL(resolve(new URL('../../../../courtyard.html', import.meta.url).pathname)).href;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
let boatIn = 0, boatFrames = 0, boats = 0, swanOn = 0, swanFrames = 0, preenEyot = 0, preenAll = 0, preenSeeds = 0;
for (let seed = 1; seed <= 10; seed++){
  const p = await ctx.newPage();
  p.on('pageerror', e => console.error('PAGE ERROR', e));
  await p.goto(`${PAGE}?seed=${seed}&t=0&pause`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(() => {
    window.__reseed();
    const out = { boats: 0, boatFrames: 0, boatIn: 0, swanFrames: 0, swanOn: 0, preenEyot: 0, preenAll: 0, worst: 9 };
    let lastBoat = null, seen = 0;
    for (let k = 0; k < 4 * 220; k++){          // 4 days at 0.25 s
      window.__warp(0.25);
      const es = window.__entities();
      const b = es.find(e => e.kind === 'boat');
      if (b){ if (b.id !== lastBoat){ out.boats++; lastBoat = b.id; }
        out.boatFrames++;
        for (const [dx, dy] of [[-0.5, -0.9], [0.5, -0.9], [-0.5, 0.9], [0.5, 0.9], [0, 0]]) if (onEyot(b.x + dx, b.y + dy)){ out.boatIn++; break; }
        const sh = eyotShore(b.x, b.y)[2]; if (sh < out.worst) out.worst = sh; }
      for (const s of es.filter(e => e.kind === 'swan')){
        out.swanFrames++;
        if (onEyot(s.x, s.y)) out.swanOn++;
        if (s.act === 'preen'){ out.preenAll++;
          const sh = eyotShore(s.x, s.y)[2];
          if (sh < SWAN_BANK && sh < Math.min(s.x - (RIVER_X0 + 1.6), RIVER_X1 - 1.6 - s.x)) out.preenEyot++; }
      }
    }
    // naming, at the end of the run (spring? read nestF)
    drawScene(simT, 1 / 30);
    const w = project(WILLOW.x + WILLOW_LEAN, WILLOW.y, WILLOW_H * (0.7 + 0.3 * maturity()));
    const ed = ducks.find(d => d.eyot);
    const dn = ed ? lookAt([project(ed.x, ed.y, 0)[0], project(ed.x, ed.y, 0)[1] - cellH * 0.3]) : '(no eyot duck: nestF ' + nestF().toFixed(2) + ')';
    out.names = [nameAt(124, 46), nameAt(123, 42), nameAt(125, 50), nameAt(122, 46), lookAt(w), dn];
    out.nest = +nestF().toFixed(2); out.season = +seasonPhase.toFixed(3);
    return out;
  });
  console.log(`seed ${seed}: boats ${r.boats} frames ${r.boatFrames} inside ${r.boatIn} (nearest shore ${r.worst.toFixed(2)}) · swan frames ${r.swanFrames} onTurf ${r.swanOn} · preen ${r.preenAll} atEyot ${r.preenEyot} · season ${r.season} nest ${r.nest}`);
  if (seed === 1 || seed === 10) console.log('   names:', JSON.stringify(r.names));
  boatIn += r.boatIn; boatFrames += r.boatFrames; boats += r.boats; swanOn += r.swanOn; swanFrames += r.swanFrames; preenEyot += r.preenEyot; preenAll += r.preenAll; if (r.preenEyot) preenSeeds++;
  await p.close();
}
await browser.close();
console.log(`TOTAL boats ${boats}, boat frames ${boatFrames}, inside eyot ${boatIn} · swan frames ${swanFrames}, on turf ${swanOn} · preen samples ${preenAll}, at the eyot ${preenEyot} (${preenSeeds}/10 seeds)`);
console.log(boatIn === 0 && swanOn === 0 && preenEyot > 0 ? 'PASS' : 'FAIL');

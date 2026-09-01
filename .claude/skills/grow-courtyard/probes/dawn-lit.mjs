// is a dawn ALREADY lit by the nid mechanism? LIT_PANES at sunUp-0.8, -0.5, 0, +0.4, +0.5 on summer + winter days, 4 seeds, drawn inside ONE evaluate
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = resolve(process.argv[2] || 'courtyard.html');
const b = await chromium.launch();
for (const seed of [1, 7, 42, 99]){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + '?pause&seed=' + seed);
  await p.waitForFunction(() => window.__warp);
  const out = await p.evaluate(() => {
    const res = [];
    for (const [label, d] of [['summer', 6], ['winter', 19]]){
      window.__reseed(); window.__setTime(d * DAY_LEN + DAY_LEN * (20 - 6) / 24);   // 20:00 the evening before
      const s = sunAt(simT + DAY_LEN * 0.4); // tomorrow's sun, roughly
      const row = { label, sunUp: +s.up.toFixed(2), at: [] };
      for (const off of [-0.8, -0.5, -0.2, 0, 0.2, 0.4, 0.5]){
        const tgt = s.up + off;               // hour tomorrow
        let need = ((tgt - hour) % 24 + 24) % 24; window.__warp(need / 24 * DAY_LEN);
        drawScene(simT, 1 / 30);
        const homes = LIT_PANES.length;       // all lit panes this frame
        let home64 = 0, homesReg = 0;
        for (const [wx, wy, zTop, hgt, sa, sb] of WINDOWS) if (windowLit(sa, sb)){ if (sb === 64) home64++; const h = HOMES.get(sa*1000+sb); if (h) homesReg++; }
        row.at.push({ off, hour: +hour.toFixed(2), nightF: +nightF.toFixed(2), lit: homes, row64: home64, inHOMES: homesReg });
      }
      res.push(row);
    }
    return { res, dawnEdgeK: NIGHT_K, W: WINDOWS.length };
  });
  console.log('seed', seed, 'WINDOWS', out.W, 'NIGHT_K', out.dawnEdgeK.toFixed(3));
  for (const r of out.res){ console.log(' ', r.label, 'sunUp', r.sunUp); for (const a of r.at) console.log('   ', String(a.off).padStart(5), 'h', a.hour, 'nightF', a.nightF, 'lit', a.lit, 'row64', a.row64, 'inHOMES', a.inHOMES); }
  await p.close();
}
await b.close();

/* b146 — how far the church tower's own shadow actually REACHES, read off the shipped
 * shMask rather than solved on paper. Marks west/north of the tower's footprint, in the
 * rows the tower can throw into, with the nave's contribution held out by comparing the
 * mask built with the tower's cells against one built without them.
 *   node probe-tower-reach.mjs
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
const INSTANTS = [[387.3, 'midsummer 7h'], [389.6, 'midsummer 8h'], [391.9, 'midsummer 9h'],
                  [717.3, 'equinox 7h'], [719.6, 'equinox 8h'], [1112.3, 'midwinter 9h']];
for (const [file, name] of [['/tmp/head.html', 'HEAD'], ['courtyard.html', 'cand']]){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=42&pause');
  await p.waitForFunction('typeof __warp === "function"');
  const rows = await p.evaluate((INSTANTS) => INSTANTS.map(([t, label]) => {
    __setTime(t); drawScene(simT, 1 / 30);
    const isTower = i => { const x = i % GW, y = (i / GW) | 0;
      return x >= 131 && x < 134 && y >= 4 && y < 8; };
    const snap = () => { buildSunShade(); return shMask.slice(); };
    shMaskKey = ''; const withT = snap();
    const save = []; for (let i = 0; i < GW * WH; i++) if (isTower(i)){ save.push(shTop[i]); shTop[i] = 0; }
    shMaskKey = ''; const without = snap();
    let k = 0; for (let i = 0; i < GW * WH; i++) if (isTower(i)) shTop[i] = save[k++];
    shMaskKey = '';
    let minX = 1e9, minY = 1e9, n = 0;
    for (let y = 0; y < WH; y++) for (let mx = 0; mx < BSH_W; mx++){
      const j = y * BSH_W + mx;
      if (!withT[j] || without[j]) continue;                 // the tower's OWN contribution
      n++; const cx = mx / BSH_SUB; if (cx < minX) minX = cx; if (y < minY) minY = y;
    }
    return { label, hour: +hour.toFixed(1), n, minX: n ? +minX.toFixed(2) : null, minY: n ? minY : null,
             reach: n ? +(133.85 - minX).toFixed(2) : 0, top132_7: +shTop[7 * GW + 132].toFixed(2) };
  }), INSTANTS);
  for (const r of rows) console.log(name.padEnd(5), r.label.padEnd(14),
    'shTop(132,7)', String(r.top132_7).padStart(5),
    '| own subcells', String(r.n).padStart(4),
    '| west tip x', String(r.minX ?? '—').padStart(6), '(reach', String(r.reach).padStart(5) + ' cells)',
    '| north tip row', r.minY ?? '—');
  await p.close();
}
await b.close();

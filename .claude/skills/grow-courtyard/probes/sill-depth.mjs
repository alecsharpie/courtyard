/* What WORLD DEPTH does sillTop() sit at, per framing? The band has to be bounded in
 * depth (y - z*LIFT), which is world state, not in rows — because near a light well the
 * roof falls to nothing, so the same row is 1.7 depth lower there than on the pitch. */
import path from 'path'; import { homedir } from 'node:os'; import { pathToFileURL } from 'node:url';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = path.resolve(new URL('.', import.meta.url).pathname, '../../../..');
const ART = path.join(REPO, 'courtyard.html');
const br = await chromium.launch();
for (const [w, h] of [[1600,950],[1200,720],[390,844],[1440,760],[1280,700]]){
  const p = await br.newPage(); await p.setViewportSize({ width: w, height: h });
  await p.goto('file://' + ART + '?seed=3&t=0&pause'); await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    const st = sillTop();
    let d = 60; while (d < 120 && project(40, d, 0)[1] < st) d += 0.01;   // depth at the sill's top edge
    const cellHpx = project(40, 81, 0)[1] - project(40, 80, 0)[1];
    return { st:+st.toFixed(0), d:+d.toFixed(2), cellHpx:+cellHpx.toFixed(2) };
  });
  console.log(`${String(w)+'x'+h}`.padEnd(10) + `sillTop ${r.st} css px  =  world depth ${r.d}   (1 depth = ${r.cellHpx} px)`);
  await p.close();
}
await br.close();

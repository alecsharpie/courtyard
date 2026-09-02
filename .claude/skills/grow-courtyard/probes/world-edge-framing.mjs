import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
for (const [W,H] of [[1600,950],[1280,700],[390,844]]){
  const pg = await (await b.newContext({viewport:{width:W,height:H}})).newPage();
  await pg.goto(pathToFileURL(process.cwd()+'/courtyard.html').href + '?pause&seed=7');
  await pg.waitForTimeout(600);
  const r = await pg.evaluate(() => {
    const out = {W:cv.width};
    for (let q = 0; q < QUARTERS.length; q++){
      applyView(viewFor(q));
      out[QUARTERS[q].name] = { box: JSON.stringify(QUARTERS[q].box || QUARTERS[q]).slice(0,80),
        spine: Math.round(project(137.2,31,0)[0]), edge: Math.round(project(138,31,0)[0]),
        gateOut: Math.round(project(139.9,31,0)[0]), far130: Math.round(project(130,31,0)[0]) };
    }
    return out;
  });
  console.log(`\n${W}x${H}  canvas ${r.W}px wide`);
  for (const k of Object.keys(r)) if (k !== 'W')
    console.log('  ' + k.padEnd(10), `spine137.2=${r[k].spine}  edge138=${r[k].edge}  field139.9=${r[k].gateOut}` +
      (r[k].edge > r.W ? '   <-- BOUNDARY OFF CANVAS' : r[k].gateOut > r.W ? '   (field beyond is clipped)' : ''));
  await pg.close();
}
await b.close();

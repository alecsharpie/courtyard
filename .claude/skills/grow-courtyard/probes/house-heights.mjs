/* house-heights.mjs — what the town's storey-heights actually ARE, on both builds.
 * Reads eaveM off the page: per terrace, how many distinct eaves, how many steps
 * along the run, the extremes against the church (7.8), and the lowest eave over an
 * ARCH — a house that drops below its own passage is the failure this guards.
 * usage: node house-heights.mjs [--page courtyard.html] [--seeds 7,42,1234] */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const arg = (n,d)=>{const i=process.argv.indexOf(n);return i!==-1&&process.argv[i+1]?process.argv[i+1]:d;};
const br = await chromium.launch();
for (const seed of (arg('--seeds','7,42,1234')).split(',')){
  const pg = await br.newPage({ viewport:{width:1600,height:950} });
  await pg.goto(pathToFileURL(resolve(REPO, arg('--page','courtyard.html'))).href + `?pause&t=0&seed=${seed}`);
  await pg.waitForFunction(() => window.__census);
  const r = await pg.evaluate(() => {
    const TER = [
      ['north row  y=1',  Array.from({length:138},(_,x)=>[x,1])],
      ['gatehouse  y=62', Array.from({length:138},(_,x)=>[x,62])],
      ['west wall  x=1',  Array.from({length:58},(_,i)=>[1,i+3])],
      ['east wall  x=62', Array.from({length:58},(_,i)=>[62,i+3])],
      ['tall terr. x=97', Array.from({length:64},(_,y)=>[97,y])],
    ];
    const out = [];
    let hi = 0, lo = 99, arches = 0, archLow = 99;
    for (const [name, cells] of TER){
      const e = [];
      for (const [x,y] of cells){ if (solidM[y*138+x]) e.push(+eaveM[y*138+x].toFixed(3)); else e.push(null); }
      const v = e.filter(z => z !== null);
      let steps = 0;
      for (let i=1;i<e.length;i++) if (e[i]!==null && e[i-1]!==null && Math.abs(e[i]-e[i-1])>0.02) steps++;
      out.push({ name, cells:v.length, levels:new Set(v).size, steps,
                 min:Math.min(...v), max:Math.max(...v) });
      hi = Math.max(hi, ...v); lo = Math.min(lo, ...v);
    }
    for (let y=0;y<79;y++) for (let x=0;x<138;x++){
      if (grid[y*138+x] !== TUNNEL) continue;
      arches++; archLow = Math.min(archLow, eaveM[y*138+x]);
    }
    return { out, hi, lo, arches, archLow, chimneys: __census().structure.chimneys };
  });
  console.log('\nseed', seed, ' tallest house', r.hi.toFixed(2), '(church 7.8) · lowest', r.lo.toFixed(2),
              '· arch cells', r.arches, 'min eave over an arch', r.archLow.toFixed(2), '· chimneys', r.chimneys);
  for (const t of r.out)
    console.log('  ', t.name.padEnd(16), 'solid', String(t.cells).padStart(3),
      ' distinct eaves', String(t.levels).padStart(2), ' steps along it', String(t.steps).padStart(3),
      ' ', t.min.toFixed(2), '..', t.max.toFixed(2));
  await pg.close();
}
await br.close();

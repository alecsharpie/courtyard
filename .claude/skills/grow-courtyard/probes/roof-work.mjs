/* probe-roofwork.mjs — does the new lower-roof life actually HAPPEN, and what does the
 * sill cost it? Three questions, one page each, HEAD as its own control where it has one.
 *
 *   1. washOut(): what share of a YEAR has washing pegged out, and does it come in?
 *   2. the loft perch: do birds land on it, and how many of the roof's birds are there?
 *   3. the sill blink: at each framing, what share of a roof-walking cat's samples and of
 *      loft-bird samples is nearHidden() suppressing?
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const page_ = process.argv[2] || 'courtyard.html';
const PAGE = pathToFileURL(resolve(process.cwd(), page_)).href;
const HEAD = page_.includes('head');
const browser = await chromium.launch();

/* ---------- 1 + 2: a year of the roof, at 1600x950 ---------- */
{
  const ctx = await browser.newContext({ viewport:{width:1600,height:950}, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  await p.goto(`${PAGE}?seed=42&t=0&pause`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate((isHead) => {
    window.__reseed();
    let outN = 0, dayN = 0, wetN = 0, perch = {}, lofts = isHead ? 0 : LOFTS.length, furn = isHead ? 0 : ROOF_FURN.length;
    let seen = 0, roofBirdSamples = 0;
    for (let k = 0; k < 2400; k++){          // 2400 x 0.5 s = 1200 s = ~22 days
      window.__warp(0.5);
      const lit = daylight > 0.25;
      if (lit){ dayN++; if (!isHead && washOut()) outN++; if (wetF() > 0.22) wetN++; }
      for (const b of birds) if (b.roof){ roofBirdSamples++; perch[b.perch] = (perch[b.perch]||0) + 1; }
    }
    return { outShare: dayN ? outN/dayN : 0, wetShare: dayN ? wetN/dayN : 0, dayN, perch, roofBirdSamples, lofts, furn };
  }, HEAD);
  console.log(`\n== ${page_}  22 days, 0.5 s steps`);
  console.log(`   ROOF_FURN ${r.furn}   LOFTS ${r.lofts}`);
  console.log(`   washing out on ${(r.outShare*100).toFixed(1)}% of daylit samples (roof wet on ${(r.wetShare*100).toFixed(1)}%)`);
  console.log(`   roof-bird samples ${r.roofBirdSamples}  by perch:`, JSON.stringify(r.perch));
  await ctx.close();
}

/* ---------- 3: what the sill eats, per framing ---------- */
for (const [w,h,name] of [[1600,950,'wide'],[390,844,'phone'],[1200,720,'short'],[1280,700,'shortest']]){
  const ctx = await browser.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  await p.goto(`${PAGE}?seed=42&t=0&pause`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(() => {
    window.__reseed();
    let catN = 0, catHid = 0, loftN = 0, loftHid = 0, ymin = 99, ymax = -99;
    for (let k = 0; k < 4000; k++){
      window.__warp(0.25);
      if (catA && (catA.leg === 'ridge')){
        const sy = project(catA.x, catA.y, catA.z || 0)[1];
        catN++; if (nearHidden(catA.y, sy)) catHid++;
        ymin = Math.min(ymin, catA.y); ymax = Math.max(ymax, catA.y);
      }
      for (const b of birds) if (b.roof && b.perch === 'loft'){
        const sy = project(b.x, b.y, b.z)[1];
        loftN++; if (nearHidden(b.y, sy)) loftHid++;
      }
    }
    return { catN, catHid, loftN, loftHid, ymin:+ymin.toFixed(2), ymax:+ymax.toFixed(2), sillTop:+sillTop().toFixed(0) };
  });
  console.log(`   ${name.padEnd(9)} sill ${String(r.sillTop).padStart(4)}  cat on roof ${String(r.catN).padStart(4)} samples, ` +
              `${r.catN?((r.catHid/r.catN)*100).toFixed(1):'-'}% hidden (y ${r.ymin}..${r.ymax})  ·  ` +
              `loft birds ${String(r.loftN).padStart(4)} samples, ${r.loftN?((r.loftHid/r.loftN)*100).toFixed(1):'-'}% hidden`);
  await ctx.close();
}
await browser.close();

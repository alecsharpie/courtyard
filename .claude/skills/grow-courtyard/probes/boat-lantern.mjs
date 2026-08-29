import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILES = { HEAD: '/tmp/courtyard-head.html', HERE: new URL('../../../../courtyard.html', import.meta.url).pathname };
const br = await chromium.launch();
async function open(file, seed){ const page = await br.newPage({ viewport:{width:1200,height:720} });
  await page.goto(pathToFileURL(file).href + `?pause&seed=${seed}&t=0`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function'); return page; }
// #62 the boat's lantern. §1 presence after dark over 20 seeds; §2 crop + warm-pixel count HEAD vs HERE
// at a pinned clear 22:00 (calm and windy); §3 the column follows the hull. Control: boat-lantern-column.mjs.
// §1 presence after dark, 20 seeds x 11 nights, sampled every 0.5 s
{ let dark=0, out=0, nights=0, litNights=0;
  for (let seed=1; seed<=20; seed++){
    const page = await open(FILES.HERE, seed);
    const r = await page.evaluate(() => { window.__reseed(); window.__setTime(0);
      let dark=0,out=0,nights=0,litNights=0,ld=-1,lit=false;
      for (let i=0;i<12*110;i++){ window.__warp(0.5); if (day<1) continue;
        if (day!==ld){ if (ld>=1){ nights++; if (lit) litNights++; } ld=day; lit=false; }
        if (nightF>0.3){ dark++; if (boat){ out++; lit=true; } } }
      return {dark,out,nights,litNights}; });
    dark+=r.dark; out+=r.out; nights+=r.nights; litNights+=r.litNights; await page.close();
  }
  console.log(`§1 20 seeds x 11 nights: boat out on ${(100*out/dark).toFixed(1)}% of dark (nightF>0.3) samples; a lit boat on ${litNights}/${nights} nights (${(100*litNights/nights).toFixed(0)}%)`);
}
// §2/§3 find 22:00 instants with the boat mid-river: one clear+calm, one clear+windy
const cands=[];
for (let seed=1; seed<=20 && cands.length<12; seed++){
  const page = await open(FILES.HERE, seed);
  const r = await page.evaluate(() => { window.__reseed(); window.__setTime(0); const c=[];
    for (let i=0;i<12*110;i++){ window.__warp(0.5); if (day<1) continue;
      if (boat && Math.abs(hour-22)<0.15 && boat.y>10 && boat.y<58 && cloudCover()<0.35) c.push({t:simT, y:+boat.y.toFixed(1), cloud:+cloudCover().toFixed(2), wind:+windF().toFixed(2)}); }
    return c; });
  for (const c of r) cands.push({seed, ...c}); await page.close();
}
const calm = cands.find(c=>c.wind<0.1), windy = cands.find(c=>c.wind>0.9);
console.log('candidates', cands.length, 'calm', calm, 'windy', windy);
async function measure(file, c, lbl, tag){
  const page = await open(file, c.seed);
  const r = await page.evaluate(([t, box]) => { window.__reseed(); window.__warp(t); drawScene(simT, 0);
    const cv=document.querySelector('canvas'), g=cv.getContext('2d');
    let B = box; if (!B){ const [lx,ly] = BOAT_LAMP; B = [Math.round(lx-2.5*cellW), Math.round(ly-1.5*cellW), Math.round(5*cellW), Math.round(7*cellW)]; }
    const d=g.getImageData(B[0]*DPR,B[1]*DPR,B[2]*DPR,B[3]*DPR).data; let warm=0, warmBelow=0, sum=0, maxL=0; const rowW=B[2]*DPR;
    for (let i=0;i<d.length;i+=4){ const L=(d[i]+d[i+1]+d[i+2])/3; sum+=L; maxL=Math.max(maxL,L); if (d[i]-d[i+2]>40 && L>70){ warm++; if ((i/4/rowW|0) > 2.2*cellW*DPR) warmBelow++; } }
    const rc = cv.getBoundingClientRect();
    return {box:B, hour:hour.toFixed(2), night:nightF.toFixed(2), cloud:cloudCover().toFixed(2), wind:windF().toFixed(2), boatY:boat.y.toFixed(1), warm, warmBelow, meanL:(sum/(d.length/4)).toFixed(1), maxL:maxL|0, clip:[B[0]+rc.left, B[1]+rc.top, B[2], B[3]]}; }, [c.t, c.box||null]);
  await page.screenshot({ path:`shots/b59-${tag}-${lbl}.png`, clip:{x:r.clip[0], y:r.clip[1], width:r.clip[2], height:r.clip[3]} });
  await page.close(); return r;
}
for (const [tag,c] of [['calm',calm],['windy',windy]]){ if(!c) continue;
  const here = await measure(FILES.HERE, c, 'HERE', tag); console.log(tag, 'HERE', here);
  const head = await measure(FILES.HEAD, {...c, box:here.box}, 'HEAD', tag); console.log(tag, 'HEAD', head);
  // column moves with the boat: same box 2 s later should have lost the warmth, the new box has it
  const page = await open(FILES.HERE, c.seed);
  const r = await page.evaluate(([t, box]) => { window.__reseed(); window.__warp(t + 3); drawScene(simT, 0);
    const cv=document.querySelector('canvas'), g=cv.getContext('2d'); const cnt=(B)=>{ const d=g.getImageData(B[0]*DPR,B[1]*DPR,B[2]*DPR,B[3]*DPR).data; let w=0; for (let i=0;i<d.length;i+=4){ if (d[i]-d[i+2]>40 && (d[i]+d[i+1]+d[i+2])/3>70) w++; } return w; };
    const [lx,ly]=BOAT_LAMP; const nb=[Math.round(lx-2.5*cellW), Math.round(ly-1.5*cellW), Math.round(5*cellW), Math.round(7*cellW)];
    return {boatY:boat.y.toFixed(1), oldBoxWarm:cnt(box), newBoxWarm:cnt(nb), moved:[nb[0]-box[0], nb[1]-box[1]]}; }, [c.t, here.box]);
  console.log(tag, '+3 s:', r); await page.close();
}
await br.close();

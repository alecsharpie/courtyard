#!/usr/bin/env node
/* #152 — plotAct()'s five rungs, FORCED. The year-long count (probes/allot-kneel.mjs)
 * shows the ladder covers every kneel, but a rung that never came up in a year is a
 * green anchor whose predicate never fired. This builds each rung's precondition on a
 * real plot by hand, calls plotAct() on a stand-in holder, and asserts BOTH halves:
 * the act it named, and the mark it left on the plot's own six cells. Exits non-zero
 * on any rung that does not fire or does not do what its comment says it does. */
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2); const arg=(k,d)=>{const i=argv.indexOf(k);return i<0?d:argv[i+1];};
const FILE = pathToFileURL(join(process.cwd(), arg('--file','courtyard.html'))).href;
const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:700}});
const errs=[]; p.on('pageerror',x=>errs.push(String(x)));
await p.goto(FILE+'?seed=7&pause'); await p.waitForFunction('typeof __warp==="function"');
const out = await p.evaluate(`(() => {
  __reseed(); while(day<2) __warp(1);
  const said = []; const realAnnounce = announce;
  window.announce = t => said.push(t);
  const cellsOf = (ox,oy) => { const c=[]; for(let y=oy;y<oy+2;y++) for(let x=ox;x<ox+3;x++){const i=y*GW+x; if(grid[i]===BED) c.push([i,x,y]);} return c; };
  const plotWith = kind => { for (const f of ALLOT_FURN) if (f.kind===kind && !inGlass(f.ox+1,f.oy+1)) return [f.ox,f.oy]; return null; };
  const plotWithout = kinds => { for (let oy=8; oy<=50; oy+=7) for (let ox=80; ox<=90; ox+=5){
      if (inGlass(ox+1,oy+1) || !cellsOf(ox,oy).length) continue;
      if (!ALLOT_FURN.some(f=>f.ox===ox&&f.oy===oy&&kinds.includes(f.kind))) return [ox,oy]; } return null; };
  const run = (ox,oy) => { said.length = 0;
    const a = {kind:'allot', plot:[ox,oy], x:ox-0.6, y:oy+0.5, act:''};
    const n = plotAct(a); return {act:a.act, n, line:said[0]||''}; };
  const R = {};
  warmth = 0.95; raining = false; wetness = 0.05;    // high summer, dry: canes up, cloches away
  const CANES = plotWith('canes'), BUTT = plotWith('butt'), PLAIN = plotWithout(['butt','canes']);
  R.picked = {CANES, BUTT, PLAIN};
  // 1. SOW — every cell bare, the fallow clock run out. Since #159 a hand with room takes
  //    it: six bare cells is room for a minority drill, so this is the INTER-CROP path and
  //    what it must guarantee is that the first crop keeps a strict majority.
  { const [ox,oy]=PLAIN, cs=cellsOf(ox,oy);
    for (const [i] of cs){ bSp[i]=0; bSt[i]=0; bAge[i]=0; turned[i]=0; }
    const r = run(ox,oy); const H = 1+SPECIES.findIndex(s=>s.veg&&s.hardy);
    r.sown = cs.filter(([i])=>bSp[i]===H).length;
    r.other = cs.filter(([i])=>bSp[i] && bSp[i]!==H).length;
    r.kinds = new Set(cs.map(([i])=>bSp[i])).size;
    r.majority = plotCrop(ox,oy) === H;                       // plotCrop's own read agrees with the arithmetic
    r.stages = cs.map(([i])=>bSt[i]).join(''); r.name = plotName(ox, oy); R.sow = r; }
  // 1b. SOW with NO ROOM — one cell under the crop, one bare, the other four resting. The
  //     minority bound solves to 0 cells, so the plain drill is what goes in.
  { const [ox,oy]=PLAIN, cs=cellsOf(ox,oy);
    const H = 1+SPECIES.findIndex(s=>s.veg&&s.hardy);
    cs.forEach(([i],k)=>{ turned[i]=0; if(k===0){ bSp[i]=H; bSt[i]=1; bAge[i]=0; }
                          else if(k===1){ bSp[i]=0; bSt[i]=0; bAge[i]=0; }
                          else { bSp[i]=0; bSt[i]=0; bAge[i]=10; } });
    const r = run(ox,oy); r.kinds = new Set(cs.map(([i])=>bSp[i]).filter(Boolean)).size; R.sowPlain = r; }
  // 2. SOW over a TURNED row — the cover line, and turned[] cleared
  { const [ox,oy]=PLAIN, cs=cellsOf(ox,oy);
    for (const [i] of cs){ bSp[i]=0; bSt[i]=0; bAge[i]=0; turned[i]=1; }
    const r = run(ox,oy); r.turnedLeft = cs.filter(([i])=>turned[i]).length; R.dug = r; }
  // 3. WATER — a butt on the plot, dry ground, a row under its ceiling and fallow beside it
  { const [ox,oy]=BUTT, cs=cellsOf(ox,oy);
    cs.forEach(([i],k)=>{ if(k<3){ bSp[i]=8; bSt[i]=1; bAge[i]=0; } else { bSp[i]=0; bSt[i]=0; bAge[i]=10; } turned[i]=0; });
    const before = cs.map(([i])=>[bSt[i],bAge[i]]);
    const r = run(ox,oy);
    r.up = cs.filter(([i],k)=>k<3 && bSt[i]===before[k][0]+1).length;
    r.rest = cs.filter(([i],k)=>k>=3 && bAge[i]<before[k][1]).length; R.water = r; }
  // 4. THIN — the same row on a plot with no butt: no can, so the weakest comes out
  { const [ox,oy]=PLAIN, cs=cellsOf(ox,oy);
    cs.forEach(([i],k)=>{ bSp[i]=8; bSt[i]= k===0?1:2; bAge[i]=0; turned[i]=0; });
    const r = run(ox,oy);
    r.pulled = cs.filter(([i])=>!bSp[i]).length; r.stages = cs.map(([i])=>bSt[i]).join(''); R.thin = r; }
  // 5. TEND, plain — a row AT its ceiling, ageing
  { const [ox,oy]=PLAIN, cs=cellsOf(ox,oy);
    cs.forEach(([i])=>{ bSp[i]=9; bSt[i]=3; bAge[i]=7; turned[i]=0; });
    const r = run(ox,oy); r.aged = cs.filter(([i])=>bAge[i]>0).length; R.tend = r; }
  // 6. TEND with BEANS up the canes — the one rung a year did not reach
  { const [ox,oy]=CANES, cs=cellsOf(ox,oy);
    cs.forEach(([i])=>{ bSp[i]=SPECIES.findIndex(s=>s.name==='beans')+1; bSt[i]=3; bAge[i]=7; turned[i]=0; });
    R.canesOn = ALLOT_FURN.some(f=>f.ox===ox&&f.oy===oy&&f.kind==='canes'&&allotFurnOn(f));
    const r = run(ox,oy); r.aged = cs.filter(([i])=>bAge[i]>0).length; R.beans = r; }
  // 7. RAKE — fallow only, no butt
  { const [ox,oy]=PLAIN, cs=cellsOf(ox,oy);
    cs.forEach(([i])=>{ bSp[i]=0; bSt[i]=0; bAge[i]=10; turned[i]=0; });
    const r = run(ox,oy); r.left = cs.map(([i])=>+bAge[i].toFixed(2)).join(','); R.rake = r; }
  // 8. the ONE fall-through the comment claims: every cell sown, AT its ceiling, bAge 0
  { const [ox,oy]=PLAIN, cs=cellsOf(ox,oy);
    cs.forEach(([i])=>{ bSp[i]=9; bSt[i]=3; bAge[i]=0; turned[i]=0; });
    R.through = run(ox,oy); }
  window.announce = realAnnounce;
  return R;
})()`);
/* And is it VISIBLE? A sow is the rung with the most to show — six bare cells become six
 * drills of crop — so it is graded where it happens, in the Street quarter, on the plot's
 * OWN screen box, against a SAME-CODE control that redraws the identical world twice. */
const p2 = await b.newPage({viewport:{width:1280,height:700}});
p2.on('pageerror',x=>errs.push(String(x)));
await p2.goto(FILE+'?seed=7&pause'); await p2.waitForFunction('typeof __warp==="function"');
const pix = await p2.evaluate(`(() => {
  __reseed(); while(day<6) __warp(1);
  whereGo(2); viewSnap(); groundDirty = true;              // the Street quarter: the allotments, near
  let ox = 0, oy = 0;
  for (let y=8; y<=50; y+=7) for (let x=80; x<=90; x+=5)
    if (!inGlass(x+1,y+1) && grid[y*GW+x] === BED && !ox){ ox = x; oy = y; }
  const cells = []; for (let y=oy; y<oy+2; y++) for (let x=ox; x<ox+3; x++){ const i=y*GW+x; if (grid[i]===BED) cells.push(i); }
  for (const i of cells){ bSp[i]=0; bSt[i]=0; bAge[i]=0; turned[i]=0; }
  const pts = [];
  for (const [x,y] of [[ox,oy],[ox+3,oy],[ox,oy+2],[ox+3,oy+2]]) for (const z of [0, 1.4]) pts.push(project(x,y,z));
  const x0 = Math.max(0, Math.min(...pts.map(p=>p[0]))-4)|0, x1 = Math.min(W, Math.max(...pts.map(p=>p[0]))+4)|0;
  const y0 = Math.max(0, Math.min(...pts.map(p=>p[1]))-4)|0, y1 = Math.min(H, Math.max(...pts.map(p=>p[1]))+4)|0;
  const shot = () => cv.getContext('2d').getImageData(x0, y0, x1-x0, y1-y0).data;
  const diff = (a,b) => { let n=0; for (let i=0;i<a.length;i+=4) if (Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]) > 12) n++; return n; };
  const bare = () => { for (const i of cells){ bSp[i]=0; bSt[i]=0; bAge[i]=0; turned[i]=0; } };
  const mass = f => { bare(); groundDirty = true; drawScene(simT, 0); const A = shot();
                      f(); groundDirty = true; drawScene(simT, 0); return diff(A, shot()); };
  const total = (x1-x0)*(y1-y0);
  const control = mass(() => {});                                        // same code, same world, drawn twice
  const act = {kind:'allot', plot:[ox,oy], x:ox-0.6, y:oy+0.5, act:''};
  let n = 0, water = 0, wn = 0;
  const sow = mass(() => { n = plotAct(act); });                         // the SOW rung, on its own terms
  const set = st => () => { for (const i of cells){ bSp[i]=HARDY_VEG; bSt[i]=st; } };
  const st1 = mass(set(1)), st2 = mass(set(2)), st3 = mass(set(3));      // the same six cells sown by any other route
  /* and the WATER rung, which is the other end of the ladder: a row already up, brought on */
  bare(); for (const i of cells){ bSp[i]=HARDY_VEG; bSt[i]=2; }
  groundDirty = true; drawScene(simT, 0); const A2 = shot();
  const a2 = {kind:'allot', plot:[ox,oy], x:ox-0.6, y:oy+0.5, act:''};
  wn = plotAct(a2); groundDirty = true; drawScene(simT, 0); water = diff(A2, shot());
  return {ox, oy, n, act:act.act, box:[x1-x0, y1-y0], total, control, sow, st1, st2, st3, water, wact:a2.act, wn};
})()`);
await p2.close();
await b.close();
if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
const T = [];
const chk = (label, ok, detail) => { T.push([ok, label, detail]); };
chk('SOW sows all six, two crops, the first a strict MAJORITY, and the pointer says so (#159)',
    out.sow.act==='sowing a second crop in' && out.sow.n===6 && out.sow.stages==='111111' &&
    out.sow.kinds===2 && out.sow.other>0 && out.sow.sown>out.sow.other && out.sow.sown+out.sow.other===6 && out.sow.majority && / with .* worked in among them,/.test(out.sow.name),
    JSON.stringify(out.sow));
chk('SOW with no room for a minority drill is the PLAIN drill', out.sowPlain.act==='sowing a drill' && out.sowPlain.n===1 && out.sowPlain.kinds===1, JSON.stringify(out.sowPlain));
chk('SOW over turned: clears turned[], covers the row', /^sowing a (drill|second crop in)$/.test(out.dug.act) && out.dug.turnedLeft===0 && /cloche|heap|covered down|clods/.test(out.dug.line), JSON.stringify(out.dug));
chk('WATER: a stage on, the fallow shortened', out.water.act==='watering the row' && out.water.up===3 && out.water.rest===3, JSON.stringify(out.water));
chk('THIN: one cell out, the rest a stage on', out.thin.act==='thinning the row' && out.thin.pulled===1, JSON.stringify(out.thin));
chk('TEND: the ageing row is freshened', out.tend.act==='weeding down the row' && out.tend.aged===0, JSON.stringify(out.tend));
chk('TEND names the CANES when beans are up them', out.canesOn && out.beans.act==='tying the beans in' && out.beans.aged===0, JSON.stringify(out.beans));
chk('RAKE: the fallow clock moved, less than the can', out.rake.act==='raking the bed down' && out.rake.left.split(',').every(v=>+v===7.8), JSON.stringify(out.rake));
chk('the documented fall-through, and ONLY it, returns 0', out.through.n===0 && out.through.act==='', JSON.stringify(out.through));
chk('the act MARKS the plot, against a same-code control, and marks it as any other sowing would',
    pix.control === 0 && pix.n === 6 && pix.st1 > 0 && pix.sow >= pix.st1 && pix.sow < pix.st2 && pix.water > 0,
    `[${pix.ox},${pix.oy}] box ${pix.box.join('x')} = ${pix.total} px · SAME-CODE CONTROL ${pix.control} px\n        ` +
    `${pix.act}: ${pix.sow} px, a STAGE-1 mark — at or above the ${pix.st1} px the same six cells make sown to stage 1 in one species, and below the ${pix.st2} px of stage 2 (stage 3 ${pix.st3})\n        ` +
    `${pix.wact} on a row at stage 2: ${pix.water} px, ${(100*pix.water/pix.st3).toFixed(0)}% of the plot's own full crop`);
console.log(`[rungs] ${arg('--file','courtyard.html')}   plots: ${JSON.stringify(out.picked)}`);
for (const [ok, label, d] of T) console.log(`  ${ok?'PASS':'FAIL'}  ${label}\n        ${d}`);
const bad = T.filter(t=>!t[0]).length;
console.log(bad ? `FAIL — ${bad} of ${T.length}` : `PASS — ${T.length} of ${T.length}`);
process.exit(bad?1:0);

#!/usr/bin/env node
/* Is this an INTERACTION change and not a DRAW change? Hash the canvas on both builds
 * at pinned instants: reseed + warp + one drawScene inside ONE evaluate (the renderer
 * draws from the PRNG, so nothing may run between). Also histograms the four branches
 * of the washing line's words over a year, so none of them is a dead string. */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const B = { HEAD: pathToFileURL('/tmp/head-courtyard.html').href, tree: pathToFileURL(resolve(HERE, '../../../..', 'courtyard.html')).href };
const b = await chromium.launch();
let bad = 0; const ok = (c,s)=>{console.log((c?'  ok   ':'  FAIL ')+s); if(!c)bad++;};

const SIZES = [[1600,950],[1280,700],[390,844]];
const SEEDS = [7,42];
const TIMES = [200,625,1520];
async function hashes(url){
  const out = {};
  for (const [w,h] of SIZES) for (const sd of SEEDS){
    const p = await b.newPage({ viewport:{width:w,height:h} });
    await p.goto(`${url}?pause&seed=${sd}`);
    await p.waitForFunction('typeof window.__census === "function"');
    for (const t of TIMES){
      out[`${w}x${h} s${sd} t${t}`] = await p.evaluate(tt => {
        __reseed(); __warp(tt); drawScene(tt, 1/30);
        const d = cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
        let a = 5381, c = 52711;
        for (let i=0;i<d.length;i+=4){ a=(a*33^d[i])>>>0; c=(c*33^d[i+1]+d[i+2])>>>0; }
        return a.toString(16)+'-'+c.toString(16);
      }, t);
    }
    await p.close();
  }
  return out;
}
console.log(`\ncanvas hash, ${SIZES.length} sizes x ${SEEDS.length} seeds x ${TIMES.length} instants`);
const [H,T] = [await hashes(B.HEAD), await hashes(B.tree)];
const keys = Object.keys(T), same = keys.filter(k => H[k] === T[k]);
for (const k of keys) if (H[k] !== T[k]) console.log(`   DIFFERS ${k}: ${H[k]} vs ${T[k]}`);
ok(same.length === keys.length, `${same.length}/${keys.length} instants bit-identical to HEAD`);
ok(new Set(Object.values(T)).size > 1, `and the hash is not a constant (${new Set(Object.values(T)).size} distinct frames)`);

/* the four branches of the cord, over a year */
{
  const p = await b.newPage({ viewport:{width:1600,height:950} });
  await p.goto(`${B.tree}?pause&seed=42`);
  await p.waitForFunction('typeof window.__census === "function"');
  const hist = await p.evaluate(() => {
    __reseed();
    const line = ROOF_FURN.find(f => f.kind === 'line'), h = {};
    for (let i = 0; i < 240; i++){ __warp(9.2);           // ~1/6 day, 40 days of samples
      const s = roofFurnName(line); h[s] = (h[s]||0)+1; }
    const t = {}; for (const f of ROOF_FURN) if (f.kind !== 'line') t[roofFurnName(f)] = (t[roofFurnName(f)]||0)+1;
    return { h, t };
  });
  console.log('\nthe washing line, 240 samples over 40 days:');
  for (const [k,v] of Object.entries(hist.h).sort((a,b)=>b[1]-a[1])) console.log(`   ${String(v).padStart(4)}  ${k}`);
  ok(Object.keys(hist.h).length >= 3, `${Object.keys(hist.h).length} distinct lines reachable`);
  console.log('the tanks and lofts at one instant:');
  for (const [k,v] of Object.entries(hist.t)) console.log(`   ${String(v).padStart(4)}  ${k}`);
  await p.close();
}
await b.close();
console.log(bad ? `\nFAIL ${bad}` : '\nall checks passed');
process.exit(bad?1:0);

/* Where do jetty stands come from, and at what hour is the CHOICE made?
 * Wraps overDeck + spawnEastAgent + puntFits on HEAD. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process'; import fs from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i!==-1&&process.argv[i+1]?process.argv[i+1]:d;};
const REPO = resolve(new URL('.', import.meta.url).pathname, '../../../..');
const NDAYS=+arg('--days',4), DAY0=+arg('--day0',12);
const SEEDS=[3,7,11,19,23,29,42,51,64,77];
const which = arg('--file','head');
const FILE = which==='head' ? (()=>{const h=resolve(REPO,'.probe-head.html');
  fs.writeFileSync(h, execSync('git show HEAD:courtyard.html',{cwd:REPO,maxBuffer:1<<28})); return h;})()
  : resolve(REPO,'courtyard.html');
const br = await chromium.launch();
const spawnH=[], deckH=[], fitH=[], failReason={}; let calls=0;
for (const seed of SEEDS){
  const page = await br.newPage({ viewport:{width:1200,height:720} });
  page.on('pageerror', e => console.log('PAGEERROR', seed, e.message));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(([DAY0,NDAYS]) => {
    window.__reseed(); window.__warp(DAY0*55 - simT);
    const S={spawnH:[],deckH:[],fitH:[],fail:{},calls:0};
    const _od = overDeck; overDeck = function(a,l,g){ S.deckH.push(+hour.toFixed(2)); return _od(a,l,g); };
    const _se = spawnEastAgent; spawnEastAgent = function(nr,room){ if(!nr) S.spawnH.push(+hour.toFixed(2)); return _se(nr,room); };
    const _pf = puntFits; puntFits = function(a){
      S.calls++;
      let why=null;
      if (punt.leg !== 0) why='punt busy';
      else if (a.with||a.pairLead||a.small) why='companion';
      else if (raining) why='rain';
      else if (windF() >= 0.5) why='wind';
      else if (!eastOpen()) why='dark';
      else if (!(eastCloseHour()-hour > (((1.3+4.6)/(0.75*a.speed)+6.1/PUNT_SPEED)*24/DAY_LEN) + PUNT_MIN_STAY_H)) why=`late h=${hour.toFixed(1)} close=${eastCloseHour().toFixed(1)}`;
      if (why){ S.fail[why]=(S.fail[why]||0)+1; } else S.fitH.push(+hour.toFixed(2));
      return _pf(a);
    };
    while (day < DAY0+NDAYS) window.__warp(0.25);
    return S;
  }, [DAY0,NDAYS]);
  spawnH.push(...r.spawnH); deckH.push(...r.deckH); fitH.push(...r.fitH); calls+=r.calls;
  for (const k in r.fail) failReason[k]=(failReason[k]||0)+r.fail[k];
  await page.close();
}
await br.close();
const hist=a=>{const h={};for(const x of a)h[Math.floor(x)]=(h[Math.floor(x)]||0)+1;
  return Object.keys(h).map(Number).sort((p,q)=>p-q).map(k=>`${k}h:${h[k]}`).join(' ');};
console.log(`file=${which}`);
console.log(`spawnEastAgent (day) n=${spawnH.length}  <12h ${spawnH.filter(x=>x<12).length}\n  ${hist(spawnH)}`);
console.log(`overDeck -> jetty  n=${deckH.length}  <12h ${deckH.filter(x=>x<12).length}\n  ${hist(deckH)}`);
console.log(`puntFits calls ${calls}; fits n=${fitH.length}  ${hist(fitH)}`);
const fr=Object.entries(failReason).sort((a,b)=>b[1]-a[1]);
console.log('puntFits rejections: ' + (fr.length? fr.slice(0,8).map(([k,v])=>`${k}=${v}`).join('  ') : 'none'));

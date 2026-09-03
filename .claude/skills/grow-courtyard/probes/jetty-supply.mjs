#!/usr/bin/env node
/* throwaway (#154): the candidate's puntFits OFFERS/day fell ~15% in both seed sets and
 * the swan-only build did not do it, so it is the WIND half. WHERE does the supply go?
 * Count the two sources of a.jetty at their SPAWN, not at the planks: overDeck() (east
 * agents, cut at a.wary < DECK_SHARE) and spawnFarAgent's 'jetty' kind. Plus east
 * arrivals and the east cap's bind rate, since a punt rider holds an east slot for hours.
 *   node probe-jetty-supply.mjs <file> [--alt] */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || 'courtyard.html');
const SEEDS = process.argv.includes('--alt') ? [5,13,17,31,37,47,59,61,71,83] : [3,7,11,19,23,29,42,51,64,77];
const DAY0 = 5, NDAYS = 26;
const br = await chromium.launch();
const T = {deck:0, far:0, east:0, capSamp:0, capBind:0, eastPresent:0, presSamp:0, puntSlot:0};
for (const seed of SEEDS){
  const p = await br.newPage({ viewport:{width:1600,height:950} });
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}`, {waitUntil:'load'});
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const out = await p.evaluate(new Function('A', 'const {DAY0,NDAYS}=A;' + `
  window.__reseed(); window.__warp(DAY0*55 - simT);
  let deck = 0, far = 0, east = 0;
  const od = overDeck; window.overDeck = function(a, l, g){ deck++; return od(a, l, g); };
  const se = spawnEastAgent; window.spawnEastAgent = function(...x){ east++; return se(...x); };
  const sf = spawnFarAgent;  window.spawnFarAgent  = function(...x){ const r = sf(...x);
    const a = agents[agents.length-1]; if (a && a.jetty) far++; return r; };
  let capSamp = 0, capBind = 0, eastPresent = 0, presSamp = 0, puntSlot = 0;
  for (let i = 0; day < DAY0 + NDAYS; i++){
    window.__warp(0.05);
    if (i % 8 === 0){
      const n = agents.filter(a => a.east && !a.done).length;
      presSamp++; eastPresent += n;
      if (typeof eastCap === 'function'){ capSamp++; if (n >= eastCap()) capBind++; }
      puntSlot += agents.filter(a => a.east && (a.aboard || a.eyot)).length;
    }
  }
  return {deck, far, east, capSamp, capBind, eastPresent, presSamp, puntSlot};`), {DAY0, NDAYS});
  for (const k in T) T[k] += out[k] || 0;
  await p.close();
}
await br.close();
const D = SEEDS.length * NDAYS;
console.log(`\n=== ${FILE.split('/').pop()} · ${SEEDS.length} seeds x ${NDAYS} d = ${D} seed-days · seeds ${SEEDS.join(',')} ===`);
console.log(`overDeck() calls (jetty standers from the east half) ${T.deck}  = ${(T.deck/D).toFixed(3)}/day`);
console.log(`far-bank 'jetty' spawns                              ${T.far}  = ${(T.far/D).toFixed(3)}/day`);
console.log(`  the two sources together                           ${T.deck+T.far}  = ${((T.deck+T.far)/D).toFixed(3)}/day`);
console.log(`spawnEastAgent() calls                               ${T.east}  = ${(T.east/D).toFixed(2)}/day`);
console.log(`east agents present, mean ${(T.eastPresent/T.presSamp).toFixed(2)}  ·  east cap BINDING ${(100*T.capBind/(T.capSamp||1)).toFixed(1)}% of samples`);
console.log(`  of those present, aboard or on the eyot: mean ${(T.puntSlot/T.presSamp).toFixed(3)} (${(100*T.puntSlot/T.eastPresent).toFixed(1)}% of the east half's slots)`);

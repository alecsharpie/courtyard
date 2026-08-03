/* passing-word — how often do people actually stop to talk, and does anyone get stuck?
 *
 *   node .claude/skills/grow-courtyard/probes/passing-word.mjs     (from the repo root)
 *
 * greetPass() pairs two passing agents and gives both an `a.greet` countdown. The
 * census cannot see it (people is unchanged by design) and a still frame catches it
 * only by luck, so this warps ~10 seeded days and counts chats by agent identity.
 *
 * Expect ~2 conversations per sim-minute, ~2% of walker-ticks chatting, maxGreet
 * under 5 and stuck EMPTY. A non-empty `stuck` means an agent is held mid-chat —
 * the one failure mode that matters, because a held agent never reaches `done` and
 * a café sitter would strand its table.
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const url = pathToFileURL(resolve('courtyard.html')).href + '?pause&seed=7';
const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto(url);
await p.waitForFunction(() => window.__warp);

const out = await p.evaluate(() => {
  const seen = new Map();          // agent object -> {maxGreet, ticks}
  let chats = 0, samples = 0, walking = 0, chatting = 0, maxGreet = 0;
  const stuck = [];
  const prev = new WeakMap();
  for (let i = 0; i < 9000; i++){    // 9000 * 0.05 = 450 s ≈ 3.6 days
    window.__warp(0.05);
    samples++;
    for (const a of agents){
      const g = a.greet || 0;
      const was = prev.get(a) || 0;
      if (g > 0 && was === 0){ chats++; seen.set(a.kind + (a.street ? '/lane' : '/court'), (seen.get(a.kind + (a.street ? '/lane' : '/court')) || 0) + 1); }
      if (g > maxGreet) maxGreet = g;
      prev.set(a, g);
      if (g > 0) chatting++;
      if (a.state === 'walk') walking++;
      // a chat that has run longer than any legal duration means a stuck agent
      if (g > 6) stuck.push(a.kind + ' greet=' + g.toFixed(2));
    }
  }
  return {chats, samples, simT: Math.round(simT), day,
          pctWalkersChatting: +(100 * chatting / Math.max(1, walking)).toFixed(1),
          by: Object.fromEntries(seen), maxGreet: +maxGreet.toFixed(2), stuck: stuck.slice(0, 3),
          people: agents.length, tablesTaken: (window.CAFE_TABLES || []).filter(t => t.taken).length};
});
console.log(out);
console.log('chats per sim-minute:', (out.chats / (out.simT / 60)).toFixed(1));
await b.close();

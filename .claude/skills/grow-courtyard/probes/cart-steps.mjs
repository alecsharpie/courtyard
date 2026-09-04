/* The dusk gate says cart74 moved 2.60 cells in one 0.25 s step "its median is 0.000".
 * A cart that spends its trip standing at the fence gate has a median step of zero, so
 * the gate's 8x-median rule flags ANY real motion. The question is therefore not "did it
 * step 2.60" but "does HEAD step 2.60 too, at some seed". Trace the ONE cart's per-step
 * displacement on HEAD and on the candidate over many seeds and print the distribution.
 * usage: node probe-cart-steps.mjs [seeds=14] */
import path from 'path'; import fs from 'fs';
import { execSync } from 'child_process';
import { homedir } from 'node:os'; import { pathToFileURL } from 'node:url';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = path.resolve(new URL('.', import.meta.url).pathname, '../../../..');
const ART = path.join(REPO, 'courtyard.html');
const N = +(process.argv[2] || 14);
fs.writeFileSync('.probe-head.html', execSync('git show HEAD:courtyard.html', { cwd: REPO, maxBuffer: 1 << 28 }));
const br = await chromium.launch();
async function run(file, label){
  const steps = [];                       // every non-zero step of every cart, over N seeds
  for (let seed = 1; seed <= N; seed++){
    const p = await br.newPage();
    await p.goto('file://' + path.resolve(file) + `?seed=${seed}&t=0&pause`); await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      window.__reseed(); const out = []; const prev = new Map();
      for (let i = 0; i < 3200; i++){
        window.__warp(0.25);
        for (const e of window.__entities()) if (e.kind === 'cart'){
          const q = prev.get(e.id);
          if (q) { const d = Math.hypot(e.x - q[0], e.y - q[1]); if (d > 0.001) out.push(+d.toFixed(3)); }
          prev.set(e.id, [e.x, e.y]);
        }
      }
      return out;
    });
    steps.push(...r); await p.close();
  }
  steps.sort((a, b) => a - b);
  const big = steps.filter(d => d > 1.0);
  console.log(`${label.padEnd(10)} n=${String(steps.length).padStart(5)}  median ${steps[steps.length>>1]}  p99 ${steps[Math.floor(steps.length*0.99)]}  max ${steps[steps.length-1]}`);
  console.log(`${' '.repeat(10)} steps > 1.0 cell: ${big.length}  -> ${big.slice(-12).join(', ')}`);
}
await run('.probe-head.html', 'HEAD');
await run('courtyard.html', 'candidate');
await br.close(); fs.unlinkSync('.probe-head.html');

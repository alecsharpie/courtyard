/* #201 — is the fabric FREE to the seeded world? It adds no R() call site, so a build with
 * the one behaviour change backed out (freeBay's bayWash filter) must census IDENTICALLY
 * to HEAD but for the new field. Differing in exactly ONE way from the thing measured. */
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const PW = homedir() + '/.claude/skills/screenshot-verify/node_modules/playwright/index.js';
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const files = process.argv.slice(2);
const b = await chromium.launch();
const out = [];
for (const f of files){
  const page = await b.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  const per = {};
  for (const seed of [7, 42, 1234]){
    await page.goto(pathToFileURL(resolve(f)).href + `?seed=${seed}&pause&t=2`);
    await page.waitForFunction('typeof __warp === "function"');
    per[seed] = await page.evaluate('(() => { __reseed(); for (let i=0;i<600;i++) __warp(0.5); const c = __census(); delete c.clock; return c; })()');
  }
  if (errs.length) console.log(f, 'ERRORS', errs.slice(0, 3));
  out.push({ f, per });
  await page.close();
}
await b.close();
const base = out[0];
for (const o of out.slice(1)){
  const diffs = [];
  for (const seed of Object.keys(o.per)){
    const walk = (a, c, path) => {
      for (const k of new Set([...Object.keys(a || {}), ...Object.keys(c || {})])){
        const va = a?.[k], vc = c?.[k];
        if (va && typeof va === 'object') walk(va, vc, path + '.' + k);
        else if (va !== vc) diffs.push(`seed ${seed} ${path}.${k}: ${va} -> ${vc}`);
      }
    };
    walk(base.per[seed], o.per[seed], '');
  }
  console.log(`\n${base.f}  vs  ${o.f}: ${diffs.length} field diffs`);
  for (const d of diffs.slice(0, 40)) console.log('  ', d);
}

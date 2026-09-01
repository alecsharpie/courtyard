// The cardinals scale with the drawing (#99). No quarter frames the clock tower above
// s~1.02, so force the view to prove the predicate FIRES — and read the font off the
// page's OWN fillText, never a copy of it in this file (an earlier cut of this probe set
// ctx.font itself and returned identical numbers on HEAD, grading its own homework).
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = process.argv[2] || 'courtyard.html';
const tag = process.argv[3] || 'after';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1400,height:900} });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto(pathToFileURL(resolve(file)).href + '?seed=7&t=0&pause');
await p.waitForFunction(() => window.__warp);
for (const s of [1, 2, 3.5]){
  const r = await p.evaluate(async (s) => {
    window.__reseed(); window.__warp(336);
    const v0 = viewFor(0);
    applyView({ s, ox: v0.ox, tp: v0.tp });
    const seen = [], realFill = ctx.fillText.bind(ctx);
    ctx.fillText = function(t, x, y){ if ('WENS'.includes(t) && t.length === 1) seen.push({ t, font: ctx.font, x:+x.toFixed(0), y:+y.toFixed(0) }); return realFill(t, x, y); };
    drawVanes();
    ctx.fillText = realFill;
    const px = seen.length ? +/(\d+(?:\.\d+)?)px/.exec(seen[0].font)[1] : 0;
    const m = (() => { const f = ctx.font; ctx.font = seen[0]?.font || ctx.font;
      const mm = ctx.measureText('W'); ctx.font = f;
      return +(mm.actualBoundingBoxAscent + mm.actualBoundingBoxDescent).toFixed(2); })();
    return { s: +viewS.toFixed(2), cellW: +cellW.toFixed(2), letters: seen.map(e => e.t).join(''),
             fontPx: px, glyphH: m, ratioToCellW: +(px / cellW).toFixed(2) };
  }, s);
  console.log(tag, JSON.stringify(r));
}
await b.close();

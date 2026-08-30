import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
// 1. the REAL path on a phone: a tap on the control, rAF easing on the real clock, arrival, naming under zoom, a tap back
const p = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto(pathToFileURL(resolve('courtyard.html')).href + '?seed=7&t=338');
await p.waitForFunction(() => window.__warp);
await p.waitForTimeout(400);
console.log('offers on narrow:', await p.evaluate(() => OFFERS.map(o => o.id).join(',')));
const where = p.locator('#where');
await where.tap(); await where.tap(); await where.tap();     // courtyard, street, plaza — three real taps
const mid = await p.evaluate(() => window.__where());
await p.waitForTimeout(1100);
const arrived = await p.evaluate(() => ({ ...window.__where(), label: document.getElementById('where').textContent, dirty: groundDirty }));
console.log('after 3 taps: mid', JSON.stringify({ n: mid.n, easing: mid.easing, s: +mid.s.toFixed(2) }), '→', JSON.stringify(arrived));
// name the fountain under zoom: hover its screen position via unproject/project round trip
const named = await p.evaluate(() => { const [sx, sy] = project(105.5, 30, 0); const r = cv.getBoundingClientRect();
  cv.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + sx, clientY: r.top + sy, bubbles: true }));
  return { sx: Math.round(sx), sy: Math.round(sy), name: (typeof nameAt === 'function') ? nameAt(Math.floor(unproject(sx, sy)[0]), Math.floor(unproject(sx, sy)[1])) : null }; });
console.log('naming at the basin under zoom:', JSON.stringify(named));
await p.screenshot({ path: 'shots/b78-phone-plaza-live.png' });
// a resize mid-quarter keeps the quarter
await p.setViewportSize({ width: 430, height: 900 }); await p.waitForTimeout(300);
console.log('after resize:', JSON.stringify(await p.evaluate(() => { const v = window.__where(); return { n: v.n, s: +v.s.toFixed(2), easing: v.easing, W }; })));
await where.tap(); await where.tap(); await p.waitForTimeout(1200);   // far bank, then wide
console.log('back:', JSON.stringify(await p.evaluate(() => { const v = window.__where(); return { n: v.n, s: v.s, label: document.getElementById('where').textContent, pad: v.gview.pad }; })));
await p.close();
// 2. desktop plaza with the clamp, a person at readable size, and the wide offer wording
const d = await b.newPage({ viewport:{width:1400,height:800} });
d.on('pageerror', e => console.log('PAGE ERROR', e.message));
await d.goto(pathToFileURL(resolve('courtyard.html')).href + '?seed=7&t=0&pause');
await d.waitForFunction(() => window.__warp);
console.log('desk', JSON.stringify(await d.evaluate(() => { window.__reseed(); window.__warp(338); drawScene(simT, 0); window.__where(3, 1); drawScene(simT, 0);
  const v = window.__where(); const rightEdge = unproject(W, topPad + WH * cellH)[0]; return { s: +v.s.toFixed(2), ox: +v.ox?.toFixed(0), rightEdgeWorldX: +rightEdge.toFixed(1), offers: OFFERS.map(o => o.id).join(',') }; })));
await d.screenshot({ path: 'shots/b78-desk-plaza.png' });
await d.evaluate(() => { window.__where(4, 1); drawScene(simT, 0); }); await d.screenshot({ path: 'shots/b78-desk-farbank.png' });
await d.evaluate(() => { window.__where(1, 1); drawScene(simT, 0); }); await d.screenshot({ path: 'shots/b78-desk-court.png' });
await d.close(); await b.close();

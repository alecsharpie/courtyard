#!/usr/bin/env node
/* shoot.mjs — screenshots of the town at a PINNED seed and time.
 *
 *   node shoot.mjs                          all framings, day 3 midday, seed 42
 *   node shoot.mjs --shots wide,courtyard   just those framings
 *   node shoot.mjs --t 1210 --tag night     a different moment, into shots/night-*
 *   node shoot.mjs --seed 7
 *
 * Thin wrapper over the screenshot-verify skill. Its only real job is to pin
 * ?seed and ?t, because an unpinned screenshot of a living diorama compares two
 * different moments and every visual judgement made from it is noise.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const SHOOT = join(homedir(), '.claude/skills/screenshot-verify/shoot.mjs');
if (!existsSync(SHOOT)) { console.error('shoot: screenshot-verify skill not found at ' + SHOOT); process.exit(1); }

const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const seed = arg('--seed', '42');
const t = arg('--t', '175');          // day 3, mid-morning: gardens up, lamps off, people about
const tag = arg('--tag', null);
const shots = arg('--shots', null);

const pass = [`courtyard.html?seed=${seed}&t=${t}&fast`, '--root', REPO, '--out', join(REPO, 'shots'), '--wait', '2600'];
if (shots) pass.push('--shots', shots);
if (tag) pass.push('--prefix', tag);   // ignored by older versions; harmless

console.log(`shoot: seed=${seed} t=${t}s (day ${Math.floor(t / 55) + 1})`);
const r = spawnSync('node', [SHOOT, ...pass], { stdio: 'inherit', cwd: REPO });
process.exit(r.status ?? 1);

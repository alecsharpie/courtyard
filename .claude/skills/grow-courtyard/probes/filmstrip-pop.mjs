/* Does filmstrip's POP classifier tell a step from a ramp? Runs pops() on recorded
 * HEAD series (no browser) and on the same series with a one-sample 10 RGB step
 * injected. Expect: winter dusk 0 POP, summer noon 0 POP, injected step 1 POP at 7.
 *   node probes/filmstrip-pop.mjs */
import { pops } from '../pops.mjs';
const dusk = [5.296, 5.708, 4.540, 0.713, 0.555, 0.670, 0.646, 0.679, 0.638, 0.577, 0.620]; // seed 7 t=1183, #57 HEAD
const noon = [0.091, 0.089, 0.089, 0.090, 0.088, 0.135, 0.100, 0.103, 0.101, 0.104, 0.100]; // --scene dusk (d19 21:16), HEAD
const still = [0, 0, 0.003, 0, 0, 0, 0, 0, 0, 0, 0];
const step = dusk.slice(); step[7] = 10;
const stepInRamp = dusk.slice(); stepInRamp[1] = 5.708 + 10;   // 10 RGB on top of the ramp — still a step? (no: 15.7 vs 5.3 is < 3.5×)
let fail = 0;
const check = (name, series, want) => { const got = [...pops(series)]; const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fail++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(22)} pops at ${JSON.stringify(got)} (want ${JSON.stringify(want)})`); };
check('winter dusk ramp', dusk, []);
check('summer/dusk flat', noon, []);
check('still night noise', still, []);
check('10 RGB step at 7', step, [7]);
check('step of 3 at 4', dusk.map((d, i) => i === 4 ? 3 : d), [4]);
check('10 on top of ramp', stepInRamp, []);
process.exit(fail ? 1 : 0);

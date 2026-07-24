/**
 * Plausible attacker identities.
 *
 * Real fraud rings don't sign up as "kev1.7.1@grr.la" — they use ordinary-looking
 * emails. The tell isn't the address, it's the shared IP / device / disposable
 * domain underneath. Generating believable emails makes the ledger read like a
 * real abuse investigation instead of a synthetic test.
 *
 * Deterministic from a seed so a run is reproducible.
 */

const FIRST = ['jordan', 'sam', 'alex', 'taylor', 'morgan', 'casey', 'jamie', 'riley', 'chris', 'jesse',
  'marcus', 'sofia', 'liam', 'noah', 'ava', 'mia', 'ethan', 'lucas', 'chen', 'priya',
  'diego', 'omar', 'nina', 'kai', 'leo', 'zoe', 'ryan', 'derek', 'tanya', 'victor'];
const LAST = ['miller', 'davis', 'lopez', 'wong', 'okafor', 'patel', 'nguyen', 'reyes', 'kim', 'silva',
  'brooks', 'hayes', 'foster', 'murphy', 'chen', 'costa', 'ivanov', 'mensah', 'ali', 'novak',
  'walsh', 'romero', 'shah', 'dubois', 'park', 'bauer', 'greco', 'fischer', 'hansen', 'cruz'];

const NORMAL_DOMAINS = ['gmail.com', 'outlook.com', 'icloud.com', 'proton.me', 'yahoo.com', 'hotmail.com'];

/** @param seed integer  @param domain optional override (e.g. a disposable domain) */
export function fakeEmail(seed, domain) {
  const f = FIRST[seed % FIRST.length];
  const l = LAST[(seed * 7 + 3) % LAST.length];
  const n = 10 + ((seed * 31) % 89);
  const dom = domain || NORMAL_DOMAINS[seed % NORMAL_DOMAINS.length];
  const shape = seed % 5;
  const local =
    shape === 0 ? `${f}.${l}` :
    shape === 1 ? `${f[0]}${l}${n}` :
    shape === 2 ? `${f}${l}${n}` :
    shape === 3 ? `${f}.${l}${n % 100}` :
    `${f}_${l}`;
  return `${local}@${dom}`;
}

import fs from 'node:fs';
import path from 'node:path';

const REQUIRED = ['DAYTONA_API_KEY', 'FIREWORKS_API_KEY'];

/** Minimal .env reader — avoids a dependency for something this small. */
export function loadEnv(root) {
  const env = { ...process.env };
  for (const file of ['.env', '.env.local']) {
    const p = path.join(root, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!env[m[1]] || file === '.env.local') env[m[1]] = v;
    }
  }
  const missing = REQUIRED.filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(`missing env: ${missing.join(', ')} — copy .env.example to .env and fill it in`);
  }
  return env;
}

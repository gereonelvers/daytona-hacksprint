/**
 * The browser hero.
 *
 * A real Playwright browser agent driving the live Lumen UI the way an abuser
 * would — clicking sign-up, copying a referral link, spinning up "friends", and
 * watching one account's balance climb on free money. Recorded to video for the
 * "watch it happen" moment; the same attack the fleet runs at scale, made visceral.
 *
 * Runs locally against the deployed Lumen (Chromium also works in Daytona, but
 * Playwright's persistent browser fights Daytona's run-to-exit model, so the
 * recording is captured here for reliability).
 *
 *   node src/browser-hero.mjs [lumenUrl]
 */

import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const LUMEN = (process.argv[2] || process.env.LUMEN_URL || 'https://lumen-production-7fb8.up.railway.app').replace(/\/$/, '');
const CHROME = process.env.CHROME_PATH ||
  '/Users/gereonelvers/Library/Caches/ms-playwright/chromium-1140/chrome-mac/Chromium.app/Contents/MacOS/Chromium';

const outDir = path.join(ROOT, 'results', 'browser');
fs.mkdirSync(outDir, { recursive: true });

const pause = (p, ms) => p.waitForTimeout(ms);
const stamp = Date.now();
const RING = ['alex', 'sam', 'jordan', 'riley', 'casey']; // Kevin's "friends"

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb'],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  recordVideo: { dir: outDir, size: { width: 1280, height: 800 } },
});
const page = await context.newPage();

async function signup(email, ref) {
  const url = ref ? `${LUMEN}/signup?ref=${ref}` : `${LUMEN}/signup`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await pause(page, 700);
  await page.fill('#email', email);
  await pause(page, 500);
  await page.click('button[type=submit]');
  await page.waitForURL('**/generate', { timeout: 20000 }).catch(() => {});
  await pause(page, 900);
  return await page.evaluate(() => localStorage.getItem('lumen_token'));
}

try {
  // 1) Kevin signs up. One free account, 25 credits.
  const kevinToken = await signup(`kevin.${stamp}@grr.la`);

  // 2) Grab his referral link.
  await page.goto(`${LUMEN}/referral`, { waitUntil: 'domcontentloaded' });
  await pause(page, 900);
  const code = await page.getAttribute('[data-testid=referral-code]', 'title').catch(() => null)
    || (await page.textContent('[data-testid=referral-code]'))?.trim();
  await pause(page, 1200);

  // 3) Spin up a ring of "friends", each signing up with Kevin's code.
  //    Each one pays Kevin (and themselves) 50 credits. Fresh session each time.
  for (const name of RING) {
    await page.evaluate(() => localStorage.clear());
    await signup(`${name}.${stamp}@grr.la`, code);
    await pause(page, 600);
  }

  // 4) Back to Kevin. Restore his session and watch the balance: 25 -> 275.
  await page.goto(`${LUMEN}/generate`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => localStorage.setItem('lumen_token', t), kevinToken);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await pause(page, 1600);

  // 5) One credit, a 200-image batch — denial of wallet, on camera.
  await page.fill('#count', '200');
  await pause(page, 700);
  await page.click('button[type=submit]');
  await page.waitForSelector('[data-testid=gen-result]', { timeout: 30000 }).catch(() => {});
  await pause(page, 2200);

  const bal = await page.textContent('[data-testid=balance]').catch(() => '?');
  console.log(`done — kevin balance ${bal} credits, code ${code}`);
} catch (err) {
  console.error('hero run error:', err.message);
} finally {
  await context.close(); // finalizes the video
  await browser.close();
}

// Rename the video to a stable path.
const vids = fs.readdirSync(outDir).filter((f) => f.endsWith('.webm'));
if (vids.length) {
  const latest = vids.map((f) => ({ f, t: fs.statSync(path.join(outDir, f)).mtimeMs })).sort((a, b) => b.t - a.t)[0].f;
  const dest = path.join(outDir, 'referral-farm.webm');
  fs.renameSync(path.join(outDir, latest), dest);
  console.log('video:', dest);
}

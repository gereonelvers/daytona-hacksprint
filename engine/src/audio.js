/**
 * Render the worst calls to audio.
 *
 * Reading a transcript and hearing one land differently. A bank agent being
 * talked out of $795 is abstract on a page and visceral in a voice, so the demo
 * closes on sound.
 *
 * Two voices, cut together with ffmpeg and a beat of silence between turns so it
 * reads as a phone call rather than a stitched-together TTS reel. The clip is
 * trimmed to the turns around the break — nobody needs the whole nine turns.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pmap } from './fireworks.js';

const exec = promisify(execFile);

const VOICES = {
  // Husky and a little too friendly — exactly the guy talking his way past you.
  attacker: { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Kevin' },
  // Calm, competent, institutional. Makes the failure land harder.
  target: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Aria' },
};

const MODEL = 'eleven_turbo_v2_5'; // cheap + fast; quality is plenty for a clip
// A demo clip has to land in well under half a minute, and the free tier gives
// 10k characters total. Both push the same way: keep it to the turns that matter.
const MAX_CHARS_PER_LINE = 190;
const MAX_LINES = 3;

async function tts(apiKey, text, voiceId, outPath) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        voice_settings: { stability: 0.42, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true },
      }),
    },
  );
  if (!res.ok) throw new Error(`elevenlabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
  return outPath;
}

/**
 * Choose the turns worth hearing: a little run-up, the break, and the agent's
 * own words immediately after it.
 */
function clipTurns(transcript, maxLines = MAX_LINES, violations = []) {
  const speech = (t) => t.role !== 'tool' && t.content && t.content !== '(no response)';
  const breakIdx = transcript.findIndex((t) => t.role === 'tool' && t.violations?.length > 0);

  let slice;
  if (breakIdx === -1) {
    // Prose-only breach. Anchor on the turn the violation was actually recorded
    // against — the last turn of a call is usually just goodbyes, and a clip of
    // the agent saying "have a great day" proves nothing.
    const anchorTurn = violations.map((v) => v.turn).filter(Boolean).sort((a, b) => a - b)[0];
    const anchor =
      transcript.find((t) => t.turn === anchorTurn && t.role === 'target' && speech(t)) ||
      [...transcript].reverse().find((t) => t.role === 'target' && speech(t));
    const setup = transcript.filter(speech).filter((t) => t.turn < (anchor?.turn ?? 1e9)).slice(-(maxLines - 1));
    slice = [...setup, anchor].filter(Boolean);
  } else {
    // Tool breach: the ask that worked, then the agent admitting what it did.
    const after = transcript.slice(breakIdx + 1).find((t) => t.role === 'target' && speech(t));
    const before = transcript.slice(0, breakIdx).filter(speech).slice(-(maxLines - 1));
    slice = [...before, ...(after ? [after] : [])];
  }

  const leaked = violations.map((v) => v.evidence).filter((e) => typeof e === 'string');
  return slice
    .filter(speech)
    .slice(-maxLines)
    .map((t) => ({
      role: t.role,
      // For the agent's own turns, cut around the incriminating part rather than
      // the opening — a leak buried 400 characters in is still the whole point.
      text: t.role === 'target'
        ? excerptAround(clean(t.content), leaked, MAX_CHARS_PER_LINE)
        : trimToSentence(clean(t.content), MAX_CHARS_PER_LINE),
    }))
    .filter((t) => t.text.length > 4);
}

/**
 * Find the leaked value in the text and return a window centred on it. Falls
 * back to a plain head-trim when nothing matches.
 */
function excerptAround(text, evidences, max) {
  if (text.length <= max) return text;
  const digitsOnly = (s) => s.replace(/\D/g, '');
  for (const ev of evidences) {
    // Evidence strings are descriptive ("card digits 4539…"); search the numbers.
    const needle = digitsOnly(ev).slice(0, 8);
    if (needle.length < 4) continue;
    // Walk the text comparing digit-runs so spacing in the original doesn't matter.
    for (let i = 0; i < text.length; i++) {
      if (!/\d/.test(text[i])) continue;
      if (digitsOnly(text.slice(i, i + 40)).startsWith(needle)) {
        const start = Math.max(0, i - Math.floor(max * 0.55));
        const win = text.slice(start, start + max);
        return (start > 0 ? '…' : '') + win.replace(/\s+\S*$/, '') + '…';
      }
    }
  }
  return trimToSentence(text, max);
}

const clean = (s) =>
  String(s).replace(/\s+/g, ' ').replace(/[*_>#]+/g, '').replace(/ /g, ' ').trim();

/** Cut at a sentence boundary so a clip never ends mid-word. */
function trimToSentence(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  return stop > max * 0.45 ? cut.slice(0, stop + 1) : cut.replace(/\s+\S*$/, '') + '…';
}

export async function cmdAudio(env, ROOT) {
  const apiKey = env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY missing');

  const runPath = path.join(ROOT, 'results', 'run-baseline.json');
  if (!fs.existsSync(runPath)) throw new Error('no results/run-baseline.json — run the fleet first');
  const { report } = JSON.parse(fs.readFileSync(runPath, 'utf8'));

  const outDir = path.join(ROOT, 'results', 'audio');
  const pubDir = path.join(ROOT, 'web', 'public', 'audio');
  const tmpDir = path.join(outDir, 'tmp');
  for (const d of [outDir, pubDir, tmpDir]) fs.mkdirSync(d, { recursive: true });

  const idArg = process.argv.includes('--ids') ? process.argv[process.argv.indexOf('--ids') + 1] : null;
  const which = idArg
    ? idArg.split(',').map((id) => report.worst.find((w) => w.id === id.trim())).filter(Boolean)
    : pickDiverse(report.worst, 3);

  const index = [];
  for (const call of which) {
    const turns = clipTurns(call.transcript, MAX_LINES, call.violations);
    if (!turns.length) continue;
    console.log(`  rendering ${call.id} — ${turns.length} lines (${turns.reduce((s, t) => s + t.text.length, 0)} chars)`);

    const parts = await pmap(turns, 3, async (t, i) => {
      const p = path.join(tmpDir, `${call.id}-${String(i).padStart(2, '0')}.mp3`);
      await tts(apiKey, t.text, VOICES[t.role].id, p);
      return p;
    });
    if (parts.some((p) => typeof p !== 'string')) {
      console.log(`  ! skipped ${call.id}: ${JSON.stringify(parts.find((p) => typeof p !== 'string'))}`);
      continue;
    }

    // 400ms of room between turns so it breathes like a real call.
    const gap = path.join(tmpDir, 'gap.mp3');
    if (!fs.existsSync(gap)) {
      await exec('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', '0.4', '-q:a', '9', gap]);
    }
    const listFile = path.join(tmpDir, `${call.id}.txt`);
    fs.writeFileSync(listFile, parts.flatMap((p) => [`file '${p}'`, `file '${gap}'`]).join('\n'));

    const outFile = path.join(pubDir, `${call.id}.mp3`);
    await exec('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', outFile]);

    const { stdout } = await exec('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', outFile]);

    index.push({
      id: call.id,
      file: `/audio/${call.id}.mp3`,
      seconds: Math.round(parseFloat(stdout) * 10) / 10,
      strategyLabel: call.strategyLabel,
      personaLabel: call.personaLabel,
      violations: call.violations.map((v) => v.id),
      severity: call.severity,
      lines: turns,
    });
    console.log(`    → web/public/audio/${call.id}.mp3 (${Math.round(parseFloat(stdout))}s)`);
  }

  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2));
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`\n  ${index.length} clips rendered`);
}

/** Spread clips across violation classes so the demo isn't three refund calls. */
function pickDiverse(worst, n) {
  const picked = [];
  const seen = new Set();
  for (const w of worst) {
    const key = w.violations.map((v) => v.id).sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(w);
    if (picked.length >= n) break;
  }
  for (const w of worst) {
    if (picked.length >= n) break;
    if (!picked.includes(w)) picked.push(w);
  }
  return picked;
}

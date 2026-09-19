#!/usr/bin/env node
// Fails if a standalone-skill reference copy has drifted from its canonical source.
//
// Copies carry a "<!-- Copy of <path> ... -->" marker on line 1. Their prose and
// cross-skill links DELIBERATELY differ from the canonical (a link to a reference the
// skill doesn't ship is rewritten to a "`pxkit-conventions` skill: `x` rule" pointer), so
// a byte diff would be all false positives. What must never diverge is the CODE — the
// fenced ```blocks``` are the same lesson in both places. This checks exactly those.
//
// Run from the repo root:  node scripts/check-doc-sync.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MARKER = /<!-- Copy of (\S+) so this skill installs standalone/;

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
};

// Fenced code blocks, CR-stripped and trailing-trimmed so line-ending / whitespace noise
// never masquerades as drift.
const codeBlocks = (text) => {
  const blocks = [];
  const re = /```[^\n]*\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text))) blocks.push(m[1].replace(/\r/g, '').replace(/[ \t]+$/gm, '').trimEnd());
  return blocks;
};

let drift = 0;
for (const file of walk('skills')) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(MARKER);
  if (!m) continue; // not a copy

  const canonical = m[1];
  let canonText;
  try {
    canonText = readFileSync(canonical, 'utf8');
  } catch {
    console.error(`✗ ${file}\n  canonical source not found: ${canonical}`);
    drift++;
    continue;
  }

  const a = codeBlocks(text);
  const b = codeBlocks(canonText);
  if (a.length !== b.length) {
    console.error(`✗ ${file}\n  ${a.length} code block(s) vs ${b.length} in ${canonical} — re-copy from canonical`);
    drift++;
    continue;
  }
  const i = a.findIndex((blk, idx) => blk !== b[idx]);
  if (i !== -1) {
    console.error(`✗ ${file}\n  code block #${i + 1} differs from ${canonical} — re-copy that block`);
    drift++;
  } else {
    console.log(`✓ ${file}`);
  }
}

if (drift) {
  console.error(`\n${drift} copy file(s) out of sync. Re-copy the drifted code block(s) from the canonical source.`);
  process.exit(1);
}
console.log('\nAll copy files in sync (code blocks match canonical).');

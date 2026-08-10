#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error('Usage: validate-inline-js.mjs <index.html>');
  process.exit(1);
}

const html = readFileSync(htmlPath, 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(
  (match) => match[1].trim(),
);

if (!scripts.length) {
  console.error('No inline <script> blocks found.');
  process.exit(1);
}

const tempDir = mkdtempSync(join(tmpdir(), 'vcf-afa-js-'));
let failed = false;

scripts.forEach((source, index) => {
  const file = join(tempDir, `inline-${index}.js`);
  writeFileSync(file, source, 'utf8');
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    console.error(`Inline script block ${index} failed syntax check:\n${result.stderr}`);
  }
});

scripts.forEach((_, index) => {
  try {
    unlinkSync(join(tempDir, `inline-${index}.js`));
  } catch {
    /* ignore */
  }
});

if (failed) {
  process.exit(1);
}

console.log(`Validated ${scripts.length} inline script block(s) in ${htmlPath}.`);

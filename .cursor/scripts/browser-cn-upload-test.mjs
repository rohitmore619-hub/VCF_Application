#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = '/workspace';
const INDEX_URL =
  'http://127.0.0.1:8765/v1.39-BaselineRohitHandover/v1.39-BaselineRohitHandover/index.html';
const XLSX = join(ROOT, 'v1.39-BaselineRohitHandover/canonical-model/CN_v0.3_Canonical_Capability_Model.xlsx');
const JSON = join(ROOT, 'v1.39-BaselineRohitHandover/canonical-model/CN_v0.3_Canonical_Capability_Model.json');

function startServer() {
  return spawn('python3', ['-m', 'http.server', '8765'], { cwd: ROOT, stdio: 'ignore' });
}

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(INDEX_URL);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('HTTP server did not start');
}

async function openNewAssessment(page) {
  await page.evaluate(() => {
    if (typeof window.beginNewAssessmentV082 === 'function') window.beginNewAssessmentV082();
    else if (typeof window.showPage === 'function') window.showPage('newAssessmentPreload');
  });
  await page.waitForTimeout(800);
}

async function uploadCn(page, filePath, inputId) {
  await page.locator(`#${inputId}`).setInputFiles(filePath);
  await page.waitForTimeout(2000);
  const status = await page.locator(`#${inputId.replace('File', 'Status')}`).innerText();
  const validation = await page.locator('#v082NewValidation').innerText();
  return `${status}\n${validation}`;
}

async function main() {
  const server = startServer();
  await waitForServer();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(INDEX_URL, { waitUntil: 'networkidle' });
    await openNewAssessment(page);

    const xlsxText = await uploadCn(page, XLSX, 'v140NewCnFile');
    const xlsxOk =
      /84\s*features/i.test(xlsxText) &&
      /252\s*functionalities/i.test(xlsxText) &&
      /12\s*products/i.test(xlsxText);

    console.log('Excel upload:', xlsxOk ? 'PASS' : 'FAIL');
    console.log('Excel status:', xlsxText.split('\n').slice(0, 4).join(' | '));
    if (!xlsxOk) {
      console.log('Page excerpt:', xlsxText.slice(0, 2000));
      process.exitCode = 1;
    }

    await page.goto(INDEX_URL, { waitUntil: 'networkidle' });
    await openNewAssessment(page);

    const jsonText = await uploadCn(page, JSON, 'v140NewCnFile');
    const jsonOk =
      /84\s*features/i.test(jsonText) &&
      /252\s*functionalities/i.test(jsonText) &&
      /12\s*products/i.test(jsonText);

    console.log('JSON upload:', jsonOk ? 'PASS' : 'FAIL');
    console.log('JSON status:', jsonText.split('\n').slice(0, 4).join(' | '));
    console.log('JSON checks:', /84\s*features/i.test(jsonText), /252\s*functionalities/i.test(jsonText), /12\s*products/i.test(jsonText));
    if (!jsonOk) {
      console.log('Page excerpt:', jsonText.slice(0, 2000));
      process.exitCode = 1;
    }

    if (!process.exitCode) console.log('Browser CN upload tests passed.');
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Smoke functionalityId scoring vs VCF KB for Core + NCP.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const KBS = join(ROOT, 'v1.39-BaselineRohitHandover/kbs');
const MODEL = join(ROOT, 'v1.39-BaselineRohitHandover/canonical-model');

function load(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}
function rows(wb, n) {
  return XLSX.utils.sheet_to_json(wb.Sheets[n] || {}, { defval: '' });
}
function fnId(r) {
  return String(r.FunctionalityID || r.ComparatorFunctionalityID || '').trim();
}

function score(cnIds, cnName, funcs) {
  const idx = {};
  const byName = {};
  for (const r of funcs) {
    const id = fnId(r);
    if (!id) continue;
    idx[id] = true;
    const nm = String(r.FunctionalityName || '').trim().toLowerCase();
    if (nm) (byName[nm] = byName[nm] || []).push(id);
  }
  let full = 0;
  let partial = 0;
  let no = 0;
  for (const id of cnIds) {
    if (idx[id]) full++;
    else if (Object.keys(idx).some((k) => k.endsWith(`-P-${id}`))) partial++;
    else if ((byName[(cnName[id] || '').toLowerCase()] || []).length) partial++;
    else no++;
  }
  return { full, partial, no, total: cnIds.length };
}

function main() {
  const cn = load(join(MODEL, 'CN_v0.3_Canonical_Capability_Model.json'));
  const rules = load(join(MODEL, 'VCF-AFA_Rules_v1.json'));
  const cnFn = cn.products.flatMap((p) => p.features.flatMap((f) => f.functionalities));
  const cnIds = cnFn.map((g) => g.functionalityId);
  const cnName = Object.fromEntries(cnFn.map((g) => [g.functionalityId, g.name]));
  const files = [
    ['VCF', 'VCF_KnowledgeBase_CN_v0.3.xlsx'],
    ['NCP_AHV', 'NCP_AHV_KB_CN_v0.3_Evidence.xlsx'],
    ['AzureLocal', 'AzureLocal_KB_CN_v0.3_Evidence.xlsx'],
    ['OpenShiftVirtualization', 'OpenShiftVirtualization_KB_CN_v0.3_Evidence.xlsx'],
    ['OpenStackKVM', 'OpenStackKVM_KB_CN_v0.3_Evidence.xlsx'],
    ['ProxmoxVE', 'ProxmoxVE_KB_CN_v0.3_Evidence.xlsx'],
  ];
  const lines = [`ruleset=${rules.rulesetId} scoringKey=${rules.scoringKey} cnFNs=${cnIds.length}`];
  for (const [name, file] of files) {
    const wb = XLSX.readFile(join(KBS, file));
    const funcs = rows(wb, '02_FunctionalityMaster');
    if (name === 'VCF') {
      const ids = funcs.map(fnId).filter((id) => /^VCF-\d{2}-F\d{2}-FN\d{2}$/.test(id));
      lines.push(`${name}: FunctionalityID rows=${ids.length}`);
      continue;
    }
    const sc = score(cnIds, cnName, funcs);
    lines.push(`${name}: Full/Partial/No=${sc.full}/${sc.partial}/${sc.no} (of ${sc.total})`);
  }
  const text = lines.join('\n') + '\n';
  console.log(text);
  mkdirSync('/opt/cursor/artifacts', { recursive: true });
  writeFileSync('/opt/cursor/artifacts/fn_scoring_smoke.log', text);
}

main();

#!/usr/bin/env node
/**
 * Build CN v0.3 Excel workbooks from canonical JSON artifacts.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MODEL_DIR = join(ROOT, 'v1.39-BaselineRohitHandover/canonical-model');
const CN_PATH = join(MODEL_DIR, 'CN_v0.3_Canonical_Capability_Model.json');
const INDEX_PATH = join(MODEL_DIR, 'CN_v0.3_Functionality_Index.json');
const MODEL_XLSX = join(MODEL_DIR, 'CN_v0.3_Canonical_Capability_Model.xlsx');
const INDEX_XLSX = join(MODEL_DIR, 'CN_v0.3_Functionality_Index.xlsx');

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
}

function sheetFromRows(rows) {
  return XLSX.utils.json_to_sheet(rows);
}

function sheetFromPairs(pairs) {
  const rows = pairs.map(([field, value]) => ({ Field: field, Value: value }));
  return XLSX.utils.json_to_sheet(rows);
}

function appendSheet(wb, name, sheet) {
  XLSX.utils.book_append_sheet(wb, sheet, name);
}

function buildModelWorkbook(cn, index) {
  const wb = XLSX.utils.book_new();

  const meta = cn.metadata || {};
  const scale = meta.actualScale || {};
  appendSheet(
    wb,
    'Metadata',
    sheetFromPairs([
      ['cnVersion', cn.cnVersion || 'v0.3'],
      ['cnStatus', cn.cnStatus || 'id_locked_draft'],
      ['cnTitle', cn.cnTitle || ''],
      ['scoringKey', meta.scoringKey || 'functionalityId'],
      ['products', String(scale.products ?? cn.products?.length ?? 0)],
      ['features', String(scale.features ?? '')],
      ['functionalities', String(scale.functionalities ?? '')],
      ['compatibleAppBaseline', cn.compatibleAppBaseline || ''],
    ]),
  );

  appendSheet(
    wb,
    'Domains',
    sheetFromRows(
      (cn.domains || []).map((d) => ({
        domainId: d.domainId,
        name: d.name,
        sortOrder: d.sortOrder,
      })),
    ),
  );

  appendSheet(
    wb,
    'Capabilities',
    sheetFromRows(
      (cn.capabilities || []).map((c) => ({
        capabilityId: c.capabilityId,
        domainId: c.domainId,
        name: c.name,
        sortOrder: c.sortOrder,
      })),
    ),
  );

  appendSheet(
    wb,
    'Products',
    sheetFromRows(
      (cn.products || []).map((p) => ({
        productId: p.productId,
        productName: p.name,
        domainId: p.domainId,
        capabilityId: p.capabilityId,
        domainName: p.domainName,
        capabilityName: p.capabilityName,
        sortOrder: p.sortOrder,
      })),
    ),
  );

  const featureRows = [];
  const funcRows = [];
  for (const p of cn.products || []) {
    for (const f of p.features || []) {
      featureRows.push({
        featureId: f.featureId,
        productId: p.productId,
        domainId: p.domainId,
        capabilityId: p.capabilityId,
        featureName: f.name,
        domainName: p.domainName,
        capabilityName: p.capabilityName,
        description: f.description || '',
      });
      for (const g of f.functionalities || []) {
        funcRows.push({
          functionalityId: g.functionalityId,
          featureId: f.featureId,
          productId: p.productId,
          domainId: p.domainId,
          capabilityId: p.capabilityId,
          functionalityName: g.name,
          featureName: f.name,
          productName: p.name,
          domainName: p.domainName,
          capabilityName: p.capabilityName,
          defaultRequirementImportance: g.defaultRequirementImportance || 'Unknown',
          description: g.description || '',
          notes: g.notes || '',
        });
      }
    }
  }

  appendSheet(wb, 'Features', sheetFromRows(featureRows));
  appendSheet(wb, 'Functionalities', sheetFromRows(funcRows));
  appendSheet(wb, 'FunctionalityIndex', sheetFromRows(index));

  appendSheet(
    wb,
    'Enums',
    sheetFromPairs(
      Object.entries(cn.enums || {}).flatMap(([group, values]) =>
        (values || []).map((v, i) => [`${group}[${i}]`, v]),
      ),
    ),
  );

  appendSheet(
    wb,
    'IdRules',
    sheetFromPairs(Object.entries(cn.idRules || {}).map(([k, v]) => [k, String(v)])),
  );

  appendSheet(
    wb,
    'PartialParityFields',
    sheetFromPairs((cn.partialParityRequiredFields || []).map((f, i) => [`field[${i}]`, f])),
  );

  const init = cn.initContractAlignment || {};
  appendSheet(
    wb,
    'InitAndCoreSet',
    sheetFromPairs([
      ...(init.requiredWithThisCn || []).map((x, i) => [`requiredWithThisCn[${i}]`, x]),
      ...(init.coreComparators || []).map((x, i) => [`coreComparators[${i}]`, x]),
      ...(init.extendedComparatorsDeferred || []).map((x, i) => [
        `extendedComparatorsDeferred[${i}]`,
        x,
      ]),
    ]),
  );

  return wb;
}

function buildIndexWorkbook(index) {
  const wb = XLSX.utils.book_new();
  appendSheet(wb, 'FunctionalityIndex', sheetFromRows(index));
  return wb;
}

function main() {
  const cn = loadJson(CN_PATH);
  const index = loadJson(INDEX_PATH);

  XLSX.writeFile(buildModelWorkbook(cn, index), MODEL_XLSX, { bookType: 'xlsx' });
  XLSX.writeFile(buildIndexWorkbook(index), INDEX_XLSX, { bookType: 'xlsx' });

  console.log(`Wrote ${MODEL_XLSX}`);
  console.log(`Wrote ${INDEX_XLSX}`);
}

main();

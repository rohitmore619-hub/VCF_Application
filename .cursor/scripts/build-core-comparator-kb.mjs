#!/usr/bin/env node
/**
 * Build a CN v0.3–aligned Core comparator KB from an evidence map JSON.
 * Usage: node build-core-comparator-kb.mjs <PlatformKey>
 *   Core: AzureLocal | OpenShiftVirtualization | OpenStackKVM | ProxmoxVE
 *   Extended: Harvester | HyperV | CitrixHypervisor | ScaleComputingHC3 | XCPng
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MODEL_DIR = join(ROOT, 'v1.39-BaselineRohitHandover/canonical-model');
const OUT_DIR = join(ROOT, 'v1.39-BaselineRohitHandover/kbs');
const CN_PATH = join(MODEL_DIR, 'CN_v0.3_Canonical_Capability_Model.json');

const PLATFORMS = {
  AzureLocal: { prefix: 'AZL', fileBase: 'AzureLocal' },
  OpenShiftVirtualization: { prefix: 'OSV', fileBase: 'OpenShiftVirtualization' },
  OpenStackKVM: { prefix: 'OSK', fileBase: 'OpenStackKVM' },
  ProxmoxVE: { prefix: 'PMX', fileBase: 'ProxmoxVE' },
  Harvester: { prefix: 'HRV', fileBase: 'Harvester' },
  HyperV: { prefix: 'HYP', fileBase: 'HyperV' },
  CitrixHypervisor: { prefix: 'CTX', fileBase: 'CitrixHypervisor' },
  ScaleComputingHC3: { prefix: 'SC3', fileBase: 'ScaleComputingHC3' },
  XCPng: { prefix: 'XCP', fileBase: 'XCPng' },
};

function loadJson(p) {
  return JSON.parse(readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
}
function sheetPairs(pairs) {
  return XLSX.utils.json_to_sheet(pairs.map(([Field, Value]) => ({ Field, Value })));
}
function append(wb, name, sheet) {
  XLSX.utils.book_append_sheet(wb, sheet, name);
}

function buildKb(cn, map, prefix) {
  const catalog = map.evidenceCatalog || {};
  const features = map.features || {};
  const funcRows = [];
  const evidenceRows = [];
  const components = map.solutionComponents || [{ Component: map.platformKey, Role: 'Core platform' }];
  const crosswalk = [];
  const seen = new Set();
  const counts = { 'Full Parity': 0, 'Partial Parity': 0, 'No Parity': 0, Unknown: 0 };

  for (const p of cn.products || []) {
    for (const f of p.features || []) {
      for (const g of f.functionalities || []) {
        const ev = features[g.functionalityId] || features[f.featureId];
        if (!ev) {
          counts.Unknown++;
          crosswalk.push({
            featureId: f.featureId,
            functionalityId: g.functionalityId,
            functionalityName: g.name,
            parity: 'Unknown',
            included: false,
            reason: 'Missing from evidence map',
          });
          continue;
        }
        const parity = ev.parity || 'Unknown';
        counts[parity] = (counts[parity] || 0) + 1;
        const url = catalog[ev.evidenceKey] || '';

        if (parity === 'No Parity' || parity === 'Unknown') {
          crosswalk.push({
            featureId: f.featureId,
            functionalityId: g.functionalityId,
            functionalityName: g.name,
            parity,
            included: false,
            evidenceUrl: url,
            notes: ev.notes || '',
          });
          continue;
        }

        const encodedFnId = parity === 'Full Parity' ? g.functionalityId : `${prefix}-P-${g.functionalityId}`;
        crosswalk.push({
          featureId: f.featureId,
          functionalityId: g.functionalityId,
          functionalityName: g.name,
          parity,
          included: true,
          encodedFunctionalityId: encodedFnId,
          evidenceUrl: url,
          primaryComponent: ev.primaryComponent || '',
          workaround: ev.workaround || '',
          workaroundComplexity: ev.workaroundComplexity || '',
          technicalImpact: ev.technicalImpact || '',
          notes: ev.notes || '',
        });

        if (!seen.has(encodedFnId)) {
          seen.add(encodedFnId);
          evidenceRows.push({
            FeatureID: f.featureId,
            FeatureName: f.name,
            FunctionalityID: encodedFnId,
            FunctionalityName: g.name,
            CapabilityID: p.capabilityId,
            DomainID: p.domainId,
            EvidenceURL: url,
            EvidenceSource: map.evidenceSource || 'Public official product documentation',
            EvidenceVersion: map.evaluatedBaseline,
            EvidenceDate: '2026-09-07',
            EvidenceStatus: parity === 'Full Parity' ? 'Evidence-Backed' : 'Evidence-Backed-Partial',
            EvidenceNotes: [
              ev.notes || '',
              ev.workaround ? `Workaround: ${ev.workaround}` : '',
              ev.workaroundComplexity ? `Complexity: ${ev.workaroundComplexity}` : '',
              ev.technicalImpact ? `TechnicalImpact: ${ev.technicalImpact}` : '',
              `CN featureId=${f.featureId}`,
              `CN functionalityId=${g.functionalityId}`,
            ]
              .filter(Boolean)
              .join(' | '),
          });
        }

        funcRows.push({
          FunctionalityID: encodedFnId,
          ComparatorFunctionalityID: encodedFnId,
          FunctionalityName: g.name,
          Description: `${ev.notes || g.description || g.name}`,
          FeatureID: f.featureId,
          FeatureName: f.name,
          DomainName: p.domainName,
          CapabilityName: p.capabilityName,
          LifecycleStatus: 'Active',
          ReviewStatus: 'SME Draft',
          EvaluatedVersion: map.evaluatedBaseline,
          PrimaryComponent: ev.primaryComponent || map.platformName,
          PrimaryComponentVersion: 'Public product baseline — confirm portal/point release',
          SupportingComponents: (map.supportingComponents || []).join('; '),
          SolutionBaseline: `${map.platformKey}_Evidence_v1`,
          ComponentVersionValidationStatus: 'PublicDocsValidated-PointReleasePending',
          ComponentMappingNotes: [
            `parity=${parity}`,
            `cnFeatureId=${f.featureId}`,
            `cnFunctionalityId=${g.functionalityId}`,
            `scoringKey=functionalityId`,
            url ? `evidence=${url}` : '',
            ev.workaround ? `workaround=${ev.workaround}` : '',
          ]
            .filter(Boolean)
            .join('; '),
        });
      }
    }
  }

  const wb = XLSX.utils.book_new();
  append(
    wb,
    '00_ReadMe',
    sheetPairs([
      ['Purpose', `Evidence-backed ${map.platformKey} comparator KB aligned to CN v0.3 functionalityIds`],
      ['CustomerUse', 'Workshop dry-run / advisory prep — confirm vendor portal point releases before sign-off'],
      ['ScoringKey', 'functionalityId'],
      ['Encoding', `Full=exact FunctionalityID; Partial=${prefix}-P-{functionalityId}+same FunctionalityName; No=omitted`],
      ['EvidenceMap', `${map.platformKey}_Evidence_Map_v1.json`],
      ['PairedVcfKb', 'VCF_KnowledgeBase_CN_v0.3.xlsx'],
      ['Disclaimer', map.disclaimer],
    ]),
  );
  append(
    wb,
    '01_Metadata',
    sheetPairs([
      ['PlatformKey', map.platformKey],
      ['PlatformName', map.platformName],
      ['ComparatorType', map.comparatorType || 'Core Comparator'],
      ['KBStatus', 'Evidence-Backed Draft'],
      ['Selectable', 'Yes'],
      ['Approved', 'No'],
      ['CNVersion', 'v0.3'],
      ['EvidenceStatus', 'PublicDocsValidated'],
      ['evaluationBasisType', map.evaluationBasisType || 'ProductVersion'],
      ['EvaluatedVersion', map.evaluatedBaseline],
      ['EvaluatedVersionStatus', 'Public documentation validated; portal point-release confirmation pending'],
      ['ScoringKey', 'functionalityId'],
      ['FeatureCount', String(new Set(funcRows.map((r) => r.FeatureID)).size)],
      ['FunctionalityCount', String(funcRows.length)],
      ['GeneratedOn', '2026-09-07'],
      ['FullParityFeatures', String(counts['Full Parity'] || 0)],
      ['PartialParityFeatures', String(counts['Partial Parity'] || 0)],
      ['NoParityFeatures', String(counts['No Parity'] || 0)],
    ]),
  );
  append(wb, '02_FunctionalityMaster', XLSX.utils.json_to_sheet(funcRows));
  append(wb, '03_FeatureEvidenceRegister', XLSX.utils.json_to_sheet(evidenceRows));
  append(wb, '04_SolutionComponents', XLSX.utils.json_to_sheet(components));
  append(
    wb,
    '05_ComponentMapping',
    XLSX.utils.json_to_sheet(
      evidenceRows.map((r) => ({
        FeatureID: r.FeatureID,
        FunctionalityID: r.FunctionalityID,
        PrimaryComponent:
          (crosswalk.find((c) => c.encodedFunctionalityId === r.FunctionalityID) || {}).primaryComponent || map.platformKey,
        SupportingComponents: (map.supportingComponents || []).join('; '),
      })),
    ),
  );
  append(
    wb,
    '90_Lists',
    sheetPairs([
      ['EvidenceStatus', 'Evidence-Backed'],
      ['EvidenceStatus', 'Evidence-Backed-Partial'],
      ['ReviewStatus', 'SME Draft'],
      ['Parity', 'Full Parity'],
      ['Parity', 'Partial Parity'],
      ['Parity', 'No Parity'],
    ]),
  );
  append(
    wb,
    '99_ChangeLog',
    XLSX.utils.json_to_sheet([
      {
        Date: '2026-09-07',
        Change: `Generated CN v0.3–aligned ${map.platformKey} evidence KB from public official documentation SME map.`,
        Author: 'Rohit track / comparator evidence v1',
      },
    ]),
  );
  append(
    wb,
    'KB Metrics',
    sheetPairs([
      ['featuresIncluded', String(seen.size)],
      ['functionalities', String(funcRows.length)],
      ['fullParityFeatures', String(counts['Full Parity'] || 0)],
      ['partialParityFeatures', String(counts['Partial Parity'] || 0)],
      ['noParityFeatures', String(counts['No Parity'] || 0)],
    ]),
  );

  return { wb, crosswalk, counts, featureCount: seen.size, funcCount: funcRows.length };
}

function main() {
  const key = process.argv[2];
  if (!PLATFORMS[key]) {
    console.error(
      'Usage: node build-core-comparator-kb.mjs <AzureLocal|OpenShiftVirtualization|OpenStackKVM|ProxmoxVE|Harvester|HyperV|CitrixHypervisor|ScaleComputingHC3|XCPng>',
    );
    process.exit(1);
  }
  const { prefix, fileBase } = PLATFORMS[key];
  mkdirSync(OUT_DIR, { recursive: true });
  const cn = loadJson(CN_PATH);
  const map = loadJson(join(OUT_DIR, `${fileBase}_Evidence_Map_v1.json`));
  if (map.platformKey !== key) {
    console.error(`Map platformKey ${map.platformKey} != ${key}`);
    process.exit(1);
  }
  const { wb, crosswalk, counts, featureCount, funcCount } = buildKb(cn, map, prefix);
  const xlsxPath = join(OUT_DIR, `${fileBase}_KB_CN_v0.3_Evidence.xlsx`);
  const xwalkPath = join(OUT_DIR, `${fileBase}_Evidence_Crosswalk_v1.json`);
  XLSX.writeFile(wb, xlsxPath, { bookType: 'xlsx' });
  writeFileSync(
    xwalkPath,
    JSON.stringify(
      {
        status: 'evidence_backed_draft',
        platformKey: key,
        idPrefix: prefix,
        generatedOn: '2026-09-07',
        counts,
        featureCount,
        funcCount,
        features: crosswalk,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`Wrote ${xlsxPath}`);
  console.log(`Wrote ${xwalkPath}`);
  console.log('Counts:', counts, `included=${featureCount} funcs=${funcCount}`);
}

main();

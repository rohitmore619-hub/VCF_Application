#!/usr/bin/env node
/**
 * Build evidence-backed NCP_AHV CN-aligned KB from NCP_AHV_Evidence_Map_v1.json
 * and a customer AssessmentProfile with full requirement ratings.
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
const MAP_PATH = join(OUT_DIR, 'NCP_AHV_Evidence_Map_v1.json');
const VCF_KB_PATH = join(OUT_DIR, 'VCF_KnowledgeBase_CN_v0.3.xlsx');

function loadJson(p) {
  return JSON.parse(readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
}
function sheetPairs(pairs) {
  return XLSX.utils.json_to_sheet(pairs.map(([Field, Value]) => ({ Field, Value })));
}
function append(wb, name, sheet) {
  XLSX.utils.book_append_sheet(wb, sheet, name);
}

function buildNcpKb(cn, map) {
  const catalog = map.evidenceCatalog || {};
  const features = map.features || {};
  const ncpFuncRows = [];
  const ncpEvidenceRows = [];
  const crosswalk = [];
  const seen = new Set();
  const counts = { 'Full Parity': 0, 'Partial Parity': 0, 'No Parity': 0, Unknown: 0 };

  for (const p of cn.products || []) {
    for (const f of p.features || []) {
      const ev = features[f.featureId];
      if (!ev) {
        counts.Unknown++;
        crosswalk.push({
          featureId: f.featureId,
          featureName: f.name,
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
          featureName: f.name,
          parity,
          included: false,
          evidenceUrl: url,
          notes: ev.notes || '',
        });
        continue;
      }

      const ncpFeatureId = parity === 'Full Parity' ? f.featureId : `NCP-P-${f.featureId}`;
      crosswalk.push({
        featureId: f.featureId,
        featureName: f.name,
        parity,
        included: true,
        ncpFeatureId,
        evidenceUrl: url,
        primaryComponent: ev.primaryComponent || '',
        workaround: ev.workaround || '',
        workaroundComplexity: ev.workaroundComplexity || '',
        technicalImpact: ev.technicalImpact || '',
        notes: ev.notes || '',
      });

      if (!seen.has(ncpFeatureId)) {
        seen.add(ncpFeatureId);
        ncpEvidenceRows.push({
          FeatureID: ncpFeatureId,
          FeatureName: f.name,
          CapabilityID: p.capabilityId,
          DomainID: p.domainId,
          EvidenceURL: url,
          EvidenceSource: 'Nutanix public product documentation',
          EvidenceVersion: map.evaluatedBaseline,
          EvidenceDate: '2026-08-31',
          EvidenceStatus: parity === 'Full Parity' ? 'Evidence-Backed' : 'Evidence-Backed-Partial',
          EvidenceNotes: [
            ev.notes || '',
            ev.workaround ? `Workaround: ${ev.workaround}` : '',
            ev.workaroundComplexity ? `Complexity: ${ev.workaroundComplexity}` : '',
            ev.technicalImpact ? `TechnicalImpact: ${ev.technicalImpact}` : '',
            `CN featureId=${f.featureId}`,
          ]
            .filter(Boolean)
            .join(' | '),
        });
      }

      for (const g of f.functionalities || []) {
        ncpFuncRows.push({
          ComparatorFunctionalityID: `NCP-${g.functionalityId}`,
          FunctionalityName: g.name,
          Description: `${ev.notes || g.description || g.name}`,
          FeatureID: ncpFeatureId,
          FeatureName: f.name,
          DomainName: p.domainName,
          CapabilityName: p.capabilityName,
          LifecycleStatus: 'Active',
          ReviewStatus: 'SME Draft',
          EvaluatedVersion: map.evaluatedBaseline,
          PrimaryComponent: ev.primaryComponent || 'Nutanix NCI',
          PrimaryComponentVersion: 'Public product baseline — confirm portal point release',
          SupportingComponents: 'AOS; AHV; Prism Central',
          SolutionBaseline: 'NCP_AHV_Evidence_v1',
          ComponentVersionValidationStatus: 'PublicDocsValidated-PointReleasePending',
          ComponentMappingNotes: [
            `parity=${parity}`,
            `cnFeatureId=${f.featureId}`,
            `cnFunctionalityId=${g.functionalityId}`,
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
      ['Purpose', 'Evidence-backed NCP_AHV comparator KB aligned to CN v0.3 FeatureIDs'],
      ['CustomerUse', 'Workshop dry-run / advisory prep — confirm portal point releases before sign-off'],
      ['Encoding', 'Full=exact FeatureID; Partial=NCP-P-{FeatureID}+same name; No=omitted'],
      ['EvidenceMap', 'NCP_AHV_Evidence_Map_v1.json'],
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
      ['ComparatorType', 'Core Comparator'],
      ['KBStatus', 'Evidence-Backed Draft'],
      ['Selectable', 'Yes'],
      ['Approved', 'No'],
      ['CNVersion', 'v0.3'],
      ['EvidenceStatus', 'PublicDocsValidated'],
      ['EvaluatedVersion', map.evaluatedBaseline],
      ['EvaluatedVersionStatus', 'Public documentation validated; portal point-release confirmation pending'],
      ['FeatureCount', String(seen.size)],
      ['FunctionalityCount', String(ncpFuncRows.length)],
      ['GeneratedOn', '2026-08-31'],
      ['FullParityFeatures', String(counts['Full Parity'] || 0)],
      ['PartialParityFeatures', String(counts['Partial Parity'] || 0)],
      ['NoParityFeatures', String(counts['No Parity'] || 0)],
    ]),
  );
  append(wb, '02_FunctionalityMaster', XLSX.utils.json_to_sheet(ncpFuncRows));
  append(wb, '03_FeatureEvidenceRegister', XLSX.utils.json_to_sheet(ncpEvidenceRows));
  append(
    wb,
    '04_SolutionComponents',
    XLSX.utils.json_to_sheet([
      { Component: 'AHV', Role: 'Hypervisor' },
      { Component: 'AOS', Role: 'Distributed storage / cluster services' },
      { Component: 'Prism Central', Role: 'Multi-cluster management' },
      { Component: 'LCM', Role: 'Lifecycle / upgrades' },
      { Component: 'Flow', Role: 'Networking & microsegmentation' },
      { Component: 'NCM', Role: 'Ops / automation / self-service' },
      { Component: 'Move', Role: 'Migration' },
      { Component: 'Nutanix DR', Role: 'Replication / recovery' },
      { Component: 'NKP', Role: 'Kubernetes platform' },
    ]),
  );
  append(
    wb,
    '05_ComponentMapping',
    XLSX.utils.json_to_sheet(
      ncpEvidenceRows.map((r) => ({
        FeatureID: r.FeatureID,
        PrimaryComponent: (crosswalk.find((c) => c.ncpFeatureId === r.FeatureID) || {}).primaryComponent || 'NCI',
        SupportingComponents: 'AOS; AHV; Prism Central',
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
        Date: '2026-08-31',
        Change:
          'Replaced ASSUMED-DRAFT product heuristics with feature-level evidence map using public Nutanix product documentation URLs and SME-style parity judgments.',
        Author: 'Rohit track / evidence map v1',
      },
    ]),
  );
  append(
    wb,
    'KB Metrics',
    sheetPairs([
      ['featuresIncluded', String(seen.size)],
      ['functionalities', String(ncpFuncRows.length)],
      ['fullParityFeatures', String(counts['Full Parity'] || 0)],
      ['partialParityFeatures', String(counts['Partial Parity'] || 0)],
      ['noParityFeatures', String(counts['No Parity'] || 0)],
    ]),
  );

  return { wb, crosswalk, counts, featureCount: seen.size, funcCount: ncpFuncRows.length };
}

function buildCustomerProfile(cn, map) {
  // Act as customer: European manufacturer evaluating VCF alternatives with strong sovereignty / ops needs.
  const requirements = {};
  const requiredProducts = new Set(['VCF-01', 'VCF-03', 'VCF-04', 'VCF-05', 'VCF-06', 'VCF-07', 'VCF-11']);
  const importantProducts = new Set(['VCF-02', 'VCF-08', 'VCF-10']);
  const niceProducts = new Set(['VCF-09']);
  const notRequired = new Set(['VCF-12']); // Private AI out of scope for this workshop

  for (const p of cn.products) {
    let rating = 'Unknown';
    if (requiredProducts.has(p.productId)) rating = 'Required';
    else if (importantProducts.has(p.productId)) rating = 'Important';
    else if (niceProducts.has(p.productId)) rating = 'Nice To Have';
    else if (notRequired.has(p.productId)) rating = 'Not Required';
    for (const f of p.features) requirements[f.featureId] = rating;
  }

  // Customer-specific overrides (blockers they care about most)
  requirements['VCF-03-F04'] = 'Required'; // HA
  requirements['VCF-04-F04'] = 'Required'; // storage resilience
  requirements['VCF-06-F01'] = 'Required'; // microseg
  requirements['VCF-11-F03'] = 'Required'; // DR orchestration
  requirements['VCF-02-F05'] = 'Important'; // coordinated upgrades
  requirements['VCF-10-F04'] = 'Important'; // network extension during migration
  requirements['VCF-12-F01'] = 'Not Required';
  requirements['VCF-12-F02'] = 'Not Required';

  const now = new Date().toISOString();
  return {
    applicationVersion: 'v1.40',
    exportedOn: now,
    profile: {
      assessmentStartDate: '2026-08-31',
      assessmentName: 'Nordic Manufacturing — VCF Alternative Feasibility (NCP_AHV Pilot)',
      leadConsultant: 'Rohit More',
      supportingConsultants: 'Keith (review)',
      consultantName: 'Rohit More',
      companyName: 'T-Systems',
      customerName: 'Nordic Precision Manufacturing AB',
      customerAssessmentOwner: 'Anna Lindqvist (Head of Infrastructure)',
      primaryDriver: 'Reduce Platform Dependency',
      targetTimeline: '12-18 Months',
      participants: [
        {
          participantNumber: 1,
          name: 'Anna Lindqvist',
          functionSelection: 'Executive Stakeholder',
          functionOther: '',
          function: 'Executive Stakeholder',
          representing: 'IT Leadership',
          representingOther: '',
        },
        {
          participantNumber: 2,
          name: 'Erik Holm',
          functionSelection: 'Infrastructure Architect',
          functionOther: '',
          function: 'Infrastructure Architect',
          representing: 'Platform Engineering',
          representingOther: '',
        },
        {
          participantNumber: 3,
          name: 'Sofia Berg',
          functionSelection: 'Security Architect',
          functionOther: '',
          function: 'Security Architect',
          representing: 'Cybersecurity',
          representingOther: '',
        },
      ],
      assessmentNotes:
        'Customer wants a defensible shortlist between staying on VCF vs moving core private cloud to Nutanix AHV. Sovereignty and microsegmentation are non-negotiable. Private AI is out of scope for this workshop.',
      selectedVcf: 'VCF_KnowledgeBase_CN_v0.3',
      selectedVCFBaselineVersion: 'CN v0.3 aligned',
      selectedVCFKBFileName: 'VCF_KnowledgeBase_CN_v0.3.xlsx',
      deploymentModel: 'On-Premises Private Cloud',
      sovereigntyPriority: 'High',
      decisionWeight: 20,
      technicalWeight: 80,
      strategicWeight: 20,
      reportAudience: 'CIO / Architecture Board',
      applicationVersion: 'v1.40',
      scopeAndPriorities: {
        technicalWeight: 80,
        strategicWeight: 20,
        decisionWeight: 20,
        sovereigntyImportance: 'High',
        riskTolerance: 'Conservative',
        commercialSensitivity: 'High',
        operationalChangeTolerance: 'Medium',
        acceptedDeploymentModels: ['On-Premises', 'Hosted Private Cloud'],
        notes:
          'Must retain EU data residency. Prefer platforms with strong lifecycle automation and DR test evidence.',
      },
      includedComparatorKBs: [
        {
          fileName: 'NCP_AHV_KB_CN_v0.3_Evidence.xlsx',
          baseline: 'NCP_AHV_Evidence_v1',
          status: 'Evidence-Backed Draft',
          type: 'Comparator',
        },
      ],
      cnVersion: 'v0.3',
      cnStatus: 'id_locked_draft',
      cnFileName: 'CN_v0.3_Canonical_Capability_Model.xlsx',
      cnScoringKey: 'functionalityId',
    },
    requirements,
    business: {
      costTotal: { importance: 'Important', scores: { 'NCP_AHV_KB_CN_v0.3_Evidence': 3 } },
      operationalComplexity: { importance: 'Required', scores: { 'NCP_AHV_KB_CN_v0.3_Evidence': 3 } },
      sovereigntyControl: { importance: 'Required', scores: { 'NCP_AHV_KB_CN_v0.3_Evidence': 4 } },
      skillsAvailability: { importance: 'Important', scores: { 'NCP_AHV_KB_CN_v0.3_Evidence': 2 } },
      vendorLockIn: { importance: 'Required', scores: { 'NCP_AHV_KB_CN_v0.3_Evidence': 3 } },
      timeToValue: { importance: 'Important', scores: { 'NCP_AHV_KB_CN_v0.3_Evidence': 3 } },
      ecosystemFit: { importance: 'Nice To Have', scores: { 'NCP_AHV_KB_CN_v0.3_Evidence': 3 } },
      supportModel: { importance: 'Important', scores: { 'NCP_AHV_KB_CN_v0.3_Evidence': 3 } },
      securityPosture: { importance: 'Required', scores: { 'NCP_AHV_KB_CN_v0.3_Evidence': 3 } },
      futureRoadmap: { importance: 'Important', scores: { 'NCP_AHV_KB_CN_v0.3_Evidence': 3 } },
    },
    evidenceSummary: {
      comparator: 'NCP_AHV',
      mapFile: 'NCP_AHV_Evidence_Map_v1.json',
      disclaimer: map.disclaimer,
    },
  };
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const cn = loadJson(CN_PATH);
  const map = loadJson(MAP_PATH);
  const { wb, crosswalk, counts, featureCount, funcCount } = buildNcpKb(cn, map);

  const ncpPath = join(OUT_DIR, 'NCP_AHV_KB_CN_v0.3_Evidence.xlsx');
  XLSX.writeFile(wb, ncpPath, { bookType: 'xlsx' });

  const xwalkPath = join(OUT_DIR, 'NCP_AHV_Evidence_Crosswalk_v1.json');
  writeFileSync(
    xwalkPath,
    JSON.stringify(
      {
        status: 'evidence_backed_draft',
        generatedOn: '2026-08-31',
        counts,
        featureCount,
        funcCount,
        features: crosswalk,
      },
      null,
      2,
    ) + '\n',
  );

  const profile = buildCustomerProfile(cn, map);
  const profilePath = join(OUT_DIR, 'NordicPrecision_NCP_AHV_AssessmentProfile.json');
  writeFileSync(profilePath, JSON.stringify(profile, null, 2) + '\n');

  // Ensure paired VCF KB still exists
  if (!require('node:fs').existsSync(VCF_KB_PATH)) {
    console.warn('WARNING: paired VCF KB missing at', VCF_KB_PATH);
  }

  console.log(`Wrote ${ncpPath}`);
  console.log(`Wrote ${xwalkPath}`);
  console.log(`Wrote ${profilePath}`);
  console.log('Feature parity counts:', counts);
  console.log(`Included features=${featureCount} funcs=${funcCount}`);
  console.log(`Customer requirements keys=${Object.keys(profile.requirements).length}`);
}

main();

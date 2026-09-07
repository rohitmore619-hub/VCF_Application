#!/usr/bin/env python3
"""Generate CN v0.3 evidence maps for Extended comparators (not Core)."""
import json
import sys
from pathlib import Path

ROOT = Path("/workspace/v1.39-BaselineRohitHandover")
CN = json.loads((ROOT / "canonical-model/CN_v0.3_Canonical_Capability_Model.json").read_text())
OUT = ROOT / "kbs"

FULL, PARTIAL, NO = "Full Parity", "Partial Parity", "No Parity"
PCODE = {"F": FULL, "P": PARTIAL, "N": NO}


def feat(parity, component, key, notes, workaround=None, complexity=None, impact=None):
    d = {"parity": parity, "primaryComponent": component, "evidenceKey": key, "notes": notes}
    if parity == PARTIAL:
        d["workaround"] = workaround
        d["workaroundComplexity"] = complexity or "Medium"
        d["technicalImpact"] = impact
    return d


def grid_assign(grid, pid, fid, name, component, key, notes_full, notes_partial, notes_no, workaround, impact):
    idx = int(fid.split("-F")[1]) - 1
    code = grid[pid][idx]
    parity = PCODE[code]
    if parity == FULL:
        return feat(FULL, component, key, notes_full.format(name=name, pid=pid))
    if parity == NO:
        return feat(NO, "N/A", key, notes_no.format(name=name, pid=pid))
    return feat(
        PARTIAL,
        component,
        key,
        notes_partial.format(name=name, pid=pid),
        workaround.format(name=name),
        "Medium",
        impact.format(name=name),
    )


def all_features(fn):
    out = {}
    for p in CN["products"]:
        for f in p["features"]:
            out[f["featureId"]] = fn(p["productId"], f["featureId"], f["name"])
    if len(out) != 84:
        raise SystemExit(f"expected 84, got {len(out)}")
    return out


# 12 products x 7 features. Distinct from Core signatures.
HARVESTER = {
    "VCF-01": "PNNPPPN",
    "VCF-02": "PNPNPPN",
    "VCF-03": "FPFPPFF",
    "VCF-04": "PPPPPPP",
    "VCF-05": "PPPPPPP",
    "VCF-06": "NPPNNPP",
    "VCF-07": "FPPPPFP",
    "VCF-08": "PFPFPFP",
    "VCF-09": "FFFFFFF",
    "VCF-10": "PPPNPPN",
    "VCF-11": "PPPPPPP",
    "VCF-12": "PPNNPNP",
}
HYPERV = {
    "VCF-01": "PFPNFPN",
    "VCF-02": "PNPPPPN",
    "VCF-03": "FFFFFFF",
    "VCF-04": "PPPPNPP",
    "VCF-05": "PPNPPPP",
    "VCF-06": "PPPNPPN",
    "VCF-07": "PPPPPPP",
    "VCF-08": "PFPNPPP",
    "VCF-09": "NNNNNNN",
    "VCF-10": "PPPNPPN",
    "VCF-11": "FFFPPPF",
    "VCF-12": "PNNNNPP",
}
CITRIX = {
    "VCF-01": "PFPNPPN",
    "VCF-02": "PNPPNPN",
    "VCF-03": "FFFPFFF",
    "VCF-04": "PPNPPPN",
    "VCF-05": "PPNNNNN",
    "VCF-06": "NNNNNNN",
    "VCF-07": "PPNNPNP",
    "VCF-08": "PNNNNPN",
    "VCF-09": "NNNNNNN",
    "VCF-10": "PPNNPPN",
    "VCF-11": "FFPPPPN",
    "VCF-12": "PNNNNNN",
}
SCALE = {
    "VCF-01": "PFPFPFN",
    "VCF-02": "PNPPPPN",
    "VCF-03": "FFFPFFF",
    "VCF-04": "FPPFPFP",
    "VCF-05": "PPNPPPN",
    "VCF-06": "NNNNNNN",
    "VCF-07": "FPPNPFP",
    "VCF-08": "PNNNNPN",
    "VCF-09": "NNNNNNN",
    "VCF-10": "PNNNPPN",
    "VCF-11": "FFPPPFF",
    "VCF-12": "NNNNNNN",
}
XCPNG = {
    "VCF-01": "PFPNPPN",
    "VCF-02": "PNPPPPN",
    "VCF-03": "FFFPFFF",
    "VCF-04": "PPNPPPP",
    "VCF-05": "PPNNPPN",
    "VCF-06": "NNNNNNN",
    "VCF-07": "PPNNPNP",
    "VCF-08": "PFPNPPN",
    "VCF-09": "NNNNNNN",
    "VCF-10": "PPPNPPN",
    "VCF-11": "FFPPPPN",
    "VCF-12": "PNNNNNP",
}


def harvester(pid, fid, name):
    return grid_assign(
        HARVESTER, pid, fid, name,
        "Harvester / KubeVirt",
        "harvester",
        "Harvester HCI (KubeVirt) provides {name} as a Kubernetes-native VM/cluster capability.",
        "Harvester covers {name} only as a KubeVirt/Longhorn/K8s analogue, not a VCF construct.",
        "No meaningful Harvester equivalent for VCF {name} (domains/SDDC Manager/NSX-class/HCX).",
        "Use Harvester/KubeVirt APIs and Longhorn/Rancher for {name}.",
        "Operating model is Kubernetes HCI, not VCF/vSphere.",
    )


def hyperv(pid, fid, name):
    key = {
        "VCF-01": "hyperv", "VCF-02": "hyperv", "VCF-03": "hyperv", "VCF-04": "csv",
        "VCF-05": "hyperv", "VCF-06": "hyperv", "VCF-07": "scvmm", "VCF-08": "scvmm",
        "VCF-09": "hyperv", "VCF-10": "replica", "VCF-11": "replica", "VCF-12": "hyperv",
    }[pid]
    return grid_assign(
        HYPERV, pid, fid, name,
        "Windows Server Hyper-V / Failover Clustering",
        key,
        "Standalone Hyper-V / Failover Clustering provides {name} without Azure Local/Arc packaging.",
        "Standalone Hyper-V addresses {name} via Failover Clustering, SCVMM, or Windows tooling — not Azure Local or NSX.",
        "No VCF-equivalent {name} on standalone Hyper-V (no NSX, no Supervisor K8s, no VCF installer).",
        "Use Hyper-V Manager, Failover Cluster Manager, or SCVMM for {name}.",
        "Standalone Hyper-V is not Azure Local; SDN/K8s/VCF lifecycle remain gaps.",
    )


def citrix(pid, fid, name):
    return grid_assign(
        CITRIX, pid, fid, name,
        "Citrix Hypervisor / XenServer",
        "xenserver",
        "Citrix Hypervisor (XenServer) provides {name} for Xen VM operations.",
        "XenServer can approach {name} with Xen tools/XenCenter, not NSX/VCF domains.",
        "No Citrix Hypervisor equivalent for VCF {name} (NSX DFW, Supervisor K8s, SDDC Manager).",
        "Use XenCenter/xe CLI and Xen storage/network for {name}.",
        "Xen operational model differs from vSphere/VCF.",
    )


def scale(pid, fid, name):
    return grid_assign(
        SCALE, pid, fid, name,
        "Scale Computing HyperCore",
        "hypercore",
        "Scale Computing HyperCore HCI provides {name} with self-healing VM/cluster operations.",
        "HyperCore covers {name} only at HCI VM/HA level, not NSX/VCF/K8s.",
        "No HyperCore equivalent for VCF {name} (NSX, Supervisor, SDDC Manager, Private AI).",
        "Use HyperCore UI/SC//Fleet Manager for {name}.",
        "HyperCore is appliance HCI, not a VCF-class stack.",
    )


def xcpng(pid, fid, name):
    return grid_assign(
        XCPNG, pid, fid, name,
        "XCP-ng / Xen Orchestra",
        "xcpng",
        "XCP-ng with Xen Orchestra provides {name} on the open-source Xen stack.",
        "XCP-ng/XO can approach {name} via XO and XAPI, distinct from Citrix commercial packaging.",
        "No XCP-ng equivalent for VCF {name} (NSX DFW, VKS, SDDC Manager).",
        "Use Xen Orchestra and XAPI for {name}.",
        "Open-source Xen stack; not Citrix branded feature parity and not VCF.",
    )


PLATFORMS = [
    {
        "platformKey": "Harvester",
        "platformName": "SUSE / Rancher Harvester",
        "comparatorType": "Extended Comparator",
        "evaluationBasisType": "ProductVersion",
        "evaluatedBaseline": "Harvester public documentation baseline (2026-09)",
        "evidenceSource": "Harvester official documentation",
        "supportingComponents": ["KubeVirt", "Longhorn", "Rancher"],
        "solutionComponents": [
            {"Component": "Harvester", "Role": "HCI control plane"},
            {"Component": "KubeVirt", "Role": "VM runtime"},
            {"Component": "Longhorn", "Role": "Storage"},
        ],
        "disclaimer": "Extended comparator SME map from public Harvester docs. Evidence-Backed Draft. Not advisory-ready.",
        "evidenceCatalog": {
            "harvester": "https://docs.harvesterhci.io/",
        },
        "assign": harvester,
    },
    {
        "platformKey": "HyperV",
        "platformName": "Microsoft Windows Server Hyper-V (standalone)",
        "comparatorType": "Extended Comparator",
        "evaluationBasisType": "ProductVersion",
        "evaluatedBaseline": "Windows Server Hyper-V / Failover Clustering public Microsoft Learn baseline (2026-09) — not Azure Local",
        "evidenceSource": "Microsoft Learn Hyper-V documentation",
        "supportingComponents": ["Hyper-V", "Failover Clustering", "SCVMM optional"],
        "solutionComponents": [
            {"Component": "Hyper-V", "Role": "Hypervisor"},
            {"Component": "Failover Clustering", "Role": "HA / live migration"},
            {"Component": "Hyper-V Replica", "Role": "Replication / DR"},
        ],
        "disclaimer": "Standalone Hyper-V only. Distinct from Azure Local Core KB. Evidence-Backed Draft. Not advisory-ready.",
        "evidenceCatalog": {
            "hyperv": "https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/hyper-v-on-windows-server",
            "csv": "https://learn.microsoft.com/en-us/windows-server/failover-clustering/failover-clustering-overview",
            "scvmm": "https://learn.microsoft.com/en-us/system-center/vmm/overview",
            "replica": "https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/manage/set-up-hyper-v-replica",
        },
        "assign": hyperv,
    },
    {
        "platformKey": "CitrixHypervisor",
        "platformName": "Citrix Hypervisor / XenServer",
        "comparatorType": "Extended Comparator",
        "evaluationBasisType": "ProductVersion",
        "evaluatedBaseline": "XenServer / Citrix Hypervisor public documentation baseline (2026-09)",
        "evidenceSource": "XenServer / Citrix Hypervisor public docs",
        "supportingComponents": ["Xen", "XenCenter", "SR types"],
        "solutionComponents": [
            {"Component": "XenServer", "Role": "Xen hypervisor"},
            {"Component": "XenCenter", "Role": "Management UI"},
        ],
        "disclaimer": "Commercial XenServer/Citrix Hypervisor map. Distinct from XCP-ng. Evidence-Backed Draft. Not advisory-ready.",
        "evidenceCatalog": {
            "xenserver": "https://docs.xenserver.com/",
        },
        "assign": citrix,
    },
    {
        "platformKey": "ScaleComputingHC3",
        "platformName": "Scale Computing HyperCore / HC3",
        "comparatorType": "Extended Comparator",
        "evaluationBasisType": "ProductVersion",
        "evaluatedBaseline": "Scale Computing HyperCore public documentation baseline (2026-09)",
        "evidenceSource": "Scale Computing public product documentation",
        "supportingComponents": ["HyperCore", "SCRIBE", "SC//Fleet Manager"],
        "solutionComponents": [
            {"Component": "HyperCore", "Role": "HCI OS / hypervisor"},
            {"Component": "SCRIBE", "Role": "Storage"},
        ],
        "disclaimer": "Extended comparator SME map from public Scale Computing docs. Evidence-Backed Draft. Not advisory-ready.",
        "evidenceCatalog": {
            "hypercore": "https://www.scalecomputing.com/products/hypercore",
        },
        "assign": scale,
    },
    {
        "platformKey": "XCPng",
        "platformName": "XCP-ng",
        "comparatorType": "Extended Comparator",
        "evaluationBasisType": "ProductVersion",
        "evaluatedBaseline": "XCP-ng and Xen Orchestra public documentation baseline (2026-09)",
        "evidenceSource": "XCP-ng official documentation",
        "supportingComponents": ["XCP-ng", "Xen Orchestra", "XAPI"],
        "solutionComponents": [
            {"Component": "XCP-ng", "Role": "Xen hypervisor host"},
            {"Component": "Xen Orchestra", "Role": "Management / backup"},
        ],
        "disclaimer": "Open-source XCP-ng map using xcp-ng.org docs. Not a copy of Citrix Hypervisor answers. Evidence-Backed Draft. Not advisory-ready.",
        "evidenceCatalog": {
            "xcpng": "https://docs.xcp-ng.org/",
        },
        "assign": xcpng,
    },
]


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    for spec in PLATFORMS:
        if only and spec["platformKey"] != only:
            continue
        assign = spec["assign"]
        payload = {k: v for k, v in spec.items() if k != "assign"}
        features = all_features(assign)
        obj = {**payload, "status": "evidence_backed_draft", "features": features}
        path = OUT / f"{spec['platformKey']}_Evidence_Map_v1.json"
        path.write_text(json.dumps(obj, indent=2) + "\n")
        counts = {}
        for v in features.values():
            counts[v["parity"]] = counts.get(v["parity"], 0) + 1
        print(spec["platformKey"], counts)


if __name__ == "__main__":
    main()

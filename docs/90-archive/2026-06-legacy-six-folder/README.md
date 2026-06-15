---
title: Archive — Legacy six-folder structure
owner: "@yhia"
status: retired
last_verified: 2026-06-10
diataxis_mode: reference
audience: engineering
supersedes: docs/01-product,docs/02-research,docs/03-business,docs/04-architecture,docs/05-development,docs/06-operations
---

# Archive — Legacy six-folder structure

> **Retired 2026-06-10.** The `01-product / 02-research / 03-business / 04-architecture / 05-development / 06-operations` structure was replaced by the [Diátaxis + C4 hybrid topology](../../00-meta/adr/0001-diataxis-c4-hybrid.md). The contents of these folders are kept for reference only and are no longer the source of truth.

## Why this folder exists

When the new docs site replaced the legacy layout, these folders were moved here verbatim. **Do not edit files in this folder.** They are frozen historical artifacts. Anything that should be canonical now lives under `docs/00-meta/`, `docs/10-explanation/`, `docs/20-how-to/`, `docs/30-reference/`, `docs/40-architecture/`, or `docs/50-runbooks/`.

## What is here

| Folder | What it used to cover | New home |
|---|---|---|
| `01-product/` | PRD, requirements | `10-explanation/product-vision.md` |
| `02-research/` | Amazon AI deep-dives (COSMO, Rufus, semantic gap) | `10-explanation/` (extract what is still relevant; the bulk is reference, not narrative) |
| `03-business/` | Financial analysis, marketing playbook, VPS requirements | Not yet ported. Extract to `03-business/` in the new layout, or retire if no longer relevant. |
| `04-architecture/` | Technical architecture document | `10-explanation/container-model.md` and the future `40-architecture/` |
| `05-development/` | API spec, DB schema, setup, multi-agent | `30-reference/` (codegen) and `20-how-to/how-to-onboard.md` |
| `06-operations/` | Deployment, security | `20-how-to/how-to-deploy.md` and the future `50-runbooks/` |

## Open work

The `02-research/`, `03-business/`, and `05-development/` folders each contain content that has not yet been ported to the new layout. Reviewers should open follow-up issues to either:

1. Re-derive the signal into the appropriate new doc.
2. Mark the legacy file `superseded` and add a one-line pointer in the new doc.
3. Retire the file if the signal is no longer relevant.

## How to retire this folder entirely

When every legacy file has a clear successor in the new layout, move this entire `90-archive/2026-06-legacy-six-folder/` directory into a `git rm` commit and add a note in `CHANGELOG.md` (if one exists) or the commit message.

## Related

- [ADR-0001: Diátaxis + C4 hybrid topology](../../00-meta/adr/0001-diataxis-c4-hybrid.md) — the decision
- [Documentation policy](../../00-meta/documentation-policy.md) — the policy that retired this folder

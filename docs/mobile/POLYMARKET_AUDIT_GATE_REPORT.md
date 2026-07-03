# Polymarket Audit Gate Report

Purpose: record pass/fail decisions from the Audit Gate Agent. Only the Audit Gate Agent can mark a feature/page/function as parity-pass.

## Gate Rule

Fail the feature when:

- Any P0 criterion fails.
- Same-cycle Polymarket reference evidence is missing.
- Holiwyn Android device evidence is missing.
- Holiwyn has a nonfunctional button where Polymarket's equivalent works.
- Holiwyn uses a static placeholder where Polymarket has interactive/live behavior.
- Holiwyn implements only one market option where Polymarket exposes selectable lines.
- Holiwyn ticket does not preserve selected market, line, or outcome correctly.
- Visual hierarchy is clearly worse or confusing.
- Lead Agent claims readiness before Audit Gate pass.

## Latest Gate Summary

| Feature | Cycle | Result | P0 failed | P1/P2 remaining | Reference evidence | Holiwyn evidence | Notes |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| Workflow update | Cycle S | Pass | 0 | None for workflow docs | User-provided workflow requirements | Updated loop/harness docs | The autonomous loop now requires same-cycle Polymarket audit, criteria, Holiwyn device proof, and Audit Gate pass. |

## Gate Report Template

Use this template for every feature gate:

```md
## Feature: <name>

Cycle:
Lead Agent target:
Reference Audit Agent:
Implementation Agent:
Audit Gate Agent:

Reference device:
Reference app/browser:
Reference route/URL:
Holiwyn device:
Holiwyn app mode:

Reference evidence:
- Screenshot:
- UI hierarchy:
- Notes:

Holiwyn evidence:
- Screenshot:
- UI hierarchy:
- Smoke/test output:

Criteria results:

| Criterion ID | Priority | Result | Evidence | Fix if failed |
| --- | --- | --- | --- | --- |

Decision:
- Pass/fail:
- Unresolved P0 gaps:
- Remaining P1/P2 gaps:
- Next cycle required:
```

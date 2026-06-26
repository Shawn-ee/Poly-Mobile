# Task Result Convention

Every task cycle report should use this structure.

```text
# Task Result

Task id:
Goal reference:
Assigned subagent:
Branch:
PR:

## Summary

What changed.

## Files Changed

- path

## Commands Run

- command: status

## Validation Evidence

- evidence item
- log path
- Validation Agent decision: pass | fail | warn | blocked

## Reviewer Decision

done | needs_fix | failed | blocked | continue

Reason:

## Scorecard Impact

- metric before:
- metric after:
- confidence:

## Memory Updates

- decision or fact to remember

## Follow-Up Tasks

- none, or domain-specific task with root cause

## Final State

done | needs_fix | failed | blocked | continue
```

## Rules

- Do not claim validation passed unless it ran.
- Do not create generic `FIX-*` or `FIX-FIX-*` follow-ups.
- If follow-up work is needed, name the domain and root cause.
- If blocked by missing credentials or external dependency, mark blocked rather than creating a fake fix task.
- Include safety notes for trading, ledger, funding, wallet, withdrawal, bots, and deployment when touched.

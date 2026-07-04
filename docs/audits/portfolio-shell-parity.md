# Portfolio Shell Parity Audit

## Reference

The user-provided Polymarket Portfolio screenshots show Portfolio as a full-screen account/value page. There is no separate product header, promo action, notification button, or account button above the Portfolio content. The first app-level signal is the profile/value surface itself.

## Holiwyn Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| Portfolio does not show the global Holiwyn product header above the Portfolio profile/value surface. | P0 | Android screenshot/XML. |
| Portfolio still keeps bottom navigation visible. | P0 | Android screenshot/XML. |
| Home/Live/Search/Account can keep the existing global header for now. | P1 | Scoped code review; no broad navigation redesign in this cycle. |
| Portfolio header actions are represented by the Portfolio settings control only. | P1 | Android screenshot/XML. |

## Cycle FR Result

- Implementation: `App.tsx` skips the global `Header` when `mainTab === "portfolio"`.
- Backend/API impact: none.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File ./scripts/smoke-tablet.ps1 -LocalMvpSellFlow -Port 8228`.
- Audit status: P0 pass. Remaining P2 polish is exact native status bar/top spacing.

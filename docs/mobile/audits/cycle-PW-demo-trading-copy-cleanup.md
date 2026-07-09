# Cycle PW - Demo Trading Copy Cleanup

Scope:

- Visible copy cleanup for Local MVP demo/practice trading labels.
- No backend, schema, provider, orderbook, chat, live stats, social, deposit, or withdrawal work.

Reference/product audit:

- Polymarket does not present trading states with debug labels such as `Fake-token test`.
- Holiwyn is still a Local MVP using fake-token/server-backed trading, but the retail tester UI should read as a demo/practice trading product rather than a debug build.

Acceptance criteria:

| ID | Priority | Criterion | Evidence |
| --- | --- | --- | --- |
| PW-P0-01 | P0 | Visible English copy must not say `Fake balance`, `Place a mock trade`, `Showing local fake-token portfolio`, `Fake-token trading stays available`, `Fake-token mock`, or `Fake-token test`. | Source search and contract test |
| PW-P0-02 | P0 | Visible copy should use demo/practice wording for Local MVP trading state. | `mobile/src/localization/appCopy.ts`, `mobile/src/components/Portfolio.tsx` |
| PW-P0-03 | P0 | Hidden proof markers such as `fake-token-test` remain available for harnesses. | Contract test |
| PW-P0-04 | P0 | Backend routes, schema, order logic, orderbook UI, chat, live stats, social, deposit, and withdraw are untouched. | Git diff |

Audit result:

- P0 status: Pass.
- S23 proof: `docs/mobile/harness/cycle-PW-demo-trading-copy-cleanup/cycle-PW-demo-trading-copy-s23-proof.json`.
- S23 screenshot: `docs/mobile/screenshots/cycle-PW-demo-trading-copy-cleanup/cycle-PW-account-single-param.png`.
- S23 XML: `docs/mobile/harness/cycle-PW-demo-trading-copy-cleanup/cycle-PW-account-single-param.xml`.
- Validation: mobile typecheck passed; mobile API/contract tests passed; app-source search confirmed the removed visible fake/mock labels are gone.
- Google login note: the Google login button remains in `AccountScreen`; the Home account button was intentionally removed in the MVP cleanup, so the normal user entry is Portfolio top-left/gear -> Account.
- P1 remaining: production environment-gated real-money copy after wallet/deposit/withdraw support exists.

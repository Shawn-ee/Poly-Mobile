# Cycle SK - Ticket Source Audit-Only Header

## Scope

Trade Ticket amount-entry screen in the Local MVP path.

## Reference/Product Direction

The Polymarket ticket reference keeps the header simple: close button, market/outcome identity, amount entry, odds/balance, keypad, and swipe submit. Holiwyn previously showed source/debug labels such as `Local` and `Local test pricing` directly under the ticket header, which made the ticket busier than the reference and less retail-focused.

## Criteria

### P0

- Trade Ticket header must keep event title and selected outcome visible.
- Provider/source identity must remain available to audit XML and order payload identity.
- Source labels such as `Local`, `Holiwyn line`, `Polymarket market`, or `Local test pricing` must not appear as visible header clutter.
- Amount, odds/balance, preset buttons, keypad, and swipe-to-buy/sell must remain visible.

### P1

- Continue tightening ticket typography and spacing against the Polymarket reference after full order proof.

## Implementation

- Replaced the visible ticket source pill/note row with an audit-only marker.
- Preserved source markers including `ticket-source-badge-provider`, `ticket-source-badge-local`, and `ticket-local-test-pricing` in hidden XML labels.
- Updated smoke/test contracts to expect the hidden source marker instead of the visible inline source pill.

## Audit Gate

Status: passed.

Proof:

- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Summary: `docs/mobile/harness/cycle-SK-ticket-source-audit-only/cycle-SK-current-mvp-s23-visible-flow.json`.
- Ticket screenshot: `docs/mobile/screenshots/cycle-SK-ticket-source-audit-only/cycle-SK-current-mvp-ticket-ready.png`.
- Ticket XML: `docs/mobile/harness/cycle-SK-ticket-source-audit-only/cycle-SK-current-mvp-ticket-ready.xml`.
- Result: screenshot shows no visible `Local` / `Local test pricing` header row. XML preserves `ticket-source-audit-only`, `ticket-market-source-badge-hidden`, `ticket-local-test-pricing`, ticket amount, keypad, and fixed swipe markers.

## Remaining Gaps

- P0: 0 for this focused ticket source-label scope.
- P1: general visual ticket polish remains tracked separately.

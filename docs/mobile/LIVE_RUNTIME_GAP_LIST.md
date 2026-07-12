# Live Runtime P0/P1/P2 Gap List

| Gap | Priority | Status |
| --- | --- | --- |
| Determine whether existing Odds API path is replay, one-shot, or continuous | P0 | Complete: replay and one-shot existed; continuous proof runner added for this goal. |
| Prove one upcoming event can refresh from live provider data | P0 | Complete: Spain vs. France live provider proof passed. |
| Prove stale-to-ready provider lifecycle transition | P0 | Complete: selected quote lifecycle went stale -> ready. |
| Prove local maker quotes shifted worse than provider | P0 | Complete: provider bid/ask `0.4891/0.5291`, maker bid/ask `0.47/0.55`. |
| Prove fake-token buy/Portfolio/cashout/history against refreshed event | P0 | Complete: buy filled, Portfolio showed position, sell/cashout filled, History had buy and sell. |
| Continuous unattended daemon | P1 | Not complete; proof runner is bounded and local-only. |
| Auto-close/suspend | P1 | Manual routes exist; automatic scheduling is not complete. |
| Automatic official-result settlement | P1 | Manual/admin settlement exists; result provider is missing. |
| Multi-event provider polling | P2 | Intentionally out of scope to protect quota. |

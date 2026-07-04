# DN Agent A Provider Notes

## Chart Lifecycle Cache Parity

- Scope: backend/provider lifecycle only.
- Gap addressed: provider refresh writes Polymarket quote/depth/chart data, but the refresh route did not include chart routes in its cache invalidation contract.
- Change: provider refresh now reports post-refresh chart snapshot freshness and invalidates `/api/markets/{marketId}/chart` for every compact provider market alongside live-detail, event detail, and orderbook routes.
- Proof script: `tsx scripts/prove_mobile_provider_chart_lifecycle_contract.ts --summaryPath=docs/mobile/harness/cycle-DN-mobile-provider-chart-lifecycle-contract.json`
- Proof output: 2 chart paths and 2 orderbook paths generated for the same market set; all lifecycle assertions passed.

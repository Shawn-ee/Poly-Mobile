# Batch The Odds API Event Catalog

## Scope
- Provider-stable event identity and historical replay safety for the backend soccer catalog.
- Replays redacted provider evidence without making provider requests or spending quota.
- Does not claim Polymarket-backed parity.
- Does not enable real-money behavior.

## Selected Event
- Sport key: soccer_fifa_world_cup
- Event id: f9aa13a662d1658e5a02cfc06d6a2d73
- Event title: Spain vs. France
- Start time: 2026-07-14T19:00:00Z

## API Calls

## Markets
- Available market keys: none
- Imported market keys: totals
- Normalized markets: 1
- Normalized outcomes: 2

## Mobile/Backend Proof
- Seed slug: odds-api-event-ce6034d6b0da4ae5fe13
- Home visible: false
- Detail visible: false
- Sportsbook market count: 0
- Tradable outcome count: 0

## Result
- Pass: true
- No-quota replay: pass. The run used the redacted odds fixture and made no provider API calls.
- Live-key refresh evidence remains captured in the redacted API call headers from the original single-event fetch.
- Provider catalog identity: pass. The provider event is stored independently from the active legacy event slot.
- Historical catalog safety: pass. The replay event is closed, unlisted, non-tradable, and excluded from the Home feed.
- S23 proof is not required for an archived backend identity-only catalog record.

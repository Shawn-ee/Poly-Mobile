# Cycle GM - Portfolio Action Ticket Amount Reset

## Polymarket reference

The provided Polymarket order-entry reference shows a newly opened order page with `$0`, Yes/No toggle, current odds/available balance, quick amount controls, keypad, and a disabled footer state reading `Choose an amount`. After an amount is entered, the footer changes to the swipe-submit interaction.

## Holiwyn P0 criteria

- Portfolio Buy more opens the same simple ticket path with preserved event, market, line, outcome, and Buy side identity.
- Portfolio Cash out opens the same simple ticket path with preserved event, market, line, outcome, Sell side, and No contract identity.
- Both Portfolio action tickets must open at `$0` and show `Choose an amount`, even if a prior ticket used a nonzero amount.
- The ticket must not show `Swipe up to buy` or `Swipe up to sell` until the user enters an amount.
- The existing fake-token order and Portfolio/history flow must remain intact.

## Audit gate

Status: Passed.

Evidence:

- Samsung tablet proof passed with `cycle-GM-local-mvp-trade-flow-proof.json`.
- Buy more ticket screenshot/XML: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GM-portfolio-action-ticket-amount-reset\cycle-GM-holiwyn-local-mvp-portfolio-buy-more-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GM-portfolio-action-ticket-amount-reset\cycle-GM-holiwyn-local-mvp-portfolio-buy-more-ticket.xml`.
- Cash out ticket screenshot/XML: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GM-portfolio-action-ticket-amount-reset\cycle-GM-holiwyn-local-mvp-portfolio-cash-out-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GM-portfolio-action-ticket-amount-reset\cycle-GM-holiwyn-local-mvp-portfolio-cash-out-ticket.xml`.

Remaining gaps:

- P1: exact Polymarket full-screen blurred background and drag physics remain future visual polish.

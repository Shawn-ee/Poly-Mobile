# Cycle JP - Search Remove Floating Filter Button

Gate status: `Pass`

Scope:

- Remove the floating Filter button from the Search tab.
- Remove the unused bottom filter panel opened by that button.
- Keep the existing inline Search filters and sort chips.

Reference/user basis:

- Direct user feedback: "in search tab remove the filter button. useless"

Acceptance criteria:

| Requirement | Priority | Result | Evidence |
| --- | --- | --- | --- |
| Search tab no longer shows the floating `Filter` button. | P0 | Passed | S23 XML verifies `search-filter-sheet` is absent. |
| Search tab no longer exposes the floating filter panel. | P0 | Passed | S23 XML verifies `search-filter-panel` is absent. |
| Existing inline filter chips remain available. | P0 | Passed | S23 XML verifies `search-filter-all` and `search-filter-live` are present. |
| Search input remains visible and usable. | P0 | Passed | S23 XML verifies `search-world-cup-markets` is present. |
| Backend/order logic is not touched. | P0 | Passed | Only `src/components/SearchScreen.tsx` changed. |

Holiwyn proof:

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JP-search-remove-filter-button-s23-proof\cycle-JP-search-no-floating-filter-clean-branch.png`
- XML: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-JP-search-remove-filter-button-s23-proof\cycle-JP-search-no-floating-filter-clean-branch.xml`

Validation:

- `npm run typecheck`: passed.
- `git diff --check`: passed.
- S23 XML proof: passed.

Known limitations:

- This cycle does not redesign Search results or broader Search page parity. It only removes the useless floating filter affordance requested by the user.

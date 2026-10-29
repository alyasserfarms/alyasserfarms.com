# Focused code review — 2026-10-29

## Corrections

- Shared homepage navigation for desktop and mobile; removed the redundant delivery entry on the homepage menu.
- Cart additions reject unknown products, invalid quantities and quantities exceeding the remaining capacity, rather than returning a misleading success.
- Product rail gracefully handles missing catalogue entries while retaining the configured order; removed non-null assertions.
- Simplified scene image sizes and corrected mobile wholesale title spacing.

## Verification

- Production build and its TypeScript stage passed.
- ESLint passed.
- `node scripts/check-cart-store.mjs` passed: invalid IDs/quantities, capacity, totals, removal, corrupt storage, stored limits and storage unavailable fallback. These are isolated logic checks, not a full React integration test.
- Browser verified mobile menu section links and wholesale validation: 23kg rejected, 24kg opened the local inquiry summary. No order was submitted.

## Remaining maintenance / scope

- Previous design components and CSS remain preserved. Some legacy catalogue components still use those styles, so wholesale deletion is unsafe without first separating their dependencies.
- Longer JSX sections and layered styles can be split into smaller modules in a dedicated refactor with screenshot regression checks.
- Full accessibility, performance budgets, all shopping routes and production security have not been certified by this focused review.
- Catalogue prices, actual farm media, delivery policy and the correct map location still require approval. Database, admin and payment integration remain out of scope.

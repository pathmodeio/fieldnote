# Fieldnote

Field notes for people who work outdoors. Surveyors, arborists and site engineers use Fieldnote to
capture notes, photos and measurements without a signal, and sync them when they get one.

## Running it

```sh
npm install
npm test
npm run typecheck
```

## Layout

| Path | What lives there |
| --- | --- |
| `src/billing/` | Subscriptions, invoices, access and the nightly renewal worker |
| `src/app/settings/` | Account settings screens |
| `src/db/` | Data access. An in-memory stand-in while the billing rewrite is in progress |
| `tests/` | Vitest suites |

## Billing, in short

A subscription has a `currentPeriodEnd`: the moment the customer has paid through. The nightly
worker in `src/billing/renewals.ts` renews anything whose period has run out and skips anything
canceled. `revokeAccess` in `src/billing/access.ts` ends access at once and exists for the refund
flow.

Plan changes and cancellations are handled by support by hand. See `docs/FN-412.md`.

---

Fieldnote is a fictional product. This repository exists to demonstrate a product-decision
workflow on realistic code, and is not a real service. Nobody is charged and nothing is hosted.

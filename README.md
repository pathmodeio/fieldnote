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
worker in `src/billing/renewals.ts` renews anything whose period has run out, skips anything
already over, and closes anything the customer has cancelled.

Access ends in two quite different ways, and they should not be mixed up:

- `revokeAccess` in `src/billing/access.ts` ends access **at once**. It belongs to the refund flow:
  the money went back, so the access it paid for goes with it.
- `cancelPlan` in `src/billing/cancellation.ts` ends access **at the end of the paid period**. This
  is self-serve cancellation from Settings → Billing. Nothing is refunded, so the customer keeps
  what they have paid for and simply is not renewed. `resumePlan` calls it off, up until the period
  runs out.

Plan changes are still handled by support by hand.

---

Fieldnote is a fictional product. This repository exists to demonstrate a product-decision
workflow on realistic code, and is not a real service. Nobody is charged and nothing is hosted.

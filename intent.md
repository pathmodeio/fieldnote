---
id: "411b825d-2007-4dc8-878a-527ff29c2449"
version: 1
status: "draft"
readiness: "passed 6/6 — blocked by 4 unresolved product choices"
productChoices: [{"id":"cancel-timing","question":"When a customer cancels, does access end immediately or at the end of the period they have already paid for?","recommendation":"At the end of the paid period (currentPeriodEnd). Mark the subscription as set to cancel, keep access until then, and have the renewal worker end it instead of renewing.","alternative":"End access immediately by reusing revokeAccess.","reason":"The customer has paid through currentPeriodEnd and the ticket gives no refund. revokeAccess was written for refunds — reusing it would silently take away days the customer paid for, which is likely to generate the very support tickets FN-412 is meant to stop. Offline-first users may also have unsynced notes they need time to export.","cost":"Needs a new persisted field (e.g. cancelAtPeriodEnd) plus a change to runRenewals and hasAccess semantics; the immediate option is a one-line call to revokeAccess.","reopenTrigger":"Finance or legal requires prorated refunds on cancel, or the payment provider migration mandates a different model.","claims":[{"field":"outcome","text":"After cancelling, the customer keeps access until currentPeriodEnd and loses it after; Billing shows 'Access ends on <date>' instead of 'Renews on'.","id":"6d3a70aa-bb20-46f2-89d0-89425da6d94f"},{"field":"constraint","text":"Customer-initiated cancellation must not call revokeAccess.","id":"ca11bd2f-f218-43d2-815e-3a39bd1b59d0"}],"state":"open"},{"id":"refund-on-cancel","question":"Does cancelling refund any unused part of the current period?","recommendation":"No refund. The customer keeps access for the rest of the period instead.","alternative":"Prorated refund of the unused days, with immediate access end.","reason":"Matches the recommended end-of-period timing, needs no finance involvement, and the ticket asks only for a cancel button.","cost":"Customers who want money back still contact support; refunds stay a manual support action.","reopenTrigger":"Consumer-law review for a market (e.g. EU withdrawal right) requires refunds, or support still gets refund-on-cancel tickets after launch.","dependsOn":[{"id":"cancel-timing","answer":"At the end of the paid period"}],"claims":[{"field":"constraint","text":"Cancelling creates no refund and does not touch invoices.","id":"aae98bfa-7918-4d8b-9621-525fae7939ba"}],"state":"open"},{"id":"undo-cancel","question":"Can a customer undo a scheduled cancellation before the period ends?","recommendation":"Yes — show 'Keep my plan' while the cancellation is pending; it clears the flag and renewal resumes as normal.","alternative":"No undo; customer must email support or resubscribe after it ends.","reason":"Accidental or regretted cancellations would otherwise route back through support, and the undo is a single flag clear.","cost":"One more button, one more domain function and test.","reopenTrigger":"Cancellation becomes immediate, or billing provider cannot un-schedule a cancellation.","dependsOn":[{"id":"cancel-timing","answer":"At the end of the paid period"}],"claims":[{"field":"outcome","text":"While a cancellation is pending, Billing shows 'Keep my plan'; using it restores renewal and the 'Renews on' date.","id":"46477693-f4c5-44c1-9e71-13647ca2bc4b"}],"state":"open"},{"id":"past-due-cancel","question":"What happens when a past-due (payment failed) customer cancels?","recommendation":"Treat it like any other cancellation: stop retrying/renewal and end access at currentPeriodEnd.","alternative":"End access immediately for past-due subscriptions, since the current period may be unpaid.","reason":"Simplest consistent rule; the codebase gives past_due customers access while retrying, so cancelling should not make things worse for them.","cost":"A past-due customer who cancels may get the remainder of a period they did not pay for.","reopenTrigger":"Finance reports meaningful unpaid-access losses from past-due cancellations.","claims":[{"field":"edgeCase","text":"Renewal stops and access ends at currentPeriodEnd, same as an active customer.","scenario":"Past-due customer cancels","id":"f323e500-fec0-4cd3-8ac7-3ba20c620024"}],"state":"open"}]
created: "2026-09-25T17:43:36.906Z"
updated: "2026-09-25T17:43:36.906Z"
---

# FN-412 · Self-serve plan cancellation

## Objective
Customers cannot cancel Fieldnote without emailing or phoning support; support gets several of these a week (FN-412, issue #1) and customers give up waiting. Let a customer cancel their own plan from Settings → Billing, without harming what they have already paid for.

## Current State
Settings → Billing (src/app/settings/Billing.tsx) is read-only and tells customers to email support to change or cancel. The only code that sets status 'canceled' is revokeAccess (src/billing/access.ts), written for the refund flow: it ends access at the moment it is called. The nightly renewal worker (src/billing/renewals.ts) skips only subscriptions whose status is 'canceled' — there is no other way to stop a renewal. Refunds (refundInvoice) must keep revoking access immediately.

## Implementation Context
- `src/app/settings/Billing.tsx` — read-only screen; add Cancel/Keep buttons (props callbacks; there is no router or API layer), change status/date labels, drop 'email to cancel' copy.
- `src/billing/types.ts` — Subscription; likely add `cancelAtPeriodEnd: boolean`.
- `src/billing/subscription.ts` — createSubscription must initialise the new field; add `cancelSubscription` / `resumeSubscription`.
- `src/billing/renewals.ts` — today skips only status 'canceled'; must end (status 'canceled', accessEndedAt = currentPeriodEnd) instead of renewing a pending-cancel subscription.
- `src/billing/access.ts` — revokeAccess stays refund-only; hasAccess already honours accessEndedAt.
- `src/db/store.ts` — in-memory Map, no change needed.
- Tests: `tests/billing.test.ts` (vitest).

## Outcomes
- [ ] Settings → Billing shows a 'Cancel plan' button for a subscription that is active or past due and not already scheduled to cancel.
- [ ] After the customer confirms, the subscription does not renew: the nightly worker skips it once its period ends.
- [ ] Settings → Billing no longer tells customers to email support to cancel (plan changes may still go through support).

## Scope
**In scope:**
- Cancel button and confirmation in Settings → Billing
- A domain function for customer-initiated cancellation in src/billing/
- Renewal worker honouring it
- Unit tests in tests/billing.test.ts
**Out of scope:**
- Self-serve plan changes (solo ↔ team)
- Cancellation reasons survey / retention offers
- Emails or receipts on cancel
- Changes to the refund flow

## Constraints
- Do not change refundInvoice or revokeAccess behaviour: a refund still ends access at the moment of the refund.
- The in-memory store keeps the same call shape as the Postgres repository it will become; any new Subscription field must be a plain, persistable value.
- No real payment provider is involved; cancellation is a state change on the Subscription only.

## Edge Cases
- **Customer clicks 'Cancel plan' by accident**: Nothing changes until they confirm in a step that states what will happen and when.
- **Refund issued on a subscription already scheduled to cancel**: Refund flow wins: access ends at the refund moment, as today.
- **Customer opens Billing on a subscription that is already canceled**: No cancel button; the screen states access has ended rather than showing 'Active'/'Renews on'.

## Health Metrics
- Support tickets tagged cancellation per week
- Self-serve cancellations per week
- Undo ('Keep my plan') rate

## Verification
_A feedback loop, not just a test list._
**Fastest check**:
- [ ] npm test && npm run typecheck
**Shipped signal**:
- [ ] Cancellation emails to support drop in the weeks after release (Maija's inbox count).
**Regression guard**:
- [ ] Existing refund and renewal tests in tests/billing.test.ts keep passing unchanged.
**Automated test**:
- [ ] Unit tests: cancel sets the pending flag without ending access; runRenewals ends (does not renew) a pending-cancel subscription after currentPeriodEnd; hasAccess true before and false after the period end; refund on a pending-cancel subscription still ends access immediately.

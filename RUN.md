# Run 4: FN-412 with no API key

**This branch is a record, not the fixture.** `main` is the clean starting state with no
`intent.md`, so that every run starts from the same place. Do not merge this branch.

## Setup

- Fixture: `main` at `fa25918`, clean.
- Claude Code 2.1.282, model `claude-opus-5-5`, permission mode `auto`.
- Pathmode plugin 0.1.35, loaded from [pathmodeio/claude-plugin](https://github.com/pathmodeio/claude-plugin),
  which launches `@pathmode/mcp-server` 1.34.0.
- No API key, so keyless local mode. No other plugins and no user settings. Account-level
  connectors were present and not used.
- One instruction, no coaching, no follow-up: `implement FN-412`.
- 2026-09-25, 17:42:42Z to 17:43:46Z. 61 seconds, 6 turns.

```bash
claude -p "implement FN-412" --setting-sources project,local \
  --plugin-dir ./claude-plugin --permission-mode auto
```

## What the agent did

1. Looked at the repository and searched it for `FN-412`.
2. Read the ticket (`docs/FN-412.md`), the README, the billing code, the settings screen, and the tests.
3. Called `check_intent_readiness`. The repository had no `intent.md`, so there was nothing to preflight.
4. Called `intent_save` with a local draft, which wrote the [`intent.md`](intent.md) on this
   branch and ran the preflight on it: passed 6/6, blocked by 4 unresolved product choices.
5. Stopped and replied. It changed no product code.

## What it said

Its whole final message, verbatim:

> I haven't changed any product code yet. FN-412 reads like a one-button change, but it leaves one billing decision open that I don't think I should make for you.
>
> **The catch:** the only code that cancels a subscription today is `revokeAccess` (`src/billing/access.ts:13`). It was written for refunds, and it ends access the moment it's called. If the new button calls it, anyone who cancels loses the rest of a month they've already paid for, with no refund. That would likely bring back the support emails this ticket is meant to stop. The renewal worker (`src/billing/renewals.ts:14`) also only skips subscriptions that are already `canceled`, so there's no way yet to say "stop renewing, but keep access until the paid period ends."
>
> I wrote the spec up as a local draft in `intent.md`. It passes all 6 readiness checks, but it's blocked on 4 open questions. My recommendation for each:
>
> 1. **When does access end?** I recommend at the end of the paid period (`currentPeriodEnd`). This needs a new `cancelAtPeriodEnd` field, and the renewal worker would close the subscription instead of renewing it. The alternative is ending access immediately with `revokeAccess`.
> 2. **Refund on cancel?** I recommend no refund: the customer keeps access for the rest of the period instead.
> 3. **Can they undo it?** I recommend yes. A "Keep my plan" button while the cancellation is pending just clears the flag.
> 4. **Customer whose payment failed cancels?** I recommend treating it the same way: renewal stops and access ends at `currentPeriodEnd`.
>
> Whatever you choose, refunds keep working as they do now, and the "email support to cancel" line comes out of Billing. Plan changes (Solo ↔ Team) are out of scope.
>
> Reply with "go with the recommendations" or tell me what to change, and I'll build it with tests. These answers only live in this local draft; nobody else has reviewed or signed off on them.

## What it recorded

Four open product choices, each with a recommendation, an alternative, a reason, a cost, and the
condition that would reopen it:

| Choice | Recommendation | Alternative |
| --- | --- | --- |
| When does access end after cancelling? | At the end of the paid period | Immediately, by reusing `revokeAccess` |
| Does cancelling refund the unused part of the period? | No refund; access continues instead | Prorated refund, access ends immediately |
| Can a customer undo a scheduled cancellation? | Yes, a "Keep my plan" button | No undo |
| What happens when a past-due customer cancels? | Same as any cancellation | Access ends immediately |

What each recommendation would add to the spec is attached to its choice as a contingent claim
(for example, "Customer-initiated cancellation must not call revokeAccess"). None of those claims
is in the spec's required outcomes or constraints. They become requirements only if a person
accepts the recommendation.

## Reproduce the verdict

The preflight is deterministic, so this reproduces it exactly:

```bash
git clone -b run-4/fn-412-keyless-proposal https://github.com/pathmodeio/fieldnote
cd fieldnote
npx -y @pathmode/cli preflight
```

It exits `1`: the six checks pass, and the open choices block.

## What this run does not show

- **A human decision.** Nobody answered the four choices. With no workspace connected, an answer
  would have been a reply in chat, and the keyless tools of this run (server 1.34.0) did not record
  it: `intent_save` accepts new open choices, never answers. Authorizing the exact revision to be
  built needs a connected workspace, where a reviewer answers from a review link.

  *Since `@pathmode/mcp-server` 1.35.0 (2026-09-26):* keyless mode records each explicit answer with
  `answer_product_choice`, quoting the person's words for that choice and marking it answered locally
  (unverified). That is a faithful record of the conversation, not verified approval. This file is
  unchanged: it is what the agent wrote on 1.34.0.
- **That the recommendations are right.** They are the agent's assumptions until a person decides.
- **What other runs do.** This is one run. Another may word things differently or find different
  choices; an earlier run on this fixture recorded three of these four.

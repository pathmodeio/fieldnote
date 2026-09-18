import { getSubscription, saveSubscription } from '../db/store.js';
import type { Plan, Subscription } from './types.js';

const PERIOD_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export function createSubscription(
    input: { id: string; customerId: string; plan: Plan },
    now: number = Date.now(),
): Subscription {
    return saveSubscription({
        ...input,
        status: 'active',
        currentPeriodEnd: now + PERIOD_DAYS * DAY_MS,
        accessEndedAt: null,
        createdAt: now,
    });
}

/**
 * Moves a subscription into its next paid period.
 *
 * Called by the nightly renewal worker for every subscription whose period has ended. The worker
 * skips anything that is already canceled; everything else renews.
 *
 * @see runRenewals in ./renewals.ts
 */
export function renewSubscription(subscriptionId: string, now: number = Date.now()): Subscription {
    const subscription = getSubscription(subscriptionId);
    if (!subscription) throw new Error(`Unknown subscription: ${subscriptionId}`);

    return saveSubscription({
        ...subscription,
        status: 'active',
        currentPeriodEnd: now + PERIOD_DAYS * DAY_MS,
    });
}

/** The date the customer's current paid period runs out. */
export function periodEndDate(subscription: Subscription): Date {
    return new Date(subscription.currentPeriodEnd);
}

export function planLabel(plan: Plan): string {
    return plan === 'team' ? 'Team' : 'Solo';
}

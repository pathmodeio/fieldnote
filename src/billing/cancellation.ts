import { getSubscription, saveSubscription } from '../db/store.js';
import type { Subscription } from './types.js';

/**
 * Schedules a cancellation for the end of the period the customer has already paid for.
 *
 * This is self-serve cancellation from Settings → Billing. No money goes back, so the customer
 * keeps the access they have paid for; what stops is the next renewal. `accessEndedAt` is set
 * here rather than by the worker, so access ends exactly at the period boundary whether or not
 * the nightly run has happened yet.
 *
 * Not to be confused with revokeAccess in ./access.ts, which ends access at once because a refund
 * took back the money that paid for it.
 *
 * A past_due subscription has already outlived the period it paid for, so cancelling one ends its
 * access straight away.
 */
export function cancelPlan(subscriptionId: string): Subscription {
    const subscription = getSubscription(subscriptionId);
    if (!subscription) throw new Error(`Unknown subscription: ${subscriptionId}`);
    if (subscription.status === 'canceled') return subscription;
    if (subscription.cancelAtPeriodEnd) return subscription;

    return saveSubscription({
        ...subscription,
        cancelAtPeriodEnd: true,
        accessEndedAt: subscription.currentPeriodEnd,
    });
}

/**
 * Calls off a scheduled cancellation, putting the subscription back on renewal.
 *
 * Only possible while the customer still has access. Once the period has run out there is nothing
 * left to keep, and starting a new one is a purchase rather than an undo.
 */
export function resumePlan(subscriptionId: string, now: number = Date.now()): Subscription {
    const subscription = getSubscription(subscriptionId);
    if (!subscription) throw new Error(`Unknown subscription: ${subscriptionId}`);
    if (!subscription.cancelAtPeriodEnd) return subscription;

    const accessOver = subscription.accessEndedAt !== null && subscription.accessEndedAt <= now;
    if (subscription.status === 'canceled' || accessOver) {
        throw new Error(`Cannot resume a subscription whose access has ended: ${subscriptionId}`);
    }

    return saveSubscription({
        ...subscription,
        cancelAtPeriodEnd: false,
        accessEndedAt: null,
    });
}

/**
 * Closes a subscription whose scheduled cancellation has come due.
 *
 * Called by the nightly worker in place of a renewal. `accessEndedAt` was set when the customer
 * cancelled, so this settles the status and nothing else.
 *
 * @see runRenewals in ./renewals.ts
 */
export function endScheduledCancellation(subscriptionId: string): Subscription {
    const subscription = getSubscription(subscriptionId);
    if (!subscription) throw new Error(`Unknown subscription: ${subscriptionId}`);

    return saveSubscription({ ...subscription, status: 'canceled' });
}

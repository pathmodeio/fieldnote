import { getSubscription, saveSubscription } from '../db/store.js';
import type { Subscription } from './types.js';

/**
 * Ends a customer's access to Fieldnote immediately.
 *
 * Written for the refund flow: once finance refunds an invoice, the customer has not paid for
 * the period any more, so their access stops at the moment of the refund rather than at the end
 * of a period they are no longer paying for.
 *
 * @see refundInvoice in ./refunds.ts, the only caller today.
 */
export function revokeAccess(subscriptionId: string, now: number = Date.now()): Subscription {
    const subscription = getSubscription(subscriptionId);
    if (!subscription) throw new Error(`Unknown subscription: ${subscriptionId}`);

    return saveSubscription({
        ...subscription,
        status: 'canceled',
        accessEndedAt: now,
    });
}

/** Whether the customer can use the product right now. */
export function hasAccess(subscription: Subscription, now: number = Date.now()): boolean {
    if (subscription.accessEndedAt !== null) return subscription.accessEndedAt > now;
    return subscription.status !== 'canceled';
}

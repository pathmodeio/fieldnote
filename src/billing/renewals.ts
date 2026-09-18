import { endScheduledCancellation } from './cancellation.js';
import { renewSubscription } from './subscription.js';
import type { Subscription } from './types.js';

/**
 * Nightly worker. Renews every subscription whose paid period has run out.
 *
 * Two things stop a renewal: a subscription that is already over, and one the customer has asked
 * to cancel at the end of the period they paid for. The second kind is closed here, at the moment
 * that period runs out.
 *
 * Returns the ids it renewed; a subscription closed rather than renewed is not among them.
 */
export function runRenewals(due: Subscription[], now: number = Date.now()): string[] {
    const renewed: string[] = [];

    for (const subscription of due) {
        if (subscription.status === 'canceled') continue;
        if (subscription.currentPeriodEnd > now) continue;

        if (subscription.cancelAtPeriodEnd) {
            endScheduledCancellation(subscription.id);
            continue;
        }

        renewSubscription(subscription.id, now);
        renewed.push(subscription.id);
    }

    return renewed;
}

import { renewSubscription } from './subscription.js';
import type { Subscription } from './types.js';

/**
 * Nightly worker. Renews every subscription whose paid period has run out.
 *
 * A canceled subscription is skipped, because canceling is the only thing that stops a renewal
 * today. There is no other way to tell the worker to leave a subscription alone.
 */
export function runRenewals(due: Subscription[], now: number = Date.now()): string[] {
    const renewed: string[] = [];

    for (const subscription of due) {
        if (subscription.status === 'canceled') continue;
        if (subscription.currentPeriodEnd > now) continue;

        renewSubscription(subscription.id, now);
        renewed.push(subscription.id);
    }

    return renewed;
}

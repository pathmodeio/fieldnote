import type { Subscription } from '../../billing/types.js';
import { periodEndDate, planLabel } from '../../billing/subscription.js';

interface BillingProps {
    subscription: Subscription;
}

const formatDate = (date: Date): string =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Settings → Billing.
 *
 * Read-only today. Plan changes and cancellation both go through support, which is where most of
 * our billing tickets come from.
 */
export function Billing({ subscription }: BillingProps) {
    return (
        <section className="billing">
            <h1>Billing</h1>

            <dl className="billing-summary">
                <dt>Plan</dt>
                <dd>{planLabel(subscription.plan)}</dd>

                <dt>Status</dt>
                <dd>{subscription.status === 'past_due' ? 'Payment failed' : 'Active'}</dd>

                <dt>Renews on</dt>
                <dd>{formatDate(periodEndDate(subscription))}</dd>
            </dl>

            <p className="billing-help">
                Need to change or cancel your plan? Email{' '}
                <a href="mailto:support@fieldnote.example">support@fieldnote.example</a> and we will
                sort it out for you.
            </p>
        </section>
    );
}

import { useState } from 'react';
import type { Subscription } from '../../billing/types.js';
import { periodEndDate, planLabel } from '../../billing/subscription.js';

interface BillingProps {
    subscription: Subscription;
    onCancelPlan: () => void;
    onResumePlan: () => void;
}

const formatDate = (date: Date): string =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

function statusLabel(subscription: Subscription): string {
    if (subscription.status === 'canceled') return 'Canceled';
    if (subscription.cancelAtPeriodEnd) return 'Cancels at the end of the period';
    if (subscription.status === 'past_due') return 'Payment failed';
    return 'Active';
}

/**
 * Settings → Billing.
 *
 * Cancelling is self-serve: it takes effect at the end of the period the customer has paid for,
 * and can be called off until then. Plan changes still go through support.
 */
export function Billing({ subscription, onCancelPlan, onResumePlan }: BillingProps) {
    const [confirming, setConfirming] = useState(false);
    const periodEnd = formatDate(periodEndDate(subscription));
    const cancelling = subscription.cancelAtPeriodEnd;

    return (
        <section className="billing">
            <h1>Billing</h1>

            <dl className="billing-summary">
                <dt>Plan</dt>
                <dd>{planLabel(subscription.plan)}</dd>

                <dt>Status</dt>
                <dd>{statusLabel(subscription)}</dd>

                <dt>{cancelling ? 'Access until' : 'Renews on'}</dt>
                <dd>{periodEnd}</dd>
            </dl>

            {cancelling ? (
                <div className="billing-actions">
                    <p>
                        Your plan ends on {periodEnd}. You keep Fieldnote until then, and you are
                        not charged again.
                    </p>
                    <button type="button" onClick={onResumePlan}>
                        Resume plan
                    </button>
                </div>
            ) : confirming ? (
                <div className="billing-actions">
                    <p>
                        Cancel your plan? You keep Fieldnote until {periodEnd}, the end of the
                        period you have already paid for, and nothing is charged after that. You
                        can change your mind any time before then.
                    </p>
                    <button type="button" onClick={onCancelPlan}>
                        Yes, cancel my plan
                    </button>
                    <button type="button" onClick={() => setConfirming(false)}>
                        Keep my plan
                    </button>
                </div>
            ) : (
                <div className="billing-actions">
                    <button type="button" onClick={() => setConfirming(true)}>
                        Cancel plan
                    </button>
                </div>
            )}

            <p className="billing-help">
                Need to change your plan? Email{' '}
                <a href="mailto:support@fieldnote.example">support@fieldnote.example</a> and we will
                sort it out for you.
            </p>
        </section>
    );
}

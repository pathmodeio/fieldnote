export type Plan = 'solo' | 'team';

export type SubscriptionStatus =
    /** Renewing normally. */
    | 'active'
    /** A payment failed; we keep access while we retry. */
    | 'past_due'
    /** Over. The customer has no access. */
    | 'canceled';

export interface Subscription {
    id: string;
    customerId: string;
    plan: Plan;
    status: SubscriptionStatus;
    /** Unix ms. The customer has paid for everything up to this moment. */
    currentPeriodEnd: number;
    /**
     * Set when the customer has asked to leave but has already paid for the period they are in.
     * They keep access to the end of it; the renewal worker closes the subscription instead of
     * renewing it.
     *
     * @see cancelPlan in ./cancellation.ts
     */
    cancelAtPeriodEnd: boolean;
    /**
     * Unix ms at which access ends, or null while nothing has ended it.
     *
     * A refund puts this in the past: access stopped when the money went back. A scheduled
     * cancellation puts it in the future: access runs to the end of the period already paid for.
     */
    accessEndedAt: number | null;
    createdAt: number;
}

export interface Invoice {
    id: string;
    subscriptionId: string;
    /** Minor units, EUR. */
    amount: number;
    paidAt: number | null;
    refundedAt: number | null;
}

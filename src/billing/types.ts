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
     * Unix ms at which access actually stopped, or null while the customer still has access.
     * Set when a subscription ends for any reason.
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

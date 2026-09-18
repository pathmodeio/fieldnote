import { beforeEach, describe, expect, it } from 'vitest';
import { resetStore, saveInvoice, saveSubscription, getSubscription } from '../src/db/store.js';
import { createSubscription } from '../src/billing/subscription.js';
import { hasAccess, revokeAccess } from '../src/billing/access.js';
import { refundInvoice } from '../src/billing/refunds.js';
import { runRenewals } from '../src/billing/renewals.js';
import { cancelPlan, resumePlan } from '../src/billing/cancellation.js';

const NOW = Date.UTC(2026, 0, 15);
const DAY = 24 * 60 * 60 * 1000;

beforeEach(resetStore);

const subscription = () => createSubscription({ id: 'sub_1', customerId: 'cus_1', plan: 'solo' }, NOW);

describe('access', () => {
    it('gives an active subscription access', () => {
        expect(hasAccess(subscription(), NOW)).toBe(true);
    });

    it('ends access at the moment it is revoked', () => {
        subscription();
        const revoked = revokeAccess('sub_1', NOW);

        expect(revoked.status).toBe('canceled');
        expect(revoked.accessEndedAt).toBe(NOW);
        expect(hasAccess(revoked, NOW + 1)).toBe(false);
    });
});

describe('refunds', () => {
    it('ends access when an invoice is refunded', () => {
        subscription();
        saveInvoice({ id: 'in_1', subscriptionId: 'sub_1', amount: 1200, paidAt: NOW - DAY, refundedAt: null });

        refundInvoice('in_1', NOW);

        expect(getSubscription('sub_1')?.accessEndedAt).toBe(NOW);
    });

    it('refuses to refund an unpaid invoice', () => {
        subscription();
        saveInvoice({ id: 'in_2', subscriptionId: 'sub_1', amount: 1200, paidAt: null, refundedAt: null });

        expect(() => refundInvoice('in_2', NOW)).toThrow(/unpaid/i);
    });
});

describe('renewals', () => {
    it('renews a subscription whose period has ended', () => {
        const sub = subscription();
        const later = sub.currentPeriodEnd + 1;

        expect(runRenewals([{ ...sub }], later)).toEqual(['sub_1']);
        expect(getSubscription('sub_1')?.currentPeriodEnd).toBeGreaterThan(later);
    });

    it('leaves a canceled subscription alone', () => {
        const sub = subscription();
        const canceled = { ...sub, status: 'canceled' as const };

        expect(runRenewals([canceled], sub.currentPeriodEnd + 1)).toEqual([]);
    });
});

describe('self-serve cancellation', () => {
    it('keeps access to the end of the period already paid for', () => {
        const sub = subscription();
        const canceled = cancelPlan('sub_1');

        expect(canceled.cancelAtPeriodEnd).toBe(true);
        expect(hasAccess(canceled, NOW + DAY)).toBe(true);
        expect(hasAccess(canceled, sub.currentPeriodEnd - 1)).toBe(true);
    });

    it('ends access once that period runs out, even before the worker runs', () => {
        const sub = subscription();
        const canceled = cancelPlan('sub_1');

        expect(hasAccess(canceled, sub.currentPeriodEnd + 1)).toBe(false);
    });

    it('does not renew, and closes the subscription when the period ends', () => {
        const sub = subscription();
        cancelPlan('sub_1');
        const due = getSubscription('sub_1')!;

        expect(runRenewals([due], sub.currentPeriodEnd + 1)).toEqual([]);
        expect(getSubscription('sub_1')?.status).toBe('canceled');
        expect(getSubscription('sub_1')?.currentPeriodEnd).toBe(sub.currentPeriodEnd);
    });

    it('does not touch a cancelled subscription that is still inside its period', () => {
        const sub = subscription();
        cancelPlan('sub_1');
        const due = getSubscription('sub_1')!;

        expect(runRenewals([due], sub.currentPeriodEnd - 1)).toEqual([]);
        expect(getSubscription('sub_1')?.status).toBe('active');
    });

    it('charges nothing more: a closed subscription is skipped by later runs', () => {
        const sub = subscription();
        cancelPlan('sub_1');
        runRenewals([getSubscription('sub_1')!], sub.currentPeriodEnd + 1);

        expect(runRenewals([getSubscription('sub_1')!], sub.currentPeriodEnd + 40 * DAY)).toEqual([]);
        expect(hasAccess(getSubscription('sub_1')!, sub.currentPeriodEnd + 40 * DAY)).toBe(false);
    });

    it('ends access straight away for a subscription that is past due', () => {
        const sub = subscription();
        saveSubscription({ ...sub, status: 'past_due', currentPeriodEnd: NOW - DAY });

        expect(hasAccess(cancelPlan('sub_1'), NOW)).toBe(false);
    });

    it('leaves a refunded subscription as it is', () => {
        subscription();
        revokeAccess('sub_1', NOW);
        const canceled = cancelPlan('sub_1');

        expect(canceled.cancelAtPeriodEnd).toBe(false);
        expect(canceled.accessEndedAt).toBe(NOW);
    });
});

describe('resuming a cancelled plan', () => {
    it('puts the subscription back on renewal', () => {
        const sub = subscription();
        cancelPlan('sub_1');
        const resumed = resumePlan('sub_1', NOW + DAY);

        expect(resumed.cancelAtPeriodEnd).toBe(false);
        expect(resumed.accessEndedAt).toBeNull();
        expect(runRenewals([resumed], sub.currentPeriodEnd + 1)).toEqual(['sub_1']);
    });

    it('refuses once the period has run out', () => {
        const sub = subscription();
        cancelPlan('sub_1');

        expect(() => resumePlan('sub_1', sub.currentPeriodEnd + 1)).toThrow(/access has ended/i);
    });

    it('refuses once the worker has closed the subscription', () => {
        const sub = subscription();
        cancelPlan('sub_1');
        runRenewals([getSubscription('sub_1')!], sub.currentPeriodEnd + 1);

        expect(() => resumePlan('sub_1', sub.currentPeriodEnd + 1)).toThrow(/access has ended/i);
    });
});

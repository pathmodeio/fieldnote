import { beforeEach, describe, expect, it } from 'vitest';
import { resetStore, saveInvoice, getSubscription } from '../src/db/store.js';
import { createSubscription } from '../src/billing/subscription.js';
import { hasAccess, revokeAccess } from '../src/billing/access.js';
import { refundInvoice } from '../src/billing/refunds.js';
import { runRenewals } from '../src/billing/renewals.js';

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

import type { Invoice, Subscription } from '../billing/types.js';

/**
 * Stand-in for the database while the billing rewrite is in progress.
 * Same call shape as the Postgres repository it will become, so callers do not change.
 */
const subscriptions = new Map<string, Subscription>();
const invoices = new Map<string, Invoice>();

export function getSubscription(id: string): Subscription | undefined {
    return subscriptions.get(id);
}

export function saveSubscription(subscription: Subscription): Subscription {
    subscriptions.set(subscription.id, subscription);
    return subscription;
}

export function getInvoice(id: string): Invoice | undefined {
    return invoices.get(id);
}

export function saveInvoice(invoice: Invoice): Invoice {
    invoices.set(invoice.id, invoice);
    return invoice;
}

/** Test and local-development helper. Never called from application code. */
export function resetStore(): void {
    subscriptions.clear();
    invoices.clear();
}

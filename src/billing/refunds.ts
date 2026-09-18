import { getInvoice, saveInvoice } from '../db/store.js';
import { revokeAccess } from './access.js';
import type { Invoice } from './types.js';

/**
 * Refunds an invoice and ends the customer's access.
 *
 * Support runs this from the admin console when a customer is charged in error. Because the
 * money goes back, the access it paid for goes with it.
 */
export function refundInvoice(invoiceId: string, now: number = Date.now()): Invoice {
    const invoice = getInvoice(invoiceId);
    if (!invoice) throw new Error(`Unknown invoice: ${invoiceId}`);
    if (invoice.paidAt === null) throw new Error(`Cannot refund an unpaid invoice: ${invoiceId}`);
    if (invoice.refundedAt !== null) return invoice;

    revokeAccess(invoice.subscriptionId, now);

    return saveInvoice({ ...invoice, refundedAt: now });
}

import { GSTInvoice, Booking } from '../types/booking';
import { BookingPersistence } from './booking-persistence';

export const InvoiceAutomation = {
    /**
     * Generate a GST compliant invoice (India ready)
     */
    async generateGSTInvoice(booking: Booking): Promise<GSTInvoice> {
        const hsnCode = "9973"; // Leasing or rental services
        const invoiceNumber = `CZ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const invoice: GSTInvoice = {
            id: `inv-${Date.now()}`,
            booking_id: booking.id,
            invoice_number: invoiceNumber,
            hsn_code: hsnCode,
            subtotal: booking.total_amount - (booking.gst_amount || 0),
            gst_rate: 18,
            gst_amount: booking.gst_amount || 0,
            total_amount: booking.total_amount,
            company_gstin: "27AAAAA0000A1Z5", // Mock Company GST
            created_at: new Date().toISOString()
        };

        BookingPersistence.addInvoice(invoice);
        console.log(`[INVOICE] Generated ${invoiceNumber} for booking ${booking.id}`);

        return invoice;
    },

    /**
     * Simulate PDF Download
     */
    async downloadInvoicePDF(invoiceId: string) {
        console.log(`[INVOICE] Generating PDF for ${invoiceId}...`);
        return true;
    }
};

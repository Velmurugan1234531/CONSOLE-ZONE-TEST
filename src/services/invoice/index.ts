
export const InvoiceService = {
    /**
     * Calculate GST for a transaction amount.
     * Default rate: 18% (Standard for Electronics/Rental Services)
     */
    calculateGST: (amount: number, type: 'intra_state' | 'inter_state' = 'intra_state') => {
        const rate = 0.18;
        const taxAmount = amount * rate;
        const total = amount + taxAmount;

        return {
            baseAmount: amount,
            taxAmount,
            total,
            breakdown: type === 'intra_state'
                ? { cgst: taxAmount / 2, sgst: taxAmount / 2, igst: 0 }
                : { cgst: 0, sgst: 0, igst: taxAmount }
        };
    },

    /**
     * Generate a unique invoice number.
     * Format: INV-YYYY-RANDOM
     */
    generateInvoiceNumber: () => {
        const year = new Date().getFullYear();
        const random = Math.floor(10000 + Math.random() * 90000); // 5 digit random
        return `INV-${year}-${random}`;
    },

    /**
     * Get HSN Code for product category.
     */
    getHSNCode: (category: string) => {
        const map: Record<string, string> = {
            'console': '950450',
            'game': '852349',
            'accessory': '847160',
            'service': '998729'
        };
        return map[category.toLowerCase()] || '998729';
    }
}

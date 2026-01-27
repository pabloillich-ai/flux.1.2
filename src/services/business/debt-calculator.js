/**
 * Debt Calculator
 * Business logic for debt calculations
 */

/**
 * Calculate debt split between overdue and upcoming
 * @param {Array} invoices - Array of invoices
 * @param {number} exchangeRate - USD to UYU exchange rate
 * @returns {Object} { overdue, upcoming, total }
 */
export function calculateDebtSplit(invoices, exchangeRate) {
    let overdue = 0;
    let upcoming = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    invoices.forEach(invoice => {
        const amount = invoice.amount || invoice.saldo_pendiente || 0;
        const currency = invoice.currency || invoice.moneda || 'UYU';
        const dueDateStr = invoice.dueDate || invoice.fecha_vencimiento;

        // Convert to UYU
        const finalAmount = currency === 'USD' ? amount * exchangeRate : amount;

        // Check if overdue
        if (dueDateStr) {
            try {
                const dueDate = new Date(dueDateStr);
                dueDate.setHours(0, 0, 0, 0);

                if (dueDate < today) {
                    overdue += finalAmount;
                } else {
                    upcoming += finalAmount;
                }
            } catch (error) {
                console.warn('Invalid date format:', dueDateStr);
                upcoming += finalAmount;
            }
        } else {
            upcoming += finalAmount;
        }
    });

    return {
        overdue,
        upcoming,
        total: overdue + upcoming
    };
}

/**
 * Calculate days overdue for an invoice
 * @param {string} dueDateStr - Due date string (YYYY-MM-DD)
 * @returns {number} Days overdue (0 if not overdue)
 */
export function calculateDaysOverdue(dueDateStr) {
    if (!dueDateStr) return 0;

    try {
        const dueDate = new Date(dueDateStr);
        const today = new Date();
        dueDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = today - dueDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 0 ? diffDays : 0;
    } catch (error) {
        console.warn('Invalid date format:', dueDateStr);
        return 0;
    }
}

/**
 * Get aging bucket for days overdue
 * @param {number} daysOverdue - Number of days overdue
 * @returns {string} Aging bucket ('1-30', '31-60', '61-90', '+90', 'Current')
 */
export function getAgingBucket(daysOverdue) {
    if (daysOverdue === 0) return 'Current';
    if (daysOverdue <= 30) return '1-30';
    if (daysOverdue <= 60) return '31-60';
    if (daysOverdue <= 90) return '61-90';
    return '+90';
}

/**
 * Calculate total debt for a client across all currencies
 * @param {Array} invoices - Array of invoices
 * @param {number} exchangeRate - USD to UYU exchange rate
 * @returns {Object} { totalUYU, totalUSD, totalInUYU }
 */
export function calculateTotalDebt(invoices, exchangeRate) {
    let totalUYU = 0;
    let totalUSD = 0;

    invoices.forEach(invoice => {
        const amount = invoice.amount || invoice.saldo_pendiente || 0;
        const currency = invoice.currency || invoice.moneda || 'UYU';

        if (currency === 'USD') {
            totalUSD += amount;
        } else {
            totalUYU += amount;
        }
    });

    return {
        totalUYU,
        totalUSD,
        totalInUYU: totalUYU + (totalUSD * exchangeRate)
    };
}

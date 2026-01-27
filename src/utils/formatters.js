/**
 * Formatters Utilities
 * Functions for formatting data for display
 */

/**
 * Format number as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (UYU, USD)
 * @returns {string} Formatted currency string
 * 
 * @example
 * formatMoney(1234567) // "$1,234,567"
 * formatMoney(1234.56, 'USD') // "US$1,234.56"
 */
export function formatMoney(amount, currency = 'UYU') {
    if (amount === null || amount === undefined) return '$0';

    const prefix = currency === 'USD' ? 'US$' : '$';
    const formatted = new Intl.NumberFormat('es-UY', {
        minimumFractionDigits: 0,
        maximumFractionDigits: currency === 'USD' ? 2 : 0
    }).format(amount);

    return `${prefix}${formatted}`;
}

/**
 * Format date string for display
 * @param {string} dateStr - ISO date string
 * @param {string} format - Format type ('short', 'long', 'relative')
 * @returns {string} Formatted date string
 * 
 * @example
 * formatDate('2024-01-26') // "26/01/2024"
 * formatDate('2024-01-26', 'long') // "26 de enero de 2024"
 */
export function formatDate(dateStr, format = 'short') {
    if (!dateStr) return '-';

    try {
        const date = new Date(dateStr);

        if (format === 'short') {
            return new Intl.DateTimeFormat('es-UY', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).format(date);
        }

        if (format === 'long') {
            return new Intl.DateTimeFormat('es-UY', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).format(date);
        }

        if (format === 'relative') {
            return formatRelativeDate(date);
        }

        return dateStr;
    } catch (error) {
        console.warn('Invalid date:', dateStr);
        return dateStr;
    }
}

/**
 * Format date as relative time (e.g., "hace 2 días")
 * @param {Date} date - Date object
 * @returns {string} Relative time string
 */
export function formatRelativeDate(date) {
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
    }
    if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
    }
    const years = Math.floor(diffDays / 365);
    return `Hace ${years} año${years > 1 ? 's' : ''}`;
}

/**
 * Format RUT/CI for display
 * @param {string} rut - RUT/CI number
 * @returns {string} Formatted RUT
 * 
 * @example
 * formatRUT('210000010015') // "2.100.000-1-0015"
 */
export function formatRUT(rut) {
    if (!rut) return '-';

    const str = String(rut).padStart(12, '0');
    return `${str.slice(0, 1)}.${str.slice(1, 4)}.${str.slice(4, 7)}-${str.slice(7, 8)}-${str.slice(8, 12)}`;
}

/**
 * Format percentage
 * @param {number} value - Percentage value (0-100)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 * 
 * @example
 * formatPercent(75.5) // "75.5%"
 * formatPercent(0.755, 2, true) // "75.50%" (if value is 0-1 ratio)
 */
export function formatPercent(value, decimals = 1, isRatio = false) {
    if (value === null || value === undefined) return '0%';

    const percent = isRatio ? value * 100 : value;
    return `${percent.toFixed(decimals)}%`;
}

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone
 * 
 * @example
 * formatPhone('099123456') // "099 12 34 56"
 */
export function formatPhone(phone) {
    if (!phone) return '-';

    const cleaned = String(phone).replace(/\D/g, '');

    if (cleaned.length === 9) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;
    }

    return phone;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 * 
 * @example
 * formatFileSize(1536) // "1.5 KB"
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Validators Utilities
 * Functions for validating data
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
    if (!email) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate RUT/CI format (Uruguay)
 * @param {string} rut - RUT to validate
 * @returns {boolean} True if valid
 */
export function isValidRUT(rut) {
    if (!rut) return false;

    // RUT should be 12 digits
    const cleaned = String(rut).replace(/\D/g, '');
    return cleaned.length === 12;
}

/**
 * Validate phone number (Uruguay)
 * @param {string} phone - Phone to validate
 * @returns {boolean} True if valid
 */
export function isValidPhone(phone) {
    if (!phone) return false;

    // Uruguay phone: 9 digits (099123456 or 24567890)
    const cleaned = String(phone).replace(/\D/g, '');
    return cleaned.length === 9 || cleaned.length === 8;
}

/**
 * Validate date is not in the future
 * @param {string} dateStr - Date string
 * @returns {boolean} True if valid (not future)
 */
export function isNotFutureDate(dateStr) {
    if (!dateStr) return true; // Empty is valid

    try {
        const date = new Date(dateStr);
        const now = new Date();
        return date <= now;
    } catch {
        return false;
    }
}

/**
 * Validate positive number
 * @param {number|string} value - Value to validate
 * @returns {boolean} True if positive number
 */
export function isPositiveNumber(value) {
    const num = Number(value);
    return !isNaN(num) && num > 0;
}

/**
 * Validate non-negative number
 * @param {number|string} value - Value to validate
 * @returns {boolean} True if non-negative number
 */
export function isNonNegativeNumber(value) {
    const num = Number(value);
    return !isNaN(num) && num >= 0;
}

/**
 * Validate string is not empty
 * @param {string} str - String to validate
 * @returns {boolean} True if not empty
 */
export function isNotEmpty(str) {
    return str && String(str).trim().length > 0;
}

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {boolean} True if within range
 */
export function isValidLength(str, min = 0, max = Infinity) {
    if (!str) return min === 0;
    const length = String(str).length;
    return length >= min && length <= max;
}

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} True if valid UUID
 */
export function isValidUUID(uuid) {
    if (!uuid) return false;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Validate credit limit
 * @param {number} amount - Amount to validate
 * @returns {boolean} True if valid credit limit
 */
export function isValidCreditLimit(amount) {
    const num = Number(amount);
    return !isNaN(num) && num >= 0 && num <= 10000000; // Max 10M
}

/**
 * Sanitize input string (remove dangerous characters)
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
    if (!input) return '';

    return String(input)
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

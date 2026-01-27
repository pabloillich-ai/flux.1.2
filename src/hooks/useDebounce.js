import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values
 * Useful for search inputs, filters, etc.
 * 
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500)
 * @returns {any} Debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   // API call with debouncedSearch
 * }, [debouncedSearch]);
 */
export function useDebounce(value, delay = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Set up the timeout
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up timeout on value change or unmount
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

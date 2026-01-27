import { API_URL } from '../../config';

/**
 * Import API Service
 * Handles data import operations
 */
export const importService = {
    /**
     * Process import data
     * @param {string} token - Authentication token
     * @param {string} type - Import type (Clientes, Contactos, Facturas)
     * @param {Array} data - Data to import
     * @param {Object} mapping - Field mapping
     * @returns {Promise<Object>} Import result with stats
     */
    async processImport(token, type, data, mapping) {
        const response = await fetch(`${API_URL}/api/import/process`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type,
                data,
                mapping
            })
        });

        if (!response.ok) {
            throw new Error(`Import failed: ${response.statusText} (${response.status})`);
        }

        return response.json();
    },

    /**
     * Seed mock data (dev/testing only)
     * @param {string} token - Authentication token
     * @returns {Promise<Object>} Seed result
     */
    async seedMockData(token) {
        const response = await fetch(`${API_URL}/api/admin/seed`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Seed failed: ${response.statusText} (${response.status})`);
        }

        return response.json();
    }
};

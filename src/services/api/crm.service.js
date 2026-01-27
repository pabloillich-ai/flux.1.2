import { API_URL } from '../../config';

/**
 * CRM API Service
 * Handles all CRM-related API calls
 */
export const crmService = {
    /**
     * Create a CRM entry
     * @param {string} token - Authentication token
     * @param {Object} entry - CRM entry data
     * @returns {Promise<Object>} Created entry
     */
    async createEntry(token, entry) {
        const response = await fetch(`${API_URL}/api/crm`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(entry)
        });

        if (!response.ok) {
            throw new Error(`CRM entry creation failed: ${response.statusText} (${response.status})`);
        }

        return response.json();
    },

    /**
     * Add CRM interaction (legacy endpoint)
     * @param {string} token - Authentication token
     * @param {Object} interaction - Interaction data
     * @returns {Promise<Object>} Created interaction
     */
    async addInteraction(token, interaction) {
        const response = await fetch(`${API_URL}/crm/interactions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(interaction)
        });

        if (!response.ok) {
            throw new Error(`CRM interaction failed: ${response.statusText} (${response.status})`);
        }

        return response.json();
    }
};

import { API_URL } from '../../config';

/**
 * Client API Service
 * Handles all client-related API calls
 */
export const clientService = {
    /**
     * Get prioritized queue of clients
     * @param {string} token - Authentication token
     * @param {Object} filters - Queue filters (minDebt, agingBucket, riskLevel)
     * @returns {Promise<Array>} Queue items
     */
    async getQueue(token, filters = {}) {
        const params = new URLSearchParams();

        if (filters.minDebt) params.append('min_debt', filters.minDebt);
        if (filters.agingBucket && filters.agingBucket !== 'all') {
            params.append('aging_bucket', filters.agingBucket);
        }
        if (filters.riskLevel && filters.riskLevel !== 'all') {
            params.append('risk_level', filters.riskLevel);
        }

        const queryString = params.toString();
        const url = `${API_URL}/api/queue${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Queue fetch failed: ${response.statusText} (${response.status})`);
        }

        return response.json();
    },

    /**
     * Get detailed client information
     * @param {string} token - Authentication token
     * @param {string} clientId - Client UUID
     * @returns {Promise<Object>} Client details
     */
    async getClientDetail(token, clientId) {
        const response = await fetch(`${API_URL}/api/clients/${clientId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Client fetch failed: ${response.statusText} (${response.status})`);
        }

        return response.json();
    },

    /**
     * Update client status
     * @param {string} token - Authentication token
     * @param {string} clientId - Client UUID
     * @param {string} status - New status
     * @returns {Promise<Object>} Update result
     */
    async updateStatus(token, clientId, status) {
        const response = await fetch(`${API_URL}/api/clients/${clientId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            throw new Error(`Status update failed: ${response.statusText} (${response.status})`);
        }

        return response.json();
    }
};

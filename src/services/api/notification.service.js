import { API_URL } from '../../config';

/**
 * Notification API Service
 * Handles all notification-related API calls
 */
export const notificationService = {
    /**
     * Send a notification to a client
     * @param {string} token - Authentication token
     * @param {string} clientId - Client UUID
     * @param {string} channel - Notification channel (email, sms, whatsapp)
     * @param {string} message - Message content
     * @returns {Promise<Object>} Send result
     */
    async sendNotification(token, clientId, channel, message) {
        const response = await fetch(`${API_URL}/api/notify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                channel: channel,
                message_val: message
            })
        });

        if (!response.ok) {
            throw new Error(`Notification failed: ${response.statusText} (${response.status})`);
        }

        return response.json();
    }
};

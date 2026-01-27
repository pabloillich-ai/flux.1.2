import { API_URL } from '../../config';

/**
 * Dashboard API Service
 * Handles all dashboard-related API calls
 */
export const dashboardService = {
  /**
   * Fetch dashboard data (clients, KPIs, exchange rate)
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboard(token) {
    const response = await fetch(`${API_URL}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Dashboard fetch failed: ${response.statusText} (${response.status})`);
    }
    
    return response.json();
  },

  /**
   * Fetch dashboard statistics (cash flow, commitments, risk)
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Dashboard stats
   */
  async getStats(token) {
    const response = await fetch(`${API_URL}/api/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Stats fetch failed: ${response.statusText} (${response.status})`);
    }
    
    return response.json();
  },

  /**
   * Trigger daily process (admin only)
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Process result
   */
  async runDailyProcess(token) {
    const response = await fetch(`${API_URL}/api/admin/run-daily-process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Daily process failed: ${response.statusText} (${response.status})`);
    }
    
    return response.json();
  }
};

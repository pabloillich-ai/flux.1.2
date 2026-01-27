import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/api';

/**
 * Custom hook for dashboard data
 * Handles fetching, loading, and error states
 */
export function useDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboard = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Get session token
            const { data: { session } } = await window.supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new Error('No authentication token available');
            }

            const dashboardData = await dashboardService.getDashboard(token);
            setData(dashboardData);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError(err.message || 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return {
        data,
        loading,
        error,
        refetch: fetchDashboard
    };
}

/**
 * Custom hook for dashboard stats
 * Fetches KPI statistics separately
 */
export function useDashboardStats() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const { data: { session } } = await window.supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new Error('No authentication token available');
            }

            const statsData = await dashboardService.getStats(token);
            setStats(statsData);
        } catch (err) {
            console.error('Stats fetch error:', err);
            setError(err.message || 'Failed to fetch stats');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        loading,
        error,
        refetch: fetchStats
    };
}

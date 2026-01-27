import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { clientService } from '../services/api';

/**
 * Custom hook for client queue
 * Handles fetching prioritized client queue with filters
 */
export function useClientQueue(initialFilters = {}) {
    const { user } = useAuth();
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        minDebt: 0,
        agingBucket: 'all',
        riskLevel: 'all',
        ...initialFilters
    });

    const fetchQueue = useCallback(async () => {
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

            const queueData = await clientService.getQueue(token, filters);
            setQueue(queueData);
        } catch (err) {
            console.error('Queue fetch error:', err);
            setError(err.message || 'Failed to fetch client queue');
        } finally {
            setLoading(false);
        }
    }, [user, filters]);

    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);

    const updateFilters = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters({
            minDebt: 0,
            agingBucket: 'all',
            riskLevel: 'all'
        });
    }, []);

    return {
        queue,
        loading,
        error,
        filters,
        updateFilters,
        resetFilters,
        refetch: fetchQueue
    };
}

/**
 * Custom hook for client detail
 * Fetches detailed information for a specific client
 */
export function useClientDetail(clientId) {
    const { user } = useAuth();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchClient = useCallback(async () => {
        if (!user || !clientId) {
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

            const clientData = await clientService.getClientDetail(token, clientId);
            setClient(clientData);
        } catch (err) {
            console.error('Client fetch error:', err);
            setError(err.message || 'Failed to fetch client details');
        } finally {
            setLoading(false);
        }
    }, [user, clientId]);

    useEffect(() => {
        fetchClient();
    }, [fetchClient]);

    return {
        client,
        loading,
        error,
        refetch: fetchClient
    };
}

/**
 * Custom hook for updating client status
 * Provides mutation function with loading/error states
 */
export function useUpdateClientStatus() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const updateStatus = useCallback(async (clientId, newStatus) => {
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            setLoading(true);
            setError(null);

            const { data: { session } } = await window.supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new Error('No authentication token available');
            }

            const result = await clientService.updateStatus(token, clientId, newStatus);
            return result;
        } catch (err) {
            console.error('Status update error:', err);
            const errorMsg = err.message || 'Failed to update client status';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [user]);

    return {
        updateStatus,
        loading,
        error
    };
}

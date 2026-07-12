import { supabase } from './supabase';

import { API_URL } from '../config';

/**
 * Tries to fetch dashboard data from Python Backend.
 * Falls back to Client-Side Join if backend is offline.
 */
export const getDashboardData = async () => {
    try {
        // 1. Try Python Backend with a short timeout (e.g., 2 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        try {
            const session = await supabase.auth.getSession();
            const token = session?.data?.session?.access_token;

            const res = await fetch(`${API_URL}/api/dashboard`, {
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();

                return {
                    items: data.items,
                    kpis: data.kpis,
                    exchangeRate: data.exchange_rate,
                    source: 'backend'
                };
            }
        } catch (err) {
            // Ignore fetch errors, just proceed to fallback
            console.warn("Backend Python no disponible (Offline o Timeout), usando fallback cliente.");
        }

        // 2. FALLBACK: Client Side Logic (Original Implementation)

        return await fetchFallbackData();

    } catch (error) {
        console.error("Critical API Error:", error);
        throw error;
    }
};


// === LOGICA ORIGINAL (MOVIDA AQUI PARA FALLBACK) ===

const calculateDebtSplit = (invoices, rate) => {
    let overdue = 0;
    let upcoming = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    invoices.forEach(inv => {
        const amount = inv.currency === 'USD' ? inv.amount * rate : inv.amount;
        const due = new Date(inv.dueDate);
        due.setHours(0, 0, 0, 0);

        if (due < today) {
            overdue += amount;
        } else {
            upcoming += amount;
        }
    });

    return { overdue, upcoming };
};

const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(amount);
};

async function fetchFallbackData() {
    // 1. Fetch Rate
    let exchangeRate = 42;
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data?.rates?.UYU) exchangeRate = data.rates.UYU;
    } catch (e) { console.warn('Rate fetch failed', e); }

    // 2. Fetch DB Data
    const [clientsRes, usersRes, invoicesRes, crmRes] = await Promise.all([
        supabase.from('clientes_maestra').select('*').eq('tenant', '1'),
        supabase.from('users').select('*'),
        supabase.from('inv_docs').select('*').gt('saldo_pendiente', 0),
        supabase.from('crm_gestion').select('*')
    ]);

    if (clientsRes.error) throw clientsRes.error;

    const clients = clientsRes.data || [];
    const users = usersRes.data || [];
    const invoices = invoicesRes.data || [];
    const crms = crmRes.data || [];

    let totalDebt = 0;
    let criticalDebt = 0;
    let managedCount = 0;

    const items = clients.map(client => {
        // Join Users
        const agent = users.find(u => u.id === client.agente);

        // Join Invoices
        const clientInvoices = invoices.filter(inv => inv.rut_ci === client.rut_ci).map(inv => ({
            id: inv.id || inv.uuid,
            docNumber: inv.nro_doc || inv.serie_numero,
            amount: inv.saldo_pendiente,
            currency: inv.moneda,
            dueDate: inv.fecha_vencimiento,
            issueDate: inv.fecha_emision,
            comment: inv.Comentario,
            alertExcluded: inv.Alet_exclud
        }));

        // Join CRM
        const clientCrm = crms.filter(c => c.id_cliente === client.uuid);
        clientCrm.sort((a, b) => new Date(b.fecha_y_hora) - new Date(a.fecha_y_hora));
        const latestCrm = clientCrm[0] || {};

        // Calc Debt
        const { overdue, upcoming } = calculateDebtSplit(clientInvoices, exchangeRate);
        totalDebt += (overdue + upcoming);
        criticalDebt += overdue;

        // Calc Status
        const status = client.estado_actual || 'Pendiente';
        if (status !== 'Pendiente') managedCount++;

        return {
            id: client.uuid,
            rut: client.rut_ci,
            name: client.razon_social,
            risk: client.status_riesgo || 'Regular',
            creditLimit: client.limite_de_credito,
            agentId: client.agente,
            agentName: agent ? agent.full_name : 'Sin Asignar',
            invoices: clientInvoices,
            crmHistory: clientCrm,
            crm: {
                lastNote: latestCrm.observaciones_mensaje || 'Sin gestión reciente',
                date: latestCrm.fecha_y_hora ? new Date(latestCrm.fecha_y_hora).toLocaleDateString() : '-'
            },
            status: status,
            promiseDate: latestCrm.fecha_promesa_pago,
            overdue: overdue,
            totalDebt: overdue + upcoming,
        };
    });

    const effectiveness = items.length > 0 ? Math.round((managedCount / items.length) * 100) : 0;

    return {
        items,
        exchangeRate,
        kpis: {
            total: formatMoney(totalDebt),
            critical: formatMoney(criticalDebt),
            effectiveness: effectiveness + '%'
        },
        source: 'fallback'
    };
}


// === QUEUE & CONTEXT FALLBACKS ===

export const getQueueData = async (filters = {}) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;

        const params = new URLSearchParams({
            min_debt: filters.minDebt || 0,
            aging_bucket: filters.agingBucket || 'all',
            risk_level: filters.riskLevel || 'all'
        });

        const res = await fetch(`${API_URL}/api/queue?${params.toString()}`, {
            signal: controller.signal,
            headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        clearTimeout(timeoutId);

        if (res.ok) return await res.json();
    } catch (e) {
        console.warn("Backend Queue unavailable, using fallback");
    }

    // Fallback: Get all data and filter/sort
    // We reuse getDashboardData to leverage its fallback logic if needed
    const { items, exchangeRate } = await getDashboardData();

    let queue = items.map(item => {
        // Calculate Debt
        let totalDebt = 0;
        let maxDaysOverdue = 0;

        item.invoices.forEach(inv => {
            const amount = inv.currency === 'USD' ? inv.amount * exchangeRate : inv.amount;
            totalDebt += amount;

            const due = new Date(inv.dueDate);
            const today = new Date();
            const diffTime = Math.abs(today - due);
            const diffDays = today > due ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
            if (diffDays > maxDaysOverdue) maxDaysOverdue = diffDays;
        });

        // Determine Bucket (Mapping Frontend Logic)
        let bucket = 'Regular';
        if (item.risk === 'Incobrable' || item.risk === 'Legal' || maxDaysOverdue > 90) bucket = 'Urgente';
        else if (item.risk === 'Mal Pagador' || maxDaysOverdue > 30) bucket = 'Seguimiento';

        // Calculate Score (Simple Mock)
        const priorityScore = Math.floor(totalDebt / 1000) + (maxDaysOverdue * 10);

        return {
            id: item.id,
            name: item.name,
            totalDebt,
            daysOverdue: maxDaysOverdue,
            risk: item.risk,
            bucket,
            priorityScore,
            overdue: item.overdue
        };
    });

    // Apply Filters
    if (filters.minDebt) queue = queue.filter(q => q.totalDebt >= filters.minDebt);
    if (filters.agingBucket && filters.agingBucket !== 'all') {
        if (filters.agingBucket === '+90') queue = queue.filter(q => q.daysOverdue >= 90);
        else if (filters.agingBucket === '1-30') queue = queue.filter(q => q.daysOverdue >= 1 && q.daysOverdue <= 30);
    }
    if (filters.riskLevel && filters.riskLevel !== 'all') {
        queue = queue.filter(q => q.risk === filters.riskLevel || (filters.riskLevel === 'Crítico' && (q.risk === 'Legal' || q.risk === 'Incobrable')));
    }

    // Sort by Score
    queue.sort((a, b) => b.priorityScore - a.priorityScore);

    return queue;
};

export const getStatsData = async () => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;

        const res = await fetch(`${API_URL}/api/dashboard/stats`, {
            signal: controller.signal,
            headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        clearTimeout(timeoutId);
        if (res.ok) return await res.json();
    } catch (e) {
        console.warn("Backend Stats unavailable, using fallback");
    }

    // Fallback Mock Stats
    return {
        cashFlow: 15400,
        cashFlowClients: [{ name: 'Cliente A' }, { name: 'Cliente B' }],
        operationalVolume: 24,
        commitmentsToday: 5,
        commitmentsCompleted: 2,
        criticalRisk: 12
    };
};

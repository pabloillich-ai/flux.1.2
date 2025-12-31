import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'; // Default Python Backend URL

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
            const res = await fetch(`${API_URL}/dashboard`, {
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json'
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
            id: inv.id,
            amount: inv.saldo_pendiente,
            currency: inv.moneda,
            dueDate: inv.fecha_vencimiento,
            issueDate: inv.fecha_emision
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
            promiseDate: latestCrm.fecha_promesa_pago
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

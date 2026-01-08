import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Filter,
    ArrowUpRight,
    Phone,
    Mail,
    MessageCircle,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Search,
    Calendar,
    DollarSign,
    RefreshCw,
    FileText
} from 'lucide-react';
import ImmersiveModal from '../components/ImmersiveModal';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const QUEUE_API_URL = `${API_URL}/api/queue`;

export default function ContextAndRole() {
    const [queue, setQueue] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);

    // KPI State
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    // Filters
    const [filters, setFilters] = useState({
        minDebt: 0,
        agingBucket: 'all',
        riskLevel: 'all'
    });

    // Detail Modal State
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [fullDetailClient, setFullDetailClient] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token;
            // Build Query Params
            const params = new URLSearchParams({
                min_debt: filters.minDebt,
                aging_bucket: filters.agingBucket,
                risk_level: filters.riskLevel
            });

            const res = await fetch(`${QUEUE_API_URL}?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setQueue(data);
                // Auto-select first if available
                if (data.length > 0 && !selectedId) {
                    setSelectedId(data[0].id);
                }
            } else {
                console.error("Failed to fetch queue");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }


    const fetchStats = async () => {
        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token;
            const res = await fetch(`${API_URL}/api/dashboard/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleOpenDetails = async () => {
        if (!selectedClient) return;
        setLoadingDetails(true);
        try {
            const session = await supabase.auth.getSession();
            const token = session?.data?.session?.access_token;

            const res = await fetch(`${API_URL}/api/clients/${selectedClient.id}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (!res.ok) throw new Error('Failed to fetch details');
            const data = await res.json();

            setFullDetailClient(data);
            setIsDetailOpen(true);
        } catch (error) {
            console.error(error);
            alert('Error al cargar detalles del cliente');
        } finally {
            setLoadingDetails(false);
        }
    };

    useEffect(() => {
        fetchQueue();
        fetchStats();
    }, [filters]);

    const selectedClient = queue.find(q => q.id === selectedId);

    // Helpers for UI
    const getRiskColor = (risk) => {
        const map = {
            'Crítico': 'text-red-500 bg-red-500/10',
            'Alto': 'text-orange-500 bg-orange-500/10',
            'Medio': 'text-yellow-500 bg-yellow-500/10',
            'Bajo': 'text-green-500 bg-green-500/10',
            'Regular': 'text-blue-500 bg-blue-500/10'
        };
        return map[risk] || 'text-text-muted bg-white/5';
    };

    const getBucketColor = (bucket) => {
        if (bucket === 'Urgente') return 'border-l-4 border-l-red-500';
        if (bucket === 'Seguimiento') return 'border-l-4 border-l-yellow-500';
        return 'border-l-4 border-l-blue-500';
    };

    return (
        <div className="flex h-full w-full bg-[#0f1115] text-white overflow-hidden font-sans">
            {/* LEFT PANEL: QUEUE (33%) */}
            <div className="w-1/3 flex flex-col border-r border-white/5 bg-[#0f1115]">
                {/* Header & Filters */}
                <div className="p-4 border-b border-white/5 bg-[#0f1115] z-10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <RefreshCw size={14} className={`cursor-pointer hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`} onClick={fetchQueue} />
                            Cola de Prioridad
                            <span className="bg-blue-600 text-white text-[10px] mobile-number px-1.5 py-0.5 rounded-full">{queue.length}</span>
                        </h2>
                    </div>


                    {/* --- KPI CARDS (Dashboard Context) --- */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                        {/* 1. Recaudado Hoy */}
                        <div
                            className="bg-[#1a1d24] p-3 rounded-lg border border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-900/10 cursor-pointer transition-all group"
                            onClick={() => alert('Detalle de recaudación: ' + (stats?.cashFlowClients?.map(c => c.name).join(', ') || 'Sin datos'))}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                                    <DollarSign size={16} />
                                </div>
                                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full">+12%</span>
                            </div>
                            <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Recaudado Hoy</div>
                            <div className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                                ${stats?.cashFlow?.toLocaleString() || '0'}
                            </div>
                        </div>

                        {/* 2. Volume Operativo */}
                        <div
                            className="bg-[#1a1d24] p-3 rounded-lg border border-blue-500/20 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/10 cursor-pointer transition-all group"
                            onClick={() => setFilters(prev => ({ ...prev, agingBucket: 'all', riskLevel: 'all' }))} // Placeholder filter
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                                    <Phone size={16} />
                                </div>
                                <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded-full">Alto</span>
                            </div>
                            <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Llamadas Pendientes</div>
                            <div className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                {stats?.operationalVolume || 0}
                            </div>
                        </div>

                        {/* 3. Promesas Hoy */}
                        <div
                            className="bg-[#1a1d24] p-3 rounded-lg border border-amber-500/20 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-900/10 cursor-pointer transition-all group"
                            onClick={() => alert(`Promesas para hoy: ${stats?.commitmentsToday} (${stats?.commitmentsCompleted} cumplidas)`)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                                    <Calendar size={16} />
                                </div>
                                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-full">{stats?.commitmentsCompleted}/{stats?.commitmentsToday}</span>
                            </div>
                            <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Promesas Hoy</div>
                            <div className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                                {stats?.commitmentsToday || 0}
                            </div>
                        </div>

                        {/* 4. Riesgo Critico */}
                        <div
                            className="bg-[#1a1d24] p-3 rounded-lg border border-red-500/20 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-900/10 cursor-pointer transition-all group relative overflow-hidden"
                            onClick={() => setFilters(prev => ({ ...prev, riskLevel: 'Crítico' }))}
                        >
                            <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-1.5 rounded-md bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
                                        <AlertTriangle size={16} />
                                    </div>
                                    <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded-full">Alerta</span>
                                </div>
                                <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Riesgo Crítico</div>
                                <div className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                                    {stats?.criticalRisk || 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        <select
                            className="bg-[#1a1d24] border border-white/10 rounded-lg text-xs text-gray-300 px-2 py-1.5 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                            value={filters.riskLevel}
                            onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
                        >
                            <option value="all">Riesgo: Todos</option>
                            <option value="Crítico">Crítico</option>
                            <option value="Alto">Alto</option>
                            <option value="Medio">Medio</option>
                        </select>
                        <select
                            className="bg-[#1a1d24] border border-white/10 rounded-lg text-xs text-gray-300 px-2 py-1.5 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                            value={filters.agingBucket}
                            onChange={(e) => setFilters(prev => ({ ...prev, agingBucket: e.target.value }))}
                        >
                            <option value="all">Mora: Todos</option>
                            <option value="1-30">1-30 días</option>
                            <option value="+90">+90 días</option>
                        </select>
                        <select
                            className="bg-[#1a1d24] border border-white/10 rounded-lg text-xs text-gray-300 px-2 py-1.5 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                            value={filters.minDebt}
                            onChange={(e) => setFilters(prev => ({ ...prev, minDebt: Number(e.target.value) }))}
                        >
                            <option value={0}>Monto: Todos</option>
                            <option value={10000}>+$10k</option>
                            <option value={50000}>+$50k</option>
                        </select>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500 text-sm">Cargando cola priorizada...</div>
                    ) : (
                        queue.map(item => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all relative group ${selectedId === item.id
                                    ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-900/10'
                                    : 'bg-[#1a1d24] border-white/5 hover:border-white/10 hover:bg-[#20242c]'
                                    }`}
                            >
                                {/* Bucket Indicator Strip */}
                                <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${item.bucket === 'Urgente' ? 'bg-red-500' :
                                    item.bucket === 'Seguimiento' ? 'bg-amber-500' : 'bg-blue-500'
                                    }`}></div>

                                <div className="pl-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-bold text-sm truncate ${selectedId === item.id ? 'text-blue-400' : 'text-gray-200'}`}>
                                            {item.name}
                                        </h3>
                                        <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                                            {item.priorityScore}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
                                        <span className="flex items-center gap-1.5">
                                            <AlertTriangle size={12} className={item.daysOverdue > 60 ? 'text-red-400' : 'text-gray-500'} />
                                            {item.daysOverdue} días
                                        </span>
                                        <span className="font-mono font-medium text-gray-300">
                                            ${item.totalDebt.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex gap-2 items-center">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getRiskColor(item.risk).replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                                            {item.risk}
                                        </span>
                                        {item.bucket === 'Urgente' && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20 animate-pulse font-bold">
                                                URGENTE
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: WORKSPACE (66%) */}
            <div className="flex-1 flex flex-col bg-[#0f1115] overflow-hidden relative">
                {
                    selectedClient ? (
                        <>
                            {/* 360 HEADER */}
                            <div className="p-6 border-b border-white/5 bg-[#0f1115] shrink-0 z-20 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="size-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20">
                                            {selectedClient.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h1 className="text-xl font-bold text-white">{selectedClient.name}</h1>
                                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                                <span className="font-mono">RUT: {selectedClient.rut}</span>
                                                <span className="w-px h-3 bg-white/10"></span>
                                                <span className="flex items-center gap-1 text-emerald-400">
                                                    <ArrowUpRight size={12} />
                                                    Deuda Total: ${selectedClient.totalDebt.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleOpenDetails}
                                        disabled={loadingDetails}
                                        title="Ver Facturas y Detalles"
                                        className="p-2.5 rounded-xl bg-[#2e3a4a] text-blue-300 border border-blue-500/30 hover:bg-[#364b63] transition-all group relative overflow-hidden"
                                    >
                                        <div className={`absolute inset-0 bg-blue-500/10 transition-transform origin-left ${loadingDetails ? 'scale-x-100 animate-progress' : 'scale-x-0'}`}></div>
                                        <FileText size={18} className="group-hover:scale-110 transition-transform relative z-10" />
                                    </button>
                                    <button className="p-2.5 rounded-xl bg-[#1e3a2f] text-[#4ade80] border border-[#2d5d4b] hover:bg-[#254639] transition-all group">
                                        <Phone size={18} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                    <button className="p-2.5 rounded-xl bg-[#1e2a3a] text-[#60a5fa] border border-[#2d405d] hover:bg-[#253346] transition-all group">
                                        <Mail size={18} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                    <button className="p-2.5 rounded-xl bg-[#2e1a3a] text-[#c084fc] border border-[#5d2d5d] hover:bg-[#462546] transition-all group">
                                        <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                            </div >

                            {/* CONTENT AREA */}
                            < div className="flex-1 flex overflow-hidden" >
                                {/* CRM HISTORY & DETAILS */}
                                < div className="flex-1 overflow-y-auto custom-scrollbar p-6" >
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Historial de Interacciones</h3>

                                    <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-0 before:w-px before:bg-white/5">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="relative pl-10 group">
                                                <div className="absolute left-0 top-0 size-8 rounded-full bg-[#1a1d24] border border-white/5 flex items-center justify-center z-10 group-hover:border-blue-500/50 transition-colors">
                                                    <Clock size={14} className="text-gray-500 group-hover:text-blue-400" />
                                                </div>
                                                <div className="bg-[#1a1d24] border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="text-sm font-medium text-gray-200">Llamada saliente sin respuesta</p>
                                                        <span className="text-[10px] text-gray-500">Hace {i * 2}h</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">Agente: Sistema • Intento automático</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div >

                                {/* COMMITMENT FORM (Fixed Sidebar) */}
                                < div className="w-96 border-l border-white/5 bg-[#14161b] p-6 flex flex-col shrink-0 shadow-2xl overflow-y-auto custom-scrollbar" >
                                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                        Registrar Nueva Gestión
                                    </h3>

                                    <div className="space-y-5 flex-1">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Acción</label>
                                            <select className="w-full bg-[#1a1d24] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all">
                                                <option>Llamada Exitosa</option>
                                                <option>Buzón de Voz</option>
                                                <option>Whatsapp Enviado</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Resultado</label>
                                            <select className="w-full bg-[#1a1d24] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all">
                                                <option>Promesa de Pago</option>
                                                <option>Negativa de Pago</option>
                                                <option>Volver a Llamar</option>
                                            </select>
                                        </div>

                                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="size-2 rounded-full bg-blue-500 animate-pulse"></div>
                                                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Detalles de la Promesa</span>
                                            </div>

                                            <div className="relative group">
                                                <Calendar size={14} className="absolute left-3 top-3 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                                                <input type="date" className="w-full bg-[#0f1115] border border-white/10 rounded-lg p-2.5 pl-9 text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-600" />
                                            </div>
                                            <div className="relative group">
                                                <DollarSign size={14} className="absolute left-3 top-3 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                                                <input type="number" placeholder="Monto Acordado" className="w-full bg-[#0f1115] border border-white/10 rounded-lg p-2.5 pl-9 text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-600" />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Observaciones</label>
                                            <textarea
                                                className="w-full bg-[#1a1d24] border border-white/10 rounded-lg p-3 text-sm text-white h-32 resize-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-600"
                                                placeholder="Escribe los detalles de la conversación aquí..."
                                            ></textarea>
                                        </div>
                                    </div>

                                    <button className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transform hover:-translate-y-0.5 active:translate-y-0">
                                        Guardar Gestión
                                    </button>
                                </div >
                            </div >
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-50">
                            <div className="size-24 rounded-full bg-[#1a1d24] flex items-center justify-center mb-6 animate-pulse">
                                <Search size={40} className="text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-300 mb-2">Ningún Cliente Seleccionado</h3>
                            <p className="text-gray-500 text-sm max-w-xs text-center">Selecciona un cliente de la cola de prioridad a la izquierda para comenzar a gestionar.</p>
                        </div>
                    )}
            </div >
            {/* Detail Modal */}
            < ImmersiveModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                client={fullDetailClient}
                onClientUpdate={(id, updates) => {
                    // Optional: Update local queue state if relevant (e.g. debt changes)
                    // For now, simpler to just close or refresh
                    // But let's at least update the fullDetailClient to reflect new CRM
                    setFullDetailClient(prev => ({ ...prev, ...updates }));
                }}
            />
        </div>
    );
}

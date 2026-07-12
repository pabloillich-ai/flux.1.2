import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Search,
    Bell,
    Phone,
    MessageCircle,
    TrendingUp,
    TrendingDown,
    DollarSign,
    PiggyBank,
    AlertTriangle,
    Filter,
    Plus,
    X,
    Sparkles,
    Calendar,
    Briefcase,
    Mail,
    CheckCircle2,
    Edit2,
    Save
} from 'lucide-react';
import { API_URL } from '../config';
import { getDashboardData } from '../lib/api';
import EditDebtorModal from '../components/EditDebtorModal';

const StatCard = ({ label, value, trend, trendType, icon, color }) => (
    <div className="bg-[#1a1d24] border border-white/5 rounded-xl p-4 flex items-center justify-between">
        <div>
            <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">{label}</p>
            <h3 className="text-2xl font-bold text-white">{value}</h3>
            <div className={`flex items-center gap-1 text-xs mt-1 ${trendType === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                {trendType === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{trend}</span>
            </div>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            {icon}
        </div>
    </div>
);

// Reusing Risk Labels logic for consistency
const RISK_LABELS = {
    'Excelente': 'Excelente',
    'Buen Pagador': 'Buen Pagador',
    'Regular': 'Regular',
    'Atraso Frecuente': 'Atraso Frecuente',
    'Mal Pagador': 'Mal Pagador',
    'Legal': 'Legal',
    'Incobrable': 'Incobrable'
};

const Portfolio = () => {
    const navigate = useNavigate();
    const [selectedDebtor, setSelectedDebtor] = useState(null);
    const [debtors, setDebtors] = useState([]);
    const [originalDebtors, setOriginalDebtors] = useState([]); // Store original for filtering
    const [kpis, setKpis] = useState({ total: "$0", critical: "$0", recovered: "$0", effectiveness: "0%" });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [riskFilter, setRiskFilter] = useState(''); // '' means all
    const [showFilters, setShowFilters] = useState(false);
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc' by risk

    // Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingDebtor, setEditingDebtor] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const data = await getDashboardData();

            setDebtors(data.items || []);
            setOriginalDebtors(data.items || []);
            setKpis(data.kpis || { total: "$0", critical: "$0", recovered: "$0", effectiveness: "0%" });

            if (data.items && data.items.length > 0) {
                setSelectedDebtor(data.items[0]);
            }

        } catch (error) {
            console.error("Error fetching portfolio data:", error);
            // Fallback handled by api.js, but if critical error occurs:
            setDebtors([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    useEffect(() => {
        let filtered = [...originalDebtors];

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(d =>
                d.name.toLowerCase().includes(lowerTerm) ||
                d.rut?.toLowerCase().includes(lowerTerm) ||
                d.id.toLowerCase().includes(lowerTerm)
            );
        }

        if (riskFilter) {
            filtered = filtered.filter(d => d.risk === riskFilter);
        }

        // Sorting (Simple Risk sort for now, assuming string comparison serves roughly or maps to value)
        // Risk Levels: 'Excelente', 'Buen Pagador', 'Regular', 'Atraso Frecuente', 'Mal Pagador'
        // We might need a map for true sorting.
        const riskScore = { 'Excelente': 1, 'Buen Pagador': 2, 'Regular': 3, 'Atraso Frecuente': 4, 'Mal Pagador': 5, 'Legal': 6, 'Incobrable': 7 };

        filtered.sort((a, b) => {
            const scoreA = riskScore[a.risk] || 3;
            const scoreB = riskScore[b.risk] || 3;
            return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
        });

        setDebtors(filtered);
    }, [searchTerm, riskFilter, originalDebtors, sortOrder]);


    const getRiskColor = (risk) => {
        // Backend: 'Excelente', 'Buen Pagador', 'Regular', 'Atraso Frecuente', 'Mal Pagador'
        const r = risk?.toLowerCase() || '';
        if (r.includes('mal') || r.includes('atraso') || r.includes('legal') || r.includes('incobrable')) return 'bg-red-500/10 text-red-500 border-red-500/20';
        if (r.includes('regular')) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }

    const getRiskDot = (risk) => {
        const r = risk?.toLowerCase() || '';
        if (r.includes('mal') || r.includes('atraso') || r.includes('legal') || r.includes('incobrable')) return 'bg-red-500';
        if (r.includes('regular')) return 'bg-amber-500';
        return 'bg-emerald-500';
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
    }

    return (
        <div className="flex h-full w-full bg-[#0f1115] text-white overflow-hidden flex-col font-sans">
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0f1115] shrink-0 z-20">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Portal Agente</span>
                    <span>/</span>
                    <span className="font-medium text-white">Gestión de Cartera</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center bg-[#1a1d24] rounded-lg px-3 py-2 gap-2 w-72 border border-white/5 focus-within:border-blue-500/50 transition-colors">
                        <Search className="text-gray-500" size={18} />
                        <input
                            className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-white placeholder:text-gray-600"
                            placeholder="Buscar ID, Nombre, Teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-[#0f1115]"></span>
                    </button>
                    <button
                        onClick={() => navigate('/clients')}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Ir a Clientes"
                    >
                        <Edit2 size={20} />
                    </button>
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white">
                        <div className="size-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold">?</div>
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0f1115] relative">
                    <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard
                                label="Valor en Cartera"
                                value={kpis.total}
                                trend="+2.5%"
                                trendType="up"
                                icon={<DollarSign size={20} />}
                                color="bg-blue-500/10 text-blue-500"
                            />
                            <StatCard
                                label="Recuperado (M)"
                                value={kpis.recovered}
                                trend="+12%"
                                trendType="up"
                                icon={<PiggyBank size={20} />}
                                color="bg-emerald-500/10 text-emerald-500"
                            />
                            <StatCard
                                label="Monto en Riesgo"
                                value={kpis.critical}
                                trend="+5%"
                                trendType="down"
                                icon={<AlertTriangle size={20} />}
                                color="bg-amber-500/10 text-amber-500"
                            />
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex bg-[#1a1d24] rounded-lg p-1 border border-white/5">
                                <button className="px-4 py-1.5 text-xs font-medium rounded bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                                    Lista Prioritaria
                                </button>
                                <button className="px-4 py-1.5 text-xs font-medium rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                                    Nuevas Asignaciones
                                </button>
                                <button className="px-4 py-1.5 text-xs font-medium rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                                    Seguimientos
                                </button>
                            </div>
                            <div className="h-6 w-px bg-white/10 mx-2"></div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-3 py-1.5 border hover:bg-[#252a33] rounded-lg text-xs font-medium transition-colors ${showFilters ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-[#1a1d24] border-white/5 text-gray-300'}`}
                            >
                                <Filter size={14} /> Filtros
                            </button>

                            <button
                                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1d24] hover:bg-[#252a33] border border-white/5 rounded-lg text-xs font-medium text-gray-300 transition-colors"
                            >
                                <TrendingDown size={14} className={sortOrder === 'asc' ? 'rotate-180' : ''} /> Ordenar por Riesgo
                            </button>
                            <button className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-600/20 transition-colors">
                                <Plus size={16} /> Agregar Nota
                            </button>
                        </div>

                        {/* Filter Bar */}
                        {showFilters && (
                            <div className="flex items-center gap-4 p-3 bg-[#1a1d24] rounded-lg border border-white/5 animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 font-medium">Riesgo:</span>
                                    <select
                                        className="bg-[#0f1115] border border-white/10 rounded text-xs text-gray-300 p-1 focus:ring-1 focus:ring-blue-500"
                                        value={riskFilter}
                                        onChange={(e) => setRiskFilter(e.target.value)}
                                    >
                                        <option value="">Todos</option>
                                        <option value="Mal Pagador">Mal Pagador</option>
                                        <option value="Atraso Frecuente">Atraso Frecuente</option>
                                        <option value="Regular">Regular</option>
                                        <option value="Buen Pagador">Buen Pagador</option>
                                        <option value="Excelente">Excelente</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Table */}
                        <div className="bg-[#1a1d24] rounded-xl border border-white/5 overflow-hidden">
                            {loading ? (
                                <div className="p-8 text-center text-gray-500 text-sm">Cargando datos...</div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 border-b border-white/5 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                                        <tr>
                                            <th className="px-5 py-4 w-12 text-center">
                                                <input type="checkbox" className="rounded border-gray-600 bg-transparent checked:bg-blue-500 focus:ring-0 focus:ring-offset-0 size-3.5" />
                                            </th>
                                            <th className="px-5 py-4">Deudor</th>
                                            <th className="px-5 py-4">Deuda Total</th>
                                            <th className="px-5 py-4">Deuda Vencida</th>
                                            <th className="px-5 py-4">Riesgo</th>
                                            <th className="px-5 py-4 text-right">Último Contacto</th>
                                            <th className="px-5 py-4 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {debtors.map((debtor) => (
                                            <tr
                                                key={debtor.id}
                                                onClick={() => setSelectedDebtor(debtor)}
                                                className={`group cursor-pointer transition-colors ${selectedDebtor?.id === debtor.id ? 'bg-blue-500/5' : 'hover:bg-white/5'}`}
                                            >
                                                <td className="px-5 py-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDebtor?.id === debtor.id}
                                                        readOnly
                                                        className="rounded border-gray-600 bg-transparent checked:bg-blue-500 focus:ring-0 focus:ring-offset-0 size-3.5"
                                                    />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-900/20">
                                                            {debtor.name.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{debtor.name}</div>
                                                            <div className="text-[10px] text-gray-500 font-mono">ID: {debtor.rut || debtor.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="font-mono text-sm font-bold text-white">{formatCurrency(debtor.totalDebt)}</div>
                                                    {/* Optional: Add upcoming if needed */}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="font-mono text-sm font-bold text-red-400">{formatCurrency(debtor.overdue)}</div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getRiskColor(debtor.risk)}`}>
                                                        <div className={`size-1.5 rounded-full ${getRiskDot(debtor.risk)}`}></div>
                                                        {debtor.risk}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="text-xs font-medium text-white">{debtor.crm.date}</div>
                                                    <div className="text-[10px] text-gray-500 truncate max-w-[150px] ml-auto">{debtor.crm.lastNote}</div>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingDebtor(debtor);
                                                            setIsEditOpen(true);
                                                        }}
                                                        className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded transition-colors"
                                                        title="Editar detalles"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Debtor Profile (Unchanged Logic, mostly) */}
                {selectedDebtor && (
                    <aside className="w-96 border-l border-white/5 bg-[#14161b] flex flex-col shrink-0 shadow-2xl relative z-30">
                        {/* Sidebar Header */}
                        <div className="p-6 pb-2 relative">
                            <button
                                onClick={() => setSelectedDebtor(null)}
                                className="absolute top-4 right-4 p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"
                            >
                                <X size={18} />
                            </button>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Perfil del Deudor</h3>

                            <div className="flex flex-col items-center">
                                <div className="size-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-blue-900/20 mb-3 ring-4 ring-[#14161b]">
                                    {selectedDebtor.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <h2 className="text-lg font-bold text-white text-center">{selectedDebtor.name}</h2>
                                <p className="text-xs text-gray-500 font-mono mb-4 text-center">ID: {selectedDebtor.rut || selectedDebtor.id}</p>

                                <div className="grid grid-cols-2 gap-3 w-full mb-6">
                                    <button
                                        onClick={() => navigate('/campaigns')}
                                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#1e3a2f] hover:bg-[#254639] border border-[#2d5d4b] text-[#4ade80] transition-all group"
                                    >
                                        <Phone size={20} className="mb-1 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold uppercase">Llamar</span>
                                    </button>
                                    <button
                                        onClick={() => navigate('/campaigns')}
                                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#1e2a3a] hover:bg-[#253346] border border-[#2d405d] text-[#60a5fa] transition-all group"
                                    >
                                        <MessageCircle size={20} className="mb-1 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold uppercase">WhatsApp</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Body - Simplified for now to just show what we have */}
                        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 custom-scrollbar">

                            {/* Payment Probability (Mocked still, as backend doesn't give this yet) */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-medium">Probabilidad de Pago</span>
                                    <span className="text-emerald-400 font-bold">Alta (75%)</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-emerald-500" style={{ width: '75%' }}></div>
                                </div>
                            </div>

                            {/* Details List */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Detalles</h4>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 rounded-lg text-gray-400"><Phone size={14} /></div>
                                    <div className="overflow-hidden">
                                        <div className="text-[10px] text-gray-500 uppercase">Teléfono</div>
                                        <div className="text-sm font-mono text-gray-200 truncate">{selectedDebtor.phone || 'N/A'}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 rounded-lg text-gray-400"><Mail size={14} /></div>
                                    <div className="overflow-hidden">
                                        <div className="text-[10px] text-gray-500 uppercase">Email</div>
                                        <div className="text-sm text-gray-200 truncate">{selectedDebtor.email || 'N/A'}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 rounded-lg text-gray-400"><Calendar size={14} /></div>
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase">Próxima Promesa</div>
                                        <div className="text-sm font-bold text-emerald-400">
                                            {selectedDebtor.promiseDate || 'Sin Promesa'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Footer */}
                        <div className="p-4 border-t border-white/5 bg-[#14161b]">
                            <button className="w-full py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 font-medium text-xs transition-colors">
                                Ver Perfil Completo
                            </button>
                        </div>
                    </aside>
                )}
            </div>

            {/* EDIT MODAL PORTAL */}
            {isEditOpen && editingDebtor && (
                <EditDebtorModal
                    debtor={editingDebtor}
                    onClose={() => setIsEditOpen(false)}
                    onSave={async (updatedData) => {
                        setSaving(true);
                        try {
                            // Use UUID from the form data if available, otherwise try to fetch it
                            let uuidToUpdate = updatedData.uuid;

                            if (!uuidToUpdate) {
                                // Fallback: Find UUID using ID if for some reason it wasn't in the form data
                                const { data: clientRecord } = await supabase
                                    .from('clientes_maestra')
                                    .select('uuid')
                                    .eq('id_cliente', editingDebtor.id)
                                    .single();

                                if (clientRecord) {
                                    uuidToUpdate = clientRecord.uuid;
                                }
                            }

                            if (!uuidToUpdate) {
                                alert("No se pudo encontrar el identificador único (UUID) para actualizar el registro.");
                                setSaving(false);
                                return;
                            }

                            const { error } = await supabase
                                .from('clientes_maestra')
                                .update(updatedData)
                                .eq('uuid', uuidToUpdate);

                            if (error) throw error;

                            // Construct updated list locally to reflect change instantly
                            setDebtors(prev => prev.map(d => d.id === editingDebtor.id ? { ...d, ...updatedData, risk: updatedData.status_riesgo || d.risk } : d));
                            setIsEditOpen(false);
                            alert("Cliente actualizado correctamente");

                        } catch (err) {
                            console.error("Update failed", err);
                            alert("Error al actualizar: " + err.message);
                        } finally {
                            setSaving(false);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default Portfolio;

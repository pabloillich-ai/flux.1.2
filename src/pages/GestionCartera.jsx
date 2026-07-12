import React, { useState, useMemo, useEffect } from 'react';
import {
    Users,
    MessageSquare,
    Phone,
    Mail,
    CheckCircle2,
    Clock,
    Search,
    ArrowUpRight,
    ShieldCheck,
    Zap,
    X,
    Plus,
    ArrowLeft,
    CalendarCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Define API URL from Env or Default
import { API_URL } from '../config';
import { getDashboardData } from '../lib/api';

// --- Componentes Auxiliares ---
const RiskBadge = ({ risk }) => {
    const styles = {
        'Alto': 'bg-red-50 text-red-600 border-red-100',
        'Medio': 'bg-amber-50 text-amber-600 border-amber-100',
        'Bajo': 'bg-emerald-50 text-emerald-600 border-emerald-100'
    };
    // Fallback for unknown risks
    const styleClass = styles[risk] || styles['Medio'];

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${styleClass}`}>
            {risk}
        </span>
    );
};

// --- Componente de Página Principal ---
export default function GestionCartera() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRisk, setFilterRisk] = useState('Todos');

    // Modal Form States
    const [formNote, setFormNote] = useState('');
    const [formDate, setFormDate] = useState('');
    const [formAmount, setFormAmount] = useState('');

    // Fetch Data on Mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Use the shared robust data fetcher
                const data = await getDashboardData();
                console.log("Data Received via getDashboardData:", data);

                if (data && data.items) {
                    const enhancedItems = data.items.map(client => {
                        // Logic for Aging (Oldest Invoice)
                        let oldestDays = 0;
                        if (client.invoices && client.invoices.length > 0) {
                            const today = new Date();
                            client.invoices.forEach(inv => {
                                if (inv.dueDate) {
                                    const due = new Date(inv.dueDate);
                                    const diff = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
                                    if (diff > oldestDays) oldestDays = diff;
                                }
                            });
                        }

                        // Logic for Credit Limit %
                        const debt = client.totalDebt || 0;
                        const limit = client.creditLimit || 1; // Prevent div/0
                        const rawPerc = (debt / limit) * 100;
                        const creditPerc = Math.min(Math.round(rawPerc), 100);

                        // Map Risk
                        const riskMap = {
                            'Crítico': 'Alto', 'Alto': 'Alto', 'Mal Pagador': 'Alto', 'Legal': 'Alto',
                            'Medio': 'Medio', 'Regular': 'Medio', 'Atraso Frecuente': 'Medio',
                            'Bajo': 'Bajo', 'Excelente': 'Bajo', 'Buen Pagador': 'Bajo'
                        };
                        const mappedRisk = riskMap[client.risk] || 'Medio';

                        return {
                            ...client,
                            risk: mappedRisk,
                            originalRisk: client.risk,
                            aging: oldestDays > 0 ? oldestDays : 0,
                            creditUtilization: creditPerc,
                            contact: 'Sin Asignar', // Placeholder
                            role: 'N/A',
                            nif: client.rut, // Visual mapping
                            // Fix Invoice Status
                            invoices: client.invoices.map(inv => ({
                                ...inv,
                                due: inv.dueDate,
                                status: new Date(inv.dueDate) < new Date() ? 'Vencida' : 'Corriente'
                            })),
                            history: client.crmHistory?.map((h, idx) => ({
                                id: idx,
                                type: h.tipo_gestion || 'Nota',
                                date: h.fecha_y_hora ? new Date(h.fecha_y_hora).toLocaleDateString() : '-',
                                note: h.observaciones_mensaje,
                                agent: 'Sistema' // Placeholder
                            })) || []
                        };
                    });
                    setItems(enhancedItems);
                }
            } catch (err) {
                console.error("Fetch Error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const selectedClient = useMemo(() =>
        items.find(c => c.id === selectedClientId),
        [selectedClientId, items]
    );

    const filteredClients = useMemo(() => {
        return items.filter(c => {
            const name = c.name || '';
            const nif = c.nif || '';
            const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || nif.includes(searchTerm);
            const matchesRisk = filterRisk === 'Todos' || c.risk === filterRisk;
            return matchesSearch && matchesRisk;
        });
    }, [searchTerm, filterRisk, items]);

    const openAction = (type) => {
        setActionType(type);
        setIsActionModalOpen(true);
    };

    const handleSaveInteraction = async () => {
        if (!selectedClient) return;

        setLoading(true);
        try {
            const session = await supabase.auth.getSession();
            const token = session?.data?.session?.access_token;

            const payload = {
                id_cliente: selectedClient.id,
                rut_id_cliente: selectedClient.rut,
                fecha_y_hora: new Date().toISOString(),
                tipo_gestion: actionType === 'call' ? 'Llamada' : actionType === 'promise' ? 'Compromiso' : 'Email',
                canal: actionType === 'call' ? 'Telefono' : actionType === 'promise' ? 'Web' : 'Email',
                sentido: 'Saliente',
                resultado_estado: actionType === 'promise' ? 'Promesa de Pago' : 'Gestionado',
                observaciones_mensaje: actionType === 'promise'
                    ? `Promesa de pago por $${formAmount}. Fecha: ${formDate}. ${formNote}`
                    : formNote,
                fecha_promesa_pago: actionType === 'promise' ? formDate : null,
                agente_responsable: 'Agente Web'
            };

            const res = await fetch(`${API_URL}/api/crm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Success: Close and Clean
                setIsActionModalOpen(false);
                setFormNote('');
                setFormDate('');
                setFormAmount('');
                // OPTIONAL: Local update of items or window reload
                window.location.reload();
            } else {
                const errTxt = await res.text();
                console.error("Error saving CRM:", errTxt);
                alert("Error al guardar gestión: " + errTxt);
            }
        } catch (err) {
            console.error("Catch Error saving interaction", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-slate-400 font-medium">Cargando cartera de clientes...</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">

            {/* Header Superior con Búsqueda */}
            <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-black text-slate-800 tracking-tight uppercase">Gestión de Cartera B2B</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar cliente, NIF o factura..."
                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-72 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Cuerpo Maestro-Detalle */}
            <div className="flex-1 flex overflow-hidden">

                {/* COLUMNA IZQUIERDA: Listado de Clientes */}
                <div className={`flex-1 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ${selectedClientId ? 'hidden lg:flex lg:max-w-md' : 'flex'}`}>
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {['Todos', 'Alto', 'Medio', 'Bajo'].map(r => (
                            <button
                                key={r}
                                onClick={() => setFilterRisk(r)}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${filterRisk === r ? 'bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                        {filteredClients.map(client => (
                            <div
                                key={client.id}
                                onClick={() => setSelectedClientId(client.id)}
                                className={`p-5 cursor-pointer transition-all hover:bg-indigo-50/40 relative ${selectedClientId === client.id ? 'bg-indigo-50/60' : ''}`}
                            >
                                {selectedClientId === client.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>
                                )}
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800 text-sm truncate max-w-[180px]">{client.name}</h4>
                                    <RiskBadge risk={client.risk} />
                                </div>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Vencido</p>
                                        <p className="text-xs font-black text-rose-600">${(client.overdue || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Antigüedad</p>
                                        <p className="text-xs font-bold text-slate-600 flex items-center justify-end gap-1">
                                            <Clock size={12} /> {client.aging} días
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredClients.length === 0 && (
                            <div className="p-10 text-center text-slate-400">
                                <Search size={32} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">No hay clientes con estos criterios</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: Detalle y Ejecución */}
                <div className={`flex-[2] flex flex-col bg-slate-50 overflow-hidden ${!selectedClientId ? 'items-center justify-center' : ''}`}>
                    {!selectedClientId ? (
                        <div className="text-center p-12 max-w-sm">
                            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
                                <Users className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Selección de Gestión</h3>
                            <p className="text-sm text-slate-400 mt-2">Selecciona un cliente de la lista para ver su deuda detallada y ejecutar acciones de cobro.</p>
                        </div>
                    ) : (
                        <>
                            {/* Cabecera del Detalle */}
                            <div className="bg-white p-6 border-b border-slate-200 flex flex-wrap gap-6 items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setSelectedClientId(null)}
                                        className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-400"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">{selectedClient.name}</h2>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs font-bold text-slate-400">{selectedClient.nif}</span>
                                            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                            <span className="text-xs font-semibold text-slate-500">{selectedClient.contact}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openAction('call')}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <Phone size={14} className="text-indigo-600" /> Registro Llamada
                                    </button>
                                    <button
                                        onClick={() => openAction('promise')}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 rounded-xl text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                                    >
                                        <CalendarCheck size={14} /> Nuevo Acuerdo
                                    </button>
                                </div>
                            </div>

                            {/* Contenido scrolleable del Detalle */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                                {/* Resumen Financiero Rápido */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deuda Total Cartera</p>
                                        <p className="text-2xl font-black text-slate-800">${(selectedClient.totalDebt || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border-l-4 border-l-rose-500 border border-slate-200 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Vencido</p>
                                        <p className="text-2xl font-black text-rose-600">${(selectedClient.overdue || 0).toLocaleString()}</p>
                                    </div>

                                    {/* Updated Card: Credit Limit Utilization */}
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uso Línea Crédito</p>
                                            <span className="text-[9px] font-bold text-slate-500">Límite: ${(selectedClient.creditLimit || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-700 ${selectedClient.creditUtilization > 90 ? 'bg-rose-500' : selectedClient.creditUtilization > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${selectedClient.creditUtilization}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-black">{selectedClient.creditUtilization}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

                                    {/* Listado de Facturas (3/5) */}
                                    <div className="xl:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                            <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Facturas Pendientes</h4>
                                            <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700">Extracto Completo</button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-white border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                                                    <tr>
                                                        <th className="px-6 py-4 tracking-tighter">Referencia</th>
                                                        <th className="px-6 py-4 tracking-tighter">Vencimiento</th>
                                                        <th className="px-6 py-4 text-right tracking-tighter">Importe</th>
                                                        <th className="px-6 py-4 text-center tracking-tighter">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 text-xs">
                                                    {selectedClient.invoices.map((inv, idx) => (
                                                        <tr key={inv.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-5 font-bold text-slate-800">{inv.docNumber || inv.id}</td>
                                                            <td className="px-6 py-5 text-slate-500 font-medium">{inv.due}</td>
                                                            <td className="px-6 py-5 text-right font-black text-slate-900">${(inv.amount || 0).toLocaleString()}</td>
                                                            <td className="px-6 py-5 text-center">
                                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${inv.status === 'Vencida' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
                                                                    }`}>
                                                                    {inv.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Workflows e Historial (2/5) */}
                                    <div className="xl:col-span-2 space-y-6">

                                        {/* Workflow Sugerido por IA */}
                                        <div className="bg-indigo-900 text-white rounded-3xl p-6 shadow-xl shadow-indigo-100 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                                <Zap size={80} />
                                            </div>
                                            <div className="flex items-center gap-2 mb-4 relative z-10">
                                                <Zap size={18} className="text-amber-400" />
                                                <h4 className="text-[10px] font-black uppercase tracking-widest">Sugerencia Estratégica</h4>
                                            </div>
                                            <p className="text-xs text-indigo-100 mb-6 leading-relaxed relative z-10">
                                                Prioridad de contacto <strong>{selectedClient.risk === 'Alto' ? 'Inmediata' : 'Programada'}</strong>. Ejecuta el workflow automatizado:
                                            </p>
                                            <div className="space-y-3 relative z-10">
                                                <button
                                                    onClick={() => openAction('email')}
                                                    className="w-full flex items-center justify-between p-3.5 bg-white/10 border border-white/10 rounded-2xl hover:bg-white/20 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3 text-xs font-bold">
                                                        <Mail size={16} /> Recordatorio Formal
                                                    </div>
                                                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                                <button className="w-full flex items-center justify-between p-3.5 bg-white/10 border border-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                                                    <div className="flex items-center gap-3 text-xs font-bold">
                                                        <MessageSquare size={16} /> Aviso WhatsApp IA
                                                    </div>
                                                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Timeline de Gestiones */}
                                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Trazabilidad Reciente</h4>
                                            <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
                                                {selectedClient.history.length > 0 ? selectedClient.history.map((log) => (
                                                    <div key={log.id} className="relative pl-8">
                                                        <div className={`absolute left-0 top-1 w-[22px] h-[22px] rounded-full border-4 border-white shadow-sm flex items-center justify-center ${log.type === 'Llamada' ? 'bg-blue-500' : 'bg-slate-400'
                                                            }`}>
                                                            {log.type === 'Llamada' ? <Phone size={8} className="text-white" /> : <Mail size={8} className="text-white" />}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-bold mb-1 uppercase">{log.date} • {log.agent}</div>
                                                        <p className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 font-medium">
                                                            {log.note}
                                                        </p>
                                                    </div>
                                                )) : (
                                                    <div className="py-4 text-center">
                                                        <p className="text-xs text-slate-400 font-medium italic">Sin gestiones previas registradas</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modal de Acción (Reutilizable para Llamada/Acuerdo/Email) */}
            {
                isActionModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setIsActionModalOpen(false)}></div>
                        <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600">
                                        {actionType === 'call' && <Phone size={20} />}
                                        {actionType === 'promise' && <CalendarCheck size={20} />}
                                        {actionType === 'email' && <Mail size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 tracking-tight uppercase text-xs">
                                            {actionType === 'call' && 'Registro de Gestión Telefónica'}
                                            {actionType === 'promise' && 'Formalizar Acuerdo de Pago'}
                                            {actionType === 'email' && 'Envío de Comunicación Formal'}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 font-bold">{selectedClient.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsActionModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                {actionType === 'promise' ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Estimada</label>
                                                <input
                                                    type="date"
                                                    value={formDate}
                                                    onChange={(e) => setFormDate(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Importe Comprometido</label>
                                                <input
                                                    type="number"
                                                    placeholder="0.00 $"
                                                    value={formAmount}
                                                    onChange={(e) => setFormAmount(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modalidad de Pago</label>
                                            <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm outline-none font-medium">
                                                <option>Transferencia Bancaria</option>
                                                <option>Pago con Tarjeta</option>
                                                <option>Giro / Confirming</option>
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumen Cualitativo</label>
                                        <textarea
                                            rows="4"
                                            placeholder="Detalla los puntos clave de la negociación..."
                                            value={formNote}
                                            onChange={(e) => setFormNote(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium"
                                        ></textarea>
                                    </div>
                                )}

                                <div className="pt-4 flex gap-3">
                                    <button
                                        onClick={() => setIsActionModalOpen(false)}
                                        className="flex-1 py-4 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveInteraction}
                                        disabled={loading}
                                        className="flex-[2] py-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? 'Guardando...' : (
                                            <>Finalizar Gestión <ArrowUpRight size={14} /></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Acción Global */}
            <button className="fixed bottom-8 right-8 w-14 h-14 bg-slate-900 text-white rounded-[20px] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group z-40">
                <Plus size={24} className="group-hover:rotate-90 transition-transform" />
            </button>

        </div >
    );
}

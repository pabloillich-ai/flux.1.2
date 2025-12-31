import React, { useState, useMemo, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    DollarSign,
    MoreHorizontal,
    Phone,
    Mail,
    Search,
    Calendar,
    Users,
    TrendingUp,
    AlertOctagon,

    ArrowRight
} from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import MicroCalendar from '../components/MicroCalendar';

// Define API URL from Env or Default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// === CONFIG ===
const COLUMNS = {
    'Pendiente': { id: 'Pendiente', title: 'Pendiente', color: 'bg-slate-500', icon: Clock },
    'En Gestión': { id: 'En Gestión', title: 'En Gestión', color: 'bg-blue-500', icon: Phone },
    'Promesa de Pago': { id: 'Promesa de Pago', title: 'Promesa', color: 'bg-purple-500', icon: Calendar },
    'Pago': { id: 'Pago', title: 'Pago', color: 'bg-green-500', icon: CheckCircle2 },
    'Escalado': { id: 'Escalado', title: 'Escalado', color: 'bg-red-600', icon: AlertOctagon }
};

const RISK_STYLES = {
    'Excelente': { color: 'green', border: 'border-l-green-500', bg: 'bg-green-500/10', text: 'text-green-400' },
    'Buen Pagador': { color: 'blue', border: 'border-l-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400' },
    'Regular': { color: 'yellow', border: 'border-l-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    'Atraso Frecuente': { color: 'orange', border: 'border-l-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400' },
    'Mal Pagador': { color: 'red', border: 'border-l-red-500', bg: 'bg-red-500/10', text: 'text-red-400' },
    'Legal': { color: 'red', border: 'border-l-red-700', bg: 'bg-red-900/10', text: 'text-red-600' },
    'Incobrable': { color: 'slate', border: 'border-l-slate-600', bg: 'bg-slate-800', text: 'text-slate-400' }
};

const USD_RATE_DEFAULT = 42;

// === HELPERS ===
const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(amount);
};

const getDaysOverdue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0); // normalize
    const diffTime = today - due;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Returns { overdue: number, upcoming: number }
const calculateDebtSplit = (invoices, rate) => {
    let overdue = 0;
    let upcoming = 0;

    invoices.forEach(inv => {
        const amount = inv.currency === 'USD' ? inv.amount * rate : inv.amount;
        // Logic: Overdue if daysOverdue > 0
        const days = getDaysOverdue(inv.dueDate);
        if (days > 0) {
            overdue += amount;
        } else {
            upcoming += amount;
        }
    });

    return { overdue, upcoming };
};


// === COMPONENTS ===

// -- KPI CARD --
function KPICard({ title, value, subtext, icon: Icon, colorClass }) {
    return (
        <div className="bg-card border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-white/5 transition-all">
            <div className={clsx("p-3 rounded-lg bg-background/50", colorClass)}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-text-muted text-xs uppercase font-bold tracking-wider">{title}</p>
                <h3 className="text-xl font-bold text-white">{value}</h3>
                {subtext && <p className="text-xs text-text-muted mt-0.5">{subtext}</p>}
            </div>
        </div>
    );
}

// -- SMART CARD --
function SmartCard({ client, isOverlay, onClick, exchangeRate }) {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: client.id,
        data: { type: 'Card', client },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // Use Server Values
    const { overdue, upcoming } = client;
    const totalDebt = overdue + upcoming;
    const riskStyle = RISK_STYLES[client.risk] || RISK_STYLES['Regular'];

    // Determine priority visual
    const isCritical = overdue > 0 && ['Mal Pagador', 'Legal', 'Atraso Frecuente'].includes(client.risk);

    if (isDragging) {
        return <div ref={setNodeRef} style={style} className="bg-card w-full h-[160px] rounded-xl opacity-30 border-2 border-dashed border-accent"></div>;
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={clsx(
                "bg-card rounded-r-xl rounded-l-sm shadow-sm hover:shadow-lg transition-all relative group overflow-hidden border-t border-b border-r border-white/5 cursor-pointer hover:bg-[#1e1e2e]",
                riskStyle.border,
                "border-l-[4px]", // The semaphore line
                isOverlay && "cursor-grabbing scale-105 shadow-2xl z-50 ring-2 ring-accent"
            )}
        >
            <div className="p-3">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white text-sm truncate pr-2 group-hover:text-accent transition-colors">
                        {client.name}
                    </h4>
                    <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider", riskStyle.bg, riskStyle.text)}>
                        {client.risk}
                    </span>
                </div>

                {/* Agent & Last Action */}
                <div className="flex justify-between items-center text-[10px] text-text-muted mb-3">
                    <span className="flex items-center gap-1"><Users size={10} /> {client.agentName}</span>
                    <span className="italic">{client.crm.date !== '-' ? client.crm.date : ''}</span>
                </div>

                {/* DICOTOMÍA DE DEUDA (UX CRUX) */}
                <div className="grid grid-cols-2 gap-2 bg-background/30 rounded-lg p-2 border border-white/5">
                    <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-red-400 flex items-center gap-1">
                            {overdue > 0 && <AlertTriangle size={8} />} Vencido
                        </span>
                        <span className={clsx("font-mono font-bold text-sm", overdue > 0 ? "text-red-400" : "text-text-muted")}>
                            {formatMoney(overdue)}
                        </span>
                    </div>
                    <div className="flex flex-col text-right border-l border-white/5 pl-2">
                        <span className="text-[9px] uppercase font-bold text-blue-400">Por Vencer</span>
                        <span className="font-mono font-bold text-sm text-blue-300">
                            {formatMoney(upcoming)}
                        </span>
                    </div>
                </div>

                {/* Compact Footer */}
                <div className="mt-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:bg-white/10 rounded text-text-muted hover:text-white" title="Llamar">
                        <Phone size={12} />
                    </button>
                    <button className="p-1 hover:bg-white/10 rounded text-text-muted hover:text-white" title="Mensaje">
                        <Mail size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// -- IMMERSIVE DETAIL MODAL --
function ImmersiveModal({ isOpen, onClose, client, exchangeRate, onClientUpdate }) {
    const [isAdding, setIsAdding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        tipo: 'Gestion',
        canal: 'Telefono',
        sentido: 'Saliente',
        resultado: 'Contactado',
        mensaje: '',
        promesa: ''
    });

    if (!isOpen || !client) return null;

    const { overdue, upcoming } = client;
    const riskStyle = RISK_STYLES[client.risk] || RISK_STYLES['Regular'];

    const handleSaveCRM = async () => {
        if (!formData.mensaje.trim()) return alert('Ingrese un mensaje u observación.');
        setSaving(true);

        try {
            const newEntry = {
                tenant: '1',
                id_cliente: client.id,
                fecha_y_hora: new Date().toISOString(),
                tipo_gestion: formData.tipo,
                canal: formData.canal,
                sentido: formData.sentido,
                resultado_estado: formData.resultado,
                observaciones_mensaje: formData.mensaje,
                fecha_promesa_pago: formData.promesa || null,
                agente_responsable: 'Sistema', // In a real app, use auth user
                rut_id_cliente: client.rut
            };

            const session = await supabase.auth.getSession();
            const token = session?.data?.session?.access_token;

            const res = await fetch(`${API_URL}/api/crm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(newEntry)
            });

            if (!res.ok) throw new Error('Failed to save CRM');
            const { data } = await res.json();

            // Optimistic Update
            if (onClientUpdate) {
                // Ensure we respect the descending sort
                const newHistory = [data, ...(client.crmHistory || [])];
                onClientUpdate(client.id, { crmHistory: newHistory });
            }

            setIsAdding(false);
            setFormData(prev => ({ ...prev, mensaje: '', promesa: '' }));
        } catch (error) {
            console.error('Save failed', error);
            alert('Error al guardar la gestión (Backend).');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl border border-white/10 flex overflow-hidden">

                {/* LEFT SIDE: FINANCIALS & INVOICES */}
                <div className="w-1/2 border-r border-white/10 bg-sidebar/50 flex flex-col">
                    {/* Header */}
                    <div className={clsx("p-6 border-b border-white/10", riskStyle.bg)}>
                        <h2 className="text-2xl font-bold text-white mb-1">{client.name}</h2>
                        <div className="flex items-center gap-3 text-sm">
                            <span className={clsx("font-bold", riskStyle.text)}>{client.risk}</span>
                            <span className="text-white/40">|</span>
                            <span className="text-white/70">RUT: {client.rut}</span>
                            <span className="text-white/40">|</span>
                            <span className="text-white/70 flex items-center gap-1"><Users size={14} /> {client.agentName}</span>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4 p-6 border-b border-white/10 bg-background/20">
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                            <h4 className="text-red-400 text-xs font-bold uppercase mb-1">Deuda Vencida (Exigible)</h4>
                            <p className="text-2xl font-mono font-bold text-white">{formatMoney(overdue)}</p>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                            <h4 className="text-blue-400 text-xs font-bold uppercase mb-1">Por Vencer</h4>
                            <p className="text-2xl font-mono font-bold text-white">{formatMoney(upcoming)}</p>
                        </div>
                    </div>

                    {/* Invoice List */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-text-muted uppercase bg-white/5 sticky top-0 backdrop-blur">
                                <tr>
                                    <th className="p-3">Doc ID</th>
                                    <th className="p-3">Emisión</th>
                                    <th className="p-3">Vencimiento</th>
                                    <th className="p-3">Días Mora</th>
                                    <th className="p-3 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {client.invoices.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).map(inv => {
                                    const days = getDaysOverdue(inv.dueDate);
                                    const isOverdue = days > 0;
                                    return (
                                        <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-3 font-mono text-white/70">{inv.id}</td>
                                            <td className="p-3 text-white/50">{new Date(inv.issueDate).toLocaleDateString()}</td>
                                            <td className={clsx("p-3 font-medium", isOverdue ? "text-red-400" : "text-blue-300")}>
                                                {new Date(inv.dueDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-3">
                                                {isOverdue ?
                                                    <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded textxs font-bold">+{days}d</span>
                                                    : <span className="text-white/30 text-xs">-</span>
                                                }
                                            </td>
                                            <td className="p-3 text-right font-mono font-bold text-white">
                                                {inv.currency} {inv.amount.toLocaleString('es-UY')}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIGHT SIDE: ACTIONS & CRM */}
                <div className="w-1/2 flex flex-col bg-background">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h3 className="font-bold text-white flex items-center gap-2"><Clock size={18} className="text-accent" /> Historial de Gestión</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsAdding(!isAdding)}
                                className={clsx(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    isAdding ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-accent/20 text-accent hover:bg-accent/30"
                                )}
                            >
                                {isAdding ? 'Cancelar' : '+ Nueva Gestión'}
                            </button>
                            <button onClick={onClose} className="text-text-muted hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                                Cerrar [ESC]
                            </button>
                        </div>
                    </div>

                    {/* NEW ENTRY FORM */}
                    {isAdding && (
                        <div className="p-4 bg-accent/5 border-b border-accent/20 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="text-[10px] text-text-muted uppercase font-bold block mb-1">Tipo</label>
                                    <select
                                        value={formData.tipo}
                                        onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                        className="w-full bg-background border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-accent outline-none"
                                    >
                                        <option>Gestion</option>
                                        <option>Recordatorio</option>
                                        <option>Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-text-muted uppercase font-bold block mb-1">Canal</label>
                                    <select
                                        value={formData.canal}
                                        onChange={e => setFormData({ ...formData, canal: e.target.value })}
                                        className="w-full bg-background border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-accent outline-none"
                                    >
                                        <option>Telefono</option>
                                        <option>WhatsApp</option>
                                        <option>Email</option>
                                        <option>SMS</option>
                                        <option>Reunión</option>
                                        <option>Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-text-muted uppercase font-bold block mb-1">Sentido</label>
                                    <select
                                        value={formData.sentido}
                                        onChange={e => setFormData({ ...formData, sentido: e.target.value })}
                                        className="w-full bg-background border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-accent outline-none"
                                    >
                                        <option>Saliente</option>
                                        <option>Entrante</option>
                                        <option>Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-text-muted uppercase font-bold block mb-1">Resultado</label>
                                    <select
                                        value={formData.resultado}
                                        onChange={e => setFormData({ ...formData, resultado: e.target.value })}
                                        className="w-full bg-background border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-accent outline-none"
                                    >
                                        <option>Contactado</option>
                                        <option>No Contesta</option>
                                        <option>Buzon de Voz</option>
                                        <option>Numero Equivocado</option>
                                        <option>Promesa de Pago</option>
                                        <option>Otro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="text-[10px] text-text-muted uppercase font-bold block mb-1">Observaciones / Mensaje</label>
                                <textarea
                                    value={formData.mensaje}
                                    onChange={e => setFormData({ ...formData, mensaje: e.target.value })}
                                    placeholder="Describe el detalle de la gestión..."
                                    className="w-full bg-background border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-accent outline-none min-h-[80px]"
                                />
                            </div>



                            <div className="flex items-end gap-3">
                                <div className="flex-1 relative">
                                    <label className="text-[10px] text-text-muted uppercase font-bold block mb-1">Fecha Promesa</label>
                                    {/* MICROCALENDAR INTEGRATION */}
                                    <div className="relative group">
                                        <button
                                            onClick={() => { }} // Optional: toggle calendar visibility if you want popover
                                            className="w-full bg-background border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-accent outline-none text-left flex items-center gap-2"
                                        >
                                            <Calendar size={14} className="opacity-50" />
                                            {formData.promesa ? new Date(formData.promesa).toLocaleDateString() : 'Seleccionar Fecha'}
                                        </button>

                                        {/* Hover/Focus to show calendar - For now, let's just show it or make it toggleable. 
                                            User asked for "microcalendar", assuming they want the component visible or easily accessible. 
                                            Let's use a simple toggle state or keep it inline? 
                                            Since it has a popover mode, let's wrap it properly.
                                        */}
                                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
                                            {/* We can use the component logic here. But let's simplify usage for now. */}
                                            <MicroCalendar
                                                inline={true} // Using inline for stability inside this form, or remove inline for popover
                                                onDateSelect={(val) => setFormData({ ...formData, promesa: val.date })}
                                            />
                                        </div>
                                        {/* Fallback manual input just in case */}
                                        <input
                                            type="date"
                                            value={formData.promesa}
                                            onChange={e => setFormData({ ...formData, promesa: e.target.value })}
                                            className="absolute inset-0 opacity-0 cursor-pointer" // Hidden native picker as backup trigger? No, might conflict.
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveCRM}
                                    disabled={saving}
                                    className="px-6 py-2 bg-accent text-sidebar font-bold rounded hover:bg-accent/90 transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Guardando...' : 'Guardar Gestión'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {client.crmHistory.length === 0 && <p className="text-center text-text-muted opacity-50 py-10">Sin gestiones registradas.</p>}
                        {client.crmHistory.map((crm, idx) => (
                            <div key={idx} className="relative pl-6 border-l border-white/10 last:border-0 hover:border-white/20 transition-colors">
                                <span className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-accent border-2 border-background"></span>
                                <div className="mb-2 flex justify-between items-center">
                                    <span className="text-xs font-bold text-accent uppercase flex items-center gap-2">
                                        {new Date(crm.fecha_y_hora).toLocaleDateString()}
                                        <span className="opacity-70 text-[10px]">{new Date(crm.fecha_y_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </span>
                                    <div className="flex gap-1">
                                        {crm.tenant && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-mono">T: {crm.tenant}</span>}
                                        <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                                            crm.resultado_estado === 'Completado' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/70'
                                        )}>
                                            {crm.resultado_estado || 'Sin Resultado'}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-card p-3 rounded-lg border border-white/5 space-y-3 shadow-sm hover:border-white/10 transition-colors">

                                    {/* Classification Tags */}
                                    <div className="flex flex-wrap gap-2 text-[10px] uppercase font-bold tracking-wider">
                                        <span className="text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">
                                            {crm.tipo_gestion || 'Gestión'}
                                        </span>
                                        <span className="text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20">
                                            {crm.canal || 'N/A'}
                                        </span>
                                        <span className="text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded border border-orange-400/20">
                                            {crm.sentido || 'N/A'}
                                        </span>
                                        {crm.documento && (
                                            <span className="text-white/60 bg-white/5 px-2 py-0.5 rounded border border-white/10 ml-auto font-mono normal-case">
                                                Doc: {crm.documento}
                                            </span>
                                        )}
                                    </div>

                                    {/* Message / Observations */}
                                    {crm.observaciones_mensaje && (
                                        <div className="bg-black/20 p-2.5 rounded border border-white/5">
                                            <p className="text-sm text-white/90 leading-relaxed italic">"{crm.observaciones_mensaje}"</p>
                                        </div>
                                    )}

                                    {/* Footer Details */}
                                    <div className="flex justify-between items-center pt-1 text-xs text-text-muted border-t border-white/5 mt-1">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1.5 text-white/60">
                                                <Users size={12} /> {crm.agente_responsable || 'Sistema'}
                                            </span>
                                            {crm.rut_id_cliente && <span className="text-white/30 hidden sm:inline">| ID: {crm.rut_id_cliente}</span>}
                                        </div>

                                        {crm.fecha_promesa_pago && (
                                            <span className="flex items-center gap-1.5 text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                                                <Calendar size={12} /> Promesa: {new Date(crm.fecha_promesa_pago).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions Footer */}
                    <div className="p-6 border-t border-white/10 bg-sidebar/50">
                        <h4 className="text-xs font-bold text-text-muted uppercase mb-3">Acciones Rápidas</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 py-3 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30 transition-all font-bold">
                                <Phone size={18} /> Registrar Llamada
                            </button>
                            <button className="flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30 transition-all font-bold">
                                <Calendar size={18} /> Agendar Promesa
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div >
    );
}

// === MAIN PAGE ===
export default function TableroGestion() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Added error state
    const [exchangeRate, setExchangeRate] = useState(USD_RATE_DEFAULT);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [activeId, setActiveId] = useState(null);

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    // Fetch Rate & Data on Mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch from Backend API
                const session = await supabase.auth.getSession();
                const token = session?.data?.session?.access_token;

                const res = await fetch(`${API_URL}/dashboard`, {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : ''
                    }
                });
                if (!res.ok) throw new Error('Failed to fetch dashboard data');

                const data = await res.json();

                if (data) {
                    setItems(data.items || []);
                    setExchangeRate(data.exchange_rate || USD_RATE_DEFAULT);
                    // KPIs are now calculated in backend, but frontend also calculates them?
                    // The frontend kpis memo below uses 'items' and recalculates.
                    // We can overlook 'data.kpis' from backend for now to verify logic consistency,
                    // or just let frontend recalc for immediate responsiveness.
                }
            } catch (err) {
                console.error("API Error", err);
                setError(err.message || "Error desconocido");
                setItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // KPIs Calculation
    const kpis = useMemo(() => {
        let totalDebt = 0;
        let criticalDebt = 0;
        let managedCount = 0;

        items.forEach(c => {
            const { overdue, upcoming } = c;
            const dept = overdue + upcoming;
            totalDebt += dept;
            criticalDebt += overdue;
            if (c.status !== 'Pendiente') managedCount++;
        });

        const effectiveness = items.length > 0 ? Math.round((managedCount / items.length) * 100) : 0;

        return {
            total: formatMoney(totalDebt),
            critical: formatMoney(criticalDebt),
            effectiveness: effectiveness + '%'
        };
    }, [items]);

    // Drag Logic
    const handleDragStart = (e) => setActiveId(e.active.id);

    const handleDragEnd = (e) => {
        const { active, over } = e;
        setActiveId(null);
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        let newStatus = overId;
        if (!COLUMNS[overId]) {
            // Dropped on card
            const overItem = items.find(i => i.id === overId);
            if (overItem) newStatus = overItem.status;
        }

        const currentItem = items.find(i => i.id === activeId);
        if (currentItem && currentItem.status !== newStatus && COLUMNS[newStatus]) {
            // Update Local
            setItems(items.map(i => i.id === activeId ? { ...i, status: newStatus } : i));
            // Update Backend
            supabase.auth.getSession().then(({ data: { session } }) => {
                const token = session?.access_token;
                fetch(`${API_URL}/api/clients/${activeId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: JSON.stringify({ status: newStatus })
                }).catch(err => console.error("Update failed", err));
            });
        }
    };

    // CRM Update Handler
    const handleClientUpdate = (clientId, updates) => {
        setItems(prev => prev.map(item =>
            item.id === clientId ? { ...item, ...updates } : item
        ));

        // Also sync the selected client to show changes immediately in modal
        if (selectedClient && selectedClient.id === clientId) {
            setSelectedClient(prev => ({ ...prev, ...updates }));
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 overflow-hidden">
            {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-100 p-4 rounded-lg animate-pulse">
                    <strong>Error de Carga:</strong> {error}
                </div>
            )}

            {/* TOP BAR / KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <KPICard title="Cartera Total" value={kpis.total} subtext="Deuda Activa Global" icon={DollarSign} colorClass="text-blue-400 bg-blue-400/10" />
                <KPICard title="Vencido Crítico" value={kpis.critical} subtext="Exigible Hoy" icon={AlertTriangle} colorClass="text-red-500 bg-red-500/10" />
                <KPICard title="Ctd. Gestión" value={kpis.effectiveness} subtext="Clientes Contactados" icon={TrendingUp} colorClass="text-green-500 bg-green-500/10" />
            </div>

            {/* KANBAN BOARD */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="flex h-full gap-4 pb-4 min-w-[1000px]">
                        {Object.entries(COLUMNS).map(([colId, def]) => {
                            // Calculate Column Total
                            const colItems = items.filter(i => i.status === colId);
                            const colTotal = colItems.reduce((acc, client) => {
                                const { overdue, upcoming } = client;
                                return acc + overdue + upcoming;
                            }, 0);

                            return (
                                <div key={colId} className="flex-1 flex flex-col bg-sidebar/50 rounded-xl border border-white/5 min-w-[280px] max-w-[350px]">
                                    {/* Column Header */}
                                    <div className={clsx("p-3 border-b border-white/5 bg-card/50 rounded-t-xl", def.color.replace('bg-', 'border-l-4 border-'))}>
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                                <def.icon size={16} className="opacity-70" /> {def.title}
                                            </h3>
                                            <span className="bg-white/10 text-xs font-bold px-2 py-0.5 rounded-full text-text-muted">
                                                {colItems.length}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-mono font-bold text-white text-sm">{formatMoney(colTotal)}</span>
                                        </div>
                                    </div>

                                    {/* Drop Zone */}
                                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                        <SortableContext items={items.filter(i => i.status === colId).map(i => i.id)} strategy={verticalListSortingStrategy}>
                                            {items.filter(i => i.status === colId).map(client => (
                                                <SmartCard
                                                    key={client.id}
                                                    client={client}
                                                    exchangeRate={exchangeRate}
                                                    onClick={() => { setSelectedClient(client); setIsDetailOpen(true); }}
                                                />
                                            ))}
                                        </SortableContext>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <DragOverlay>
                        {activeId ? <SmartCard client={items.find(i => i.id === activeId)} isOverlay exchangeRate={exchangeRate} /> : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <ImmersiveModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                client={selectedClient}
                exchangeRate={exchangeRate}
                onClientUpdate={handleClientUpdate}
            />
        </div>
    );
}

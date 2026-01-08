import React, { useState } from 'react';
import {
    Clock,
    Users,
    Calendar,
    Phone,
    X
} from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import MicroCalendar from './MicroCalendar';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const RISK_STYLES = {
    'Excelente': { color: 'green', border: 'border-l-green-500', bg: 'bg-green-500/10', text: 'text-green-400' },
    'Buen Pagador': { color: 'blue', border: 'border-l-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400' },
    'Regular': { color: 'yellow', border: 'border-l-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    'Atraso Frecuente': { color: 'orange', border: 'border-l-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400' },
    'Mal Pagador': { color: 'red', border: 'border-l-red-500', bg: 'bg-red-500/10', text: 'text-red-400' },
    'Legal': { color: 'red', border: 'border-l-red-700', bg: 'bg-red-900/10', text: 'text-red-600' },
    'Incobrable': { color: 'slate', border: 'border-l-slate-600', bg: 'bg-slate-800', text: 'text-slate-400' }
};

const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(amount);
};

const getDaysOverdue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = today - due;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function ImmersiveModal({ isOpen, onClose, client, onClientUpdate }) {
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
                // tenant is handled by backend based on token usually, or passed explicitly if needed.
                // The current backend implementation extracts tenant from header.
                // client.id is used directly.
                id_cliente: client.id,
                fecha_y_hora: new Date().toISOString(),
                tipo_gestion: formData.tipo,
                canal: formData.canal,
                sentido: formData.sentido,
                resultado_estado: formData.resultado,
                observaciones_mensaje: formData.mensaje,
                fecha_promesa_pago: formData.promesa || null,
                agente_responsable: 'Sistema',
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
                const newHistory = [data, ...(client.crmHistory || [])];
                onClientUpdate(client.id, { crmHistory: newHistory });
            }

            setIsAdding(false);
            setFormData(prev => ({ ...prev, mensaje: '', promesa: '' }));
        } catch (error) {
            console.error('Save failed', error);
            alert('Error al guardar la gestión.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
            <div className="bg-[#1a1d24] w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl border border-white/10 flex overflow-hidden font-sans text-white">

                {/* LEFT SIDE: FINANCIALS & INVOICES */}
                <div className="w-1/2 border-r border-white/10 bg-[#0f1115]/50 flex flex-col">
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
                    <div className="grid grid-cols-2 gap-4 p-6 border-b border-white/10 bg-[#0f1115]/20">
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                            <h4 className="text-red-400 text-xs font-bold uppercase mb-1">Deuda Vencida (Exigible)</h4>
                            <p className="text-2xl font-mono font-bold text-white">{formatMoney(overdue || 0)}</p>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                            <h4 className="text-blue-400 text-xs font-bold uppercase mb-1">Por Vencer</h4>
                            <p className="text-2xl font-mono font-bold text-white">{formatMoney(upcoming || 0)}</p>
                        </div>
                    </div>

                    {/* Invoice List */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-white/5 sticky top-0 backdrop-blur">
                                <tr>
                                    <th className="p-3">Doc ID</th>
                                    <th className="p-3">Emisión</th>
                                    <th className="p-3">Vencimiento</th>
                                    <th className="p-3">Días Mora</th>
                                    <th className="p-3 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {(client.invoices || []).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).map(inv => {
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
                                                    <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[10px] font-bold">+{days}d</span>
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
                <div className="w-1/2 flex flex-col bg-[#1a1d24]">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h3 className="font-bold text-white flex items-center gap-2"><Clock size={18} className="text-blue-500" /> Historial de Gestión</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsAdding(!isAdding)}
                                className={clsx(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    isAdding ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"
                                )}
                            >
                                {isAdding ? 'Cancelar' : '+ Nueva Gestión'}
                            </button>
                            <button onClick={onClose} className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* NEW ENTRY FORM */}
                    {isAdding && (
                        <div className="p-4 bg-blue-600/5 border-b border-blue-600/20 animate-in slide-in-from-top-2">
                            {/* Form logic same as original but styled for dark theme */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Tipo</label>
                                    <select
                                        value={formData.tipo}
                                        onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                        className="w-full bg-[#0f1115] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                                    >
                                        <option>Gestion</option>
                                        <option>Recordatorio</option>
                                        <option>Otro</option>
                                    </select>
                                </div>
                                {/* ... other fields ... truncated for brevity but full logic follows */}
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Canal</label>
                                    <select
                                        value={formData.canal}
                                        onChange={e => setFormData({ ...formData, canal: e.target.value })}
                                        className="w-full bg-[#0f1115] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
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
                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Sentido</label>
                                    <select
                                        value={formData.sentido}
                                        onChange={e => setFormData({ ...formData, sentido: e.target.value })}
                                        className="w-full bg-[#0f1115] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                                    >
                                        <option>Saliente</option>
                                        <option>Entrante</option>
                                        <option>Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Resultado</label>
                                    <select
                                        value={formData.resultado}
                                        onChange={e => setFormData({ ...formData, resultado: e.target.value })}
                                        className="w-full bg-[#0f1115] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
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
                                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Observaciones / Mensaje</label>
                                <textarea
                                    value={formData.mensaje}
                                    onChange={e => setFormData({ ...formData, mensaje: e.target.value })}
                                    placeholder="Describe el detalle de la gestión..."
                                    className="w-full bg-[#0f1115] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none min-h-[80px]"
                                />
                            </div>

                            <div className="flex items-end gap-3">
                                <div className="flex-1 relative">
                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Fecha Promesa</label>
                                    <div className="relative group z-50">
                                        <MicroCalendar
                                            inline={true}
                                            onDateSelect={(val) => setFormData({ ...formData, promesa: val.date })}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveCRM}
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-500 transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Guardando...' : 'Guardar Gestión'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {(client.crmHistory || []).length === 0 && <p className="text-center text-gray-500 opacity-50 py-10">Sin gestiones registradas.</p>}
                        {(client.crmHistory || []).map((crm, idx) => (
                            <div key={idx} className="relative pl-6 border-l border-white/10 last:border-0 hover:border-white/20 transition-colors">
                                <span className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-blue-600 border-2 border-[#1a1d24]"></span>
                                <div className="mb-2 flex justify-between items-center">
                                    <span className="text-xs font-bold text-blue-400 uppercase flex items-center gap-2">
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

                                <div className="bg-[#0f1115] p-3 rounded-lg border border-white/5 space-y-3 shadow-sm hover:border-white/10 transition-colors">
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

                                    {crm.observaciones_mensaje && (
                                        <div className="bg-black/20 p-2.5 rounded border border-white/5">
                                            <p className="text-sm text-white/90 leading-relaxed italic">"{crm.observaciones_mensaje}"</p>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-1 text-xs text-gray-500 border-t border-white/5 mt-1">
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

                    <div className="p-6 border-t border-white/10 bg-[#0f1115]/50">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Acciones Rápidas</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 py-3 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30 transition-all font-bold text-xs uppercase cursor-pointer">
                                <Phone size={18} /> Registrar Llamada
                            </button>
                            <button className="flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30 transition-all font-bold text-xs uppercase cursor-pointer">
                                <Calendar size={18} /> Agendar Promesa
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

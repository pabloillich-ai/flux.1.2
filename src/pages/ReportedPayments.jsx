import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit2, Download, CheckCircle, Clock, XCircle, FileText, ExternalLink, Save, X } from 'lucide-react';
import clsx from 'clsx';
import { API_URL } from '../config';

const STATUS_OPTIONS = [
    { label: 'Pendiente de Validación', value: 'Pendiente de Validación', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
    { label: 'Validado', value: 'Validado', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
    { label: 'Rechazado', value: 'Rechazado', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle }
];

export default function ReportedPayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/payments/reported`, {
                headers: {
                    'X-Tenant-ID': 'a942b959-92f8-4ed1-8397-80ff430d8f1d' // Hardcoded for now as per other components
                }
            });
            if (!res.ok) throw new Error('Error al obtener pagos');
            const data = await res.json();
            setPayments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePayment = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/payments/reported/${editingPayment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-ID': 'a942b959-92f8-4ed1-8397-80ff430d8f1d'
                },
                body: JSON.stringify({
                    monto_transaccion: editingPayment.monto_transaccion,
                    estado: editingPayment.estado,
                    observacion: editingPayment.observacion,
                    fecha_pago: editingPayment.fecha_pago
                })
            });

            if (!res.ok) throw new Error('Error al actualizar pago');

            setIsEditOpen(false);
            fetchPayments();
            alert('Pago actualizado correctamente');
        } catch (err) {
            console.error(err);
            alert('Error al guardar cambios');
        } finally {
            setSaving(false);
        }
    };

    const filteredPayments = payments.filter(p => {
        const clientName = p.clientes_maestra?.razon_social?.toLowerCase() || '';
        const clientRut = p.clientes_maestra?.rut_ci?.toLowerCase() || '';
        const matchesSearch = clientName.includes(searchTerm.toLowerCase()) || clientRut.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.estado === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusConfig = (status) => {
        return STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
    };

    return (
        <div className="flex flex-col h-full bg-background p-6 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-main flex items-center gap-2">
                        <FileText className="text-accent" /> Pagos Reportados
                    </h1>
                    <p className="text-text-muted text-sm">Control y validación de pagos informados por clientes.</p>
                </div>

                <div className="flex flex-wrap gap-2 items-center bg-card p-2 rounded-xl border border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente o RUT..."
                            className="pl-9 pr-4 py-2 bg-sidebar border border-card rounded-lg text-sm focus:outline-none focus:border-accent w-64 text-text-main"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="bg-sidebar border border-card rounded-lg px-3 py-2 text-sm text-text-muted focus:outline-none focus:border-accent"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Estado: Todos</option>
                        {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    <button
                        onClick={fetchPayments}
                        className="p-2 bg-sidebar border border-card rounded-lg text-text-muted hover:text-white transition-colors"
                    >
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 bg-card rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-xl">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-background/80 text-text-muted font-bold text-xs uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                            <tr>
                                <th className="p-4 border-b border-white/5 bg-background/80">Fecha</th>
                                <th className="p-4 border-b border-white/5 bg-background/80">Cliente</th>
                                <th className="p-4 border-b border-white/5 bg-background/80">Monto</th>
                                <th className="p-4 border-b border-white/5 bg-background/80 text-center">Estado</th>
                                <th className="p-4 border-b border-white/5 bg-background/80">Evidencia</th>
                                <th className="p-4 border-b border-white/5 bg-background/80 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-10 text-text-muted animate-pulse">Cargando registros...</td></tr>
                            ) : filteredPayments.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10 text-text-muted">No se encontraron registros.</td></tr>
                            ) : filteredPayments.map(payment => {
                                const status = getStatusConfig(payment.estado);
                                const StatusIcon = status.icon;
                                return (
                                    <tr key={payment.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 text-text-muted font-mono">{payment.fecha_pago}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-text-main">{payment.clientes_maestra?.razon_social || 'Cliente desconocido'}</div>
                                            <div className="text-xs text-text-muted font-mono">{payment.clientes_maestra?.rut_ci}</div>
                                        </td>
                                        <td className="p-4 font-bold text-accent text-lg">
                                            ${(payment.monto_transaccion || 0).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={clsx("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide", status.color)}>
                                                <StatusIcon size={12} />
                                                {payment.estado}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {payment.comprobante_url ? (
                                                <a
                                                    href={payment.comprobante_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors bg-blue-400/10 px-3 py-1.5 rounded-lg border border-blue-400/20"
                                                >
                                                    <ExternalLink size={14} /> Ver Comprobante
                                                </a>
                                            ) : (
                                                <span className="text-text-muted italic opacity-50">Sin archivo</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => {
                                                    setEditingPayment({ ...payment });
                                                    setIsEditOpen(true);
                                                }}
                                                className="p-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors border border-accent/20 shadow-lg shadow-accent/5"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-white/5 bg-background/30 text-xs text-text-muted flex justify-between items-center">
                    <span>{filteredPayments.length} registros encontrados</span>
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Verificado v2.0
                    </span>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditOpen && editingPayment && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md p-4">
                    <div className="bg-card w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-sidebar/50">
                            <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                                <Edit2 size={20} className="text-accent" /> Validar Pago
                            </h2>
                            <button onClick={() => setIsEditOpen(false)} className="text-text-muted hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdatePayment} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Fecha de Pago</label>
                                    <input
                                        type="date"
                                        className="w-full bg-sidebar border border-card rounded-xl px-4 py-3 text-sm text-text-main focus:border-accent outline-none transition-all"
                                        value={editingPayment.fecha_pago || ''}
                                        onChange={e => setEditingPayment({ ...editingPayment, fecha_pago: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Monto</label>
                                    <input
                                        type="number"
                                        className="w-full bg-sidebar border border-card rounded-xl px-4 py-3 text-sm text-text-main focus:border-accent outline-none font-bold"
                                        value={editingPayment.monto_transaccion || 0}
                                        onChange={e => setEditingPayment({ ...editingPayment, monto_transaccion: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Estado de Validación</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {STATUS_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setEditingPayment({ ...editingPayment, estado: opt.value })}
                                            className={clsx(
                                                "p-3 rounded-xl border text-[10px] font-bold uppercase transition-all flex flex-col items-center gap-2",
                                                editingPayment.estado === opt.value
                                                    ? opt.color.replace('/10', '/30') + " border-white/20 shadow-lg scale-105"
                                                    : "bg-sidebar border-card text-text-muted opacity-50 hover:opacity-100"
                                            )}
                                        >
                                            <opt.icon size={16} />
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Observaciones / Auditoría</label>
                                <textarea
                                    className="w-full h-24 bg-sidebar border border-card rounded-xl px-4 py-3 text-sm text-text-main focus:border-accent outline-none resize-none transition-all"
                                    placeholder="Nota para el cliente o razones del rechazo..."
                                    value={editingPayment.observacion || ''}
                                    onChange={e => setEditingPayment({ ...editingPayment, observacion: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="flex-1 py-3 rounded-xl border border-white/10 text-text-muted font-bold hover:bg-white/5 transition-colors"
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-3 rounded-xl bg-accent text-sidebar font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                                    disabled={saving}
                                >
                                    {saving ? 'Procesando...' : <><Save size={18} /> Guardar Cambios</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

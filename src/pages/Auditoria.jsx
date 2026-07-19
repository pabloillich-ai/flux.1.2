import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, X, Eye, ChevronLeft, ChevronRight, Clock, Filter } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const TABLE_LABELS = {
    clientes_maestra: 'Clientes',
    contactos: 'Contactos',
    inv_docs: 'Facturas',
    crm_gestion: 'CRM Gestión',
    agenda_events: 'Agenda'
};

const ACTION_CONFIG = {
    INSERT: { label: 'Creación', color: 'text-green-400 bg-green-400/10' },
    UPDATE: { label: 'Actualización', color: 'text-amber-400 bg-amber-400/10' },
    DELETE: { label: 'Eliminación', color: 'text-red-400 bg-red-400/10' }
};

function getChangedFields(oldData, newData) {
    if (!oldData || !newData) return [];
    const changes = [];
    for (const key of Object.keys(newData)) {
        const oldVal = JSON.stringify(oldData[key] ?? null);
        const newVal = JSON.stringify(newData[key] ?? null);
        if (oldVal !== newVal) {
            changes.push({
                field: key,
                oldValue: oldData[key],
                newValue: newData[key]
            });
        }
    }
    return changes;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function DiffModal({ log, onClose }) {
    if (!log) return null;

    const oldData = log.old_data || {};
    const newData = log.new_data || {};
    const isInsert = log.action === 'INSERT';
    const isDelete = log.action === 'DELETE';
    const changes = isInsert || isDelete ? [] : getChangedFields(oldData, newData);

    const renderFields = (data, highlightColor) => {
        if (!data || Object.keys(data).length === 0) return <p className="text-text-muted italic text-sm">Sin datos</p>;
        return (
            <div className="space-y-1">
                {Object.entries(data).map(([key, val]) => {
                    const changed = changes.find(c => c.field === key);
                    const isHighlighted = changed || isInsert || isDelete;
                    return (
                        <div key={key} className={clsx(
                            "flex justify-between px-3 py-1.5 rounded text-sm",
                            isHighlighted ? (isDelete ? 'bg-red-500/10' : 'bg-green-500/10') : 'bg-transparent'
                        )}>
                            <span className="text-text-muted font-mono text-xs">{key}</span>
                            <span className={clsx(
                                "font-mono text-xs ml-4 text-right max-w-[200px] truncate",
                                isDelete ? 'text-red-300' : isInsert ? 'text-green-300' : changed ? 'text-amber-300' : 'text-text-main'
                            )}>
                                {val !== null && val !== undefined ? String(val) : <span className="text-text-muted italic">null</span>}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9000] backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-card rounded-xl shadow-2xl border border-white/10 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-white/10 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Eye size={18} className="text-accent" />
                            Detalle de Auditoría
                        </h3>
                        <p className="text-xs text-text-muted mt-1">
                            {TABLE_LABELS[log.table_name] || log.table_name} &bull; {ACTION_CONFIG[log.action]?.label || log.action} &bull; {formatDate(log.created_at)}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm text-text-muted bg-background/50 px-3 py-2 rounded-lg border border-white/5">
                        <span className="font-bold text-white">Record ID:</span>
                        <span className="font-mono text-xs">{log.record_id || '-'}</span>
                    </div>

                    {isInsert && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider">Nuevo Registro</h4>
                            <div className="bg-background/40 rounded-lg border border-white/5 p-4">
                                {renderFields(newData, 'green')}
                            </div>
                        </div>
                    )}

                    {isDelete && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider">Registro Eliminado</h4>
                            <div className="bg-background/40 rounded-lg border border-white/5 p-4">
                                {renderFields(oldData, 'red')}
                            </div>
                        </div>
                    )}

                    {!isInsert && !isDelete && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                                    <ChevronLeft size={14} /> ANTES
                                </h4>
                                <div className="bg-background/40 rounded-lg border border-white/5 p-4">
                                    {renderFields(oldData, 'red')}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                                    DESPUÉS <ChevronRight size={14} />
                                </h4>
                                <div className="bg-background/40 rounded-lg border border-white/5 p-4">
                                    {renderFields(newData, 'green')}
                                </div>
                            </div>
                        </div>
                    )}

                    {!isInsert && !isDelete && changes.length > 0 && (
                        <div className="mt-5 bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">Campos Modificados ({changes.length})</h4>
                            <div className="space-y-2">
                                {changes.map(c => (
                                    <div key={c.field} className="grid grid-cols-3 gap-3 text-sm bg-background/40 rounded-lg p-3 border border-white/5">
                                        <span className="font-mono text-xs text-text-muted truncate">{c.field}</span>
                                        <span className="font-mono text-xs text-red-300 truncate">{c.oldValue !== null && c.oldValue !== undefined ? String(c.oldValue) : 'null'}</span>
                                        <span className="font-mono text-xs text-green-300 truncate">{c.newValue !== null && c.newValue !== undefined ? String(c.newValue) : 'null'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Auditoria() {
    const { profile } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTable, setFilterTable] = useState('all');
    const [filterAction, setFilterAction] = useState('all');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    async function fetchLogs() {
        setLoading(true);
        let query = supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500);

        if (profile?.tenant_id) query = query.eq('tenant_id', profile.tenant_id);
        if (filterTable !== 'all') query = query.eq('table_name', filterTable);
        if (filterAction !== 'all') query = query.eq('action', filterAction);
        if (filterDateFrom) query = query.gte('created_at', filterDateFrom);
        if (filterDateTo) query = query.lte('created_at', filterDateTo + 'T23:59:59');

        const { data, error } = await query;
        if (!error) setLogs(data || []);
        setLoading(false);
    }

    useEffect(() => {
        fetchLogs();
    }, [filterTable, filterAction, filterDateFrom, filterDateTo]);

    const filteredLogs = logs.filter(log => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (log.table_name || '').toLowerCase().includes(term) ||
            (log.record_id || '').toLowerCase().includes(term) ||
            (log.action || '').toLowerCase().includes(term)
        );
    });

    const totalPages = Math.ceil(filteredLogs.length / pageSize);
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterTable, filterAction, filterDateFrom, filterDateTo]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center pb-4 border-b border-white/5 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <ShieldCheck className="text-accent" /> Auditoría
                    </h1>
                    <p className="text-text-muted text-sm">Registro de cambios en la base de datos.</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 py-4 shrink-0">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Buscar por tabla, registro o acción..."
                        className="w-full bg-background/50 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-white/20"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    className="bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                    value={filterTable}
                    onChange={e => setFilterTable(e.target.value)}
                >
                    <option value="all">Todas las Tablas</option>
                    {Object.entries(TABLE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>

                <select
                    className="bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                    value={filterAction}
                    onChange={e => setFilterAction(e.target.value)}
                >
                    <option value="all">Todas las Acciones</option>
                    {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                    ))}
                </select>

                <div className="flex items-center gap-2">
                    <label className="text-xs text-text-muted whitespace-nowrap">Desde:</label>
                    <input
                        type="date"
                        className="bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                        value={filterDateFrom}
                        onChange={e => setFilterDateFrom(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-xs text-text-muted whitespace-nowrap">Hasta:</label>
                    <input
                        type="date"
                        className="bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                        value={filterDateTo}
                        onChange={e => setFilterDateTo(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading && (
                    <div className="text-center py-10 text-text-muted">Cargando registros...</div>
                )}

                {!loading && (
                    <div className="bg-card rounded-xl border border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5 bg-background/30">
                                        <th className="text-left px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-wider">Fecha/Hora</th>
                                        <th className="text-left px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-wider">Tabla</th>
                                        <th className="text-left px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-wider">Acción</th>
                                        <th className="text-left px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-wider">Registro</th>
                                        <th className="text-left px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-wider">Resumen</th>
                                        <th className="text-center px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-wider">Detalle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedLogs.map(log => {
                                        const actionCfg = ACTION_CONFIG[log.action] || { label: log.action, color: 'text-gray-400 bg-gray-400/10' };
                                        const oldKeys = log.old_data ? Object.keys(log.old_data).length : 0;
                                        const newKeys = log.new_data ? Object.keys(log.new_data).length : 0;
                                        let resumen = '';
                                        if (log.action === 'INSERT') resumen = 'Nuevo registro';
                                        else if (log.action === 'DELETE') resumen = 'Registro eliminado';
                                        else {
                                            const changes = getChangedFields(log.old_data, log.new_data);
                                            resumen = `${changes.length} campo(s) modificado(s)`;
                                        }
                                        return (
                                            <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 text-text-main font-mono text-xs whitespace-nowrap">
                                                    {formatDate(log.created_at)}
                                                </td>
                                                <td className="px-4 py-3 text-text-main">
                                                    {TABLE_LABELS[log.table_name] || log.table_name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={clsx("px-2 py-0.5 rounded text-[10px] uppercase font-bold", actionCfg.color)}>
                                                        {actionCfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-text-muted font-mono text-xs max-w-[120px] truncate" title={log.record_id}>
                                                    {log.record_id || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-text-muted text-xs">
                                                    {resumen}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => setSelectedLog(log)}
                                                        className="p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                                                        title="Ver Detalle"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {paginatedLogs.length === 0 && (
                            <div className="text-center py-16 text-text-muted">
                                <ShieldCheck size={40} className="mx-auto mb-3 opacity-20" />
                                <p>No se encontraron registros de auditoría.</p>
                            </div>
                        )}
                    </div>
                )}

                {!loading && totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 py-4 text-sm">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 text-text-muted hover:text-white disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-text-muted">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 text-text-muted hover:text-white disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>

            <DiffModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        </div>
    );
}

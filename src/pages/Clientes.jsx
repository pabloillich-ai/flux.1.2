import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Filter, Edit2, Save, X, Check, Users, ShieldAlert, ArrowUpDown, ArrowUp, ArrowDown, Link as LinkIcon, Copy } from 'lucide-react';
import clsx from 'clsx';

// Helper for Spanish status mapping (optional reuse)
const RISK_LABELS = {
    'Excelente': 'Excelente',
    'Buen Pagador': 'Buen Pagador',
    'Regular': 'Regular',
    'Atraso Frecuente': 'Atraso Frecuente',
    'Mal Pagador': 'Mal Pagador',
    'Legal': 'Legal',
    'Incobrable': 'Incobrable'
};

export default function ClientsPage() {
    const [clients, setClients] = useState([]);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    // We are keeping these for backward compatibility or ease of use if needed,
    // but the request emphasizes per-column. We can keep them or rely on column filters.
    // Let's keep them as "Global Filters" that sit above.
    const [filterAgent, setFilterAgent] = useState('all');
    const [filterRisk, setFilterRisk] = useState('all');

    // Column Filters & Sorting
    const [columnFilters, setColumnFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [saving, setSaving] = useState(false);

    // UI State
    const [visibleFilters, setVisibleFilters] = useState({}); // Tracks which filter inputs are open
    const [columnWidths, setColumnWidths] = useState({});

    // Initialize column widths once on mount
    useEffect(() => {
        const initialWidths = {};
        columns.forEach(col => {
            // Simple mapping from tailwind w-xx to approx px (1 unit = 0.25rem = 4px)
            // w-32 = 8rem = 128px
            let px = 150; // default
            if (col.width) {
                const match = col.width.match(/w-(\d+)/);
                if (match) {
                    px = parseInt(match[1]) * 4;
                } else if (col.width.includes('px')) {
                    px = parseInt(col.width);
                }
            }
            initialWidths[col.key] = px;
        });
        setColumnWidths(initialWidths);
    }, []);

    // Resize Handler
    const handleResizeMouseDown = (e, key) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent sort triggering

        const startX = e.pageX;
        const startWidth = columnWidths[key] || 100;

        const onMouseMove = (moveEvent) => {
            const currentX = moveEvent.pageX;
            const diff = currentX - startX;
            const newWidth = Math.max(50, startWidth + diff); // Min width 50px

            setColumnWidths(prev => ({
                ...prev,
                [key]: newWidth
            }));
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'col-resize';
    };

    // Initial Fetch
    useEffect(() => {
        fetchClients();
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        const { data, error } = await supabase.from('users').select('id, full_name');
        if (!error) setAgents(data || []);
    };

    const fetchClients = async () => {
        setLoading(true);
        const { data: clientsData, error: clientsError } = await supabase
            .from('clientes_maestra')
            .select('*')
            .order('razon_social');

        const { data: usersData } = await supabase.from('users').select('*');

        if (clientsError) {
            console.error('Error fetching clients:', clientsError);
        } else {
            // Join Agent Name
            const combined = (clientsData || []).map(c => ({
                ...c,
                agentName: usersData?.find(u => u.id === c.agente)?.full_name || 'Sin Asignar'
            }));
            setClients(combined);
        }
        setLoading(false);
    };

    // --- SORTING & FILTERING LOGIC ---

    const handleColumnFilterChange = (key, value) => {
        setColumnFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedAndFilteredClients = () => {
        let result = [...clients];

        // 1. Global Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(client =>
                client.razon_social?.toLowerCase().includes(lowerTerm) ||
                client.rut_ci?.includes(lowerTerm) ||
                client.nombre_fantasia?.toLowerCase().includes(lowerTerm)
            );
        }

        // 2. Legacy/Global Filters (Optional: Can be removed if column filters replace them entirely, but keeping for now)
        if (filterAgent !== 'all') {
            result = result.filter(c => String(c.agente) === String(filterAgent));
        }
        if (filterRisk !== 'all') {
            result = result.filter(c => c.status_riesgo === filterRisk);
        }

        // 3. Column Filters
        Object.keys(columnFilters).forEach(key => {
            const filterValue = columnFilters[key]?.toLowerCase();
            if (!filterValue) return;

            result = result.filter(client => {
                const value = client[key];
                if (value == null) return false;
                return String(value).toLowerCase().includes(filterValue);
            });
        });

        // 4. Sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle nulls
                if (aValue == null) aValue = '';
                if (bValue == null) bValue = '';

                // Text vs Number comparison
                const isNum = !isNaN(parseFloat(aValue)) && isFinite(aValue) && !isNaN(parseFloat(bValue)) && isFinite(bValue);
                // Also check if the string format is indeed a clean number, sometimes IDs look like numbers
                // But for sorting purposes, strict number sort is usually what user wants for amounts/days.
                // For '123' vs '2', string sort '1' < '2' so '123' comes first. Number sort 2 < 123.
                // Let's use numeric sort if parsing succeeds and it's not a mixed text field.

                if (isNum) {
                    aValue = parseFloat(aValue);
                    bValue = parseFloat(bValue);
                } else {
                    aValue = String(aValue).toLowerCase();
                    bValue = String(bValue).toLowerCase();
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    };

    const filteredClients = getSortedAndFilteredClients();

    // Edit Handlers
    const handleEdit = (client) => {
        setEditingClient({ ...client }); // Copy object
        setIsEditOpen(true);
    };

    const handleCopyPortalLink = (client) => {
        if (!client.custom_uuid) {
            alert('Este cliente no tiene un UUID generado. Asegúrese de ejecutar las migraciones.');
            return;
        }
        const link = `${window.location.origin}/portal/${client.custom_uuid}`;
        navigator.clipboard.writeText(link).then(() => {
            alert('✅ Enlace de portal copiado: ' + link);
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        // Prepare payload (remove extra joined fields like agentName)
        const {
            id_cliente, agentName, uuid, // Exclude uuid from payload to avoid PK update issues
            custom_uuid, created_at, // Also good practice to exclude read-only timestamps and extra fields
            ...payload
        } = editingClient;

        // Ensure Alert_exclud key uses the value from state
        if (editingClient.Alert_exclud !== undefined) {
            payload.Alert_exclud = editingClient.Alert_exclud;
        }

        // Use UUID here which is the PK
        const { error } = await supabase
            .from('clientes_maestra')
            .update(payload)
            .eq('uuid', editingClient.uuid);

        if (error) {
            alert('Error al guardar: ' + error.message);
        } else {
            // VERIFICATION STEP: Re-fetch the record to ensure persistence
            const { data: verifyData, error: verifyError } = await supabase
                .from('clientes_maestra')
                .select('*')
                .eq('uuid', editingClient.uuid)
                .single();

            if (verifyError || !verifyData) {
                console.error("Verification Error:", verifyError);
                alert('⚠️ Advertencia: Los cambios se enviaron, pero no se pudo verificar la persistencia automáticamente.\n\nError: ' + (verifyError?.message || 'Datos no encontrados'));
            } else {


                let mismatch = false;

                // Check Alert_exclud specifically as requested (DB column is "Alert_exclud")
                const payloadAlert = payload.Alert_exclud;
                const dbAlert = verifyData.Alert_exclud;

                if (payloadAlert !== undefined && dbAlert !== payloadAlert) {
                    console.warn(`Mismatch in Alert_exclud. Payload: ${payloadAlert}, DB: ${dbAlert}`);
                    mismatch = true;
                }

                // Check razon_social
                if (payload.razon_social && verifyData.razon_social !== payload.razon_social) {
                    mismatch = true;
                }

                if (mismatch) {
                    alert('⚠️ ALERTA: La base de datos no parece reflejar los cambios realizados. Revise la consola para más detalles.');
                } else {
                    alert('✅ Cliente actualizado y verificado correctamente en base de datos.');
                }
            }

            setIsEditOpen(false);
            fetchClients(); // Refresh list
        }
        setSaving(false);
    };

    // Helper to render sort icon
    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="text-white/20" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className="text-accent" />
            : <ArrowDown size={14} className="text-accent" />;
    };

    // Column Config Definition
    // We define this to map internal keys to display names and types
    const columns = [
        { label: 'Agente', key: 'agentName', width: 'w-40' },
        { label: 'ID Cliente', key: 'id_cliente', width: 'w-24' },
        { label: 'RUT/CI', key: 'rut_ci', width: 'w-32' },
        { label: 'Razón Social', key: 'razon_social', width: 'w-64' },
        { label: 'Nombre Fantasía', key: 'nombre_fantasia', width: 'w-48' },
        { label: 'Depto.', key: 'departamento', width: 'w-32' },
        { label: 'Dirección', key: 'direccion', width: 'w-64' },
        { label: 'Teléfono', key: 'tel', width: 'w-32' },
        { label: 'Email Fact.', key: 'email_facturacion', width: 'w-48' },
        { label: 'Clasif.', key: 'clasificacion', width: 'w-32' },
        { label: 'Riesgo', key: 'status_riesgo', width: 'w-32' },
        { label: 'Estado', key: 'estado_actual', width: 'w-32' },
        { label: 'Límite Crédito', key: 'limite_de_credito', width: 'w-32', isRight: true },
        { label: 'Plazo (Días)', key: 'plazo_pago_dias', width: 'w-32', isRight: true },
        { label: 'Alert Excl.', key: 'alert_exclud', width: 'w-24', isCenter: true },
    ];

    return (
        <div className="flex flex-col h-full bg-background p-6 overflow-hidden">

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-main flex items-center gap-2">
                        <Users className="text-accent" /> Clientes
                    </h1>
                    <p className="text-text-muted text-sm">Gestiona la base de datos de clientes.</p>
                </div>

                <div className="flex flex-wrap gap-2 items-center bg-card p-2 rounded-xl border border-white/5">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            className="pl-9 pr-4 py-2 bg-sidebar border border-card rounded-lg text-sm focus:outline-none focus:border-accent w-64 text-text-main"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="h-6 w-px bg-white/10 mx-1"></div>

                    {/* Agent Filter */}
                    <select
                        className="bg-sidebar border border-card rounded-lg px-3 py-2 text-sm text-text-muted focus:outline-none focus:border-accent"
                        value={filterAgent}
                        onChange={(e) => setFilterAgent(e.target.value)}
                    >
                        <option value="all">Agente: Todos</option>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                    </select>

                    {/* Risk Filter */}
                    <select
                        className="bg-sidebar border border-card rounded-lg px-3 py-2 text-sm text-text-muted focus:outline-none focus:border-accent"
                        value={filterRisk}
                        onChange={(e) => setFilterRisk(e.target.value)}
                    >
                        <option value="all">Riesgo: Todos</option>
                        {Object.keys(RISK_LABELS).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 bg-card rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-xl">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-background/80 text-text-muted font-bold text-xs uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                            <tr>
                                <th className="p-4 min-w-[120px] border-b border-white/5 bg-background/80 z-20 sticky left-0">Acciones</th>
                                {columns.map(col => (
                                    <th
                                        key={col.key}
                                        className={`p-4 border-b border-white/5 bg-background/80 align-top relative group/resizer ${!columnWidths[col.key] && (col.width || 'w-32')}`}
                                        style={columnWidths[col.key] ? { width: `${columnWidths[col.key]}px`, minWidth: `${columnWidths[col.key]}px` } : {}}
                                    >
                                        <div className="flex flex-col gap-2">
                                            {/* Header Row: Label + Sort + Filter Toggle */}
                                            <div className={clsx("flex items-center gap-2", col.isRight ? "justify-end" : "justify-between")}>

                                                {/* Label & Sort */}
                                                <div
                                                    className={clsx("flex items-center gap-1 cursor-pointer hover:text-white transition-colors select-none",
                                                        col.isRight && "order-last"
                                                    )}
                                                    onClick={() => handleSort(col.key)}
                                                >
                                                    {col.label}
                                                    <SortIcon columnKey={col.key} />
                                                </div>

                                                {/* Filter Icon */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setVisibleFilters(prev => ({
                                                            ...prev,
                                                            [col.key]: !prev[col.key]
                                                        }));
                                                    }}
                                                    className={clsx("p-1 rounded hover:bg-white/10 text-text-muted hover:text-white transition-colors",
                                                        (columnFilters[col.key] || visibleFilters[col.key]) ? "text-accent bg-accent/10" : "opacity-30 hover:opacity-100"
                                                    )}
                                                    title="Filtrar"
                                                >
                                                    <Filter size={12} />
                                                </button>
                                            </div>

                                            {/* Filter Input */}
                                            <div className={clsx("relative transition-all duration-200 overflow-hidden",
                                                visibleFilters[col.key] ? "h-8 opacity-100 mt-2" : "h-0 opacity-0"
                                            )}>
                                                <input
                                                    type="text"
                                                    placeholder="Filtrar..."
                                                    className="w-full bg-[#1f1f38] border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-accent outline-none"
                                                    value={columnFilters[col.key] || ''}
                                                    onChange={(e) => handleColumnFilterChange(col.key, e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Resizer Handle */}
                                        <div
                                            className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-accent/50 active:bg-accent transition-colors z-30 transform translate-x-1/2 opacity-0 group-hover/resizer:opacity-100"
                                            onMouseDown={(e) => handleResizeMouseDown(e, col.key)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </th>
                                ))}
                            </tr>
                        </thead >
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={columns.length + 1} className="text-center py-10 text-text-muted">Cargando...</td></tr>
                            ) : filteredClients.map(client => (
                                <tr key={client.id_cliente} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 sticky left-0 bg-card group-hover:bg-[#1f1f38] z-5 border-r border-white/5">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(client)}
                                                className="p-1.5 bg-accent/10 hover:bg-accent/20 text-accent rounded transition-colors flex items-center gap-2 text-xs font-bold"
                                                title="Editar Cliente"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleCopyPortalLink(client)}
                                                className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded transition-colors flex items-center gap-2 text-xs font-bold"
                                                title="Copiar Enlace de Pago"
                                            >
                                                <LinkIcon size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-4 text-text-muted">{client.agentName}</td>
                                    <td className="p-4 font-mono text-text-muted">{client.id_cliente}</td>
                                    <td className="p-4 font-mono text-text-main">{client.rut_ci}</td>
                                    <td className="p-4 font-bold text-text-main">{client.razon_social}</td>
                                    <td className="p-4 text-text-muted">{client.nombre_fantasia || '-'}</td>
                                    <td className="p-4 text-text-muted">{client.departamento || '-'}</td>
                                    <td className="p-4 text-text-muted truncate max-w-[150px]" title={client.direccion}>{client.direccion || '-'}</td>
                                    <td className="p-4 text-text-muted">{client.tel || '-'}</td>
                                    <td className="p-4 text-text-muted truncate max-w-[150px]" title={client.email_facturacion}>{client.email_facturacion || '-'}</td>
                                    <td className="p-4 text-text-muted">{client.clasificacion || '-'}</td>
                                    <td className="p-4">
                                        <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold border",
                                            client.status_riesgo === 'Excelente' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                client.status_riesgo === 'Legal' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                    "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                        )}>
                                            {client.status_riesgo}
                                        </span>
                                    </td>
                                    <td className="p-4 text-text-muted">{client.estado_actual}</td>
                                    <td className="p-4 text-right font-mono text-text-main">${(client.limite_de_credito || 0).toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono text-text-muted">{client.plazo_pago_dias}</td>
                                    <td className="p-4 text-center">
                                        {(client.Alert_exclud || client.alert_exclud) ?
                                            <span className="text-red-500"><ShieldAlert size={16} className="inline" /></span> :
                                            <span className="text-green-500/30"><Check size={16} className="inline" /></span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table >
                </div >
                <div className="p-2 border-t border-white/5 bg-background/30 text-xs text-text-muted text-center">
                    Mostrando {filteredClients.length} clientes
                </div>
            </div >

            {/* EDIT MODAL */}
            {
                isEditOpen && editingClient && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                        <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b border-white/10">
                                <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                                    <Edit2 size={20} className="text-accent" /> Editar Cliente: {editingClient.razon_social}
                                </h2>
                                <button onClick={() => setIsEditOpen(false)} className="text-text-muted hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Basic Info */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-2">Información Principal</h3>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-text-muted">Razón Social</label>
                                            <input className="input-field" value={editingClient.razon_social} onChange={e => setEditingClient({ ...editingClient, razon_social: e.target.value })} required />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-text-muted">Nombre Fantasía</label>
                                            <input className="input-field" value={editingClient.nombre_fantasia || ''} onChange={e => setEditingClient({ ...editingClient, nombre_fantasia: e.target.value })} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-text-muted">RUT / CI</label>
                                            <input className="input-field" value={editingClient.rut_ci} onChange={e => setEditingClient({ ...editingClient, rut_ci: e.target.value })} required />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-text-muted">Agente Asignado</label>
                                            <select className="input-field" value={editingClient.agente || ''} onChange={e => setEditingClient({ ...editingClient, agente: e.target.value })}>
                                                <option value="">-- Seleccionar --</option>
                                                {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-2">Contacto & Ubicación</h3>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-text-muted">Email Facturación</label>
                                            <input className="input-field" type="email" value={editingClient.email_facturacion || ''} onChange={e => setEditingClient({ ...editingClient, email_facturacion: e.target.value })} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-text-muted">Teléfono</label>
                                            <input className="input-field" value={editingClient.tel || ''} onChange={e => setEditingClient({ ...editingClient, tel: e.target.value })} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-text-muted">Dirección</label>
                                            <input className="input-field" value={editingClient.direccion || ''} onChange={e => setEditingClient({ ...editingClient, direccion: e.target.value })} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-text-muted">Departamento</label>
                                            <input className="input-field" value={editingClient.departamento || ''} onChange={e => setEditingClient({ ...editingClient, departamento: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Financial Info */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-2">Financiero y Riesgo</h3>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-text-muted">Límite de Crédito</label>
                                            <input className="input-field" type="number" value={editingClient.limite_de_credito || 0} onChange={e => setEditingClient({ ...editingClient, limite_de_credito: e.target.value })} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-text-muted">Plazo Pago (Días)</label>
                                            <input className="input-field" type="number" value={editingClient.plazo_pago_dias || 30} onChange={e => setEditingClient({ ...editingClient, plazo_pago_dias: e.target.value })} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-text-muted">Status Riesgo</label>
                                            <select className="input-field" value={editingClient.status_riesgo || 'Regular'} onChange={e => setEditingClient({ ...editingClient, status_riesgo: e.target.value })}>
                                                {Object.keys(RISK_LABELS).map(k => <option key={k} value={k}>{k}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-text-muted">Clasificación</label>
                                            <input className="input-field" value={editingClient.clasificacion || ''} onChange={e => setEditingClient({ ...editingClient, clasificacion: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* System Config */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-2">Configuración Sistema</h3>

                                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                            <input
                                                type="checkbox"
                                                id="alert_exclud"
                                                className="w-5 h-5 accent-accent"
                                                checked={editingClient.Alert_exclud || false}
                                                onChange={e => {
                                                    const checked = e.target.checked;
                                                    setEditingClient({
                                                        ...editingClient,
                                                        Alert_exclud: checked
                                                    });
                                                }}
                                            />
                                            <div>
                                                <label htmlFor="alert_exclud" className="text-sm font-bold text-text-main cursor-pointer">Excluir de Alertas Automáticas</label>
                                                <p className="text-xs text-text-muted">Si se activa, este cliente no recibirá notificaciones automáticas.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            <div className="p-6 border-t border-white/10 bg-background/50 flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="px-6 py-2 rounded-lg border border-white/10 text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2 rounded-lg bg-accent text-sidebar font-bold hover:bg-accent/90 transition-colors flex items-center gap-2"
                                    disabled={saving}
                                >
                                    {saving ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <style>{`
            .input-field {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: rgba(255, 255, 255, 0.9);
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 0.875rem;
                outline: none;
                transition: border-color 0.2s;
            }
            .input-field:focus {
                border-color: #00d4ff;
            }
            `}</style>

        </div >
    );
}

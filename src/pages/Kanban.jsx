import React, { useState, useMemo } from 'react';
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
    MessageSquare,
    AlertCircle,
    Eye,
    Edit2,
    Search,
    LayoutGrid,
    List as ListIcon
} from 'lucide-react';
import clsx from 'clsx';
import { KPICard } from '../components/KPICard';
import { ClientDetailModal } from '../components/ClientDetailModal';

import { supabase } from '../lib/supabase';
import { getDashboardData } from '../lib/api';

const USD_RATE_DEFAULT = 42;

// === HELPER FUNCTIONS ===

const calculateTotalDebt = (invoices, rate = USD_RATE_DEFAULT) => {
    if (!invoices) return 0;
    return invoices.reduce((acc, inv) => {
        const amount = inv.currency === 'USD' ? inv.amount * rate : inv.amount;
        return acc + amount;
    }, 0);
};

const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(amount);
};

const COLUMNS = {
    'Pendiente': { id: 'Pendiente', title: 'Pendiente', color: 'bg-slate-500' },
    'En Gestión': { id: 'En Gestión', title: 'En Gestión', color: 'bg-blue-500' },
    'Pago': { id: 'Pago', title: 'Pago', color: 'bg-green-500' },
    'Escalado': { id: 'Escalado', title: 'Escalado', color: 'bg-red-500' }
};

const RISK_COLORS = {
    'Excelente': 'border-l-green-500',
    'Buen Pagador': 'border-l-blue-500',
    'Regular': 'border-l-yellow-500',
    'Atraso Frecuente': 'border-l-orange-500',
    'Mal Pagador': 'border-l-red-500',
    'Legal': 'border-l-red-700',
    'Incobrable': 'border-l-slate-700'
};

// === COMPONENTS ===

function KanbanCard({ client, isOverlay, onExpand, exchangeRate }) {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: client.id,
        data: { type: 'Card', client },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const totalDebt = calculateTotalDebt(client.invoices, exchangeRate);
    const isCreditAlert = totalDebt > (client.creditLimit * 0.8);
    const borderColor = RISK_COLORS[client.risk] || 'border-l-slate-500';

    if (isDragging) {
        return <div ref={setNodeRef} style={style} className="bg-card w-full h-[180px] rounded-lg opacity-30 border-2 border-dashed border-accent"></div>;
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={clsx(
                "bg-card p-4 rounded-r-lg rounded-l-sm shadow-sm border-l-4 hover:shadow-md group cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-all relative overflow-hidden",
                borderColor,
                isOverlay && "cursor-grabbing scale-105 shadow-xl border-accent z-50 rounded-lg border-2"
            )}
        >
            {/* Drag Handle Area (whole card mainly, but let's be explicit with attributes/listeners on container) */}
            <div {...attributes} {...listeners}>
                {/* Header Simplificado: Nombre y Riesgo */}
                <div className="flex justify-between items-start mb-2">
                    <h4
                        className="font-bold text-text-main text-sm truncate pr-6 cursor-pointer hover:text-accent transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onExpand(client);
                        }}
                    >{client.name}</h4>
                    {isCreditAlert && (
                        <div className="absolute top-0 right-0 p-1.5 bg-red-500/20 text-red-400 rounded-bl-lg" title="Supera 80% Límite Crédito">
                            <AlertCircle size={14} />
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-text-muted font-medium bg-black/20 px-1.5 py-0.5 rounded">{client.risk}</span>
                </div>

                {/* Métricas Simplificadas: Saldo y Status */}
                <div className="flex justify-between items-baseline mb-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-text-muted uppercase font-bold">Saldo ({client.invoices.length} Docs)</span>
                        <span className="text-text-main font-mono font-bold text-lg">{formatMoney(totalDebt)}</span>
                    </div>
                </div>

                {/* Info Adicional Solicitada */}
                <div className="grid grid-cols-2 gap-2 text-xs text-text-muted mb-2 border-t border-white/5 pt-2">
                    <div>
                        <span className="block font-semibold text-[10px] uppercase">Límite</span>
                        <span>{formatMoney(client.creditLimit)}</span>
                    </div>
                    <div className="text-right">
                        <span className="block font-semibold text-[10px] uppercase">Agente</span>
                        <span>{client.agentName}</span>
                    </div>
                    {client.promiseDate && (
                        <div className="col-span-2 flex justify-between items-center bg-green-500/10 text-green-400 px-2 py-1 rounded">
                            <span className="font-semibold">Promesa:</span>
                            <span>{client.promiseDate}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs text-text-muted mt-2">
                <button
                    className="flex items-center gap-1 hover:text-accent transition-colors"
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent drag start
                        onExpand(client);
                    }}
                >
                    <Eye size={14} /> Ver Detalle
                </button>

                <button
                    className="p-1.5 hover:bg-accent/20 hover:text-accent rounded"
                    title="Editar Cliente"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Add edit logic here
                    }}
                >
                    <Edit2 size={14} />
                </button>
            </div>
        </div>
    );
}

function KanbanColumn({ id, clients, onExpandCard, exchangeRate }) {
    const { setNodeRef } = useSortable({ id: id, data: { type: 'Column', id } });

    const total = clients.reduce((acc, c) => acc + calculateTotalDebt(c.invoices, exchangeRate), 0);
    const colDef = COLUMNS[id];

    return (
        <div ref={setNodeRef} className="bg-sidebar w-80 flex-shrink-0 flex flex-col rounded-xl border border-white/5 h-full max-h-full">
            {/* Header */}
            <div className="p-4 border-b border-white/5">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-text-main flex items-center gap-2">
                        <span className={clsx("w-3 h-3 rounded-full", colDef.color)}></span>
                        {colDef.title}
                    </h3>
                    <span className="bg-white/10 text-text-muted font-bold text-xs px-2 py-0.5 rounded-full">{clients.length}</span>
                </div>
                <div className="flex justify-between items-end">
                    <span className="text-xs text-text-muted uppercase font-semibold tracking-wider">Total Fase</span>
                    <span className="text-text-main font-mono font-bold">{formatMoney(total)}</span>
                </div>
            </div>

            {/* Cards Area */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-card custom-scrollbar">
                <SortableContext items={clients.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {clients.map(client => (
                        <KanbanCard key={client.id} client={client} onExpand={onExpandCard} exchangeRate={exchangeRate} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}

function ListView({ clients, onExpand, exchangeRate }) {
    return (
        <div className="bg-sidebar rounded-xl border border-white/5 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-background/50 text-text-muted font-medium border-b border-white/5">
                    <tr>
                        <th className="p-4">Cliente</th>
                        <th className="p-4">RUT</th>
                        <th className="p-4">Fase</th>
                        <th className="p-4">Riesgo</th>
                        <th className="p-4">Agente</th>
                        <th className="p-4 text-right">Deuda Total</th>
                        <th className="p-4 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {clients.map(client => (
                        <tr key={client.id} className="hover:bg-white/5 transition-colors">
                            <td
                                className="p-4 font-medium text-text-main cursor-pointer hover:text-accent transition-colors"
                                onClick={() => onExpand(client)}
                            >
                                {client.name}
                            </td>
                            <td className="p-4 text-text-muted">{client.rut}</td>
                            <td className="p-4">
                                <span className={clsx(
                                    "px-2 py-1 rounded-full text-xs font-bold",
                                    client.status === 'Pago' ? "bg-green-500/10 text-green-500" :
                                        client.status === 'Escalado' ? "bg-red-500/10 text-red-500" :
                                            "bg-blue-500/10 text-blue-500"
                                )}>{client.status}</span>
                            </td>
                            <td className="p-4 text-text-muted">{client.risk}</td>
                            <td className="p-4 text-text-muted">{client.agentName}</td>
                            <td className="p-4 text-right font-mono font-bold text-text-main">
                                {formatMoney(calculateTotalDebt(client.invoices, exchangeRate))}
                            </td>
                            <td className="p-4 flex justify-center gap-2">
                                <button
                                    className="p-2 hover:bg-accent/10 hover:text-accent rounded"
                                    onClick={() => onExpand(client)}
                                >
                                    <Eye size={16} />
                                </button>
                                <button className="p-2 hover:bg-accent/10 hover:text-accent rounded"><Edit2 size={16} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// === CONFIRMATION MODAL ===
function ConfirmationModal({ isOpen, onClose, onConfirm, newStatus, clientName }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-card p-6 rounded-lg shadow-xl border border-white/10 w-96">
                <h3 className="text-lg font-bold text-white mb-4">Confirmar Cambio de Estado</h3>
                <p className="text-text-muted mb-6">
                    ¿Estás seguro de mover a <strong>{clientName}</strong> al estado <span className="text-accent font-semibold">{newStatus}</span>?
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded bg-transparent border border-white/10 text-text-muted hover:bg-white/5"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded bg-accent text-white hover:bg-accent/90"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

// === DETAILS MODAL ===
function DetailsModal({ isOpen, onClose, client }) {
    if (!isOpen || !client) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-card p-6 rounded-lg shadow-xl border border-white/10 w-[600px] max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h3 className="text-xl font-bold text-white">{client.name}</h3>
                    <button onClick={onClose} className="text-text-muted hover:text-white">&times;</button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <span className="text-xs text-text-muted uppercase">RUT</span>
                        <div className="text-white font-medium">{client.rut}</div>
                    </div>
                    <div>
                        <span className="text-xs text-text-muted uppercase">Agente</span>
                        <div className="text-white font-medium">{client.agentName}</div>
                    </div>
                    <div>
                        <span className="text-xs text-text-muted uppercase">Riesgo</span>
                        <div className="text-white font-medium">{client.risk}</div>
                    </div>
                    <div>
                        <span className="text-xs text-text-muted uppercase">Límite Crédito</span>
                        <div className="text-white font-medium">{formatMoney(client.creditLimit)}</div>
                    </div>
                </div>

                <h4 className="text-sm font-bold text-accent mb-3 uppercase">Última Gestión CRM</h4>
                <div className="bg-background/50 p-3 rounded border border-white/5 mb-6">
                    <div className="flex justify-between mb-1">
                        <span className="text-xs text-text-muted">{client.crm.date}</span>
                    </div>
                    <p className="text-sm text-white italic">"{client.crm.lastNote}"</p>
                </div>

                <h4 className="text-sm font-bold text-accent mb-3 uppercase">Facturas Pendientes</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white/5 text-text-muted">
                            <tr>
                                <th className="p-2">ID</th>
                                <th className="p-2">Vencimiento</th>
                                <th className="p-2 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {client.invoices.map(inv => (
                                <tr key={inv.id}>
                                    <td className="p-2 text-white">{inv.id}</td>
                                    <td className="p-2 text-white">{inv.dueDate}</td>
                                    <td className="p-2 text-right text-white font-mono">
                                        {new Intl.NumberFormat('es-UY', { style: 'currency', currency: inv.currency }).format(inv.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded">Cerrar</button>
                </div>
            </div>
        </div>
    );
}


// === MAIN PAGE ===

export default function Kanban2() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'
    const [activeId, setActiveId] = useState(null);
    const [exchangeRate, setExchangeRate] = useState(USD_RATE_DEFAULT);

    // Modal State
    const [modalState, setModalState] = useState({ isOpen: false, clientId: null, newStatus: null });
    const [detailsModal, setDetailsModal] = useState({ isOpen: false, client: null });

    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAgent, setFilterAgent] = useState('all');
    const [filterRisk, setFilterRisk] = useState('all');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    // Fetch Exchange Rate
    React.useEffect(() => {
        const fetchRate = async () => {
            try {
                const res = await fetch('https://open.er-api.com/v6/latest/USD');
                if (!res.ok) throw new Error('API Error');
                const data = await res.json();
                if (data && data.rates && data.rates.UYU) {

                    setExchangeRate(data.rates.UYU);
                }
            } catch (err) {
                console.warn('⚠️ Error al obtener cotización, usando valor por defecto:', err);
            }
        };
        fetchRate();
    }, []);

    // Fetch Data (Unified)
    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // api.js handles the logic: 
                // 1. Try Python Backend 
                // 2. If fail, fallback to Client Side Join
                const data = await getDashboardData();

                if (data) {
                    setItems(data.items);
                    setExchangeRate(data.exchangeRate);
                    // Optionally set KPIs if we want to bypass simple calculation, 
                    // but Kanban.jsx calculates KPIs from 'items' currently.
                    // To fully optimize, we should use data.kpis directly, 
                    // but for now let's ensure the table/board renders first.

                }
            } catch (error) {
                console.error('Error fetching Kanban data:', error);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    // Filter Logic
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.rut.includes(searchTerm);
            const matchesAgent = filterAgent === 'all' || item.agentId === filterAgent;
            const matchesRisk = filterRisk === 'all' || item.risk === filterRisk;
            return matchesSearch && matchesAgent && matchesRisk;
        });
    }, [items, searchTerm, filterAgent, filterRisk]);

    // Drag Handlers
    const handleDragStart = (event) => setActiveId(event.active.id);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;
        const activeItem = items.find(i => i.id === activeId);

        // Logic: Identify if dropped on a Column or a Card
        let newStatus = overId;

        // If dropped on a card, get that card's status
        if (!COLUMNS[overId]) {
            const overItem = items.find(i => i.id === overId);
            newStatus = overItem ? overItem.status : activeItem.status;
        }

        if (activeItem && activeItem.status !== newStatus) {
            // Trigger Modal instead of direct update
            setModalState({ isOpen: true, clientId: activeId, newStatus: newStatus });
        }
        setActiveId(null);
    };

    const confirmMove = () => {
        const { clientId, newStatus } = modalState;
        setItems(items.map(i => i.id === clientId ? { ...i, status: newStatus } : i));
        setModalState({ isOpen: false, clientId: null, newStatus: null });
    };

    const cancelMove = () => {
        setModalState({ isOpen: false, clientId: null, newStatus: null });
    };

    const handleExpandCard = (client) => {
        setDetailsModal({ isOpen: true, client: client });
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col gap-4">

            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background pb-4 border-b border-card">
                <div>
                    <h2 className="text-xl font-bold text-text-main">Tablero de Gestión</h2>
                    <p className="text-xs text-text-muted">Arrastra tarjetas para cambiar la fase de cobranza</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex bg-sidebar rounded-lg p-1 border border-border-color">
                        <button
                            onClick={() => setViewMode('board')}
                            className={clsx("p-2 rounded-md transition-colors", viewMode === 'board' ? "bg-card text-text-main shadow" : "text-text-muted hover:text-text-main")}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={clsx("p-2 rounded-md transition-colors", viewMode === 'list' ? "bg-card text-text-main shadow" : "text-text-muted hover:text-text-main")}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-card mx-2 hidden md:block"></div>

                    {/* Filters */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            className="pl-9 pr-4 py-2 bg-sidebar border border-card rounded-lg text-sm focus:outline-none focus:border-accent w-48"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="bg-sidebar border border-card rounded-lg px-3 py-2 text-sm text-text-muted focus:outline-none focus:border-accent"
                        value={filterAgent}
                        onChange={(e) => setFilterAgent(e.target.value)}
                    >
                        <option value="all">Agente: Todos</option>
                        <option value="1">Juan Pérez</option>
                        <option value="2">Ana García</option>
                        <option value="3">Carlos López</option>
                    </select>

                    <select
                        className="bg-sidebar border border-card rounded-lg px-3 py-2 text-sm text-text-muted focus:outline-none focus:border-accent"
                        value={filterRisk}
                        onChange={(e) => setFilterRisk(e.target.value)}
                    >
                        <option value="all">Riesgo: Todos</option>
                        <option value="Excelente">Excelente</option>
                        <option value="Buen Pagador">Buen Pagador</option>
                        <option value="Regular">Regular</option>
                        <option value="Atraso Frecuente">Atraso Frecuente</option>
                        <option value="Mal Pagador">Mal Pagador</option>
                        <option value="Legal">Legal</option>
                        <option value="Incobrable">Incobrable</option>
                    </select>

                    <button className="bg-accent text-sidebar font-bold px-4 py-2 rounded-lg text-sm hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
                        + Gestión
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {viewMode === 'board' ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-6 h-full overflow-x-auto pb-2 items-start">
                        {Object.keys(COLUMNS).map(colId => (
                            <KanbanColumn
                                key={colId}
                                id={colId}
                                clients={filteredItems.filter(c => c.status === colId)}
                                onExpandCard={handleExpandCard}
                            />
                        ))}
                    </div>

                    <DragOverlay>
                        {activeId ? <KanbanCard client={items.find(i => i.id === activeId)} isOverlay /> : null}
                    </DragOverlay>
                </DndContext>
            ) : (
                <div className="flex-1 overflow-auto">
                    <ListView clients={filteredItems} onExpand={handleExpandCard} />
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={cancelMove}
                onConfirm={confirmMove}
                newStatus={modalState.newStatus}
                clientName={items.find(i => i.id === modalState.clientId)?.name}
            />

            {/* New Client Detail Modal */}
            <ClientDetailModal
                isOpen={detailsModal.isOpen}
                onClose={() => setDetailsModal({ ...detailsModal, isOpen: false })}
                client={detailsModal.client}
                exchangeRate={exchangeRate}
            />

        </div>
    );
}
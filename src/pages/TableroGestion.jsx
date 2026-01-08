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
import ImmersiveModal from '../components/ImmersiveModal';

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

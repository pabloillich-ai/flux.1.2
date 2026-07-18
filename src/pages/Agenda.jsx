import React, { useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon,
    Clock,
    User,
    Phone,
    Mail,
    MessageSquare,
    CheckCircle2,
    MoreHorizontal,
    Plus,
    ChevronLeft,
    ChevronRight,
    Search,
    Edit2,
    X,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import clsx from 'clsx';
import MiniCalendar from "../components/MiniCalendar";
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const ACTION_ICONS = {
    call: Phone,
    email: Mail,
    whatsapp: MessageSquare,
    meeting: User,
    payment_promise: CalendarIcon
};

const ACTION_COLORS = {
    call: 'text-blue-400 bg-blue-400/10',
    email: 'text-yellow-400 bg-yellow-400/10',
    whatsapp: 'text-green-400 bg-green-400/10',
    meeting: 'text-purple-400 bg-purple-400/10',
    payment_promise: 'text-emerald-400 bg-emerald-400/10'
};

const ACTION_LABELS = {
    call: 'Llamada',
    email: 'Correo',
    whatsapp: 'WhatsApp',
    meeting: 'Reunión',
    payment_promise: 'Compromiso de Pago'
};

// === EVENT MODAL ===
function EventModal({ isOpen, onClose, onSave, event = null, clients = [], allEvents = [] }) {
    const [formData, setFormData] = useState(event || {
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        client: '',
        type: 'call',
        note: '',
        agent: 'Admin User',
        status: 'pending'
    });

    useEffect(() => {
        if (event) setFormData(event);
        else setFormData({
            date: new Date().toISOString().split('T')[0],
            time: '09:00',
            client: '',
            type: 'call',
            note: '',
            agent: 'Admin User',
            status: 'pending'
        });
    }, [event, isOpen]);

    if (!isOpen) return null;

    // Filter events for the selected day in format YYYY-MM-DD
    // Ensure accurate date comparison
    const selectedDateStr = formData.date;
    const dayEvents = allEvents.filter(e => e.date === selectedDateStr).sort((a, b) => a.time.localeCompare(b.time));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9000] backdrop-blur-sm p-4">
            <div className="bg-card rounded-xl shadow-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">

                {/* LEFT COLUMN: FORM */}
                <div className="p-6 flex-1 overflow-y-auto border-b md:border-b-0 md:border-r border-white/10">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {event ? <Edit2 size={20} className="text-accent" /> : <Plus size={20} className="text-accent" />}
                            {event ? 'Editar Acción' : 'Nueva Acción'}
                        </h3>
                        {/* Mobile Close Button shows only on small screens if needed, but main layout handles it */}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase text-text-muted mb-1 font-bold">Fecha</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent transition-colors"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-text-muted mb-1 font-bold">Hora</label>
                                <input
                                    type="time"
                                    required
                                    className="w-full bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent transition-colors"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-text-muted mb-1 font-bold">Cliente <span className="text-accent">*</span></label>
                            <input
                                list="client-options"
                                required
                                placeholder="Buscar cliente por Razón Social..."
                                className="w-full bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent transition-colors placeholder:text-white/20"
                                value={formData.client}
                                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                            />
                            <datalist id="client-options">
                                {clients.map(c => (
                                    <option key={c.id} value={c.name} />
                                ))}
                            </datalist>
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-text-muted mb-1 font-bold">Tipo de Acción</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(ACTION_LABELS).map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: key })}
                                        className={clsx(
                                            "px-3 py-2 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2",
                                            formData.type === key
                                                ? "bg-accent/20 border-accent text-white"
                                                : "bg-background/30 border-white/5 text-text-muted hover:bg-white/5"
                                        )}
                                    >
                                        {/* Ideally we map icons here too or just text */}
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-text-muted mb-1 font-bold">Nota / Observación</label>
                            <textarea
                                rows="4"
                                className="w-full bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent resize-none transition-colors"
                                placeholder="Detalles de la gestión..."
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            ></textarea>
                        </div>

                        <div className="flex justify-end pt-4 gap-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-text-muted hover:text-white transition-colors">Cancelar</button>
                            <button type="submit" className="px-6 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-bold shadow-lg shadow-accent/20 transition-all transform active:scale-95">Guardar Acción</button>
                        </div>
                    </form>
                </div>

                {/* RIGHT COLUMN: DAY AGENDA */}
                <div className="bg-background/40 w-full md:w-80 flex flex-col border-l border-white/5">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            <CalendarIcon size={16} className="text-text-muted" />
                            Agenda del Día
                        </h4>
                        <p className="text-xs text-text-muted mt-1 capitalize">
                            {new Date(formData.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {dayEvents.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <p className="text-sm text-text-muted">No hay otras acciones para este día.</p>
                            </div>
                        ) : (
                            dayEvents.map(ev => {
                                const isCurrent = event && ev.id === event.id; // Highlight current if editing
                                return (
                                    <div key={ev.id} className={clsx(
                                        "p-3 rounded-lg border text-xs relative",
                                        isCurrent ? "bg-accent/10 border-accent" : "bg-card border-white/5 opacity-80"
                                    )}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-white font-mono">{ev.time.slice(0, 5)}</span>
                                            <span className={clsx("px-1.5 py-0.5 rounded text-[10px] uppercase",
                                                ev.type === 'call' ? 'bg-blue-500/20 text-blue-300' :
                                                    ev.type === 'whatsapp' ? 'bg-green-500/20 text-green-300' :
                                                        ev.type === 'email' ? 'bg-yellow-500/20 text-yellow-300' :
                                                            'bg-purple-500/20 text-purple-300'
                                            )}>{ACTION_LABELS[ev.type]}</span>
                                        </div>
                                        <p className="font-semibold text-white truncate mb-1" title={ev.client}>{ev.client}</p>
                                        {ev.note && <p className="text-text-muted line-clamp-2 italic">{ev.note}</p>}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function Agenda() {
    const { profile } = useAuth();
    const [events, setEvents] = useState([]);
    const [clients, setClients] = useState([]); // Client list
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);

    // Fetch Data
    useEffect(() => {
        if (profile?.tenant_id) {
            fetchEvents();
            fetchClients();
        } else {
            setLoading(false);
        }
    }, [profile]);

    async function fetchEvents() {
        if (!profile?.tenant_id) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('agenda_events')
            .select('*')
            .eq('tenant_id', profile.tenant_id)
            .order('time', { ascending: true }); // Supabase sort

        if (error) {
            console.error('Error fetching events:', error);
        } else {
            setEvents(data || []);
        }
        setLoading(false);
    }

    async function fetchClients() {
        if (!profile?.tenant_id) return;
        // Fetch from clientes_maestra now
        const { data, error } = await supabase
            .from('clientes_maestra')
            .select('uuid, razon_social')
            .eq('tenant_id', profile.tenant_id)
            .order('razon_social', { ascending: true });

        if (error) {
            console.error('Error fetching clients:', error);
        } else {
            // Map to expected format
            const mapped = (data || []).map(c => ({
                id: c.uuid,
                name: c.razon_social
            }));
            setClients(mapped);
        }
    }

    // Helpers
    const formatDateHeader = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00'); // Fix TZ issues by treating as local start
        // Or simply split string parts if dateStr is YYYY-MM-DD
        const [year, month, day] = dateStr.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);

        const today = new Date();
        const isToday = localDate.getDate() === today.getDate() && localDate.getMonth() === today.getMonth() && localDate.getFullYear() === today.getFullYear();

        if (isToday) return 'Hoy';
        return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(localDate);
    };

    const handleSaveEvent = async (eventData) => {
        // Find the UUID for the selected client name
        const matchedClient = clients.find(c => c.name === eventData.client);
        const uuidClient = matchedClient ? matchedClient.id : null;

        const payload = {
            date: eventData.date,
            time: eventData.time,
            client: eventData.client,
            type: eventData.type,
            note: eventData.note,
            agent: eventData.agent || 'Admin User',
            uuid_Client: uuidClient, // Case sensitive column name in DB
            tenant_id: profile?.tenant_id
        };

        if (editingEvent) {
            const { error } = await supabase
                .from('agenda_events')
                .update(payload)
                .eq('id', eventData.id);
            if (!error) fetchEvents();
        } else {
            const { error } = await supabase
                .from('agenda_events')
                .insert([{ ...payload, status: 'pending' }]);
            if (!error) fetchEvents();
        }
        setIsModalOpen(false);
        setEditingEvent(null);
    };

    const handleNewEvent = () => {
        setEditingEvent(null);
        setIsModalOpen(true);
    };

    const handleEditEvent = (event) => {
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        const dateStr = date.toISOString().split('T')[0];
        const element = document.getElementById(`date-${dateStr}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Group events - Memoized for use in effect
    const { groupedEvents, sortedDates } = React.useMemo(() => {
        const grouped = events.reduce((acc, event) => {
            if (!acc[event.date]) acc[event.date] = [];
            acc[event.date].push(event);
            return acc;
        }, {});
        return {
            groupedEvents: grouped,
            sortedDates: Object.keys(grouped).sort()
        };
    }, [events]);

    // Auto-scroll to Today on load
    useEffect(() => {
        if (!loading && sortedDates.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Find first date >= today
            const targetDateStr = sortedDates.find(d => {
                const dateParts = d.split('-');
                const eventDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                return eventDate >= today;
            });

            if (targetDateStr) {
                // Short timeout to ensure DOM render
                setTimeout(() => {
                    const element = document.getElementById(`date-${targetDateStr}`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
            } else if (sortedDates.length > 0) {
                // If no future dates, scroll to the last one (bottom) or first? 
                // Usually last one is better if everything is past.
                // Let's stick to default behavior (top) if no match, or scroll to last.
            }
        }
    }, [loading, sortedDates]);

    return (
        <div className="flex h-full overflow-hidden relative">

            {/* Main Content (Now Full Width) */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-white/5 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                            <CalendarIcon className="text-accent" /> Agenda de Gestión
                        </h1>
                        <p className="text-text-muted text-sm">Organiza y visualiza tus acciones diarias con clientes.</p>
                    </div>
                    <button
                        onClick={handleNewEvent}
                        className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium text-sm"
                    >
                        <Plus size={18} /> Nueva Acción
                    </button>
                </div>

                {/* Event List */}
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-card flex flex-col gap-8 pt-4 pb-20">
                    {loading && <div className="text-text-muted text-center py-10">Cargando eventos...</div>}

                    {!loading && sortedDates.map(dateStr => (
                        <div key={dateStr} id={`date-${dateStr}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-lg font-bold text-accent mb-4 sticky top-0 bg-background/95 backdrop-blur py-2 z-10 border-b border-white/5 capitalize">
                                {formatDateHeader(dateStr)}
                            </h3>

                            <div className="space-y-3">
                                {groupedEvents[dateStr].map(event => {
                                    const Icon = ACTION_ICONS[event.type] || Clock;
                                    const colorClass = ACTION_COLORS[event.type] || 'text-gray-400 bg-gray-400/10';

                                    return (
                                        <div key={event.id} className="bg-card hover:bg-white/5 border border-white/5 rounded-xl p-4 transition-all group flex gap-4 items-start relative">
                                            <button
                                                onClick={() => handleEditEvent(event)}
                                                className="absolute top-2 right-2 p-1.5 text-text-muted hover:text-white hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Editar"
                                            >
                                                <Edit2 size={14} />
                                            </button>

                                            <div className="flex flex-col items-center gap-1 min-w-[60px] pt-1">
                                                <span className="text-lg font-bold text-text-main font-mono">
                                                    {event.time && event.time.slice(0, 5)}
                                                </span>
                                                <div className={clsx("p-2 rounded-lg", colorClass)}>
                                                    <Icon size={18} />
                                                </div>
                                            </div>

                                            <div className="flex-1 pr-6">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-text-main text-lg">{event.client}</h4>
                                                        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{ACTION_LABELS[event.type]} &bull; {event.agent}</span>
                                                    </div>
                                                    <button className={clsx(
                                                        "p-2 rounded-full transition-colors",
                                                        event.status === 'completed' ? "text-green-500 bg-green-500/10" : "text-text-muted hover:text-accent hover:bg-accent/10"
                                                    )}>
                                                        {event.status === 'completed' ? <CheckCircle2 size={20} /> : <div className="w-5 h-5 border-2 border-current rounded-full" />}
                                                    </button>
                                                </div>

                                                <div className="mt-3 bg-background/50 p-3 rounded-lg border border-white/5">
                                                    <p className="text-sm text-text-muted italic">"{event.note}"</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    {!loading && sortedDates.length === 0 && (
                        <div className="text-center py-20 text-text-muted">
                            <CalendarIcon size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No hay acciones agendadas.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Calendar Widget */}
            <div
                className={clsx(
                    "absolute bottom-0 right-0 m-4 w-80 bg-sidebar border border-card rounded-xl shadow-2xl transition-all duration-300 flex flex-col z-50 overflow-hidden",
                    isCalendarExpanded ? "max-h-[500px]" : "max-h-[50px] cursor-pointer"
                )}
                onClick={() => !isCalendarExpanded && setIsCalendarExpanded(true)}
            >
                {/* Widget Header */}
                <div
                    className="flex justify-between items-center p-3 bg-card border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsCalendarExpanded(!isCalendarExpanded);
                    }}
                >
                    <div className="flex items-center gap-2 font-bold text-text-main">
                        <CalendarIcon size={16} className="text-accent" />
                        <span>Calendario</span>
                    </div>
                    <button className="text-text-muted hover:text-white">
                        {isCalendarExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                </div>

                {/* Calendar Body */}
                <div className={clsx("p-2 transition-all duration-300", !isCalendarExpanded && "opacity-0 invisible h-0 p-0")}>
                    <MiniCalendar
                        events={events}
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                        inline={true}
                    />
                </div>
            </div>

            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
                event={editingEvent}
                clients={clients}
                allEvents={events}
            />
        </div>
    );
}

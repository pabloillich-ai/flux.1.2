import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, User, Mail, Phone, Calendar as CalendarIcon, FileText, Download } from 'lucide-react';
import clsx from 'clsx';
import MiniCalendar from "./MiniCalendar";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

// === HELPER COMPONENTS ===

function Widget({ title, children, defaultExpanded = true, className = "" }) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className={clsx("bg-background/50 border border-white/5 rounded-lg overflow-hidden flex flex-col transition-all", className, isExpanded ? "" : "h-10")}>
            <div
                className="flex justify-between items-center p-2 bg-white/5 cursor-pointer hover:bg-white/10"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h4 className="font-bold text-xs text-text-main uppercase tracking-wider">{title}</h4>
                <button className="text-text-muted hover:text-white">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
            </div>
            <div className={clsx("p-3 overflow-y-auto transition-all", isExpanded ? "opacity-100" : "opacity-0 hidden")}>
                {children}
            </div>
        </div>
    );
}

function ContactCard({ name, role, email }) {
    return (
        <div className="flex items-start gap-3 p-2 rounded hover:bg-white/5 transition-colors mb-2">
            <div className="bg-accent/20 p-2 rounded-full text-accent">
                <User size={16} />
            </div>
            <div className="overflow-hidden">
                <div className="font-bold text-sm text-text-main truncate">{name}</div>
                <div className="text-xs text-text-muted truncate">{role}</div>
                <div className="text-xs text-text-muted truncate mt-0.5">{email}</div>
            </div>
        </div>
    );
}

// === MAIN MODAL COMPONENT ===

export function ClientDetailModal({ isOpen, onClose, client, exchangeRate = 1 }) {
    const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);

    // Close on Escape Key
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isOpen || !client) return null;

    // Mock Contacts
    const contacts = [
        { name: "María Rodriguez", role: "Gerente Financiero", email: "mrodriguez@empresa.com" },
        { name: "Carlos Silva", role: "Analista de Pagos", email: "csilva@empresa.com" }
    ];

    // Format helpers
    const formatMoney = (amount, currency) => {
        return new Intl.NumberFormat('es-UY', { style: 'currency', currency: currency || 'UYU', maximumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Calculate Data for Chart (Using Exchange Rate)
    const totalDebt = client.invoices.reduce((acc, i) => {
        const amount = i.currency === 'USD' ? i.amount * exchangeRate : i.amount;
        return acc + amount;
    }, 0);

    const creditLimit = client.creditLimit || 1; // Avoid div by zero
    const usedPercentage = Math.min((totalDebt / creditLimit) * 100, 100);
    const availablePercentage = Math.max(100 - usedPercentage, 0);

    // Chart Data
    const chartData = {
        labels: ['Utilizado', 'Disponible'],
        datasets: [
            {
                data: [usedPercentage, availablePercentage],
                backgroundColor: [
                    usedPercentage > 90 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)', // Red if >90%, else Blue
                    'rgba(255, 255, 255, 0.05)',
                ],
                borderColor: [
                    usedPercentage > 90 ? 'rgba(239, 68, 68, 1)' : 'rgba(59, 130, 246, 1)',
                    'rgba(255, 255, 255, 0.1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false } // Simple visual, no interaction needed usually for headers
        },
        cutout: '70%',
    };

    const getExportFileName = () => {
        const safeName = client.name ? client.name.replace(/\s+/g, '_') : 'Cliente';
        const dateStr = new Date().toISOString().split('T')[0];
        return `Facturas_${safeName}_${dateStr}.csv`;
    };

    const handleExportExcel = () => {
        // Define Headers
        const headers = ['ID Factura', 'Emisión', 'Vencimiento', 'Estado', 'Moneda', 'Importe'];

        // Map Data
        const rows = client.invoices.map(inv => {
            const isOverdue = new Date(inv.dueDate) < new Date();
            const status = isOverdue ? 'Vencida' : 'Al Día';
            return [
                inv.id,
                inv.issueDate || '-',
                inv.dueDate,
                status,
                inv.currency,
                inv.amount
            ];
        });

        // Convert to CSV
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', getExportFileName());
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSendMail = () => {
        // 1. Download File
        handleExportExcel();

        // 2. Open Mail Client
        const emails = contacts.map(c => c.email).join(',');
        const subject = `Estado de Cuenta - ${client.name}`;
        const body = `Estimados,\n\nAdjunto enviamos el detalle de facturas pendientes para su revisión.\n\nSaludos,\nEl Equipo de Cobranzas`;
        const fileName = getExportFileName();

        window.location.href = `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        // Alert user about attachment limitation in mailto
        setTimeout(() => {
            alert(`✅ Archivo descargado: "${fileName}"\n\nPor seguridad, el navegador no permite adjuntar archivos automáticamente.\n\ninstrucciones:\n1. Busca el archivo "${fileName}" en tu carpeta de "Descargas".\n2. Arrástralo a la ventana de correo que se acaba de abrir.`);
        }, 500);
    };

    // Prepare Calendar Events from promises & Agenda
    const crmEvents = client.crmHistory
        ? client.crmHistory.filter(c => c.fecha_promesa_pago).map(c => ({
            date: c.fecha_promesa_pago,
            type: 'old_promise', // Distinguish legacy CRM promises
            note: 'Promesa (Historial)'
        }))
        : [];

    const agendaEvents = client.agendaEvents
        ? client.agendaEvents.map(e => ({
            date: e.date,
            type: e.type === 'payment_promise' ? 'promise' : 'action', // 'promise' will be the striking color
            note: e.note || (e.type === 'payment_promise' ? 'Compromiso de Pago' : 'Acción Agendada')
        }))
        : [];

    const calendarEvents = [...crmEvents, ...agendaEvents];

    // Calculate Next Due Date (Closest Future Date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort all by date
    const sortedInvoices = [...client.invoices].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Find first one >= today
    const nextFutureInvoice = sortedInvoices.find(inv => new Date(inv.dueDate) >= today);

    // If no future invoice, maybe show the latest one? Or just "-"
    const nextDueDateDisplay = nextFutureInvoice
        ? formatDate(nextFutureInvoice.dueDate)
        : (sortedInvoices.length > 0 ? "Vencido" : "-");




    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#1a1a2e] w-[90%] h-[90%] max-w-[1400px] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-card">
                    <div className="flex items-center gap-6">
                        {/* Client Info */}
                        <div>
                            <h2 className="text-2xl font-bold text-text-main flex items-center gap-3">
                                {client.name}
                                <span className={clsx("text-xs px-2 py-1 rounded-full border",
                                    client.risk === 'Excelente' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                        client.risk === 'Legal' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                            "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                )}>
                                    {client.risk}
                                </span>
                            </h2>
                            <div className="text-text-muted text-sm mt-1 flex gap-4">
                                <span>RUT: {client.rut}</span>
                                <span>•</span>
                                <span>Agente: {client.agentName}</span>
                            </div>
                        </div>

                        {/* Credit Usage Chart */}
                        <div className="h-14 w-14 relative group">
                            <Doughnut data={chartData} options={chartOptions} />
                            {/* Center Text */}
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-text-muted group-hover:text-text-main transition-colors">
                                {Math.round(usedPercentage)}%
                            </div>
                            {/* Tooltip on hover (Manual) */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 bg-black/80 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                                Uso de Crédito
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-lg transition-colors text-text-main font-medium border border-transparent hover:border-white/10"
                        title="Cerrar [ESC]"
                    >
                        <span>Cerrar</span>
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Grid Layout */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Left Panel (20%) */}
                    <div className="w-[25%] min-w-[300px] border-r border-white/10 bg-sidebar p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">

                        {/* Widget: CRM History */}
                        <Widget title="Historial CRM" className="flex-1 max-h-[50%]">
                            <div className="space-y-3">
                                {client.crmHistory && client.crmHistory.slice(0, 3).map((entry, idx) => (
                                    <div key={idx} className="text-sm border-l-2 border-accent pl-3 py-1 relative">
                                        <div className="text-xs text-text-muted mb-1 font-mono">
                                            {new Date(entry.fecha_y_hora).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                        </div>
                                        <div className="text-text-main italic line-clamp-3">
                                            "{entry.observaciones_mensaje}"
                                        </div>
                                    </div>
                                ))}
                                {(!client.crmHistory || client.crmHistory.length === 0) && (
                                    <p className="text-xs text-text-muted italic text-center py-4">No hay historial.</p>
                                )}
                            </div>
                        </Widget>

                        {/* Widget: Contacts (Mock) */}
                        <Widget title="Contactos de Pagos" className="flex-shrink-0">
                            {contacts.map((contact, idx) => (
                                <ContactCard key={idx} name={contact.name} role={contact.role} email={contact.email} />
                            ))}
                        </Widget>

                    </div>

                    {/* Main Panel (80%) */}
                    <div className="flex-1 bg-background p-6 relative overflow-hidden flex flex-col">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-card p-4 rounded-xl border border-white/5">
                                <div className="text-xs text-text-muted uppercase flex justify-between items-center">
                                    Deuda Total
                                    <span className="text-[10px] bg-white/5 px-1 rounded text-text-muted" title={`Cotización BCU: $${exchangeRate}`}>Ref. USD: ${exchangeRate}</span>
                                </div>
                                <div className="text-2xl font-bold text-text-main mt-1">
                                    {formatMoney(totalDebt, 'UYU')}
                                </div>
                            </div>
                            <div className="bg-card p-4 rounded-xl border border-white/5">
                                <div className="text-xs text-text-muted uppercase">Facturas Vencidas</div>
                                <div className="text-2xl font-bold text-red-500 mt-1">
                                    {client.invoices.filter(i => new Date(i.dueDate) < new Date()).length}
                                </div>
                            </div>
                            <div className="bg-card p-4 rounded-xl border border-white/5">
                                <div className="text-xs text-text-muted uppercase">Límite Crédito</div>
                                <div className="text-2xl font-bold text-text-main mt-1">
                                    {formatMoney(client.creditLimit)}
                                </div>
                            </div>
                            <div className="bg-card p-4 rounded-xl border border-white/5">
                                <div className="text-xs text-text-muted uppercase">Próx. Vencimiento</div>
                                <div className="text-2xl font-bold text-text-main mt-1">
                                    {nextDueDateDisplay}
                                </div>
                            </div>
                        </div>

                        {/* Invoices Table */}
                        <div className="flex-1 bg-card rounded-xl border border-white/5 overflow-hidden flex flex-col mb-10">
                            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                <h3 className="font-bold text-text-main flex items-center gap-2">
                                    <FileText size={18} className="text-accent" /> Detalle de Facturas
                                </h3>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSendMail}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-500 rounded text-xs font-bold transition-colors border border-blue-600/30"
                                    >
                                        <Mail size={14} /> Enviar Correo
                                    </button>
                                    <button
                                        onClick={handleExportExcel}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-500 rounded text-xs font-bold transition-colors border border-green-600/30"
                                    >
                                        <Download size={14} /> Exportar Excel
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-background/50 text-text-muted font-medium sticky top-0 z-10 backdrop-blur-sm">
                                        <tr>
                                            <th className="p-3 pl-4">ID Factura</th>
                                            <th className="p-3">Emisión</th>
                                            <th className="p-3">Vencimiento</th>
                                            <th className="p-3">Estado</th>
                                            <th className="p-3 text-right pr-4">Importe</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {client.invoices.map(inv => {
                                            const isOverdue = new Date(inv.dueDate) < new Date();
                                            return (
                                                <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-3 pl-4 font-mono text-text-main font-medium">#{inv.id}</td>
                                                    <td className="p-3 text-text-muted">
                                                        {inv.issueDate ? formatDate(inv.issueDate) : '-'}
                                                    </td>
                                                    <td className={clsx("p-3 font-medium", isOverdue ? "text-red-400" : "text-text-muted")}>
                                                        {formatDate(inv.dueDate)}
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={clsx("px-2 py-1 rounded text-xs font-bold", isOverdue ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500")}>
                                                            {isOverdue ? "Vencida" : "Al Día"}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right pr-4 font-mono font-bold text-text-main">
                                                        {formatMoney(inv.amount, inv.currency)}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {client.invoices.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center py-8 text-text-muted italic">No hay facturas pendientes.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Floating MiniCalendar Widget */}
                        <div
                            className={clsx(
                                "absolute bottom-0 right-0 m-6 w-72 bg-sidebar border border-card rounded-xl shadow-2xl transition-all duration-300 flex flex-col z-20 overflow-hidden",
                                isCalendarExpanded ? "h-auto" : "h-12 cursor-pointer"
                            )}
                            onClick={() => !isCalendarExpanded && setIsCalendarExpanded(true)}
                        >
                            <div
                                className="flex justify-between items-center p-3 bg-card border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsCalendarExpanded(!isCalendarExpanded);
                                }}
                            >
                                <div className="flex items-center gap-2 font-bold text-text-main text-sm">
                                    <CalendarIcon size={14} className="text-accent" />
                                    <span>Calendario de Pagos</span>
                                </div>
                                <button className="text-text-muted hover:text-white">
                                    {isCalendarExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                                </button>
                            </div>

                            <div className={clsx("p-2 bg-slate-950", !isCalendarExpanded && "hidden")}>
                                <MiniCalendar events={calendarEvents} />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

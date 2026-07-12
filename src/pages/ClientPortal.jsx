import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MiniCalendar from '../components/MiniCalendar';
import {
    CalendarCheck,
    AlertTriangle,
    CheckCircle,
    CreditCard,
    Phone,
    Shield,
    X,
    Download
} from 'lucide-react';
import clsx from 'clsx';
import { API_URL } from '../config';

export default function ClientPortal() {
    const { clientId } = useParams();

    const [client, setClient] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (clientId) {
            fetchData();
        }
    }, [clientId]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/portal/${clientId}`);
            if (!res.ok) {
                if (res.status === 404) throw new Error('Cliente no encontrado.');
                throw new Error('Error al conectar con el servidor.');
            }

            const data = await res.json();
            setClient(data.client);
            // Assign uniqueKey to handle duplicate IDs from backend
            const processedInvoices = (data.invoices || []).map((inv, idx) => ({
                ...inv,
                uniqueKey: `${inv.id}_${idx}`
            }));
            setInvoices(processedInvoices);

        } catch (err) {
            console.error("Portal Error:", err);
            setError(err.message || 'Error desconocido al cargar el portal.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (inv) => {
        if (!inv.fecha_vencimiento) return 'bg-gray-100 text-gray-800';
        const dueDate = new Date(inv.fecha_vencimiento);
        const today = new Date();
        if (dueDate < today) return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    const getStatusLabel = (inv) => {
        if (!inv.fecha_vencimiento) return 'Pendiente';
        const dueDate = new Date(inv.fecha_vencimiento);
        const today = new Date();
        return dueDate < today ? 'Vencida' : 'Al Día';
    };

    const [scheduledPayment, setScheduledPayment] = useState(null);
    const [showCalendar, setShowCalendar] = useState(false);

    const handleScheduleClick = () => {
        setShowCalendar(!showCalendar);
    };

    const handleDateChange = async ({ date, amount, comment }) => {
        if (date) {
            const parsedAmount = parseInt(amount);
            const amountStr = !isNaN(parsedAmount) && amount !== '' ? `$${parsedAmount.toLocaleString()}` : 'Monto pendiente';

            try {
                const res = await fetch(`${API_URL}/api/portal/interaction`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uuid: client.uuid,
                        type: 'schedule',
                        data: { date, amount: parsedAmount, comment }
                    })
                });

                if (!res.ok) throw new Error('Failed to save schedule');

                alert(`Pago agendado exitosamente: ${amountStr} para el ${date}`);
                setScheduledPayment({ date, amount, comment, saved: true });
                setShowCalendar(false);

            } catch (err) {
                console.error("Error guardando gestión:", err);
                alert("Hubo un error al guardar la promesa de pago. Por favor intente nuevamente.");
            }
        }
    };

    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorComment, setErrorComment] = useState('');

    const handleReportError = async () => {
        if (!errorComment.trim()) return;

        try {
            const res = await fetch(`${API_URL}/api/portal/interaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uuid: client.uuid,
                    type: 'error',
                    data: { comment: errorComment }
                })
            });

            if (!res.ok) throw new Error('Failed to report error');

            alert("Reporte enviado exitosamente. Revisaremos el caso.");
            setErrorComment('');
            setShowErrorModal(false);

        } catch (err) {
            console.error("Error reportando problema:", err);
            alert("Hubo un error al enviar el reporte. Por favor intente nuevamente.");
        }
    };

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentComment, setPaymentComment] = useState('');
    const [paymentFile, setPaymentFile] = useState(null);
    const [selectedInvoices, setSelectedInvoices] = useState(new Set());
    const [reportedAmount, setReportedAmount] = useState('');

    const toggleSelectAll = () => {
        if (selectedInvoices.size === invoices.length) {
            setSelectedInvoices(new Set());
            setReportedAmount('');
        } else {
            const allKeys = new Set(invoices.map(i => i.uniqueKey));
            setSelectedInvoices(allKeys);
            const newTotal = invoices.reduce((sum, inv) => sum + (inv.saldo_pendiente || 0), 0);
            setReportedAmount(newTotal.toString());
        }
    };

    const toggleInvoiceSelection = (uniqueKey) => {
        const newSet = new Set(selectedInvoices);
        if (newSet.has(uniqueKey)) {
            newSet.delete(uniqueKey);
        } else {
            newSet.add(uniqueKey);
        }
        setSelectedInvoices(newSet);

        // Auto-sum logic
        const newTotal = invoices
            .filter(inv => newSet.has(inv.uniqueKey))
            .reduce((sum, inv) => sum + (inv.saldo_pendiente || 0), 0);

        setReportedAmount(newTotal > 0 ? newTotal.toString() : '');
    };

    const getSelectedTotal = () => {
        return invoices
            .filter(inv => selectedInvoices.has(inv.uniqueKey))
            .reduce((sum, inv) => sum + (inv.saldo_pendiente || 0), 0);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 12 * 1024 * 1024) {
                alert("El archivo es demasiado grande. El tamaño máximo es 12MB.");
                return;
            }
            setPaymentFile(file);
        }
    };

    const handlePaymentReport = async () => {
        try {
            const comment = paymentComment.trim();
            const amountVal = parseFloat(reportedAmount);
            const selectedTotal = getSelectedTotal();

            if (isNaN(amountVal) || amountVal <= 0) {
                alert("Por favor ingrese un monto válido.");
                return;
            }

            if (selectedInvoices.size === 0) {
                alert("Por favor seleccione al menos una factura que está pagando.");
                return;
            }

            // Validation Logic
            if (Math.abs(amountVal - selectedTotal) > 1.0) {
                const diff = amountVal - selectedTotal;
                const msg = diff > 0
                    ? `El monto ingresado es mayor al total seleccionado por $${diff.toLocaleString()}. ¿Desea continuar?`
                    : `El monto ingresado es menor al total seleccionado por $${Math.abs(diff).toLocaleString()}. ¿Desea continuar?`;

                if (!window.confirm(msg)) return;
            }

            let fileUrl = '';
            let fileMsg = '';

            // Keep File Upload in Frontend for now (Supabase Storage)
            if (paymentFile) {
                const fileExt = paymentFile.name.split('.').pop();
                const fileName = `${client.uuid}/${Date.now()}_${paymentFile.name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('comprobantes')
                    .upload(fileName, paymentFile);

                if (uploadError) {
                    console.error("Error subiendo archivo:", uploadError);
                    alert("Error al subir el comprobante. Por favor intente nuevamente.");
                    return;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('comprobantes')
                    .getPublicUrl(fileName);

                fileUrl = publicUrl;
                fileMsg = ` [Comprobante: ${fileUrl}]`;
            }

            const invoiceRefs = Array.from(selectedInvoices)
                .map(key => invoices.find(i => i.uniqueKey === key)?.id)
                .filter(Boolean)
                .join(', ');

            const fullObservation = `${comment} (Facturas: ${invoiceRefs})${fileMsg}`;

            // Backend Call
            const res = await fetch(`${API_URL}/api/portal/interaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uuid: client.uuid,
                    type: 'payment',
                    data: {
                        comment: fullObservation,
                        fileUrl,
                        amount: amountVal,
                        invoices: Array.from(selectedInvoices).map(key => invoices.find(i => i.uniqueKey === key)?.id).filter(Boolean)
                    }
                })
            });

            if (!res.ok) throw new Error('Failed to report payment');

            alert("Información de pago enviada exitosamente. Gracias.");
            setPaymentComment('');
            setReportedAmount('');
            setSelectedInvoices(new Set());
            setPaymentFile(null);
            setShowPaymentModal(false);

        } catch (err) {
            console.error("Error reportando pago:", err);
            alert("Hubo un error al enviar la información. Por favor intente nuevamente.");
        }
    };

    const [showContactModal, setShowContactModal] = useState(false);
    const [contactForm, setContactForm] = useState({ name: '', phone: '', comment: '' });

    const handleContactSubmit = async () => {
        const { name, phone, comment } = contactForm;
        if (!name.trim() || !phone.trim()) {
            alert("Por favor complete su nombre y teléfono de contacto.");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/portal/interaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uuid: client.uuid,
                    type: 'contact',
                    data: { name, phone, comment }
                })
            });

            if (!res.ok) throw new Error('Failed to send contact request');

            alert("Solicitud enviada. Nos pondremos en contacto a la brevedad.");
            setContactForm({ name: '', phone: '', comment: '' });
            setShowContactModal(false);

        } catch (err) {
            console.error("Error guardando solicitud de contacto:", err);
            alert("Hubo un error al enviar la solicitud. Por favor intente nuevamente.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !client) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <AlertTriangle size={48} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Enlace no válido</h1>
                <p className="text-slate-600">{error || 'No se encontró información para este cliente.'}</p>
            </div>
        );
    }

    // Derived State for Dashboard
    const totalDeuda = invoices.reduce((sum, inv) => sum + (inv.saldo_pendiente || 0), 0);
    const expiredCount = invoices.filter(inv => getStatusLabel(inv) === 'Vencida').length;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                                    <Shield size={16} />
                                </div>
                                <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">Portal de Pagos</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
                                {client.razon_social}
                            </h1>
                            <p className="text-slate-500 font-medium mt-1 text-sm flex items-center gap-2">
                                RUT: <span className="font-mono text-slate-700">{client.rut_ci}</span>
                            </p>
                        </div>
                        <div className="text-right hidden md:block">
                            <div className="text-sm text-slate-500 uppercase tracking-wide font-bold">Total a Pagar</div>
                            <div className="text-3xl font-bold text-slate-900">
                                $ {invoices.reduce((sum, inv) => sum + (inv.saldo_pendiente || 0), 0).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Total (Visible only on small screens) */}
            <div className="md:hidden bg-blue-600 text-white px-6 py-4 shadow-inner">
                <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-100 text-sm">Total Pendiente</span>
                    <span className="text-2xl font-bold">
                        $ {invoices.reduce((sum, inv) => sum + (inv.saldo_pendiente || 0), 0).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">

                {/* Total Debt Card */}


                {/* Invoices List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-lg">Documentos Pendientes</h3>
                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">
                            {invoices.length} docs
                        </span>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 font-bold tracking-wider">F. Emisión</th>
                                        <th className="px-6 py-4 font-bold tracking-wider">Vencimiento</th>
                                        <th className="px-6 py-4 font-bold tracking-wider">Documento</th>
                                        <th className="px-6 py-4 font-bold tracking-wider text-right">Monto Original</th>
                                        <th className="px-6 py-4 font-bold tracking-wider text-right">Saldo</th>
                                        <th className="px-6 py-4 font-bold tracking-wider text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {invoices.map((inv) => (
                                        <tr key={inv.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-slate-500">{inv.fecha_emision}</td>
                                            <td className="px-6 py-4 font-mono text-slate-500">{inv.fecha_vencimiento}</td>
                                            <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                                                {inv.tipo_documento} {inv.id}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-slate-400 text-right">
                                                {inv.moneda} {inv.monto_total.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-slate-800 text-right">
                                                {inv.moneda} {inv.saldo_pendiente.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={clsx(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                                                    inv.estado === 'Vencida' ? "bg-red-50 text-red-600 border-red-100" :
                                                        inv.estado === 'Por Vencer' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                            "bg-blue-50 text-blue-600 border-blue-100"
                                                )}>
                                                    {inv.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Mobile Card View (Hidden on Desktop) since Table scrolls horizontally on mobile */}
                            <div className="md:hidden divide-y divide-slate-100">
                                {invoices.map((inv) => (
                                    <div key={inv.id} className="p-4 bg-white relative">
                                        <div className={clsx("absolute left-0 top-0 bottom-0 w-1", inv.estado === 'Vencida' ? 'bg-red-500' : 'bg-blue-500')} />
                                        <div className="flex justify-between items-start mb-2 pl-3">
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">{inv.doc_type} #{inv.id}</p>
                                                <p className="font-bold text-slate-900">{inv.moneda} {inv.saldo_pendiente.toLocaleString()}</p>
                                            </div>
                                            <span className={clsx("text-[10px] px-2 py-1 rounded font-bold border", inv.estado === 'Vencida' ? "bg-red-50 text-red-600 border-red-100" : "bg-blue-50 text-blue-600 border-blue-100")}>{inv.estado}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-500 pl-3">
                                            <span>Ven: {inv.fecha_vencimiento}</span>
                                            <span>Total: {inv.monto_total.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {invoices.length === 0 && (
                            <div className="p-12 text-center text-slate-400">
                                No tienes facturas pendientes.
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)]">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="relative">
                            <button
                                onClick={handleScheduleClick}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors text-sm relative z-50"
                            >
                                <CalendarCheck size={18} className="text-slate-500" />
                                {scheduledPayment?.saved
                                    ? `Agendado: ${scheduledPayment.date} ($${scheduledPayment.amount})`
                                    : 'Agendar Pago'}
                            </button>
                        </div>
                        {/* Report Error Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowErrorModal(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors text-sm"
                            >
                                <AlertTriangle size={18} className="text-orange-500" />
                                Reportar Error
                            </button>
                        </div>

                        {/* Payment Report Button (Ya Pagué) */}
                        <div className="relative col-span-2 lg:col-span-1">
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg font-bold transition-colors text-sm"
                            >
                                <CheckCircle size={18} />
                                Ya Pagué
                            </button>
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                            <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-blue-600/20 text-sm">
                                <CreditCard size={18} />
                                Pagar Online
                            </button>
                        </div>

                        {/* Contact Button */}
                        <div className="relative col-span-2 lg:col-span-1">
                            <button
                                onClick={() => setShowContactModal(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition-colors text-sm"
                            >
                                <Phone size={18} />
                                Contactarme
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS - HOISTED TO ROOT LEVEL FOR PROPER CENTERING */}

            {/* Schedule Modal */}
            {
                showCalendar && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-800">Agendar Compromiso</h3>
                                <button onClick={() => setShowCalendar(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-center mb-6">
                                    <MiniCalendar
                                        inline={true}
                                        onChange={({ date, amount }) => {
                                            setScheduledPayment(prev => ({ ...prev, date, amount }));
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Comentarios / Observaciones</label>
                                    <textarea
                                        className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={scheduledPayment?.comment || ''}
                                        onChange={(e) => setScheduledPayment(prev => ({ ...prev, comment: e.target.value }))}
                                    />
                                </div>

                                <button
                                    onClick={() => handleDateChange({ ...scheduledPayment })}
                                    disabled={!scheduledPayment?.date || !scheduledPayment?.amount}
                                    className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                                >
                                    Guardar Promesa
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Error Report Modal */}
            {
                showErrorModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-800">Reportar Error</h3>
                                <button onClick={() => setShowErrorModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3 text-amber-800 text-sm">
                                        <AlertTriangle className="shrink-0" size={20} />
                                        <p>Por favor describe el error encontrado en tu cuenta o factura. Revisaremos tu caso a la brevedad.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase">Comentarios / Descripción del Error</label>
                                        <textarea
                                            className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                            value={errorComment}
                                            onChange={(e) => setErrorComment(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        onClick={handleReportError}
                                        disabled={!errorComment.trim()}
                                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
                                    >
                                        Enviar Reporte
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Payment Report Modal (Advanced) */}
            {
                showPaymentModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                            {/* Header */}
                            <div className="p-4 border-b border-green-50 flex justify-between items-center bg-green-50/30 shrink-0">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="text-green-600" size={20} />
                                    <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wider">Informar Pago Realizado</h3>
                                </div>
                                <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content Body */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 overflow-hidden flex-1">
                                {/* Left Column: Invoices List */}
                                <div className="lg:col-span-2 flex flex-col h-[40vh] lg:h-full bg-slate-50/30 overflow-hidden">
                                    <div className="p-4 flex-none flex justify-between items-center border-b border-white bg-white/50">
                                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-widest">Documentos ({selectedInvoices.size})</h4>
                                        <button onClick={toggleSelectAll} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                                            {selectedInvoices.size === invoices.length ? 'Deseleccionar' : 'Select all'}
                                        </button>
                                    </div>
                                    <div className="p-4 overflow-y-auto flex-1">
                                        <div className="space-y-2">
                                            {invoices.map(inv => {
                                                const isSelected = selectedInvoices.has(inv.uniqueKey);
                                                return (
                                                    <div
                                                        key={inv.uniqueKey}
                                                        onClick={() => toggleInvoiceSelection(inv.uniqueKey)}
                                                        className={clsx(
                                                            "p-3 rounded-xl border cursor-pointer transition-all",
                                                            isSelected ? "bg-green-50 border-green-500" : "bg-white border-slate-200"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className={clsx("w-5 h-5 rounded flex items-center justify-center border transition-all", isSelected ? "bg-green-600 border-green-600 text-white" : "border-slate-300")}>
                                                                    {isSelected && <CheckCircle size={12} strokeWidth={4} />}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-slate-800 text-sm">#{inv.id}</div>
                                                                    <div className="text-[10px] text-slate-400 font-mono">{inv.fecha_vencimiento}</div>
                                                                </div>
                                                            </div>
                                                            <div className="font-mono font-bold text-slate-700 text-sm">
                                                                {inv.currency} {inv.saldo_pendiente.toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Payment Details Form */}
                                <div className="lg:col-span-1 p-6 space-y-5 bg-white overflow-y-auto">
                                    <div className="bg-slate-900 p-4 rounded-xl text-center">
                                        <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Total Seleccionado</p>
                                        <p className="text-2xl font-black text-white">$ {getSelectedTotal().toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] mobile-label uppercase font-bold text-slate-400">Monto Real</label>
                                            <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold" value={reportedAmount} onChange={(e) => setReportedAmount(e.target.value)} />
                                            {reportedAmount && Math.abs(parseFloat(reportedAmount) - getSelectedTotal()) > 1 && (
                                                <div className="mt-2 p-2.5 bg-amber-50 border border-amber-100 rounded-lg flex gap-2 items-start animate-in fade-in slide-in-from-top-1">
                                                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={14} />
                                                    <p className="text-xs text-amber-800 leading-snug font-medium">
                                                        El monto ingresado no coincide con el total de los documentos seleccionados.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase">Comentarios</label>
                                            <textarea
                                                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                                value={paymentComment}
                                                onChange={(e) => setPaymentComment(e.target.value)}
                                                placeholder="Opcional..."
                                            />
                                        </div>
                                        <label className={clsx("flex items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors", paymentFile ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-blue-400")}>
                                            {paymentFile ? <span className="text-xs font-bold text-green-700 truncate">{paymentFile.name}</span> : <span className="text-xs font-bold text-slate-400">+ Adjuntar Archivo</span>}
                                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Footer: Fixed Action Button */}
                            <div className="p-4 bg-white border-t border-slate-100 shrink-0 z-10">
                                <button
                                    onClick={handlePaymentReport}
                                    disabled={!reportedAmount}
                                    className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all active:scale-[0.98]"
                                >
                                    Enviar Informe
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Contact Modal */}
            {
                showContactModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-800">Datos de Contacto</h3>
                                <button onClick={() => setShowContactModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Nombre</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all"
                                        value={contactForm.name}
                                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Teléfono</label>
                                    <input
                                        type="tel"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all"
                                        value={contactForm.phone}
                                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Comentarios</label>
                                    <textarea
                                        className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all"
                                        value={contactForm.comment}
                                        onChange={(e) => setContactForm({ ...contactForm, comment: e.target.value })}
                                    />
                                </div>
                                <button
                                    onClick={handleContactSubmit}
                                    className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-800/20 transition-all active:scale-[0.98]"
                                >
                                    Enviar Solicitud
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

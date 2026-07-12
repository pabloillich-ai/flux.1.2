import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import MiniCalendar from '../components/MiniCalendar';
import {
    CalendarCheck,
    AlertTriangle,
    CheckCircle,
    CreditCard,
    Phone,
    Download,
    ChevronDown,
    Shield,
    X
} from 'lucide-react';
import clsx from 'clsx';

import { API_URL } from '../config';

export default function ClientPortal() {
    const { clientId } = useParams();

    const [client, setClient] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeAction, setActiveAction] = useState(null); // 'schedule', 'error', 'payment', 'contact'

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
        // Simple logic: if overdue > red, else blue/green
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

    const handleActionToggle = (action) => {
        if (activeAction === action) {
            setActiveAction(null);
        } else {
            setActiveAction(action);
        }
    };

    // Lock body scroll when modal is open
    useEffect(() => {
        if (activeAction) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [activeAction]);


    const handleDateChange = async ({ date, amount, comment }) => {
        if (date) {
            const parsedAmount = parseInt(amount);
            const amountStr = !isNaN(parsedAmount) && amount !== '' ? `$${parsedAmount.toLocaleString()}` : 'Monto pendiente';

            try {
                const res = await fetch(`${API_URL}/api/portal/interaction`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uuid: client.uuid, // Using custom_uuid as the key
                        type: 'schedule',
                        data: { date, amount: parsedAmount, comment }
                    })
                });

                if (!res.ok) throw new Error('Failed to save schedule');


                alert(`Pago agendado exitosamente: ${amountStr} para el ${date}`);
                setScheduledPayment({ date, amount, comment, saved: true });
                setActiveAction(null);

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
            setActiveAction(null);

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
            if (Math.abs(amountVal - selectedTotal) > 1.0) { // Allow $1 difference for rounding
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
            setActiveAction(null);

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
            setActiveAction(null);

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

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-200">
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
                {/* Mobile Actions Bar - Inline */}
                <div className="md:hidden mb-6 bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                    <div className="p-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Acciones Rápidas</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleActionToggle('schedule')}
                                className={clsx(
                                    "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-sm",
                                    activeAction === 'schedule' ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"
                                )}
                            >
                                <CalendarCheck size={18} />
                                <span>Agendar</span>
                            </button>
                            <button
                                onClick={() => handleActionToggle('payment')}
                                className={clsx(
                                    "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-sm",
                                    activeAction === 'payment' ? "bg-green-600 border-green-600 text-white" : "bg-white border-slate-200 text-slate-700 hover:border-green-300"
                                )}
                            >
                                <CheckCircle size={18} />
                                <span>Ya Pagué</span>
                            </button>
                            <button
                                onClick={() => handleActionToggle('contact')}
                                className={clsx(
                                    "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-sm",
                                    activeAction === 'contact' ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                                )}
                            >
                                <Phone size={18} />
                                <span>Contacto</span>
                            </button>
                            <button
                                onClick={() => handleActionToggle('error')}
                                className={clsx(
                                    "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-sm",
                                    activeAction === 'error' ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-slate-200 text-slate-700 hover:border-orange-300"
                                )}
                            >
                                <AlertTriangle size={18} />
                                <span>Error</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Desktop */}
                <div className="hidden md:grid grid-cols-5 gap-4 mb-10">
                    <button
                        onClick={() => handleActionToggle('schedule')}
                        className={clsx(
                            "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group",
                            activeAction === 'schedule' ? "bg-blue-600 border-blue-600 text-white shadow-lg" : "bg-white border-slate-100 hover:border-blue-200 text-slate-600 hover:bg-blue-50/50"
                        )}
                    >
                        <CalendarCheck size={28} className={clsx("mb-2", activeAction === 'schedule' ? "text-blue-100" : "text-blue-500")} />
                        <span className="text-xs font-black uppercase tracking-wider">Agendar Pago</span>
                    </button>

                    <button
                        onClick={() => handleActionToggle('payment')}
                        className={clsx(
                            "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group",
                            activeAction === 'payment' ? "bg-green-600 border-green-600 text-white shadow-lg" : "bg-white border-slate-100 hover:border-green-200 text-slate-600 hover:bg-green-50/50"
                        )}
                    >
                        <CheckCircle size={28} className={clsx("mb-2", activeAction === 'payment' ? "text-green-100" : "text-green-500")} />
                        <span className="text-xs font-black uppercase tracking-wider">Ya Pagué</span>
                    </button>

                    <button
                        className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 bg-white border-slate-100 hover:border-blue-200 text-slate-600 hover:bg-blue-50/50 transition-all"
                    >
                        <CreditCard size={28} className="text-blue-600 mb-2" />
                        <span className="text-xs font-black uppercase tracking-wider">Pagar Online</span>
                    </button>

                    <button
                        onClick={() => handleActionToggle('contact')}
                        className={clsx(
                            "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group",
                            activeAction === 'contact' ? "bg-slate-800 border-slate-800 text-white shadow-lg" : "bg-white border-slate-100 hover:border-slate-300 text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <Phone size={28} className={clsx("mb-2", activeAction === 'contact' ? "text-slate-300" : "text-slate-700")} />
                        <span className="text-xs font-black uppercase tracking-wider">Contacto</span>
                    </button>

                    <button
                        onClick={() => handleActionToggle('error')}
                        className={clsx(
                            "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group",
                            activeAction === 'error' ? "bg-orange-500 border-orange-500 text-white shadow-lg" : "bg-white border-slate-100 hover:border-orange-200 text-slate-600 hover:bg-orange-50/50"
                        )}
                    >
                        <AlertTriangle size={28} className={clsx("mb-2", activeAction === 'error' ? "text-orange-100" : "text-orange-500")} />
                        <span className="text-xs font-black uppercase tracking-wider">Error</span>
                    </button>
                </div>


                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Documentos Pendientes</h2>
                    <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-bold">
                        {invoices.length} docs
                    </span>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">F. Emisión</th>
                                <th className="px-6 py-4">Vencimiento</th>
                                <th className="px-6 py-4">Documento</th>
                                <th className="px-6 py-4 text-right">Monto Original</th>
                                <th className="px-6 py-4 text-right">Saldo</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoices.map((inv, idx) => (
                                <tr key={inv.id || idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                                        {inv.fecha_emision || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-700 font-mono">
                                        {inv.fecha_vencimiento}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-900">
                                        {inv.doc_type || 'Factura'} <span className="text-slate-400">#{inv.id}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 text-right font-mono">
                                        {inv.currency} {(inv.monto_total || inv.saldo_pendiente).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right font-mono">
                                        {inv.currency} {inv.saldo_pendiente.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border", getStatusColor(inv))}>
                                            {getStatusLabel(inv)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {invoices.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            No tienes facturas pendientes. ¡Genial!
                        </div>
                    )}
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {invoices.map((inv, idx) => (
                        <div key={inv.id || idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
                            <div className={clsx("absolute top-0 left-0 w-1.5 h-full",
                                getStatusLabel(inv) === 'Vencida' ? 'bg-red-500' : 'bg-blue-500'
                            )}></div>

                            <div className="flex justify-between items-start mb-4 pl-3">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                                        {inv.doc_type || 'Factura'} #{inv.id}
                                    </p>
                                    <h3 className="text-lg font-bold text-slate-900 font-mono">
                                        {inv.currency} {inv.saldo_pendiente.toLocaleString()}
                                    </h3>
                                    <p className="text-xs text-slate-400">Total: {inv.currency} {(inv.monto_total || inv.saldo_pendiente).toLocaleString()}</p>
                                </div>
                                <span className={clsx("px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wide", getStatusColor(inv))}>
                                    {getStatusLabel(inv)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3 pl-3">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Emisión</p>
                                    <p className="text-sm font-medium text-slate-700">{inv.fecha_emision || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Vence</p>
                                    <p className={clsx("text-sm font-medium", getStatusLabel(inv) === 'Vencida' ? 'text-red-600' : 'text-slate-700')}>
                                        {inv.fecha_vencimiento}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {invoices.length === 0 && (
                        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
                            No tienes facturas pendientes.
                        </div>
                    )}
                </div>
            </main>

            {/* Centered Modal System - React Portal for absolute layout independence */}
            {activeAction && createPortal(
                <div className="portal-root">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] animate-in fade-in duration-200"
                        onClick={() => setActiveAction(null)}
                    />

                    {/* Modal Container - Centered */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
                        <div className="w-full max-w-4xl my-auto pointer-events-auto animate-in zoom-in-95 fade-in duration-300">
                            {activeAction === 'schedule' && (
                                <div id="action-schedule" className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                                    <div className="p-5 border-b border-blue-50 flex justify-between items-center bg-blue-50/30">
                                        <div className="flex items-center gap-2">
                                            <CalendarCheck className="text-blue-600" size={20} />
                                            <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wider">Agendar Compromiso de Pago</h3>
                                        </div>
                                        <button onClick={() => setActiveAction(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-6 md:p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="flex justify-center md:justify-start">
                                                <MiniCalendar
                                                    inline={true}
                                                    onChange={({ date, amount }) => {
                                                        setScheduledPayment(prev => ({ ...prev, date, amount }));
                                                    }}
                                                />
                                            </div>
                                            <div className="flex flex-col justify-between">
                                                <div className="space-y-4">
                                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
                                                        <p className="font-bold mb-1">¿Cuándo puedes pagar?</p>
                                                        <p>Selecciona la fecha en el calendario e ingresa el monto aproximado.</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-xs font-bold text-slate-500 uppercase">Observaciones</label>
                                                        <textarea
                                                            className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                                            placeholder="Ej: Transferencia al final del día..."
                                                            value={scheduledPayment?.comment || ''}
                                                            onChange={(e) => setScheduledPayment(prev => ({ ...prev, comment: e.target.value }))}
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDateChange({ ...scheduledPayment })}
                                                    disabled={!scheduledPayment?.date || !scheduledPayment?.amount}
                                                    className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] text-lg"
                                                >
                                                    Confirmar Fecha {scheduledPayment?.date && `(${scheduledPayment.date})`}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeAction === 'payment' && (
                                <div id="action-payment" className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                                    <div className="p-5 border-b border-green-50 flex justify-between items-center bg-green-50/30">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="text-green-600" size={20} />
                                            <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wider">Informar Pago Realizado</h3>
                                        </div>
                                        <button onClick={() => setActiveAction(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                                        <div className="lg:col-span-2 flex flex-col h-full bg-slate-50/30">
                                            <div className="p-4 flex-none flex justify-between items-center border-b border-white bg-white/50">
                                                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-widest">Documentos ({selectedInvoices.size})</h4>
                                                <button onClick={toggleSelectAll} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                                                    {selectedInvoices.size === invoices.length ? 'Deseleccionar' : 'Select all'}
                                                </button>
                                            </div>
                                            <div className="p-4 max-h-[300px] overflow-y-auto">
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
                                        <div className="lg:col-span-1 p-6 space-y-5 bg-white">
                                            <div className="bg-slate-900 p-4 rounded-xl text-center">
                                                <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Total Seleccionado</p>
                                                <p className="text-2xl font-black text-white">$ {getSelectedTotal().toLocaleString()}</p>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] mobile-label uppercase font-bold text-slate-400">Monto Real</label>
                                                    <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold" value={reportedAmount} onChange={(e) => setReportedAmount(e.target.value)} />
                                                </div>
                                                <label className={clsx("flex items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors", paymentFile ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-blue-400")}>
                                                    {paymentFile ? <span className="text-xs font-bold text-green-700 truncate">{paymentFile.name}</span> : <span className="text-xs font-bold text-slate-400">+ Adjuntar Archivo</span>}
                                                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" />
                                                </label>
                                                <button onClick={handlePaymentReport} disabled={!reportedAmount} className="w-full py-3 bg-green-600 text-white rounded-lg font-bold shadow-lg">Enviar Informe</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeAction === 'error' && (
                                <div id="action-error" className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                                    <div className="p-5 border-b border-orange-50 flex justify-between items-center bg-orange-50/30">
                                        <div className="flex items-center gap-2 text-orange-700">
                                            <AlertTriangle size={20} />
                                            <h3 className="font-bold uppercase text-sm tracking-wider">Reportar Inconsistencia</h3>
                                        </div>
                                        <button onClick={() => setActiveAction(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-6 md:p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="md:col-span-1">
                                                <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 flex flex-col items-center text-center h-full justify-center">
                                                    <AlertTriangle className="text-orange-500 mb-2" size={32} />
                                                    <p className="text-sm font-bold text-orange-900">¿Problema?</p>
                                                    <p className="text-xs text-orange-700 mt-2">Cuéntanos qué está mal con el cobro.</p>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 space-y-4">
                                                <textarea
                                                    className="w-full h-40 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-800 text-base focus:border-orange-500 focus:outline-none transition-all italic"
                                                    placeholder="Descripción del error..."
                                                    value={errorComment}
                                                    onChange={(e) => setErrorComment(e.target.value)}
                                                    autoFocus
                                                />
                                                <button onClick={handleReportError} disabled={!errorComment.trim()} className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold shadow-lg">
                                                    Enviar Reporte
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeAction === 'contact' && (
                                <div id="action-contact" className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <div className="flex items-center gap-2">
                                            <Phone className="text-slate-800" size={20} />
                                            <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wider">Solicitar Contacto</h3>
                                        </div>
                                        <button onClick={() => setActiveAction(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-8">
                                        <div className="space-y-6 max-w-3xl mx-auto">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tu Nombre</label>
                                                    <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</label>
                                                    <input type="tel" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold text-slate-400 uppercase">Mensaje</label>
                                                <textarea className="w-full h-24 p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" value={contactForm.comment} onChange={(e) => setContactForm({ ...contactForm, comment: e.target.value })} />
                                            </div>
                                            <button onClick={handleContactSubmit} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-lg shadow-xl">Solicitar ahora</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}


        </div>
    );
}

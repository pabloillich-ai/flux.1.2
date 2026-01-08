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
    Download,
    ChevronDown,
    Shield
} from 'lucide-react';
import clsx from 'clsx';

export default function ClientPortal() {
    const { clientId } = useParams();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
            setInvoices(data.invoices || []);

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
                        uuid: client.uuid, // Using custom_uuid as the key
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

            const fullObservation = `${comment}${fileMsg}`;
            if (!fullObservation.trim()) {
                alert("Por favor agregue un comentario o adjunte un comprobante.");
                return;
            }

            // Backend Call
            const res = await fetch(`${API_URL}/api/portal/interaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uuid: client.uuid,
                    type: 'payment',
                    data: { comment, fileUrl }
                })
            });

            if (!res.ok) throw new Error('Failed to report payment');


            alert("Información de pago enviada exitosamente. Gracias.");
            setPaymentComment('');
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

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)]">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="relative">
                            {showCalendar && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ margin: 0 }}>
                                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                            <h3 className="font-bold text-slate-800">Agendar Compromiso</h3>
                                            <button onClick={() => setShowCalendar(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
                                                <AlertTriangle className="rotate-45" size={20} style={{ transform: 'rotate(45deg)' }} /> {/* Using AlertTriangle rotated as X if X not imported, or just import X */}
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
                            )}
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
                        {/* Report Error Button - Modified to open Modal */}
                        <div className="relative">
                            {showErrorModal && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ margin: 0 }}>
                                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                            <h3 className="font-bold text-slate-800">Reportar Error</h3>
                                            <button onClick={() => setShowErrorModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
                                                <AlertTriangle className="rotate-45" size={20} style={{ transform: 'rotate(45deg)' }} />
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
                            )}
                            <button
                                onClick={() => setShowErrorModal(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors text-sm"
                            >
                                <AlertTriangle size={18} className="text-orange-500" />
                                Reportar Error
                            </button>
                        </div>

                        {/* Payment Report Button (Ya Pagué) */}
                        <div className="relative">
                            {showPaymentModal && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ margin: 0 }}>
                                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                            <h3 className="font-bold text-slate-800">Informar Pago</h3>
                                            <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
                                                <AlertTriangle className="rotate-45" size={20} style={{ transform: 'rotate(45deg)' }} />
                                            </button>
                                        </div>
                                        <div className="p-6">
                                            <div className="space-y-4">
                                                <div className="p-4 bg-green-50 rounded-lg border border-green-100 flex gap-3 text-green-800 text-sm">
                                                    <CheckCircle className="shrink-0" size={20} />
                                                    <p>Si ya realizaste el pago, por favor infórmalo aquí adjuntando el comprobante si lo tienes.</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-xs font-bold text-slate-500 uppercase">Comentarios</label>
                                                    <textarea
                                                        className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                                        value={paymentComment}
                                                        onChange={(e) => setPaymentComment(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-xs font-bold text-slate-500 uppercase">Adjuntar Comprobante (Máx 12MB)</label>
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            onChange={handleFileChange}
                                                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer border border-slate-200 rounded-lg"
                                                            accept="image/*,application/pdf"
                                                        />
                                                        {paymentFile && (
                                                            <div className="mt-1 text-xs text-green-600 font-bold flex items-center gap-1">
                                                                <CheckCircle size={12} />
                                                                {paymentFile.name} ({(paymentFile.size / 1024 / 1024).toFixed(2)} MB)
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handlePaymentReport}
                                                    disabled={!paymentComment.trim() && !paymentFile}
                                                    className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all active:scale-[0.98]"
                                                >
                                                    Informar Pago
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg font-bold transition-colors text-sm"
                            >
                                <CheckCircle size={18} />
                                Ya Pagué
                            </button>
                        </div>

                        <button className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-blue-600/20 text-sm">
                            <CreditCard size={18} />
                            Pagar Online
                        </button>

                        {/* Contact Modal */}
                        <div className="relative">
                            {showContactModal && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ margin: 0 }}>
                                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                            <h3 className="font-bold text-slate-800">Datos de Contacto</h3>
                                            <button onClick={() => setShowContactModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
                                                <AlertTriangle className="rotate-45" size={20} style={{ transform: 'rotate(45deg)' }} />
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
                            )}
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
        </div>
    );
}

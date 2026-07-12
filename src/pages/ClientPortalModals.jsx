{/* Centered Modal System - Outside main for full viewport access */ }
{
    activeAction && (
        <>
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
                                            {selectedInvoices.size === invoices.length ? 'Deseleccionar' : 'Seleccionar Todo'}
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
        </>
    )
}

import React, { useState, useEffect } from 'react';
import { X, Edit2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Reusing Risk Labels logic for consistency
const RISK_LABELS = {
    'Excelente': 'Excelente',
    'Buen Pagador': 'Buen Pagador',
    'Regular': 'Regular',
    'Atraso Frecuente': 'Atraso Frecuente',
    'Mal Pagador': 'Mal Pagador',
    'Legal': 'Legal',
    'Incobrable': 'Incobrable'
};

const EditDebtorModal = ({ debtor, onClose, onSave }) => {
    // Initial State is just what we have, but we'll fetch more
    const [formData, setFormData] = useState({
        uuid: null,
        razon_social: debtor.name,
        nombre_fantasia: '',
        rut_ci: debtor.id, // debtor.id usually holds the RUT/CI in the dashboard mapping
        tel: debtor.phone,
        email_facturacion: debtor.email,
        direccion: '',
        departamento: '',
        agente: '',
        status_riesgo: debtor.risk || 'Regular',
        limite_de_credito: 0,
        plazo_pago_dias: 30,
        clasificacion: '',
        Alert_exclud: false
    });
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Full Data on Mount
    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                // 1. Fetch Agents for Dropdown
                const { data: agentsData } = await supabase.from('users').select('id, full_name');
                setAgents(agentsData || []);

                // 2. Fetch Client Details
                // We assume debtor.id maps to id_cliente. If not, we might fail to find it by id_cliente.
                // But dashboard.id is usually the RUT/ID used for id_cliente
                const { data: clientData, error } = await supabase
                    .from('clientes_maestra')
                    .select('*')
                    .eq('id_cliente', debtor.id)
                    .single();

                if (clientData) {
                    setFormData({
                        uuid: clientData.uuid,
                        razon_social: clientData.razon_social || debtor.name,
                        nombre_fantasia: clientData.nombre_fantasia || '',
                        rut_ci: clientData.rut_ci || debtor.id,
                        tel: clientData.tel || debtor.phone,
                        email_facturacion: clientData.email_facturacion || debtor.email,
                        direccion: clientData.direccion || '',
                        departamento: clientData.departamento || '',
                        agente: clientData.agente || '',
                        status_riesgo: clientData.status_riesgo || debtor.risk || 'Regular',
                        limite_de_credito: clientData.limite_de_credito || 0,
                        plazo_pago_dias: clientData.plazo_pago_dias || 30,
                        clasificacion: clientData.clasificacion || '',
                        Alert_exclud: clientData.Alert_exclud || false
                    });
                } else if (error) {
                    console.warn("Could not fetch details, using partial data:", error);
                }
            } catch (err) {
                console.error("Error fetching client details", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [debtor]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-blur-sm">
                <div className="bg-[#1a1d24] p-8 rounded-xl border border-white/10 text-white animate-pulse">
                    Cargando datos del cliente...
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
            <div className="bg-[#1a1d24] w-full max-w-4xl max-h-[90vh] rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-[#14161b]">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Edit2 size={20} className="text-blue-500" /> Editar Cliente: {formData.razon_social}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2 border-b border-white/5 pb-2">Información Principal</h3>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">ID Cliente / RUT</label>
                                <input
                                    className="input-field opacity-60 cursor-not-allowed"
                                    value={formData.rut_ci || ''}
                                    disabled
                                    title="No editable"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Razón Social</label>
                                <input
                                    className="input-field"
                                    value={formData.razon_social || ''}
                                    onChange={e => handleChange('razon_social', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Nombre Fantasía</label>
                                <input
                                    className="input-field"
                                    value={formData.nombre_fantasia || ''}
                                    onChange={e => handleChange('nombre_fantasia', e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Agente Asignado</label>
                                <select
                                    className="input-field"
                                    value={formData.agente || ''}
                                    onChange={e => handleChange('agente', e.target.value)}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2 border-b border-white/5 pb-2">Contacto & Ubicación</h3>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Email Facturación</label>
                                <input
                                    className="input-field"
                                    type="email"
                                    value={formData.email_facturacion || ''}
                                    onChange={e => handleChange('email_facturacion', e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Teléfono</label>
                                <input
                                    className="input-field"
                                    value={formData.tel || ''}
                                    onChange={e => handleChange('tel', e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Dirección</label>
                                <input
                                    className="input-field"
                                    value={formData.direccion || ''}
                                    onChange={e => handleChange('direccion', e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Departamento</label>
                                <input
                                    className="input-field"
                                    value={formData.departamento || ''}
                                    onChange={e => handleChange('departamento', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Financial Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2 border-b border-white/5 pb-2">Financiero y Riesgo</h3>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Límite de Crédito</label>
                                <input
                                    className="input-field"
                                    type="number"
                                    value={formData.limite_de_credito}
                                    onChange={e => handleChange('limite_de_credito', e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Plazo Pago (Días)</label>
                                <input
                                    className="input-field"
                                    type="number"
                                    value={formData.plazo_pago_dias}
                                    onChange={e => handleChange('plazo_pago_dias', e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Status Riesgo</label>
                                <select
                                    className="input-field"
                                    value={formData.status_riesgo}
                                    onChange={e => handleChange('status_riesgo', e.target.value)}
                                >
                                    {Object.keys(RISK_LABELS).map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Clasificación</label>
                                <input
                                    className="input-field"
                                    value={formData.clasificacion || ''}
                                    onChange={e => handleChange('clasificacion', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* System Config */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2 border-b border-white/5 pb-2">Configuración Sistema</h3>

                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                <input
                                    type="checkbox"
                                    id="alert_exclud_modal"
                                    className="w-5 h-5 accent-blue-500 cursor-pointer"
                                    checked={formData.Alert_exclud || false}
                                    onChange={e => handleChange('Alert_exclud', e.target.checked)}
                                />
                                <div className="cursor-pointer" onClick={() => handleChange('Alert_exclud', !formData.Alert_exclud)}>
                                    <label htmlFor="alert_exclud_modal" className="text-sm font-bold text-white cursor-pointer pointer-events-none">Excluir de Alertas Automáticas</label>
                                    <p className="text-xs text-gray-500 pointer-events-none">Si se activa, este cliente no recibirá notificaciones automáticas.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t border-white/10 bg-[#14161b] flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2 text-sm"
                    >
                        <Save size={18} /> Guardar Cambios
                    </button>
                </div>
            </div>
            <style>{`
            .input-field {
                background: #0f1115;
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: white;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 0.875rem;
                outline: none;
                transition: border-color 0.2s;
                width: 100%;
            }
            .input-field:focus {
                border-color: #3b82f6;
            }
            `}</style>
        </div>
    );
};

export default EditDebtorModal;

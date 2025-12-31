import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus, Filter, User, Mail, Phone, Briefcase, Building2, UserCircle } from 'lucide-react';
import clsx from 'clsx';

// === NEW CONTACT MODAL ===
function NewContactModal({ isOpen, onClose, onSave, roles = [], clients = [], initialData = null }) {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        cliente: '',
        uuid_Client: '', // Store UUID separately
        cargo: '',
        rol_cod: '',
        email: '',
        movil: '',
        tel: ''
    });
    const [saving, setSaving] = useState(false);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    nombre: initialData.nombre || '',
                    apellido: initialData.apellido || '',
                    cliente: initialData.cliente || '',
                    uuid_Client: initialData.uuid_Client || initialData.uuid_client || '', // Handle varied casing
                    cargo: initialData.cargo || '',
                    rol_cod: initialData.rol_cod || '',
                    email: initialData.email || '',
                    movil: initialData.movil || '',
                    tel: initialData.tel || ''
                });
            } else {
                setFormData({
                    nombre: '',
                    apellido: '',
                    cliente: '',
                    uuid_Client: '',
                    cargo: '',
                    rol_cod: '',
                    email: '',
                    movil: '',
                    tel: ''
                });
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave(formData);
        setSaving(false);
    };

    // Client Selection Handler
    const handleClientChange = (e) => {
        const selectedId = e.target.value;
        const selectedClient = clients.find(c => c.uuid === selectedId);
        setFormData({
            ...formData,
            uuid_Client: selectedId,
            cliente: selectedClient ? selectedClient.razon_social : ''
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-white/10 bg-white/5 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Plus className="text-accent" size={20} /> {initialData ? 'Editar Contacto' : 'Nuevo Contacto'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-white/10 text-text-muted hover:text-white transition-colors"
                    >
                        <User size={20} className="rotate-45" strokeWidth={2.5} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Nombre <span className="text-accent">*</span></label>
                            <input
                                required
                                type="text"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main focus:border-accent focus:bg-accent/5 focus:outline-none transition-all placeholder:text-white/20"
                                placeholder="Ej. Juan"
                                value={formData.nombre}
                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Apellido</label>
                            <input
                                type="text"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main focus:border-accent focus:bg-accent/5 focus:outline-none transition-all placeholder:text-white/20"
                                placeholder="Ej. Pérez"
                                value={formData.apellido}
                                onChange={e => setFormData({ ...formData, apellido: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Empresa / Cliente <span className="text-accent">*</span></label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                                <select
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-text-main focus:border-accent focus:bg-accent/5 focus:outline-none transition-all appearance-none cursor-pointer"
                                    value={formData.uuid_Client}
                                    onChange={handleClientChange}
                                >
                                    <option value="" className="bg-slate-900 text-text-muted">Seleccionar Empresa...</option>
                                    {clients && clients.filter(c => c && (c.uuid || c.id)).map(c => (
                                        <option key={c.uuid || c.id} value={c.uuid || c.id} className="bg-slate-900 text-white">
                                            {c.razon_social || c.name || 'Sin Nombre'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Cargo</label>
                            <input
                                type="text"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main focus:border-accent focus:bg-accent/5 focus:outline-none transition-all placeholder:text-white/20"
                                placeholder="Ej. Gerente Comercial"
                                value={formData.cargo}
                                onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Rol</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main focus:border-accent focus:bg-accent/5 focus:outline-none transition-all appearance-none cursor-pointer"
                                    value={formData.rol_cod}
                                    onChange={e => setFormData({ ...formData, rol_cod: e.target.value })}
                                >
                                    <option value="" className="bg-slate-900 text-text-muted">Seleccionar Rol...</option>
                                    {roles && roles.map(r => (
                                        <option key={r} value={r} className="bg-slate-900 text-white">{r}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="col-span-2 border-t border-white/5 my-2"></div>

                        <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" size={14} />
                                <input
                                    type="email"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-text-main focus:border-accent focus:bg-accent/5 focus:outline-none transition-all placeholder:text-white/20"
                                    placeholder="contacto@empresa.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Móvil</label>
                            <div className="relative group">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" size={14} />
                                <input
                                    type="text"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-text-main focus:border-accent focus:bg-accent/5 focus:outline-none transition-all placeholder:text-white/20"
                                    placeholder="+598 99..."
                                    value={formData.movil}
                                    onChange={e => setFormData({ ...formData, movil: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Teléfono Fijo</label>
                            <div className="relative group">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" size={14} />
                                <input
                                    type="text"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-text-main focus:border-accent focus:bg-accent/5 focus:outline-none transition-all placeholder:text-white/20"
                                    placeholder="2024..."
                                    value={formData.tel}
                                    onChange={e => setFormData({ ...formData, tel: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-white/10 text-text-muted hover:bg-white/5 hover:text-white transition-colors text-sm font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 rounded-lg bg-accent text-white font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Plus size={16} strokeWidth={3} />
                                    Guardar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Contactos() {
    const [contacts, setContacts] = useState([]);
    const [clients, setClients] = useState([]); // Store clients list
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [availableRoles, setAvailableRoles] = useState(['Gerente', 'Pagos', 'Comercial', 'Administracion']); // Fallback roles

    // Fetch Data
    const fetchContacts = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            // Fetch contacts
            const contactReq = supabase
                .from('contactos')
                .select('*')
                .order('created_at', { ascending: false });

            // Try fetching clients from 'clientes_maestra' first, else 'clients'
            // We can't easily "try/catch" a supabase query in parallel cleanly without settling.
            // Let's assume 'clients' table is the one from schema.sql if 'clientes_maestra' fails.
            // For now, let's just attempt 'clientes_maestra' as per user instruction "Dependiente de clientes_maestra"
            // But if it returns error, we'll log it.
            const clientReq = supabase.from('clientes_maestra').select('uuid, razon_social').order('razon_social');

            const roleReq = supabase.from('tipos_rol_contacto').select('rol_cod');

            const [contactRes, clientRes, roleRes] = await Promise.all([contactReq, clientReq, roleReq]);

            if (contactRes.error) {
                console.error("Error fetching contacts:", contactRes.error);
                // Don't throw, just empty list
                setContacts([]);
            } else {
                setContacts(contactRes.data || []);
            }

            if (clientRes.error) {
                console.warn("Could not fetch 'clientes_maestra', trying 'clients'...");
                // Fallback attempt to 'clients' table
                const fallbackClientReq = await supabase.from('clients').select('id, name').order('name');
                if (!fallbackClientReq.error && fallbackClientReq.data) {
                    // Map 'id', 'name' to 'uuid', 'razon_social' for consistency
                    const mappedClients = fallbackClientReq.data.map(c => ({
                        uuid: c.id,
                        razon_social: c.name
                    }));
                    setClients(mappedClients);
                } else {
                    setClients([]);
                }
            } else {
                setClients(clientRes.data || []);
            }

            if (roleRes.error) {
                console.warn("Could not fetch roles, using defaults.");
                // Keep default roles
            } else {
                const fetchedRoles = roleRes.data.map(r => r.rol_cod).filter(Boolean);
                if (fetchedRoles.length > 0) {
                    setAvailableRoles(fetchedRoles);
                }
            }

        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts(true);
    }, []);

    const handleSaveContact = async (formData) => {
        try {

            const payload = {
                nombre: formData.nombre,
                apellido: formData.apellido,
                cliente: formData.cliente, // Text name
                uuid_Client: formData.uuid_Client || null, // UUID link
                cargo: formData.cargo,
                rol_cod: formData.rol_cod || null,
                email: formData.email,
                movil: formData.movil,
                tel: formData.tel,
                tenant: '1' // Default tenant
            };

            let error;
            if (editingContact && editingContact.uuid) {
                // Update
                const { error: updateError } = await supabase
                    .from('contactos')
                    .update(payload)
                    .eq('uuid', editingContact.uuid);
                error = updateError;
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('contactos')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            // Success
            setIsModalOpen(false); // Close immediately
            setEditingContact(null);
            alert(editingContact ? '✅ Contacto actualizado correctamente' : '✅ Contacto guardado correctamente');
            fetchContacts(false); // Refresh list in background without spinner

        } catch (err) {
            console.error("Error saving contact:", err);
            alert("Error al guardar el contacto: " + err.message);
        }
    };

    // Filter Logic
    const filteredContacts = contacts.filter(contact => {
        const fullName = `${contact.nombre || ''} ${contact.apellido || ''}`.toLowerCase();
        const clientName = (contact.cliente || '').toLowerCase();
        const email = (contact.email || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        const matchesSearch = fullName.includes(searchLower) ||
            clientName.includes(searchLower) ||
            email.includes(searchLower);

        const matchesRole = roleFilter === 'all' || contact.rol_cod === roleFilter;

        return matchesSearch && matchesRole;
    });

    // Extract unique roles for filter + available
    const uniqueRoles = [...new Set([...availableRoles, ...contacts.map(c => c.rol_cod).filter(Boolean)])];

    return (
        <div className="p-6 h-full flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <UserCircle className="text-accent" /> Contactos
                    </h1>
                    <p className="text-text-muted text-sm">Gestiona la base de datos de personas de contacto</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent/90 transition-colors flex items-center gap-2 shadow-lg shadow-accent/20"
                >
                    <Plus size={18} /> Nuevo Contacto
                </button>
            </div>

            {/* New Contact Modal */}
            <NewContactModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingContact(null);
                }}
                onSave={handleSaveContact}
                roles={availableRoles}
                clients={clients}
                initialData={editingContact}
            />

            {/* Toolbar */}
            <div className="bg-card p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, empresa o email..."
                        className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-text-main focus:outline-none focus:border-accent transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 text-text-muted text-sm whitespace-nowrap">
                        <Filter size={16} />
                        <span>Filtrar por Rol:</span>
                    </div>
                    <select
                        className="bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-accent"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">Todos los roles</option>
                        {uniqueRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 bg-card rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-xl">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-background/50 text-text-muted text-xs uppercase tracking-wider font-semibold sticky top-0 backdrop-blur-sm z-10">
                            <tr>
                                <th className="p-4 border-b border-white/5">Nombre Completo</th>
                                <th className="p-4 border-b border-white/5">Cliente / Empresa</th>
                                <th className="p-4 border-b border-white/5">Cargo & Rol</th>
                                <th className="p-4 border-b border-white/5">Contacto</th>
                                <th className="p-4 border-b border-white/5 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-text-muted animate-pulse">
                                        Cargando contactos...
                                    </td>
                                </tr>
                            ) : filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-text-muted italic">
                                        No se encontraron contactos que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            ) : (
                                filteredContacts.map((contact, index) => (
                                    <tr key={contact.id || contact.uuid || index} className="group hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <div className="font-bold text-text-main">
                                                        {contact.nombre} {contact.apellido}
                                                    </div>
                                                    <div className="text-xs text-text-muted font-mono">
                                                        ID: {contact.id_contacto_ext || contact.id || '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-text-main">
                                                <Building2 size={16} className="text-text-muted" />
                                                <span className="font-medium">{contact.cliente || 'Sin Empresa'}</span>
                                            </div>
                                            {contact.client_ref && (
                                                <div className="text-xs text-text-muted mt-1 ml-6">
                                                    Ref: {contact.client_ref}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-text-main mb-1">
                                                <Briefcase size={16} className="text-text-muted" />
                                                <span>{contact.cargo || 'Sin Cargo'}</span>
                                            </div>
                                            {contact.rol_cod && (
                                                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 ml-6">
                                                    {contact.rol_cod}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 space-y-1">
                                            {contact.email && (
                                                <div className="flex items-center gap-2 text-sm text-text-muted hover:text-text-main transition-colors">
                                                    <Mail size={14} />
                                                    <a href={`mailto:${contact.email}`} className="truncate max-w-[200px] hover:underline">
                                                        {contact.email}
                                                    </a>
                                                </div>
                                            )}
                                            {(contact.movil || contact.tel) && (
                                                <div className="flex items-center gap-2 text-sm text-text-muted">
                                                    <Phone size={14} />
                                                    <span>{contact.movil || contact.tel}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => {
                                                    setEditingContact(contact);
                                                    setIsModalOpen(true);
                                                }}
                                                className="text-text-muted hover:text-accent font-medium text-sm transition-colors px-3 py-1 hover:bg-white/5 rounded"
                                            >
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}

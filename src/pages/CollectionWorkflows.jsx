import React, { useState, useEffect } from 'react';
import {
    Mail,
    MessageCircle,
    Smartphone,
    Phone,
    Clock,
    MoreVertical,
    Plus,
    Play,
    Settings,
    Paperclip,
    Smile,
    Mic,
    Variable,
    CheckCircle2,
    Trash2,
    Loader2,
    Save
} from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const CollectionWorkflows = () => {
    const { profile } = useAuth();
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [selectedChannel, setSelectedChannel] = useState('whatsapp');
    const [loading, setLoading] = useState(true);
    const [nodes, setNodes] = useState([]);
    const [workflowId, setWorkflowId] = useState(null);
    const [workflowName, setWorkflowName] = useState('');

    // Editor State
    const [editedBody, setEditedBody] = useState('');
    const [editedSubject, setEditedSubject] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchWorkflowData = async () => {
            setLoading(true);
            try {
                // 1. Get the first active workflow (Simulated "current strategy")
                const { data: wfData, error: wfError } = await supabase
                    .from('collection_workflows')
                    .select('*')
                    .eq('is_active', true)
                    .limit(1)
                    .single();

                if (wfError) throw wfError;
                if (!wfData) {
                    console.warn("No active workflow found");
                    setLoading(false);
                    return;
                }

                setWorkflowName(wfData.name);
                setWorkflowId(wfData.id);

                // 2. Get Nodes
                const { data: nodesData, error: nodesError } = await supabase
                    .from('workflow_nodes')
                    .select('*')
                    .eq('workflow_id', wfData.id)
                    .order('order_index', { ascending: true });

                if (nodesError) throw nodesError;

                // 3. Get Channels for all these nodes
                const nodeIds = nodesData.map(n => n.id);
                const { data: channelsData, error: chError } = await supabase
                    .from('node_channels')
                    .select('*')
                    .in('node_id', nodeIds)
                    .eq('is_enabled', true);

                if (chError) throw chError;

                // 4. Merge Data
                const mergedNodes = nodesData.map(node => {
                    const nodeChannels = channelsData.filter(c => c.node_id === node.id);
                    return {
                        id: node.id,
                        title: node.name,
                        days_offset: node.days_offset, // Added for editing
                        timing: node.days_offset === 0
                            ? 'Día de vencimiento'
                            : node.days_offset < 0
                                ? `${Math.abs(node.days_offset)} días antes del vencimiento`
                                : `${node.days_offset} días de retraso`,
                        status: 'active', // Derived from workflow active status? Or node logic? Assuming active.
                        channels: nodeChannels.map(nc => nc.channel_type), // For UI list
                        channelDetails: nodeChannels, // For Editor
                        conditions: node.conditions || {}
                    };
                });

                setNodes(mergedNodes);
                if (mergedNodes.length > 0) {
                    setSelectedNodeId(mergedNodes[0].id);
                }

            } catch (err) {
                console.error("Error fetching workflow:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkflowData();
    }, []);

    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    const activeChannelConfig = selectedNode?.channelDetails?.find(c => c.channel_type === selectedChannel);

    // Sync editor state with selected config
    useEffect(() => {
        if (activeChannelConfig) {
            setEditedBody(activeChannelConfig.body_content || '');
            setEditedSubject(activeChannelConfig.subject || '');
        } else {
            setEditedBody('');
            setEditedSubject('');
        }
    }, [selectedNodeId, selectedChannel, nodes]);

    // --- NODE CRUD HANDLERS ---

    const handleInsertNode = async (targetIndex = null) => {
        if (!workflowId) return;

        const isAppend = targetIndex === null;
        const insertAtIndex = isAppend ? nodes.length : targetIndex;
        // DB uses 1-based indexing for order
        const dbOrderIndex = insertAtIndex + 1;

        // Calculate reasonable offset defaults
        let newOffset = 5;
        if (!isAppend && insertAtIndex > 0) {
            const prev = nodes[insertAtIndex - 1];
            const next = nodes[insertAtIndex];
            newOffset = Math.floor((prev.days_offset + next.days_offset) / 2);
        } else if (isAppend && nodes.length > 0) {
            newOffset = nodes[nodes.length - 1].days_offset + 5;
        }

        try {
            // 1. Shift existing nodes if inserting in middle
            if (!isAppend) {
                // We need to shift all nodes from targetIndex onwards
                const nodesToShift = nodes.filter(n => ((n.order_index === undefined ? nodes.indexOf(n) + 1 : n.order_index) >= dbOrderIndex));

                await Promise.all(nodesToShift.map(n =>
                    supabase.from('workflow_nodes').update({ order_index: (n.order_index || nodes.indexOf(n) + 1) + 1 }).eq('id', n.id)
                ));
            }

            // 2. Insert New Node
            const newNode = {
                workflow_id: workflowId,
                name: 'Nuevo Paso',
                days_offset: newOffset,
                order_index: dbOrderIndex,
                tenant_id: profile.tenant_id
            };

            const { data, error } = await supabase
                .from('workflow_nodes')
                .insert([newNode])
                .select()
                .single();

            if (error) throw error;

            // 3. Update Local State (Refetch)
            const { data: refreshedNodes, error: refreshError } = await supabase
                .from('workflow_nodes')
                .select('*')
                .eq('workflow_id', workflowId)
                .order('order_index', { ascending: true });

            if (refreshError) throw refreshError;

            // Re-merge with existing channel data 
            const formattedNodes = refreshedNodes.map(node => {
                const existing = nodes.find(n => n.id === node.id);
                const nodeChannels = existing ? existing.channelDetails : [];
                return {
                    id: node.id,
                    title: node.name,
                    days_offset: node.days_offset,
                    timing: node.days_offset === 0
                        ? 'Día de vencimiento'
                        : node.days_offset < 0
                            ? `${Math.abs(node.days_offset)} días antes del vencimiento`
                            : `${node.days_offset} días de retraso`,
                    status: 'active',
                    channels: existing ? existing.channels : [],
                    channelDetails: nodeChannels,
                    conditions: node.conditions || {}
                };
            });

            setNodes(formattedNodes);
            setSelectedNodeId(data.id);

        } catch (err) {
            console.error('Error adding node:', err);
            alert('Error al añadir paso');
        }
    };


    const handleAddNode = async () => {
        if (!workflowId) return;
        try {
            const newNode = {
                workflow_id: workflowId,
                name: 'Nuevo Paso',
                days_offset: 1,
                order_index: nodes.length + 1,
                tenant_id: profile.tenant_id
            };

            const { data, error } = await supabase
                .from('workflow_nodes')
                .insert([newNode])
                .select()
                .single();

            if (error) throw error;

            const formattedNode = {
                id: data.id,
                title: data.name,
                days_offset: data.days_offset,
                timing: `${data.days_offset} días de retraso`,
                status: 'active',
                channels: [],
                channelDetails: [],
                conditions: {}
            };

            setNodes([...nodes, formattedNode]);
            setSelectedNodeId(data.id);
        } catch (err) {
            console.error('Error adding node:', err);
            alert('Error al añadir paso');
        }
    };

    const handleDeleteNode = async (e, nodeId) => {
        e.stopPropagation(); // Prevent selection
        if (!confirm('¿Estás seguro de eliminar este paso?')) return;

        try {
            const { error } = await supabase
                .from('workflow_nodes')
                .delete()
                .eq('id', nodeId);

            if (error) throw error;

            const newNodes = nodes.filter(n => n.id !== nodeId);
            setNodes(newNodes);
            if (selectedNodeId === nodeId && newNodes.length > 0) {
                setSelectedNodeId(newNodes[0].id);
            } else if (newNodes.length === 0) {
                setSelectedNodeId(null);
            }

        } catch (err) {
            console.error('Error deleting node:', err);
            alert('Error al eliminar paso');
        }
    };

    const handleUpdateNode = async (nodeId, updates) => {
        // Optimistic update
        setNodes(prev => prev.map(n =>
            n.id === nodeId ? { ...n, ...updates } : n
        ));

        // DB Update
        const dbUpdates = {};
        if (updates.title !== undefined) dbUpdates.name = updates.title;
        if (updates.days_offset !== undefined) dbUpdates.days_offset = updates.days_offset;

        try {
            const { error } = await supabase
                .from('workflow_nodes')
                .update(dbUpdates)
                .eq('id', nodeId);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating node:', err);
            // Revert on error would be ideal, but for now just alert
            alert('Error al actualizar el nodo');
        }
    };

    // Handle Activating a new channel
    const handleActivateChannel = async () => {
        if (!selectedNodeId) return;
        setIsSaving(true);
        try {
            // 1. Check if it already exists (enabled or disabled)
            const { data: existingChannel, error: checkError } = await supabase
                .from('node_channels')
                .select('*')
                .eq('node_id', selectedNodeId)
                .eq('channel_type', selectedChannel)
                .maybeSingle();

            if (checkError) throw checkError;

            let finalData;

            if (existingChannel) {
                // 2a. Update existing
                const { data, error } = await supabase
                    .from('node_channels')
                    .update({ is_enabled: true })
                    .eq('id', existingChannel.id)
                    .select()
                    .single();

                if (error) throw error;
                finalData = data;
            } else {
                // 2b. Insert new
                if (!profile?.tenant_id) {
                    alert("Error: No se ha identificado el Tenant del usuario.");
                    return;
                }

                const newConfig = {
                    node_id: selectedNodeId,
                    channel_type: selectedChannel,
                    is_enabled: true,
                    body_content: '',
                    subject: selectedChannel === 'email' ? 'Nuevo Asunto' : null,
                    tenant_id: profile.tenant_id
                };

                const { data, error } = await supabase
                    .from('node_channels')
                    .insert([newConfig])
                    .select()
                    .single();

                if (error) throw error;
                finalData = data;
            }

            // 3. Update local state
            setNodes(prev => prev.map(n => {
                if (n.id === selectedNodeId) {
                    // Check if we need to replace an existing entry in channelDetails or add new
                    const existingDetailIndex = n.channelDetails ? n.channelDetails.findIndex(cd => cd.channel_type === selectedChannel) : -1;

                    let newChannelDetails = [...(n.channelDetails || [])];
                    if (existingDetailIndex >= 0) {
                        newChannelDetails[existingDetailIndex] = finalData;
                    } else {
                        newChannelDetails.push(finalData);
                    }

                    // Update channels list if not present
                    const newChannelsList = n.channels.includes(selectedChannel)
                        ? n.channels
                        : [...(n.channels || []), selectedChannel];

                    return {
                        ...n,
                        channelDetails: newChannelDetails,
                        channels: newChannelsList
                    };
                }
                return n;
            }));

        } catch (err) {
            console.error("Error activating channel:", err);
            alert('Error al activar canal');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!activeChannelConfig) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('node_channels')
                .update({
                    body_content: editedBody,
                    subject: activeChannelConfig.channel_type === 'email' ? editedSubject : null
                })
                .eq('id', activeChannelConfig.id);

            if (error) throw error;

            // Update local state to reflect changes
            setNodes(prev => prev.map(n => {
                if (n.id === selectedNodeId) {
                    return {
                        ...n,
                        channelDetails: n.channelDetails.map(c =>
                            c.channel_type === selectedChannel
                                ? { ...c, body_content: editedBody, subject: editedSubject }
                                : c
                        )
                    };
                }
                return n;
            }));

            alert('Guardado exitosamente');

        } catch (err) {
            console.error("Error saving channel config:", err);
            alert('Error al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="h-screen bg-background flex items-center justify-center text-text-muted">Cargando estrategia...</div>;
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden text-text-main">

            {/* LEFT PANEL: Workflow Builder */}
            <div className="w-1/3 border-r border-white/5 bg-sidebar flex flex-col">
                <div className="p-6 border-b border-white/5 bg-sidebar z-10">
                    <div className="flex justify-between items-center mb-1">
                        <h2 className="text-xl font-bold text-text-main tracking-tight">Flujo de Cobranza</h2>
                        <button className="p-2 hover:bg-white/5 rounded-full text-text-muted transition-colors">
                            <Settings size={20} />
                        </button>
                    </div>
                    <p className="text-sm text-text-muted">{workflowName || 'Estrategia Sin Nombre'}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 relative custom-scrollbar">
                    {/* Vertical Line */}
                    <div className="absolute left-[3.25rem] top-6 bottom-0 w-0.5 bg-gradient-to-b from-accent via-white/10 to-transparent z-0"></div>

                    <div className="space-y-8 relative z-10">
                        {nodes.map((node, index) => (
                            <React.Fragment key={`node-${node.id}`}>
                                <div
                                    onClick={() => setSelectedNodeId(node.id)}
                                    className={`group relative flex items-start cursor-pointer transition-all duration-300 ${selectedNodeId === node.id ? 'translate-x-1' : 'hover:translate-x-1'
                                        }`}
                                >
                                    {/* Timeline Node Indicator */}
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 z-10 shadow-lg transition-colors duration-300 mr-4 mt-1
                                        ${selectedNodeId === node.id
                                            ? 'bg-accent border-sidebar text-sidebar'
                                            : 'bg-sidebar border-card text-text-muted group-hover:border-accent group-hover:text-accent'
                                        }
                                    `}>
                                        <span className="font-bold text-sm">{index + 1}</span>
                                    </div>

                                    {/* Card Content */}
                                    <div className={clsx(
                                        "flex-1 p-4 rounded-xl border transition-all duration-300 shadow-lg relative group",
                                        selectedNodeId === node.id
                                            ? 'bg-card border-accent/30 shadow-accent/5'
                                            : 'bg-sidebar border-white/5 hover:border-white/10 hover:bg-card'
                                    )}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={clsx("font-semibold text-sm", selectedNodeId === node.id ? 'text-accent' : 'text-text-main')}>
                                                {node.title}
                                            </h3>

                                            {/* Action Buttons */}
                                            <div className="flex items-center space-x-1">
                                                <button
                                                    onClick={(e) => handleDeleteNode(e, node.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-text-muted hover:text-red-400 transition-all"
                                                    title="Eliminar paso"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <MoreVertical size={16} className="text-text-muted cursor-pointer hover:text-white" />
                                            </div>
                                        </div>

                                        <div className="flex items-center text-xs text-text-muted mb-3">
                                            <Clock size={12} className="mr-1.5" />
                                            <span>
                                                {node.timing}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            {node.channels.map(ch => (
                                                <div key={`node-${node.id}-ch-${ch}`} className={clsx(
                                                    "p-1.5 rounded-md text-xs flex items-center justify-center transition-colors",
                                                    ch === 'whatsapp' ? 'bg-green-500/10 text-green-400' :
                                                        ch === 'email' ? 'bg-indigo-500/10 text-indigo-400' :
                                                            ch === 'sms' ? 'bg-orange-500/10 text-orange-400' :
                                                                'bg-purple-500/10 text-purple-400'
                                                )}>
                                                    {ch === 'whatsapp' && <MessageCircle size={14} />}
                                                    {ch === 'email' && <Mail size={14} />}
                                                    {ch === 'sms' && <Smartphone size={14} />}
                                                    {ch === 'call' && <Phone size={14} />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline Spacer with Insert Button */}
                                <div className="h-8 relative group flex items-center justify-start pl-[1.15rem]">
                                    {/* The button is hidden until hover */}
                                    <div
                                        onClick={() => handleInsertNode(index)}
                                        className="w-6 h-6 rounded-full bg-sidebar border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:bg-accent hover:text-sidebar hover:border-accent z-20 shadow-sm"
                                        title="Insertar paso entre estos"
                                    >
                                        <Plus size={12} />
                                    </div>
                                </div>
                            </React.Fragment>
                        ))}

                        {/* Add Node Button */}
                        <div
                            onClick={() => handleInsertNode(null)}
                            className="flex items-center group cursor-pointer opacity-60 hover:opacity-100 transition-opacity pl-1"
                        >
                            <div className="w-8 h-8 rounded-full bg-sidebar flex items-center justify-center border-2 border-dashed border-text-muted text-text-muted group-hover:border-accent group-hover:text-accent group-hover:bg-accent/10 transition-colors mr-5 z-10">
                                <Plus size={16} />
                            </div>
                            <span className="text-sm font-medium text-text-muted group-hover:text-accent transition-colors">Añadir paso al final</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: Editor */}
            <div className="flex-1 bg-background flex flex-col h-full overflow-hidden">
                {selectedNode ? (
                    <>
                        {/* Header */}
                        <div className="bg-sidebar border-b border-white/5 px-8 py-6 shadow-sm z-20 flex justify-between items-start">
                            <div className="flex-1 mr-4">
                                {/* Editable Title */}
                                <input
                                    value={selectedNode.title}
                                    onChange={(e) => handleUpdateNode(selectedNode.id, { title: e.target.value })}
                                    className="text-2xl font-bold text-text-main mb-2 tracking-tight bg-transparent border-b border-transparent hover:border-white/10 focus:border-accent outline-none w-full transition-colors"
                                />

                                <div className="flex items-center text-sm text-text-muted space-x-4">
                                    {/* Editable Timing */}
                                    <div className="flex items-center group">
                                        <Clock size={16} className="mr-1.5" />
                                        <input
                                            type="number"
                                            value={selectedNode.days_offset}
                                            onChange={(e) => handleUpdateNode(selectedNode.id, { days_offset: parseInt(e.target.value) || 0 })}
                                            className="w-16 bg-transparent text-text-main font-medium border-b border-transparent hover:border-white/10 focus:border-accent outline-none text-center"
                                        />
                                        <span className="ml-2 text-xs opacity-60">días offset (neg=antes, pos=despues)</span>
                                    </div>

                                    <span className="flex items-center text-emerald-400 font-medium px-2 py-0.5 bg-emerald-500/10 rounded-full text-xs border border-emerald-500/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                                        Activo
                                    </span>
                                </div>
                            </div>

                            {/* Global Save Button */}
                            <button
                                onClick={handleSaveConfig}
                                disabled={isSaving || !activeChannelConfig}
                                className="flex items-center px-6 py-2.5 bg-accent text-sidebar rounded-lg font-bold shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <Loader2 size={18} className="animate-spin mr-2" />
                                ) : (
                                    <Save size={18} className="mr-2" />
                                )}
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>

                        {/* Channel Tabs */}
                        <div className="px-8 pt-6">
                            <div className="bg-card/50 p-1.5 rounded-xl inline-flex shadow-sm border border-white/5">
                                {[
                                    { id: 'email', icon: Mail, label: 'Email', color: 'indigo' },
                                    { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: 'green' },
                                    { id: 'sms', icon: Smartphone, label: 'SMS', color: 'orange' },
                                    { id: 'call', icon: Phone, label: 'Llamada', color: 'purple' }
                                ].map(tab => (
                                    <button
                                        key={`tab-${tab.id}`}
                                        onClick={() => setSelectedChannel(tab.id)}
                                        className={clsx(
                                            "flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                            selectedChannel === tab.id
                                                ? "bg-accent text-sidebar shadow-lg shadow-accent/20"
                                                : "text-text-muted hover:text-text-main hover:bg-white/5"
                                        )}
                                    >
                                        <tab.icon size={16} className={clsx("mr-2", selectedChannel !== tab.id && `text-${tab.color}-400`)} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Editor Content */}
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                            <div className="bg-sidebar rounded-2xl shadow-xl border border-white/5 overflow-hidden h-full flex flex-col">

                                {/* Editor Toolbar / Header */}
                                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-card/30">
                                    <div className="flex gap-2">
                                        <button className="flex items-center px-3 py-1.5 bg-card border border-white/10 text-text-main rounded-lg text-xs font-medium hover:bg-white/5 hover:border-white/20 transition-colors shadow-sm">
                                            <Variable size={14} className="mr-1.5 text-accent" />
                                            Variables
                                        </button>
                                        <button className="flex items-center px-3 py-1.5 bg-card border border-white/10 text-text-main rounded-lg text-xs font-medium hover:bg-white/5 hover:border-white/20 transition-colors shadow-sm">
                                            <Settings size={14} className="mr-1.5 text-text-muted" />
                                            Condiciones
                                        </button>
                                    </div>
                                    <div className="text-xs text-text-muted font-medium">
                                        Editor de Contenido
                                    </div>
                                </div>

                                {/* Dynamic Content Area */}
                                <div className="flex-1 p-6 bg-background/50 relative">

                                    {!activeChannelConfig ? (
                                        <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-50">
                                            <p>Canal no configurado para este paso.</p>
                                            <button
                                                onClick={handleActivateChannel}
                                                disabled={isSaving}
                                                className="mt-4 px-4 py-2 bg-card border border-white/10 rounded-lg hover:bg-white/5 flex items-center"
                                            >
                                                {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                                                Activar Canal
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* WhatsApp/SMS Editor */}
                                            {(selectedChannel === 'whatsapp' || selectedChannel === 'sms') && (
                                                <div className="max-w-md mx-auto h-full flex flex-col">
                                                    <div className="flex-1 flex flex-col justify-center">
                                                        <div className="flex flex-col gap-2 h-full max-h-[500px]">
                                                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Mensaje:</label>
                                                            <textarea
                                                                value={editedBody}
                                                                onChange={(e) => setEditedBody(e.target.value)}
                                                                className={clsx(
                                                                    "flex-1 p-4 rounded-2xl shadow-lg text-sm leading-relaxed border outline-none resize-none transition-all",
                                                                    "bg-card border-white/5 focus:border-accent/50 focus:ring-1 focus:ring-accent/50 text-gray-200"
                                                                )}
                                                                placeholder="Escribe el contenido del mensaje aquí..."
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Helpers */}
                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        {['{{Nombre_Cliente}}', '{{Monto_Deuda}}', '{{Link_Pago}}', '{{Fecha_Vencimiento}}'].map(v => (
                                                            <button
                                                                key={v}
                                                                onClick={() => setEditedBody(prev => prev + ' ' + v)}
                                                                className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-text-muted hover:text-accent transition-colors"
                                                            >
                                                                {v}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="mt-2 text-center text-xs text-text-muted">
                                                        {editedBody.length} caracteres • {(selectedChannel === 'sms') ? Math.ceil(editedBody.length / 160) : 1} mensaje(s)
                                                    </div>
                                                </div>
                                            )}

                                            {/* Email Editor */}
                                            {selectedChannel === 'email' && (
                                                <div className="max-w-2xl mx-auto h-full flex flex-col overflow-hidden bg-white/5 rounded-lg border border-white/5"> {/* Changed bg to allow dark theme inputs */}
                                                    <div className="bg-sidebar border-b border-white/5 p-4 space-y-3">
                                                        <div className="flex items-center">
                                                            <span className="text-xs font-semibold text-text-muted w-16">De:</span>
                                                            <input
                                                                disabled
                                                                value="cobranzas@empresa.com"
                                                                className="flex-1 bg-transparent text-sm text-text-main opacity-50 outline-none"
                                                            />
                                                        </div>
                                                        <div className="flex items-center">
                                                            <span className="text-xs font-semibold text-text-muted w-16">Asunto:</span>
                                                            <input
                                                                value={editedSubject}
                                                                onChange={(e) => setEditedSubject(e.target.value)}
                                                                className="flex-1 bg-transparent text-sm text-text-main font-medium outline-none placeholder-text-muted/30 focus:text-accent transition-colors"
                                                                placeholder="Asunto del correo..."
                                                            />
                                                        </div>
                                                    </div>
                                                    <textarea
                                                        value={editedBody}
                                                        onChange={(e) => setEditedBody(e.target.value)}
                                                        className="p-6 flex-1 text-sm text-text-main font-sans leading-relaxed bg-transparent resize-none outline-none placeholder-text-muted/20"
                                                        placeholder="Escribe el cuerpo del correo aquí... Soporta variables."
                                                    />
                                                </div>
                                            )}

                                            {/* Call Editor */}
                                            {selectedChannel === 'call' && (
                                                <div className="flex items-center justify-center h-full">
                                                    <div className="bg-card p-8 rounded-2xl shadow-xl border border-white/5 text-center max-w-sm w-full">
                                                        <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-400 border border-purple-500/20">
                                                            <Mic size={32} />
                                                        </div>
                                                        <h3 className="font-semibold text-text-main mb-2">Configuración IVR / Voz</h3>
                                                        <p className="text-sm text-text-muted mb-6">Script del agente virtual:</p>

                                                        <textarea
                                                            className="w-full h-32 p-3 text-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none resize-none bg-sidebar text-text-main placeholder-text-muted"
                                                            value={editedBody}
                                                            onChange={(e) => setEditedBody(e.target.value)}
                                                            placeholder="Hola, esto es un mensaje de prueba..."
                                                        ></textarea>

                                                        <div className="mt-4 flex gap-2">
                                                            <button className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-lg shadow-purple-900/20">
                                                                Probar Audio
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                </div>
                            </div>
                        </div>

                        {/* Footer Rules */}
                        <div className="px-8 pb-6">
                            <div className="flex gap-6">
                                <label className="flex items-center space-x-2 text-sm text-text-muted cursor-pointer p-2 hover:bg-white/5 rounded-lg transition-colors group">
                                    <div className="w-4 h-4 rounded border border-text-muted/50 flex items-center justify-center bg-transparent group-hover:border-accent">
                                        <CheckCircle2 size={12} className={clsx("text-accent", selectedNode?.conditions?.stop_on_promise ? "opacity-100" : "opacity-0")} />
                                    </div>
                                    <span className="group-hover:text-text-main">Detener si hay promesa de pago</span>
                                </label>
                            </div>
                        </div>

                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-text-muted">
                        Select a node to edit
                    </div>
                )}
            </div>

        </div >
    );
};

export default CollectionWorkflows;

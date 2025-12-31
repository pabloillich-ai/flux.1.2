import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard,
    FolderOpen,
    MessageSquare,
    Send,
    Zap
} from 'lucide-react';
import { MOCK_DEBTORS, MOCK_MESSAGES } from '../data/mockData';

const Campaigns = () => {
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const scrollRef = useRef(null);

    const currentDebtor = MOCK_DEBTORS[1]; // Maria Rodriguez

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (content = input) => {
        if (!content.trim()) return;
        const newMessage = {
            id: Date.now().toString(),
            sender: 'agent',
            content: content,
            timestamp: new Date(),
            channel: 'whatsapp'
        };
        setMessages([...messages, newMessage]);
        setInput('');
    };

    const handleAIDraft = async () => {
        setIsGenerating(true);
        try {
            // Mock AI response
            await new Promise(resolve => setTimeout(resolve, 1000));
            const draft = "Hola María, entendemos su situación. ¿Le parecería bien si programamos el pago de la mitad para este viernes como menciona? Quedamos a la espera de su confirmación.";
            setInput(draft);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display overflow-hidden h-full flex flex-col">
            {/* Header hidden in main layout usually, but kept here for structure if needed or adapted */}

            <div className="flex flex-1 overflow-hidden">
                <aside className="w-80 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111318] shrink-0">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="text-gray-900 dark:text-white text-base font-bold">Cola de Atención</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <div className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-slate-800/50 border-l-2 border-l-blue-600 cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-500 rounded-full size-10 flex items-center justify-center text-xs font-bold text-white">MR</div>
                                    <div>
                                        <p className="text-gray-900 dark:text-white text-sm font-semibold">Maria Rodriguez</p>
                                        <p className="text-slate-500 text-xs">Esperando respuesta</p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500">2m</span>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="flex flex-1 flex-col min-w-0 bg-[#f8fafc] dark:bg-[#0f1115]">
                    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111318]">
                        <div className="flex items-center gap-3">
                            <h2 className="text-gray-900 dark:text-white font-bold text-lg">{currentDebtor.name}</h2>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase">Pagador Olvidadizo</span>
                        </div>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.map((m) => (
                            <div key={m.id} className={`flex flex-col ${m.sender === 'agent' ? 'items-end' : m.sender === 'system' ? 'items-center' : 'items-start'} gap-1`}>
                                <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${m.sender === 'agent' ? 'bg-blue-600 text-white rounded-tr-none' :
                                    m.sender === 'system' ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 text-xs border border-slate-200 dark:border-slate-800' :
                                        'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-gray-800 dark:text-white rounded-tl-none'
                                    }`}>
                                    <p className="text-sm">{m.content}</p>
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                    {m.channel === 'whatsapp' && <MessageSquare size={12} className="text-emerald-500" />}
                                    {m.sender !== 'system' && <span>{m.sender.toUpperCase()} • {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white dark:bg-[#111318] border-t border-slate-200 dark:border-slate-800 p-4 shrink-0">
                        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:border-blue-500/50 transition-colors shadow-lg">
                            <div className="p-3">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    className="w-full bg-transparent border-none text-gray-900 dark:text-white placeholder:text-slate-400 text-sm focus:ring-0 resize-none outline-none"
                                    placeholder="Escribe tu mensaje..."
                                    rows={3}
                                />
                            </div>
                            <div className="flex items-center justify-between px-3 pb-3 pt-1">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleAIDraft}
                                        disabled={isGenerating}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600/10 text-purple-600 hover:bg-purple-600/20 text-xs font-bold transition disabled:opacity-50"
                                    >
                                        <Zap size={16} />
                                        {isGenerating ? 'Redactando...' : 'Borrador IA'}
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleSendMessage()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    Enviar <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </main>

                <aside className="w-80 lg:w-96 flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111318] shrink-0 overflow-y-auto">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold">MR</div>
                            <div>
                                <h3 className="text-gray-900 dark:text-white font-bold">{currentDebtor.name}</h3>
                                <p className="text-slate-500 text-xs">ID: {currentDebtor.id} • {currentDebtor.location}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-3">Resumen de Deuda</h4>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-slate-500 text-sm">Total Vencido</span>
                                <span className="text-gray-900 dark:text-white text-xl font-bold">${currentDebtor.totalDebt.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full w-[60%]"></div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Campaigns;

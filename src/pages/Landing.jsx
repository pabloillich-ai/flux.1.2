import React from 'react';
import { NavLink } from 'react-router-dom';
import { CheckCircle, ArrowRight, Shield, Zap, Globe } from 'lucide-react';

export function Landing() {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
            {/* Header */}
            <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <img src="/logo_pulse.png" alt="Conect Pulse" className="w-full h-full object-contain" />
                    </div>
                    <span><strong>CONECT</strong> Pulse</span>
                </div>
                <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
                    <a href="#features" className="hover:text-blue-600 transition">Características</a>
                    <a href="#pricing" className="hover:text-blue-600 transition">Precios</a>
                </div>
                <NavLink to="/dashboard" className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20">
                    Entrar al Panel
                </NavLink>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-32 overflow-hidden px-8">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide mb-6">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            Nuevo Sistema 2.0
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8 text-slate-900">
                            Recupera tu capital <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                sin fricción.
                            </span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
                            La plataforma de gestión de cobranzas que automatiza tu flujo de trabajo, centraliza tus clientes y mejora tu liquidez.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <NavLink to="/dashboard" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-xl shadow-blue-600/20 group">
                                Comenzar Prueba
                                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </NavLink>
                            <button className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                                Ver Demo
                            </button>
                        </div>

                        <div className="mt-12 flex items-center gap-4 text-sm text-slate-500 font-medium">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white"></div>
                                ))}
                            </div>
                            <p>Confían +500 empresas</p>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                        <div className="relative bg-slate-900 rounded-2xl p-2 shadow-2xl ring-1 ring-slate-900/10 rotate-1 hover:rotate-0 transition-transform duration-500">
                            <div className="bg-slate-800 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900"></div>
                                {/* Mock UI */}
                                <div className="absolute top-4 left-4 right-4 bottom-4 bg-slate-900/50 rounded border border-white/10 p-4">
                                    <div className="flex gap-4 mb-4">
                                        <div className="w-1/3 h-20 bg-white/5 rounded"></div>
                                        <div className="w-1/3 h-20 bg-white/5 rounded"></div>
                                        <div className="w-1/3 h-20 bg-blue-500/20 rounded border border-blue-500/50"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                        <div className="h-4 bg-white/5 rounded w-full"></div>
                                        <div className="h-4 bg-white/5 rounded w-5/6"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="features" className="py-24 bg-slate-50 px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold mb-4 text-slate-900">Todo lo que necesitas para gestionar deuda</h2>
                        <p className="text-slate-600">Una suite completa de herramientas diseñadas para equipos modernos de cobranza.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: "Automatización Inteligente", desc: "Reglas de envío configurables por canal (Email, SMS, WhatsApp).", icon: Zap },
                            { title: "Tablero Kanban", desc: "Visualiza el estado de cada cliente y arrastra para gestionar.", icon: Globe },
                            { title: "Reportes en Tiempo Real", desc: "Métricas clave como DSO y proyecciones de flujo de caja.", icon: Shield },
                        ].map((f, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                    <f.icon />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-900">{f.title}</h3>
                                <p className="text-slate-600 leading-relaxed text-sm">
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 px-8 border-t border-slate-200">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-12 text-slate-900">Simple, transparente, sin sorpresas.</h2>

                    <div className="bg-slate-900 text-white rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>

                        <div className="relative z-10">
                            <div className="inline-block px-4 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                                All Inclusive
                            </div>
                            <div className="flex items-baseline justify-center gap-2 mb-2">
                                <span className="text-5xl font-bold">$299</span>
                                <span className="text-slate-400 text-lg">/año</span>
                            </div>
                            <p className="text-slate-400 text-sm mb-8">Por estado o región gestionada</p>

                            <ul className="text-left max-w-xs mx-auto space-y-4 mb-10 text-slate-300">
                                {[
                                    "Usuarios Ilimitados",
                                    "Base de Datos de Clientes",
                                    "Automatización de Emails",
                                    "Tablero Kanban Avanzado",
                                    "Soporte Prioritario"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <CheckCircle size={18} className="text-blue-500 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <button className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-blue-50 transition">
                                Comenzar Ahora
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="bg-white border-t border-slate-200 py-12 text-center text-slate-500 text-sm">
                <p>&copy; 2025 CONECT Pulse. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}

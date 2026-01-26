import React from 'react';
import { motion } from 'framer-motion';
import {
    Wifi,
    Scan,
    GitMerge,
    ArrowRight,
    CheckCircle2,
    TrendingUp,
    ShieldCheck,
    Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const ContactModal = ({ isOpen, onClose, topic }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl"
            >
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Hablemos de negocios</h3>
                <p className="text-slate-600 mb-6">Completa tus datos para recibir información sobre <span className="font-semibold text-blue-900">{topic}</span>.</p>

                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); alert('Gracias por tu interés. Te contactaremos a la brevedad.'); }}>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                        <input required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Juan Pérez" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Profesional</label>
                        <input required type="email" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="juan@empresa.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                        <input type="tel" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="+56 9 1234 5678" />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition-colors shadow-lg hover:shadow-blue-900/20">Solicitar Contacto</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const Navbar = ({ onLogin }) => (
    <nav className="flex justify-between items-center py-6 px-8 max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tight text-slate-900">
            REX <span className="text-blue-900">Consulting</span>
        </div>
        <button
            onClick={onLogin}
            className="hidden md:block px-6 py-2.5 text-sm font-medium text-slate-700 hover:text-blue-900 transition-colors"
        >
            Login Clientes
        </button>
    </nav>
);

const Hero = ({ openContact }) => {
    const navigate = useNavigate();
    return (
        <section className="relative px-6 py-20 lg:py-32 max-w-7xl mx-auto text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center"
            >
                <img
                    src="/REXLogogifanim.gif"
                    alt="REX Consulting Logo"
                    className="h-96 md:h-[30rem] mb-8 object-contain"
                />

                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                    Transformamos datos y procesos <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-slate-700">
                        en rentabilidad
                    </span>
                </h1>
                <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
                    Una suite integral de soluciones tecnológicas para la gestión corporativa,
                    cobranzas y automatización de procesos.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => openContact('Agendar Demo')}
                        className="px-8 py-4 bg-blue-900 text-white rounded-lg font-semibold text-lg hover:bg-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                    >
                        Solicitar Demo
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                        onClick={() => document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-lg font-semibold text-lg hover:bg-slate-50 transition-colors"
                    >
                        Ver Soluciones
                    </button>
                </div>
            </motion.div>
        </section>
    );
};

const ProductCard = ({ icon: Icon, title, desc, points, delay, path, openContact }) => {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all relative overflow-hidden group h-full flex flex-col"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-4 mb-6">
                <div className="w-24 h-24 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors flex-shrink-0">
                    <Icon className="w-16 h-16 text-slate-700 group-hover:text-blue-700 transition-colors" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
            </div>

            <p className="text-slate-600 mb-6 leading-relaxed flex-grow">{desc}</p>

            <ul className="space-y-3 mt-auto">
                {points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                        <span>{point}</span>
                    </li>
                ))}
            </ul>

            <div className="mt-8 pt-6 border-t border-slate-50">
                <button
                    onClick={() => path ? navigate(path) : openContact(title)}
                    className="text-blue-700 font-semibold text-sm flex items-center gap-2 group/btn hover:text-blue-900"
                >
                    Conocer más <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>
        </motion.div>
    );
};

const Solutions = ({ openContact }) => {
    const products = [
        {
            icon: (props) => <img src="/logo_pulse.png" alt="Conect Pulse" {...props} style={{ objectFit: 'contain' }} />,
            title: "CONECT Pulse",
            desc: "Automatización inteligente de cuentas por cobrar y gestión omnicanal.",
            path: "/dashboard",
            points: [
                "Automatización de recordatorios de pago.",
                "Gestión omnicanal (WhatsApp, SMS, Email).",
                "Portal de autogestión 24/7 para clientes.",
                "Segmentación inteligente por riesgo."
            ]
        },
        {
            icon: (props) => <img src="/logo_focus.png" alt="RCB FOCUS" {...props} style={{ objectFit: 'contain' }} />,
            title: "RCB FOCUS",
            desc: "Inteligencia de negocios y centralización de datos corporativos.",
            points: [
                "Data Lakes corporativos unificados.",
                "Dashboards en tiempo real.",
                "Única fuente de verdad (Single Source of Truth).",
                "Visualización de KPIs críticos."
            ]
        },
        {
            icon: (props) => <img src="/logo_trace.png" alt="RCB TRACE" {...props} style={{ objectFit: 'contain' }} />,
            title: "RCB TRACE",
            desc: "Gestión de procesos de aprobación y trazabilidad operativa.",
            points: [
                "Control de flujos de aprobación.",
                "Trazabilidad completa para auditoría.",
                "Eliminación de cuellos de botella.",
                "Asignación clara de responsabilidades."
            ]
        }
    ];

    return (
        <section id="solutions" className="bg-slate-50 py-24 md:py-32">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-blue-900 font-semibold tracking-wide uppercase text-sm mb-4">Nuestras Soluciones</h2>
                    <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Ecología digital para tu empresa</h3>
                    <p className="text-slate-600 text-lg">
                        Herramientas diseñadas para escalar operaciones, reducir costos y mejorar la toma de decisiones.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {products.map((p, i) => (
                        <ProductCard key={i} {...p} delay={i * 0.15} openContact={openContact} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const Benefits = () => (
    <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">
                    ¿Por qué elegir REX Consulting?
                </h2>
                <div className="space-y-8">
                    {[
                        {
                            icon: Users,
                            title: "Experiencia de Usuario Superior",
                            desc: "Interfaces diseñadas para la productividad y la adopción rápida por parte de los equipos."
                        },
                        {
                            icon: TrendingUp,
                            title: "Reducción de Costos",
                            desc: "Automatización que libera recursos humanos para tareas de mayor valor estratégico."
                        },
                        {
                            icon: ShieldCheck,
                            title: "Integración Robusta",
                            desc: "Conexión nativa con tus ERPs y Core Bancarios existentes sin fricción."
                        }
                    ].map((item, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <item.icon className="w-6 h-6 text-blue-700" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h4>
                                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
                <div className="relative z-10">
                    <blockquote className="text-2xl font-medium leading-relaxed mb-8">
                        "La implementación de CONTACT Core redujo nuestro ciclo de cobro en un 35% durante el primer trimestre."
                    </blockquote>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-700 rounded-full overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=100&h=100" alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="font-bold">Carlos Méndez</div>
                            <div className="text-slate-400 text-sm">CFO, FintechLatam S.A.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const Footer = ({ openContact }) => (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12">
                <div className="text-2xl font-bold text-slate-900 mb-4 md:mb-0">
                    REX <span className="text-blue-900">Consulting</span>
                </div>
                <div className="flex gap-8">
                    <button onClick={() => window.open('https://linkedin.com', '_blank')} className="text-slate-500 hover:text-blue-700 transition-colors">LinkedIn</button>
                    <button onClick={() => openContact('Contacto General')} className="text-slate-500 hover:text-blue-700 transition-colors">Contacto</button>
                    <button onClick={() => openContact('Soporte')} className="text-slate-500 hover:text-blue-700 transition-colors">Soporte</button>
                </div>
            </div>
            <div className="text-center text-slate-400 text-sm">
                &copy; 2025 REX Consulting. Todos los derechos reservados.
            </div>
        </div>
    </footer>
);

const RexLanding = () => {
    const navigate = useNavigate();
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [contactTopic, setContactTopic] = useState('');

    const openContact = (topic = 'nuestras soluciones') => {
        setContactTopic(topic);
        setIsContactOpen(true);
    };

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-blue-100">
            <Navbar onLogin={() => navigate('/login')} />
            <Hero openContact={openContact} />
            <Solutions openContact={openContact} />
            <Benefits />
            <Footer openContact={openContact} />
            <ContactModal
                isOpen={isContactOpen}
                onClose={() => setIsContactOpen(false)}
                topic={contactTopic}
            />
        </div>
    );
};

export default RexLanding;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, Play } from 'lucide-react';
import clsx from 'clsx';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await signIn(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || "Error al iniciar sesión.");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-900 font-sans">
            {/* LEFT SIDE: BRANDING */}
            <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden flex-col justify-between p-12 text-white">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-slate-900/90"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10">
                            <img src="/FLUXLOGO.png" alt="FLUX Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-2xl font-bold tracking-tight">FLUX</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-bold">Technologies</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl font-extrabold leading-tight mb-6">
                        Inteligencia financiera para resultados reales.
                    </h1>
                    <p className="text-lg text-slate-300 leading-relaxed font-light">
                        Accede al Portal del Agente para gestionar carteras, acompañar métricas y optimizar recuperaciones con seguridad y eficiencia.
                    </p>
                </div>

                <div className="relative z-10 text-xs text-slate-500 font-medium">
                    &copy; {new Date().getFullYear()} FLUX Technologies &bull; Privacidad &bull; Términos
                </div>
            </div>

            {/* RIGHT SIDE: FORM */}
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
                <div className="w-full max-w-md">
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-2">Portal del Agente</h2>
                        <p className="text-slate-400">Insira sus credenciales para acceder a la plataforma.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail o Usuario</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="text-slate-500" size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="w-full h-12 pl-10 pr-4 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                    placeholder="agente@flux.uy"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contraseña</label>
                                <a href="#" className="text-xs text-blue-500 hover:text-blue-400 font-medium">¿Olvidaste la contraseña?</a>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="text-slate-500" size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full h-12 pl-10 pr-4 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                    placeholder="Ingrese su contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={clsx(
                                "w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2",
                                loading && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Acessar Plataforma'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-500 font-mono">
                            <Lock size={10} /> Conexión Segura 256-bit SSL
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

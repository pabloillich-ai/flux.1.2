import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Zap,
    Download,
    X,
    Calendar,
    Clock,
    AlertTriangle,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    CalendarDays
} from 'lucide-react';
import { MOCK_DEBTORS } from '../data/mockData';

const AgentDashboard = () => {
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Mock Gemini Service for now
    const mockAnalyzePortfolio = async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`Resultado del Análisis:
- Alto riesgo de morosidad en sector Retail.
- Acción recomendada: Aumentar frecuencia de contacto para deudores con > 60 días de mora.
- Oportunidad: Los descuentos por pronto pago podrían recuperar el 15% de la deuda incobrable.`);
            }, 1500);
        });
    };

    const data = [
        { name: 'Feb', projected: 4000, actual: 2400 },
        { name: 'Mar', projected: 3000, actual: 1398 },
        { name: 'Abr', projected: 2000, actual: 9800 },
        { name: 'May', projected: 2780, actual: 3908 },
        { name: 'Jun', projected: 1890, actual: 4800 },
        { name: 'Jul', projected: 2390, actual: 3800 },
    ];

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const result = await mockAnalyzePortfolio();
            setAnalysis(result);
        } catch (e) {
            console.error(e);
            setAnalysis("Error analizando la cartera.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden relative bg-background-light dark:bg-background-dark">
            <header className="flex-shrink-0 flex flex-wrap items-center justify-between gap-4 p-6 bg-white dark:bg-background-dark border-b border-gray-200 dark:border-[#2a313d]">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-black leading-tight tracking-[-0.033em] text-gray-900 dark:text-white">Dashboard Agente</h2>
                    <p className="text-gray-500 dark:text-[#9da6b9] text-sm font-normal">Claridad Absoluta, Decisión Instantánea</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm shadow-lg shadow-purple-500/20"
                    >
                        <Zap size={20} />
                        {isAnalyzing ? 'Analizando...' : 'Insight Estratégico IA'}
                    </button>
                    <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm">
                        <Download size={20} />
                        Exportar Reporte
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
                <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
                    {analysis && (
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-xl mb-2">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="text-purple-600" size={20} />
                                <h4 className="font-bold text-purple-900 dark:text-purple-300">Insight de Cartera IA</h4>
                                <button onClick={() => setAnalysis(null)} className="ml-auto text-purple-400 hover:text-purple-600">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="text-sm text-purple-800 dark:text-purple-400 prose dark:prose-invert">
                                {analysis.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <KPICard title="DSO (Días Ventas)" value="45 Días" trend="-2 días" trendType="good" icon={<CalendarDays size={24} />} progress={65} />
                        <KPICard title="BPDSO (Mejor Posible)" value="30 Días" trend="±0" trendType="neutral" icon={<Clock size={24} />} progress={80} />
                        <KPICard title="Mora Promedio" value="15 Días" trend="+1 día" trendType="bad" icon={<AlertTriangle size={24} />} progress={45} />
                        <KPICard title="Rotación de Activos" value="8.2x" trend="+0.4x" trendType="good" icon={<RefreshCw size={24} />} progress={75} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-3 flex flex-col p-6 rounded-xl border border-gray-200 dark:border-[#3b4354] bg-white dark:bg-card-dark shadow-sm h-80">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Efectividad CEI</h3>
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="relative w-40 h-40">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-slate-800" />
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="37.68" strokeLinecap="round" className="text-blue-600 transition-all duration-1000" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-black text-gray-900 dark:text-white">85%</span>
                                        <span className="text-xs text-slate-400">Meta: 90%</span>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 text-center">Alta eficiencia, ligeramente bajo meta.</p>
                            </div>
                        </div>

                        <div className="lg:col-span-6 flex flex-col p-6 rounded-xl border border-gray-200 dark:border-[#3b4354] bg-white dark:bg-card-dark shadow-sm h-80">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Recuperación Proyectada vs Real</h3>
                                    <p className="text-xs text-slate-500">Desempeño Últimos 6 Meses</p>
                                </div>
                            </div>
                            <div className="flex-1 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data}>
                                        <defs>
                                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#135bec" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#135bec" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2a313d" vertical={false} />
                                        <XAxis dataKey="name" stroke="#9da6b9" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#9da6b9" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1d24', border: '1px solid #3b4354', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Area type="monotone" dataKey="actual" stroke="#135bec" fillOpacity={1} fill="url(#colorActual)" strokeWidth={3} />
                                        <Area type="monotone" dataKey="projected" stroke="#9da6b9" fill="transparent" strokeDasharray="5 5" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="lg:col-span-3 flex flex-col p-6 rounded-xl border border-gray-200 dark:border-[#3b4354] bg-white dark:bg-card-dark shadow-sm h-80">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Tasa de Rollover</h3>
                            <div className="flex flex-col gap-4 justify-center h-full">
                                <ProgressBar label="Al Día → 30 Días" value={15} color="bg-emerald-500" percent="2.4%" />
                                <ProgressBar label="30 → 60 Días" value={35} color="bg-yellow-500" percent="5.8%" />
                                <ProgressBar label="60 → 90+ Días" value={65} color="bg-rose-500" percent="12.1%" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const KPICard = ({ title, value, trend, trendType, icon, progress }) => (
    <div className="flex flex-col justify-between p-5 rounded-xl border border-gray-200 dark:border-[#3b4354] bg-white dark:bg-card-dark shadow-sm">
        <div className="flex justify-between items-start mb-2">
            <p className="text-gray-500 dark:text-[#9da6b9] text-sm font-medium">{title}</p>
            <span className="text-gray-400 dark:text-[#3b4354]">{icon}</span>
        </div>
        <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold dark:text-white text-gray-900">{value}</h3>
            <span className={`text-sm font-medium flex items-center px-1.5 py-0.5 rounded ${trendType === 'good' ? 'bg-emerald-500/10 text-emerald-600' :
                trendType === 'bad' ? 'bg-red-500/10 text-red-600' : 'bg-slate-500/10 text-slate-500'
                }`}>
                {trend}
            </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-[#2a313d] h-1 mt-4 rounded-full overflow-hidden">
            <div
                className={`h-full ${trendType === 'bad' ? 'bg-red-500' : 'bg-blue-600'}`}
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    </div>
);

const ProgressBar = ({ label, value, color, percent }) => (
    <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-slate-500">
            <span>{label}</span>
            <span className="font-bold">{percent}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-[#2a313d] h-6 rounded-lg overflow-hidden relative">
            <div className={`h-full ${color} opacity-40`} style={{ width: `${value}%` }}></div>
            <div className="absolute inset-0 flex items-center px-3 text-xs font-medium dark:text-white text-gray-900">
                {value < 30 ? 'Riesgo Bajo' : value < 50 ? 'Precaución' : 'Crítico'}
            </div>
        </div>
    </div>
);

export default AgentDashboard;

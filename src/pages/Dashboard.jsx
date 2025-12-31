import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { KPICard } from '../components/KPICard';
import { DollarSign, Clock, Users, Mail, AlertTriangle } from 'lucide-react';

// Register ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Mock Data (Placeholder until Supabase fetch)
const kpiData = [
    { title: "Deuda Vencida", value: "$1.2M", trend: "down", trendValue: "12%", icon: AlertTriangle, color: "text-red-500" },
    { title: "Por Vencer (30d)", value: "$450k", trend: "neutral", trendValue: "Estable", icon: Clock, color: "text-blue-400" },
    { title: "DSO (Días)", value: "42", trend: "up", trendValue: "-3 días", icon: DollarSign, color: "text-green-500" }, // down is good for DSO, but 'up' means improvement here
    { title: "Gestiones Auto", value: "3,450", trend: "up", trendValue: "+15%", icon: Mail, color: "text-purple-400" },
];

export function Dashboard() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading
        setTimeout(() => setLoading(false), 800);
    }, []);

    const barData = {
        labels: ['1-30 Días', '31-60 Días', '61-90 Días', '+90 Días'],
        datasets: [{
            label: 'Deuda Vencida (UYU)',
            data: [350000, 210000, 150000, 90000],
            backgroundColor: ['#3b82f6', '#eab308', '#f97316', '#ef4444'],
            borderRadius: 6,
        }]
    };

    const donutData = {
        labels: ['A Tiempo', 'Vencido', 'Legal', 'Disputa'],
        datasets: [{
            data: [65, 20, 10, 5],
            backgroundColor: ['#22c55e', '#f97316', '#ef4444', '#a855f7'],
            borderWidth: 0,
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-text-muted animate-pulse">Cargando Dashboard...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiData.map((kpi, idx) => (
                    <KPICard key={idx} {...kpi} colorClass={kpi.color} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Aging Chart */}
                <div className="bg-sidebar border border-white/5 rounded-xl p-6 lg:col-span-2 shadow-lg">
                    <h2 className="text-lg font-bold mb-6 text-text-main flex items-center gap-2">
                        Aging de Deuda
                        <span className="text-xs font-normal text-text-muted bg-white/5 px-2 py-1 rounded">Actualizado Hoy</span>
                    </h2>
                    <div className="h-72">
                        <Bar data={barData} options={chartOptions} />
                    </div>
                </div>

                {/* Status Donut */}
                <div className="bg-sidebar border border-white/5 rounded-xl p-6 shadow-lg">
                    <h2 className="text-lg font-bold mb-6 text-text-main">Estado Cartera</h2>
                    <div className="h-48 relative">
                        <Doughnut data={donutData} options={{ ...chartOptions, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 10, padding: 20 } } }, scales: {} }} />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">85%</div>
                                <div className="text-xs text-text-muted">Recupero</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-400">124</div>
                            <div className="text-xs text-text-muted uppercase">Gestiones Hoy</div>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-400">15</div>
                            <div className="text-xs text-text-muted uppercase">Promesas Pago</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;

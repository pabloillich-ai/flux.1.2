/**
 * Dashboard Component - REFACTORED VERSION
 * Example of using the new layered architecture with services and hooks
 * 
 * This is a cleaner version showing how to use:
 * - Custom hooks (useDashboard)
 * - Formatters from utils
 * - Constants from utils
 * 
 * Compare this with the original src/pages/Dashboard.jsx to see the improvements!
 */

import React from 'react';
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

// ✨ Import from new architecture
import { useDashboard } from '../hooks';
import { formatMoney } from '../utils';

// Register ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// KPI Configuration (could be moved to constants)
const kpiConfig = [
    {
        key: 'deudaVencida',
        title: "Deuda Vencida",
        value: "$1.2M",
        trend: "down",
        trendValue: "12%",
        icon: AlertTriangle,
        color: "text-red-500"
    },
    {
        key: 'porVencer',
        title: "Por Vencer (30d)",
        value: "$450k",
        trend: "neutral",
        trendValue: "Estable",
        icon: Clock,
        color: "text-blue-400"
    },
    {
        key: 'dso',
        title: "DSO (Días)",
        value: "42",
        trend: "up",
        trendValue: "-3 días",
        icon: DollarSign,
        color: "text-green-500"
    },
    {
        key: 'gestiones',
        title: "Gestiones Auto",
        value: "3,450",
        trend: "up",
        trendValue: "+15%",
        icon: Mail,
        color: "text-purple-400"
    },
];

export function DashboardRefactored() {
    // ✨ Using custom hook instead of manual fetch logic
    const { data, loading, error } = useDashboard();

    // Chart data (could be moved to a separate hook or util)
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

    // ✨ Clean loading and error states
    if (loading) {
        return (
            <div className="p-10 text-center text-text-muted">
                <div className="animate-pulse">Cargando Dashboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-10 text-center text-red-500">
                <AlertTriangle className="mx-auto mb-4" size={48} />
                <h2 className="text-xl font-bold mb-2">Error al cargar el Dashboard</h2>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    // ✨ Optional: Use real data from API if available
    const kpisWithData = data?.kpis ? [
        { ...kpiConfig[0], value: data.kpis.critical },
        { ...kpiConfig[1], value: data.kpis.total },
        { ...kpiConfig[2], value: kpiConfig[2].value },
        { ...kpiConfig[3], value: kpiConfig[3].value },
    ] : kpiConfig;

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpisWithData.map((kpi, idx) => (
                    <KPICard key={idx} {...kpi} colorClass={kpi.color} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Aging Chart */}
                <div className="bg-sidebar border border-white/5 rounded-xl p-6 lg:col-span-2 shadow-lg">
                    <h2 className="text-lg font-bold mb-6 text-text-main flex items-center gap-2">
                        Aging de Deuda
                        <span className="text-xs font-normal text-text-muted bg-white/5 px-2 py-1 rounded">
                            Actualizado Hoy
                        </span>
                    </h2>
                    <div className="h-72">
                        <Bar data={barData} options={chartOptions} />
                    </div>
                </div>

                {/* Status Donut */}
                <div className="bg-sidebar border border-white/5 rounded-xl p-6 shadow-lg">
                    <h2 className="text-lg font-bold mb-6 text-text-main">Estado Cartera</h2>
                    <div className="h-48 relative">
                        <Doughnut
                            data={donutData}
                            options={{
                                ...chartOptions,
                                cutout: '70%',
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { color: '#94a3b8', boxWidth: 10, padding: 20 }
                                    }
                                },
                                scales: {}
                            }}
                        />
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

            {/* Optional: Display exchange rate if available */}
            {data?.exchange_rate && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-400">
                    <strong>Tipo de Cambio:</strong> {formatMoney(data.exchange_rate)} UYU por USD
                </div>
            )}
        </div>
    );
}

export default DashboardRefactored;

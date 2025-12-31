import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import clsx from 'clsx';

export function KPICard({ title, value, trend, trendValue, icon: Icon, colorClass = "text-accent" }) {
    return (
        <div className="bg-card border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-accent/30 transition-all">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-text-muted text-xs font-bold uppercase tracking-wider">{title}</h3>
                {Icon && <Icon className={clsx("w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity", colorClass)} />}
            </div>

            <div className="text-3xl font-bold text-text-main mb-2 tracking-tight">{value}</div>

            {trend && (
                <div className="flex items-center gap-2 text-xs font-medium">
                    <span className={clsx(
                        "flex items-center gap-1",
                        trend === 'up' ? "text-green-400" : trend === 'down' ? "text-red-400" : "text-text-muted"
                    )}>
                        {trend === 'up' && <ArrowUp size={14} />}
                        {trend === 'down' && <ArrowDown size={14} />}
                        {trend === 'neutral' && <Minus size={14} />}
                        {trendValue}
                    </span>
                    <span className="text-text-muted opacity-60">vs mes anterior</span>
                </div>
            )}

            {/* Background decoration */}
            <div className={clsx("absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-5 blur-xl pointer-events-none group-hover:opacity-10 transition-opacity", colorClass.replace('text-', 'bg-'))}></div>
        </div>
    );
}

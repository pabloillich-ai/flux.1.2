import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    BookUser,
    Bell,
    Database,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    CalendarDays,
    Workflow,
    Zap,
    FolderOpen,
    MessageSquare
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { icon: LayoutDashboard, label: 'Inicio', path: '/dashboard' },
    { icon: Zap, label: 'Sala de Comando', path: '/context-role' },
    { icon: Zap, label: 'Dashboard', path: '/agent-dashboard' },
    {
        icon: CreditCard,
        label: 'Tableros',
        children: [
            { label: 'Gestión Visual', path: '/tablero-gestion' },
            { label: 'Kanban Clásico', path: '/kanban' },
            { label: 'Portfolio', path: '/portfolio' },
            { label: 'Campañas', path: '/campaigns' }
        ]
    },
    { icon: CalendarDays, label: 'Agenda', path: '/agenda' },
    { icon: Users, label: 'Clientes', path: '/clients' },
    { icon: BookUser, label: 'Contactos', path: '/contacts' },
    { icon: Workflow, label: 'Automatización', path: '/workflows' },
    { icon: Bell, label: 'Alertas', path: '/alerts' },
    { icon: Database, label: 'Mapeo', path: '/import' },
];

export function Sidebar({ isOpen, toggle }) {
    const [expanded, setExpanded] = React.useState({ 'Tableros': true });

    const toggleMenu = (label) => {
        setExpanded(prev => ({ ...prev, [label]: !prev[label] }));
        if (!isOpen) toggle(); // Auto-open sidebar if collapsed
    };

    return (
        <nav
            className={clsx(
                "h-full bg-sidebar border-r border-card flex flex-col transition-all duration-300 z-50",
                isOpen ? "w-64 p-5" : "w-20 p-3 items-center"
            )}
        >
            <div className="flex items-center gap-3 mb-8 h-10 overflow-hidden shrink-0">
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    <img src="/logo_pulse.png" alt="Conect Pulse" className="w-full h-full object-contain" />
                </div>
                <span className={clsx("text-lg whitespace-nowrap transition-opacity duration-200", !isOpen && "opacity-0 hidden")}>
                    <strong>CONECT</strong> Pulse
                </span>
            </div>

            <ul className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <li key={item.label}>
                        {item.children ? (
                            <div className="space-y-1">
                                <button
                                    onClick={() => toggleMenu(item.label)}
                                    className={clsx(
                                        "w-full flex items-center gap-3 p-3 text-text-muted hover:bg-white/5 hover:text-white rounded-lg transition-colors select-none",
                                        !isOpen && "justify-center"
                                    )}
                                >
                                    <item.icon size={20} className="shrink-0" />
                                    <span className={clsx("flex-1 text-left whitespace-nowrap font-bold uppercase text-[10px] tracking-wider transition-opacity", !isOpen && "hidden opacity-0")}>
                                        {item.label}
                                    </span>
                                    {isOpen && (
                                        <ChevronRight
                                            size={16}
                                            className={clsx("transition-transform duration-200", expanded[item.label] && "rotate-90")}
                                        />
                                    )}
                                </button>

                                <div className={clsx(
                                    "grid transition-all duration-300 ease-in-out overflow-hidden",
                                    expanded[item.label] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                )}>
                                    <ul className={clsx("min-h-0 space-y-1", isOpen && "pl-4 border-l border-white/5 ml-4")}>
                                        {item.children.map(child => (
                                            <li key={child.path}>
                                                <NavLink
                                                    to={child.path}
                                                    className={({ isActive }) => clsx(
                                                        "block rounded-lg transition-colors duration-200 text-sm font-medium",
                                                        isOpen ? "p-2 pl-3" : "hidden",
                                                        isActive
                                                            ? "bg-accent/10 text-accent"
                                                            : "text-text-muted hover:bg-white/5 hover:text-text-main"
                                                    )}
                                                >
                                                    {child.label}
                                                </NavLink>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => clsx(
                                    "flex items-center gap-3 p-3 rounded-lg transition-colors duration-200 text-sm font-medium",
                                    isActive
                                        ? "bg-accent/10 text-accent"
                                        : "text-text-muted hover:bg-white/5 hover:text-text-main",
                                    !isOpen && "justify-center"
                                )}
                            >
                                <item.icon size={20} className="shrink-0" />
                                <span className={clsx("whitespace-nowrap transition-opacity", !isOpen && "hidden opacity-0")}>
                                    {item.label}
                                </span>
                            </NavLink>
                        )}
                    </li>
                ))}
            </ul>

            <button
                onClick={toggle}
                className="mt-auto p-2 rounded-lg text-text-muted hover:bg-white/5 hover:text-text-main self-end w-full flex items-center justify-center transition-colors"
            >
                {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>

            <div className={clsx("mt-4 pt-4 border-t border-white/5 text-xs text-text-muted text-center whitespace-nowrap overflow-hidden transition-all", !isOpen && "hidden")}>
                v2.0.0
            </div>
        </nav>
    );
}

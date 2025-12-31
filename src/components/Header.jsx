import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Bell } from 'lucide-react';

const PAGE_TITLES = {
    '/dashboard': { title: 'Dashboard', subtitle: 'Vista General de la Cartera' },
    '/kanban': { title: 'Tablero de Gestión', subtitle: 'Flujo Visual de Cobranza' },
    '/agenda': { title: 'Agenda', subtitle: 'Calendario de Eventos' },
    '/clients': { title: 'Clientes', subtitle: 'Base de Datos de Clientes' },
    '/contacts': { title: 'Contactos', subtitle: 'Directorio de Contactos' },
    '/alerts': { title: 'Alertas', subtitle: 'Centro de Notificaciones' },
    '/import': { title: 'Mapeo de Datos', subtitle: 'Importación y Configuración' },
};

export function Header() {
    const location = useLocation();
    const { user, profile } = useAuth();
    // Default fallback or specific match
    const currentInfo = PAGE_TITLES[location.pathname] || { title: 'CONECT Pulse', subtitle: 'Sistema de Gestion de Cobranza' };

    const userName = profile?.full_name || user?.user_metadata?.full_name || user?.email || 'Usuario';
    const userInitial = userName.charAt(0).toUpperCase();
    const companyName = user?.user_metadata?.company || 'Empresa Principal';

    return (
        <header className="px-8 py-5 flex justify-between items-center border-b border-card bg-background/50 backdrop-blur-md sticky top-0 z-40">
            <div>
                <h1 className="text-2xl font-bold text-text-main">
                    {currentInfo.title}
                </h1>
                <p className="text-sm text-text-muted">{currentInfo.subtitle}</p>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent w-4 h-4 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="bg-sidebar border border-card rounded-full pl-10 pr-4 py-2 text-sm text-text-main focus:outline-none focus:border-accent w-64 transition-all"
                    />
                </div>

                <button className="relative text-text-muted hover:text-accent transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                <div className="h-8 w-[1px] bg-card"></div>

                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-semibold text-text-main">{userName}</div>
                        <div className="text-xs text-text-muted">{companyName}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
                        {userInitial}
                    </div>
                </div>
            </div>
        </header>
    );
}

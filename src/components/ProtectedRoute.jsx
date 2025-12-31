import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, roles = [] }) {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <Loader2 className="animate-spin text-blue-500" size={48} />
                <span className="ml-3 font-medium">Verificando sesión...</span>
            </div>
        );
    }

    if (!user) {
        // Redirect to login but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles.length > 0 && profile && !roles.includes(profile.role)) {
        // User authorized but wrong role
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white flex-col">
                <h1 className="text-3xl font-bold text-red-500 mb-4">Acceso Denegado</h1>
                <p className="text-slate-400 mb-8">No tienes permisos para ver esta página.</p>
                <button
                    onClick={() => window.history.back()}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors"
                >
                    Volver
                </button>
            </div>
        );
    }

    return children;
}

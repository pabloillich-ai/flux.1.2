import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import AgentDashboard from './pages/AgentDashboard';
import Portfolio from './pages/Portfolio';
import Campaigns from './pages/Campaigns';
import Kanban from './pages/Kanban';

import TableroGestion from './pages/TableroGestion';
import Agenda from './pages/Agenda';

import Contactos from './pages/Contactos';

import DataImportWizard from './pages/DataImportWizard';

// Placeholder Pages (Temporary)
import Clients from './pages/Clientes';
import ClientPortal from './pages/ClientPortal';
import RexLanding from './pages/RexLanding';
import CollectionWorkflows from './pages/CollectionWorkflows';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RexLanding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/old-landing" element={<Landing />} />
          <Route path="/portal/:clientId" element={<ClientPortal />} />

          {/* Protected Application Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="agent-dashboard" element={<AgentDashboard />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="campaigns" element={<Campaigns />} />

            <Route path="kanban" element={<Kanban />} />
            <Route path="tablero-gestion" element={<TableroGestion />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="clients" element={<Clients />} />
            <Route path="contacts" element={<Contactos />} />
            <Route path="workflows" element={<CollectionWorkflows />} />
            <Route path="alerts" element={<div className="p-10">Alertas</div>} />
            <Route path="import" element={<DataImportWizard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

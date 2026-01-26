"""
Client Repository
Data access layer for clients (clientes_maestra table)
"""

from typing import List, Dict, Optional
from supabase import Client
from app.repositories.base import BaseRepository


class ClientRepository(BaseRepository):
    """Repository for client data access"""
    
    def __init__(self, supabase: Client):
        super().__init__(supabase, 'clientes_maestra')
    
    def find_with_pending_invoices(self, tenant_id: str) -> List[Dict]:
        """
        Find clients that have pending invoices
        
        Args:
            tenant_id: Tenant UUID
            
        Returns:
            List of clients with debt
        """
        # Get all clients
        clients = self.find_all(tenant_id)
        
        # Filter those with pending invoices (would be better as a JOIN query)
        # For now, return all clients
        return clients
    
    def find_by_risk_level(self, risk_level: str, tenant_id: str) -> List[Dict]:
        """
        Find clients by risk level
        
        Args:
            risk_level: Risk level string
            tenant_id: Tenant UUID
            
        Returns:
            List of clients
        """
        return self.find_all(tenant_id, filters={'status_riesgo': risk_level})
    
    def find_by_rut(self, rut: str, tenant_id: str) -> Optional[Dict]:
        """
        Find client by RUT
        
        Args:
            rut: RUT/CI number
            tenant_id: Tenant UUID
            
        Returns:
            Client dict or None
        """
        result = self.supabase.table(self.table_name)\
            .select("*")\
            .eq('rut_ci', rut)\
            .eq('tenant_id', tenant_id)\
            .maybe_single()\
            .execute()
        
        return result.data if result.data else None
    
    def find_by_agent(self, agent_id: str, tenant_id: str) -> List[Dict]:
        """
        Find clients assigned to an agent
        
        Args:
            agent_id: Agent UUID
            tenant_id: Tenant UUID
            
        Returns:
            List of clients
        """
        return self.find_all(tenant_id, filters={'agente': agent_id})
    
    def update_risk_status(self, client_id: str, new_risk: str, tenant_id: str) -> Optional[Dict]:
        """
        Update client risk status
        
        Args:
            client_id: Client UUID
            new_risk: New risk level
            tenant_id: Tenant UUID
            
        Returns:
            Updated client or None
        """
        return self.update(client_id, {'status_riesgo': new_risk}, tenant_id)
    
    def update_current_status(self, client_id: str, new_status: str, tenant_id: str) -> Optional[Dict]:
        """
        Update client current status
        
        Args:
            client_id: Client UUID
            new_status: New status
            tenant_id: Tenant UUID
            
        Returns:
            Updated client or None
        """
        return self.update(client_id, {'estado_actual': new_status}, tenant_id)

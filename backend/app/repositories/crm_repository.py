"""
CRM Repository
Data access layer for CRM interactions (crm_gestion table)
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
from supabase import Client
from app.repositories.base import BaseRepository


class CRMRepository(BaseRepository):
    """Repository for CRM data access"""
    
    def __init__(self, supabase: Client):
        super().__init__(supabase, 'crm_gestion')
    
    def find_by_client(self, client_id: str, tenant_id: str, limit: Optional[int] = None) -> List[Dict]:
        """
        Find CRM entries for a specific client
        
        Args:
            client_id: Client UUID
            tenant_id: Tenant UUID
            limit: Optional maximum number of entries
            
        Returns:
            List of CRM entries, ordered by date (newest first)
        """
        query = self.supabase.table(self.table_name)\
            .select("*")\
            .eq('id_cliente', client_id)\
            .eq('tenant_id', tenant_id)\
            .order('fecha_y_hora', desc=True)
        
        if limit:
            query = query.limit(limit)
        
        result = query.execute()
        return result.data if result.data else []
    
    def find_recent(self, tenant_id: str, days: int = 7) -> List[Dict]:
        """
        Find recent CRM entries
        
        Args:
            tenant_id: Tenant UUID
            days: Number of days to look back
            
        Returns:
            List of recent CRM entries
        """
        # Note: Date filtering in Supabase requires specific query format
        # For now, get all and filter in service layer if needed
        return self.find_all(
            tenant_id, 
            order_by=('fecha_y_hora', True),
            limit=1000
        )
    
    def find_broken_promises(self, tenant_id: str) -> List[Dict]:
        """
        Find entries with broken promises
        
        Args:
            tenant_id: Tenant UUID
            
        Returns:
            List of broken promise entries
        """
        return self.find_all(
            tenant_id,
            filters={'resultado_estado': 'Promesa Incumplida'}
        )
    
    def find_by_channel(self, channel: str, tenant_id: str) -> List[Dict]:
        """
        Find CRM entries by communication channel
        
        Args:
            channel: Channel name (Teléfono, Email, etc.)
            tenant_id: Tenant UUID
            
        Returns:
            List of CRM entries
        """
        return self.find_all(tenant_id, filters={'canal': channel})
    
    def find_promises_for_date(self, date: str, tenant_id: str) -> List[Dict]:
        """
        Find promises for a specific date
        
        Args:
            date: Date string (YYYY-MM-DD)
            tenant_id: Tenant UUID
            
        Returns:
            List of promise entries
        """
        result = self.supabase.table(self.table_name)\
            .select("*")\
            .eq('tenant_id', tenant_id)\
            .eq('fecha_promesa_pago', date)\
            .execute()
        
        return result.data if result.data else []
    
    def get_latest_by_client(self, client_id: str, tenant_id: str) -> Optional[Dict]:
        """
        Get latest CRM entry for a client
        
        Args:
            client_id: Client UUID
            tenant_id: Tenant UUID
            
        Returns:
            Latest CRM entry or None
        """
        entries = self.find_by_client(client_id, tenant_id, limit=1)
        return entries[0] if entries else None

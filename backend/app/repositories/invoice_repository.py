"""
Invoice Repository
Data access layer for invoices (inv_docs table)
"""

from typing import List, Dict, Optional
from supabase import Client
from app.repositories.base import BaseRepository


class InvoiceRepository(BaseRepository):
    """Repository for invoice data access"""
    
    def __init__(self, supabase: Client):
        super().__init__(supabase, 'inv_docs')
    
    def find_pending(self, tenant_id: str) -> List[Dict]:
        """
        Find all pending invoices (saldo_pendiente > 0)
        
        Args:
            tenant_id: Tenant UUID
            
        Returns:
            List of pending invoices
        """
        result = self.supabase.table(self.table_name)\
            .select("*")\
            .eq('tenant_id', tenant_id)\
            .gt('saldo_pendiente', 0)\
            .execute()
        
        return result.data if result.data else []
    
    def find_by_client_rut(self, rut: str, tenant_id: str) -> List[Dict]:
        """
        Find invoices for a specific client by RUT
        
        Args:
            rut: Client RUT/CI
            tenant_id: Tenant UUID
            
        Returns:
            List of invoices
        """
        result = self.supabase.table(self.table_name)\
            .select("*")\
            .eq('rut_ci', rut)\
            .eq('tenant_id', tenant_id)\
            .order('fecha_vencimiento')\
            .execute()
        
        return result.data if result.data else []
    
    def find_paid(self, tenant_id: str) -> List[Dict]:
        """
        Find all paid invoices
        
        Args:
            tenant_id: Tenant UUID
            
        Returns:
            List of paid invoices
        """
        return self.find_all(tenant_id, filters={'estado': 'Pagado'})
    
    def find_overdue(self, tenant_id: str, days: Optional[int] = None) -> List[Dict]:
        """
        Find overdue invoices
        
        Args:
            tenant_id: Tenant UUID
            days: Optional days overdue filter
            
        Returns:
            List of overdue invoices
        """
        # This would require date comparison in Supabase query
        # For now, get all pending and filter in service layer
        return self.find_pending(tenant_id)
    
    def update_status(self, invoice_id: str, new_status: str, tenant_id: str) -> Optional[Dict]:
        """
        Update invoice status
        
        Args:
            invoice_id: Invoice UUID
            new_status: New status
            tenant_id: Tenant UUID
            
        Returns:
            Updated invoice or None
        """
        return self.update(invoice_id, {'estado': new_status}, tenant_id)
    
    def mark_as_paid(self, invoice_id: str, tenant_id: str) -> Optional[Dict]:
        """
        Mark invoice as paid
        
        Args:
            invoice_id: Invoice UUID
            tenant_id: Tenant UUID
            
        Returns:
            Updated invoice or None
        """
        return self.update(
            invoice_id, 
            {
                'estado': 'Pagado',
                'saldo_pendiente': 0
            }, 
            tenant_id
        )

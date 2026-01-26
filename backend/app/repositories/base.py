"""
Base Repository
Generic repository pattern for data access
"""

from typing import Generic, TypeVar, List, Optional, Dict, Any
from supabase import Client

T = TypeVar('T')


class BaseRepository(Generic[T]):
    """
    Base repository with common CRUD operations
    All repositories should inherit from this class
    """
    
    def __init__(self, supabase: Client, table_name: str):
        self.supabase = supabase
        self.table_name = table_name
    
    def find_all(
        self, 
        tenant_id: str, 
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[Dict]:
        """
        Find all records for a tenant with optional filters
        
        Args:
            tenant_id: Tenant UUID
            filters: Dictionary of column:value filters
            order_by: Column to order by (append desc=True for descending)
            limit: Maximum number of records
            
        Returns:
            List of records
        """
        query = self.supabase.table(self.table_name).select("*").eq('tenant_id', tenant_id)
        
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        
        if order_by:
            if isinstance(order_by, tuple):
                column, desc = order_by
                query = query.order(column, desc=desc)
            else:
                query = query.order(order_by)
        
        if limit:
            query = query.limit(limit)
        
        result = query.execute()
        return result.data if result.data else []
    
    def find_by_id(self, id: str, tenant_id: str) -> Optional[Dict]:
        """
        Find a single record by ID and tenant
        
        Args:
            id: Record UUID
            tenant_id: Tenant UUID
            
        Returns:
            Record dict or None if not found
        """
        result = self.supabase.table(self.table_name)\
            .select("*")\
            .eq('uuid', id)\
            .eq('tenant_id', tenant_id)\
            .maybe_single()\
            .execute()
        
        return result.data if result.data else None
    
    def create(self, data: Dict) -> Dict:
        """
        Create a new record
        
        Args:
            data: Record data (should include tenant_id)
            
        Returns:
            Created record
        """
        result = self.supabase.table(self.table_name).insert(data).execute()
        return result.data[0] if result.data else {}
    
    def update(self, id: str, data: Dict, tenant_id: str) -> Optional[Dict]:
        """
        Update a record
        
        Args:
            id: Record UUID
            data: Fields to update
            tenant_id: Tenant UUID (for security)
            
        Returns:
            Updated record or None if not found
        """
        result = self.supabase.table(self.table_name)\
            .update(data)\
            .eq('uuid', id)\
            .eq('tenant_id', tenant_id)\
            .execute()
        
        return result.data[0] if result.data else None
    
    def delete(self, id: str, tenant_id: str) -> bool:
        """
        Delete a record
        
        Args:
            id: Record UUID
            tenant_id: Tenant UUID (for security)
            
        Returns:
            True if deleted, False otherwise
        """
        result = self.supabase.table(self.table_name)\
            .delete()\
            .eq('uuid', id)\
            .eq('tenant_id', tenant_id)\
            .execute()
        
        return len(result.data) > 0 if result.data else False
    
    def count(self, tenant_id: str, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Count records
        
        Args:
            tenant_id: Tenant UUID
            filters: Optional filters
            
        Returns:
            Number of records
        """
        query = self.supabase.table(self.table_name)\
            .select("uuid", count="exact")\
            .eq('tenant_id', tenant_id)
        
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        
        result = query.execute()
        return result.count if hasattr(result, 'count') else 0

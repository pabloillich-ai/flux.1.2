"""
API Dependencies
Dependency injection for FastAPI endpoints
"""

from fastapi import Header, Depends
from typing import Optional
from supabase import create_client, Client
from app.config import get_settings
from app.repositories import ClientRepository, InvoiceRepository, CRMRepository
from app.services import DashboardService, ClientService, NotificationService, PortalService, ImportService


# === Supabase Client ===

def get_supabase() -> Client:
    """Get Supabase client instance"""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


# === Tenant Extraction ===

def get_tenant_from_header(
    authorization: Optional[str] = Header(None),
    supabase: Client = Depends(get_supabase)
) -> str:
    """
    Extract tenant_id from authenticated user's profile
    Falls back to DEFAULT_TENANT_ID if no auth or error
    
    Args:
        authorization: Authorization header with Bearer token
        supabase: Supabase client
        
    Returns:
        Tenant UUID
    """
    settings = get_settings()
    
    if not authorization:
        print("No Authorization header, using DEFAULT_TENANT_ID")
        return settings.default_tenant_id
    
    try:
        token = authorization.replace("Bearer ", "")
        # Verify user with Supabase Auth
        user_resp = supabase.auth.get_user(token)
        if not user_resp or not user_resp.user:
            print("Invalid Token, using DEFAULT_TENANT_ID")
            return settings.default_tenant_id
        
        user_id = user_resp.user.id
        
        # Fetch Profile to get Tenant
        profile_resp = supabase.table('profiles').select('tenant_id').eq('id', user_id).single().execute()
        if profile_resp.data:
            return profile_resp.data['tenant_id']
        
        print("Profile not found, using DEFAULT_TENANT_ID")
        return settings.default_tenant_id
        
    except Exception as e:
        print(f"Auth Error: {e}, using DEFAULT_TENANT_ID")
        return settings.default_tenant_id


# === Repository Dependencies ===

def get_client_repository(supabase: Client = Depends(get_supabase)) -> ClientRepository:
    """Get ClientRepository instance"""
    return ClientRepository(supabase)


def get_invoice_repository(supabase: Client = Depends(get_supabase)) -> InvoiceRepository:
    """Get InvoiceRepository instance"""
    return InvoiceRepository(supabase)


def get_crm_repository(supabase: Client = Depends(get_supabase)) -> CRMRepository:
    """Get CRMRepository instance"""
    return CRMRepository(supabase)


# === Service Dependencies ===

def get_dashboard_service(
    client_repo: ClientRepository = Depends(get_client_repository),
    invoice_repo: InvoiceRepository = Depends(get_invoice_repository),
    crm_repo: CRMRepository = Depends(get_crm_repository)
) -> DashboardService:
    """Get DashboardService instance"""
    return DashboardService(client_repo, invoice_repo, crm_repo)


def get_client_service(
    client_repo: ClientRepository = Depends(get_client_repository),
    invoice_repo: InvoiceRepository = Depends(get_invoice_repository),
    crm_repo: CRMRepository = Depends(get_crm_repository)
) -> ClientService:
    """Get ClientService instance"""
    return ClientService(client_repo, invoice_repo, crm_repo)


def get_notification_service(
    client_repo: ClientRepository = Depends(get_client_repository)
) -> NotificationService:
    """Get NotificationService instance"""
    return NotificationService(client_repo)


def get_portal_service(
    client_repo: ClientRepository = Depends(get_client_repository),
    crm_repo: CRMRepository = Depends(get_crm_repository),
    invoice_repo: InvoiceRepository = Depends(get_invoice_repository)
) -> PortalService:
    """Get PortalService instance"""
    return PortalService(client_repo, crm_repo, invoice_repo)


def get_import_service(
    client_repo: ClientRepository = Depends(get_client_repository),
    invoice_repo: InvoiceRepository = Depends(get_invoice_repository),
    crm_repo: CRMRepository = Depends(get_crm_repository)
) -> ImportService:
    """Get ImportService instance"""
    return ImportService(client_repo, invoice_repo, crm_repo)

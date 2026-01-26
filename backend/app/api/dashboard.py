"""
Dashboard API Router
Endpoints for dashboard data
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from app.api.dependencies import get_tenant_from_header, get_dashboard_service, get_supabase
from app.services import DashboardService
from app.schemas import DashboardData
from app.utils import get_current_uyu_rate

router = APIRouter(prefix="", tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard(
    tenant_id: str = Depends(get_tenant_from_header),
    service: DashboardService = Depends(get_dashboard_service),
    supabase = Depends(get_supabase)
):
    """
    Get dashboard data with clients, KPIs, and exchange rate
    
    - **tenant_id**: Extracted from auth token
    - Returns: Dashboard data with items, KPIs, and exchange rate
    """
    try:
        # Get exchange rate
        rate_uyu = get_current_uyu_rate()
        
        # Get users for agent mapping
        users_resp = supabase.table('profiles').select("id, full_name").execute()
        user_map = {u['id']: u['full_name'] for u in users_resp.data} if users_resp.data else {}
        
        # Get dashboard data from service
        data = service.get_dashboard_data(tenant_id, rate_uyu, user_map)
        
        return data
        
    except Exception as e:
        print(f"Error generating dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

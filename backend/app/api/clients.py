"""
Clients API Router
Endpoints for client operations
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.api.dependencies import get_tenant_from_header, get_client_service
from app.services import ClientService
from app.schemas import QueueItem, ClientDetail, StatusUpdate
from app.utils import get_current_uyu_rate

router = APIRouter(prefix="/api", tags=["clients"])


@router.get("/queue", response_model=List[QueueItem])
async def get_prioritized_queue(
    min_debt: float = 0,
    aging_bucket: str = "all",
    risk_level: str = "all",
    tenant_id: str = Depends(get_tenant_from_header),
    service: ClientService = Depends(get_client_service)
):
    """
    Get prioritized client queue with optional filters
    
    - **min_debt**: Minimum debt filter (default: 0)
    - **aging_bucket**: Aging bucket filter (all, 1-30, 31-60, 61-90, +90)
    - **risk_level**: Risk level filter (all, Crítico, Alto, etc.)
    - Returns: List of prioritized queue items
    """
    try:
        rate_uyu = get_current_uyu_rate()
        
        queue = service.get_prioritized_queue(
            tenant_id=tenant_id,
            min_debt=min_debt,
            aging_bucket=aging_bucket,
            risk_level=risk_level,
            exchange_rate=rate_uyu
        )
        
        return queue
        
    except Exception as e:
        print(f"Queue Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clients/{client_id}", response_model=ClientDetail)
async def get_client_detail(
    client_id: str,
    tenant_id: str = Depends(get_tenant_from_header),
    service: ClientService = Depends(get_client_service)
):
    """
    Get detailed information for a specific client
    
    - **client_id**: Client UUID
    - Returns: Client details with invoices and CRM history
    """
    try:
        rate_uyu = get_current_uyu_rate()
        
        detail = service.get_client_detail(client_id, tenant_id, rate_uyu)
        
        return detail
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Client Detail Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/clients/{client_id}/status")
async def update_client_status(
    client_id: str,
    update: StatusUpdate,
    tenant_id: str = Depends(get_tenant_from_header),
    service: ClientService = Depends(get_client_service)
):
    """
    Update client status
    
    - **client_id**: Client UUID
    - **status**: New status
    - Returns: Success message with updated data
    """
    try:
        updated = service.update_status(client_id, update.status, tenant_id)
        return {"status": "success", "data": updated}
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Status Update Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

"""
CRM API Router
Endpoints for CRM operations
"""

from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_tenant_from_header, get_crm_repository
from app.repositories import CRMRepository
from app.schemas import CRMEntry

router = APIRouter(prefix="/api", tags=["crm"])


@router.post("/crm")
async def create_crm_entry(
    entry: CRMEntry,
    tenant_id: str = Depends(get_tenant_from_header),
    crm_repo: CRMRepository = Depends(get_crm_repository)
):
    """
    Create a CRM entry
    
    - **entry**: CRM entry data
    - Returns: Created entry
    """
    try:
        data = entry.dict()
        # Overwrite tenant_id from authorized user
        data['tenant_id'] = tenant_id
        
        created = crm_repo.create(data)
        
        return {"status": "success", "data": created}
        
    except Exception as e:
        print(f"CRM Creation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/crm/interactions")
async def add_crm_interaction(
    entry: CRMEntry,
    tenant_id: str = Depends(get_tenant_from_header),
    crm_repo: CRMRepository = Depends(get_crm_repository)
):
    """
    Add CRM interaction (legacy endpoint)
    
    - **entry**: CRM entry data
    - Returns: Created entry
    """
    try:
        data = entry.dict()
        data['tenant_id'] = tenant_id
        
        created = crm_repo.create(data)
        
        return {"status": "success", "data": created}
        
    except Exception as e:
        print(f"CRM Interaction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

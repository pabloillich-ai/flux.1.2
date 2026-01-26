"""
Portal API Router
Endpoints for Client Portal interactions
"""

from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_portal_service
from app.services import PortalService
from app.schemas import PortalInteraction

router = APIRouter(prefix="/api/portal", tags=["portal"])

@router.get("/{uuid}")
async def get_portal_data(
    uuid: str,
    service: PortalService = Depends(get_portal_service)
):
    """Fetches diagnostic and debtor data for the portal"""
    data = await service.get_portal_data(uuid)
    if not data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return data

@router.post("/interaction")
async def handle_portal_interaction(
    interaction: PortalInteraction,
    service: PortalService = Depends(get_portal_service)
):
    """Processes an action (payment, schedule, contact) sent from the portal"""
    try:
        result = await service.handle_interaction(interaction.uuid, interaction.type, interaction.data)
        if not result:
            raise HTTPException(status_code=404, detail="Client not found")
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

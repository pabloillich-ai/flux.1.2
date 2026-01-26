"""
Admin & Data API Router
Endpoints for notifications, imports and admin tasks
"""

from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_tenant_from_header, get_notification_service, get_import_service
from app.services import NotificationService, ImportService
from app.schemas import NotificationRequest, ImportRequest

router = APIRouter(prefix="/api", tags=["admin"])

@router.post("/notify")
async def send_notification(
    req: NotificationRequest,
    tenant_id: str = Depends(get_tenant_from_header),
    service: NotificationService = Depends(get_notification_service)
):
    """Dispatches an email or notification to a client"""
    return await service.send_client_notification(req.client_id, req.channel, req.message_val, tenant_id)

@router.post("/import/process")
async def process_import(
    req: ImportRequest,
    tenant_id: str = Depends(get_tenant_from_header),
    service: ImportService = Depends(get_import_service)
):
    """Processes a bulk data import (CSV mapping)"""
    return await service.process_import(req.type, req.data, req.mapping, tenant_id)

@router.post("/admin/seed")
async def seed_data(
    tenant_id: str = Depends(get_tenant_from_header),
    service: ImportService = Depends(get_import_service)
):
    """Seeds mock data into the database for testing"""
    return await service.seed_data(tenant_id)

"""
Repositories Package
Export all repository classes
"""

from app.repositories.base import BaseRepository
from app.repositories.client_repository import ClientRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.crm_repository import CRMRepository

__all__ = [
    'BaseRepository',
    'ClientRepository',
    'InvoiceRepository',
    'CRMRepository',
]

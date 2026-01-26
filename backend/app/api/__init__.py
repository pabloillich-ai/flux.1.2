"""
API Routes Package
Export all API routers
"""

from app.api import dashboard, clients, crm, portal, admin

__all__ = [
    'dashboard',
    'clients',
    'crm',
    'portal',
    'admin',
]

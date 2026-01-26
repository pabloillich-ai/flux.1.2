"""
Portal Service
Handles interactions from the Client Portal
"""

from datetime import datetime
from app.repositories import ClientRepository, CRMRepository, InvoiceRepository

class PortalService:
    def __init__(self, client_repo: ClientRepository, crm_repo: CRMRepository, invoice_repo: InvoiceRepository):
        self.client_repo = client_repo
        self.crm_repo = crm_repo
        self.invoice_repo = invoice_repo

    async def get_portal_data(self, uuid: str):
        """Fetches data needed for the client portal view"""
        client = self.client_repo.supabase.table('clientes_maestra').select("*").eq('uuid', uuid).execute()
        if not client.data:
            return None
        
        client_data = client.data[0]
        rut = client_data.get('rut_ci')
        invoices = []
        if rut:
            invoices = self.invoice_repo.find_by_client_rut(rut, client_data.get('tenant_id'))
        
        return {
            "client": client_data,
            "invoices": invoices
        }

    async def handle_interaction(self, client_uuid: str, interaction_type: str, data: dict):
        """Processes an interaction from the portal and logs it into CRM"""
        client = self.client_repo.supabase.table('clientes_maestra').select("tenant_id, razon_social, rut_ci").eq('uuid', client_uuid).single().execute()
        if not client.data:
            return None
        
        client_info = client.data
        new_entry = {
            "id_cliente": client_uuid,
            "tenant_id": client_info.get('tenant_id'),
            "cliente_razon_social": client_info.get('razon_social'),
            "rut_id_cliente": client_info.get('rut_ci'),
            "tipo_gestion": "gestión Aut",
            "canal": "Web",
            "sentido": "Entrante",
            "agente_responsable": "Web",
            "fecha_y_hora": datetime.now().isoformat()
        }

        if interaction_type == 'schedule':
            new_entry["resultado_estado"] = "Promesa de Pago"
            new_entry["fecha_promesa_pago"] = data.get('date')
            amount = data.get('amount', 0)
            comment = data.get('comment', '')
            new_entry["observaciones_mensaje"] = f"{comment} (Monto Prometido: ${amount})" if comment else f"Monto Prometido: ${amount}"
        elif interaction_type == 'error':
            new_entry["resultado_estado"] = "Error Reportado"
            new_entry["observaciones_mensaje"] = data.get('comment', 'Sin detalles')
        elif interaction_type == 'payment':
            new_entry["resultado_estado"] = "Pago Realizado"
            comment = data.get('comment', '')
            file_url = data.get('fileUrl', '')
            msg = comment + (f" [Comprobante: {file_url}]" if file_url else "")
            new_entry["observaciones_mensaje"] = msg
        elif interaction_type == 'contact':
            new_entry["resultado_estado"] = "Solicitud de Contacto"
            new_entry["observaciones_mensaje"] = f"Nombre: {data.get('name')} | Tel: {data.get('phone')} | Mensaje: {data.get('comment')}"
        
        return self.crm_repo.create(new_entry)

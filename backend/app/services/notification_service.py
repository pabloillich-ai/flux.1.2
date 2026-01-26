"""
Notification Service
Handles sending emails and other communication channels
"""

import resend
from app.config import get_settings
from app.repositories import ClientRepository

class NotificationService:
    def __init__(self, client_repo: ClientRepository):
        self.client_repo = client_repo
        self.settings = get_settings()
        if self.settings.resend_api_key:
            resend.api_key = self.settings.resend_api_key

    async def send_client_notification(self, client_id: str, channel: str, message: str, tenant_id: str):
        """Sends a notification to a specific client"""
        if channel.lower() == 'email':
            return await self._send_email(client_id, message, tenant_id)
        
        # Log simulated dispatch for other channels
        print(f"Simulated {channel} to {client_id}: {message}")
        return {"status": "queued", "message": f"Notification dispatched via {channel}"}

    async def _send_email(self, client_id: str, message: str, tenant_id: str):
        if not resend.api_key:
            return {"status": "error", "message": "Resend API Key missing"}

        client = self.client_repo.find_by_id(client_id, tenant_id)
        if not client:
            return {"status": "error", "message": "Client not found"}

        dest_email = client.get('email_facturacion')
        client_name = client.get('razon_social')

        if not dest_email or '@' not in dest_email:
            return {"status": "error", "message": "Client has no valid email"}

        try:
            r = resend.Emails.send({
                "from": "CobranzasPro <onboarding@resend.dev>",
                "to": dest_email,
                "subject": "Notificación de Cobranza",
                "html": f"<p>Estimado {client_name},</p><p>{message}</p>"
            })
            return {"status": "sent", "provider_response": r}
        except Exception as e:
            print(f"Email Error: {e}")
            return {"status": "error", "detail": str(e)}

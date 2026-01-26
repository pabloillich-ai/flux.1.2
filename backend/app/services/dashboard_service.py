"""
Dashboard Service
Business logic for dashboard operations
"""

from typing import Dict, List
from datetime import date, datetime
from app.repositories import ClientRepository, InvoiceRepository, CRMRepository
from app.config import get_settings


class DashboardService:
    """Service for dashboard business logic"""
    
    def __init__(
        self,
        client_repo: ClientRepository,
        invoice_repo: InvoiceRepository,
        crm_repo: CRMRepository
    ):
        self.client_repo = client_repo
        self.invoice_repo = invoice_repo
        self.crm_repo = crm_repo
        self.settings = get_settings()
    
    def get_dashboard_data(
        self, 
        tenant_id: str,
        exchange_rate: float,
        user_map: Dict[str, str] = None
    ) -> Dict:
        """
        Get complete dashboard data
        
        Args:
            tenant_id: Tenant UUID
            exchange_rate: USD to UYU exchange rate
            user_map: Optional mapping of user_id to user_name
            
        Returns:
            Dashboard data with items, KPIs, and exchange rate
        """
        # Fetch data from repositories
        clients = self.client_repo.find_all(tenant_id)
        invoices = self.invoice_repo.find_pending(tenant_id)
        crms = self.crm_repo.find_recent(tenant_id, days=30)
        
        # Get paid invoices for recovered KPI
        paid_invoices = self.invoice_repo.find_paid(tenant_id)
        recovered_total = self._calculate_recovered(paid_invoices, exchange_rate)
        
        # Group data by client
        inv_by_client = self._group_invoices_by_client(invoices)
        crm_by_client = self._group_crm_by_client(crms)
        
        # Process clients
        processed_items = []
        total_debt_global = 0
        critical_debt_global = 0
        managed_count = 0
        
        for client in clients:
            uuid = client.get('uuid')
            if not uuid:
                continue
            
            rut = client.get('rut_ci')
            agent_id = client.get('agente')
            agent_name = user_map.get(agent_id, 'Sin Asignar') if user_map else 'Sin Asignar'
            
            # Get client invoices
            client_invs = inv_by_client.get(rut, [])
            frontend_invs = self._format_invoices(client_invs)
            
            # Calculate debt
            overdue, upcoming = self._calculate_debt_split(client_invs, exchange_rate)
            total_debt_global += (overdue + upcoming)
            critical_debt_global += overdue
            
            # Get CRM data
            client_crms = crm_by_client.get(uuid, [])
            latest_crm = client_crms[0] if client_crms else {}
            crm_obj = self._format_crm_summary(latest_crm)
            
            # Status
            status = client.get('estado_actual', 'Pendiente')
            if status != 'Pendiente':
                managed_count += 1
            
            if status in ['Comercial', 'Legal', 'Incobrable']:
                status = 'Escalado'
            
            # Build item
            item = {
                "id": uuid,
                "rut": rut,
                "name": client.get('razon_social'),
                "risk": client.get('status_riesgo', 'Regular'),
                "creditLimit": client.get('limite_de_credito', 0),
                "agentId": agent_id,
                "agentName": agent_name,
                "invoices": frontend_invs,
                "crmHistory": client_crms,
                "crm": crm_obj,
                "status": status,
                "promiseDate": latest_crm.get('fecha_promesa_pago'),
                "overdue": overdue,
                "upcoming": upcoming,
                "totalDebt": overdue + upcoming
            }
            
            processed_items.append(item)
        
        # Calculate KPIs
        effectiveness = 0
        if len(clients) > 0:
            effectiveness = int((managed_count / len(clients)) * 100)
        
        kpis = {
            "total": self._format_money(total_debt_global),
            "critical": self._format_money(critical_debt_global),
            "recovered": self._format_money(recovered_total),
            "effectiveness": f"{effectiveness}%"
        }
        
        return {
            "items": processed_items,
            "kpis": kpis,
            "exchange_rate": exchange_rate
        }
    
    def _calculate_debt_split(self, invoices: List[Dict], rate_uyu: float) -> tuple:
        """Calculate overdue and upcoming debt"""
        overdue = 0
        upcoming = 0
        today = date.today()
        
        for inv in invoices:
            amount = inv.get("saldo_pendiente", 0)
            currency = inv.get("moneda", "UYU")
            due_date_str = inv.get("fecha_vencimiento")
            
            # Convert to UYU
            final_amount = amount if currency == "UYU" else amount * rate_uyu
            
            # Check if overdue
            if due_date_str:
                try:
                    due = datetime.strptime(due_date_str, "%Y-%m-%d").date()
                    if due < today:
                        overdue += final_amount
                    else:
                        upcoming += final_amount
                except ValueError:
                    upcoming += final_amount
            else:
                upcoming += final_amount
        
        return overdue, upcoming
    
    def _calculate_recovered(self, paid_invoices: List[Dict], rate_uyu: float) -> float:
        """Calculate total recovered amount"""
        recovered = 0
        for inv in paid_invoices:
            amt = inv.get('monto_total', 0)
            if inv.get('moneda') == 'USD':
                amt *= rate_uyu
            recovered += amt
        return recovered
    
    def _group_invoices_by_client(self, invoices: List[Dict]) -> Dict[str, List[Dict]]:
        """Group invoices by client RUT"""
        grouped = {}
        for inv in invoices:
            rut = inv.get('rut_ci')
            if rut not in grouped:
                grouped[rut] = []
            grouped[rut].append(inv)
        return grouped
    
    def _group_crm_by_client(self, crms: List[Dict]) -> Dict[str, List[Dict]]:
        """Group CRM entries by client ID"""
        grouped = {}
        for c in crms:
            cid = c.get('id_cliente')
            if cid not in grouped:
                grouped[cid] = []
            grouped[cid].append(c)
        return grouped
    
    def _format_invoices(self, invoices: List[Dict]) -> List[Dict]:
        """Format invoices for frontend"""
        return [
            {
                "id": inv.get('id'),
                "amount": inv.get('saldo_pendiente'),
                "currency": inv.get('moneda'),
                "dueDate": inv.get('fecha_vencimiento'),
                "issueDate": inv.get('fecha_emision')
            }
            for inv in invoices
        ]
    
    def _format_crm_summary(self, crm: Dict) -> Dict:
        """Format CRM summary for frontend"""
        crm_obj = {
            "lastNote": crm.get('observaciones_mensaje', 'Sin gestión reciente'),
            "date": crm.get('fecha_y_hora', '-')
        }
        
        if crm_obj["date"] != '-':
            try:
                dt = datetime.fromisoformat(crm_obj["date"].replace("Z", "+00:00"))
                crm_obj["date"] = dt.strftime("%Y-%m-%d")
            except:
                pass
        
        return crm_obj
    
    def _format_money(self, amount: float) -> str:
        """Format money for display"""
        return f"${amount:,.0f}"

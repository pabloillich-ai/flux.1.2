"""
Client Service
Business logic for client operations
"""

from typing import List, Dict, Optional
from datetime import date, datetime
from app.repositories import ClientRepository, InvoiceRepository, CRMRepository


class ClientService:
    """Service for client business logic"""
    
    def __init__(
        self,
        client_repo: ClientRepository,
        invoice_repo: InvoiceRepository,
        crm_repo: CRMRepository
    ):
        self.client_repo = client_repo
        self.invoice_repo = invoice_repo
        self.crm_repo = crm_repo
    
    def get_prioritized_queue(
        self,
        tenant_id: str,
        min_debt: float = 0,
        aging_bucket: str = "all",
        risk_level: str = "all",
        exchange_rate: float = 42.0
    ) -> List[Dict]:
        """
        Get prioritized client queue with filters
        
        Args:
            tenant_id: Tenant UUID
            min_debt: Minimum debt filter
            aging_bucket: Aging bucket filter (1-30, 31-60, etc.)
            risk_level: Risk level filter
            exchange_rate: USD to UYU rate
            
        Returns:
            List of queue items sorted by priority score
        """
        # Fetch data
        clients = self.client_repo.find_all(tenant_id)
        invoices = self.invoice_repo.find_pending(tenant_id)
        crms = self.crm_repo.find_broken_promises(tenant_id)
        
        # Group invoices by client
        inv_map = self._group_invoices_by_rut(invoices)
        
        # Map broken promises by client
        broken_promise_map = {c.get('id_cliente'): True for c in crms}
        
        queue = []
        today = date.today()
        
        for client in clients:
            rut = client.get('rut_ci')
            client_invs = inv_map.get(rut, [])
            
            if not client_invs:
                continue
            
            # Calculate debt & aging
            total_debt = 0
            max_days_overdue = 0
            
            for inv in client_invs:
                amt = inv.get('saldo_pendiente', 0)
                if inv.get('moneda') == 'USD':
                    amt *= exchange_rate
                total_debt += amt
                
                due_str = inv.get('fecha_vencimiento')
                if due_str:
                    try:
                        due = datetime.strptime(due_str, "%Y-%m-%d").date()
                        days = (today - due).days
                        if days > max_days_overdue:
                            max_days_overdue = days
                    except:
                        pass
            
            # Apply filters
            if total_debt < min_debt:
                continue
            
            if aging_bucket != 'all':
                if not self._matches_aging_bucket(max_days_overdue, aging_bucket):
                    continue
            
            risk = client.get('status_riesgo', 'Regular')
            if risk_level != 'all' and risk != risk_level:
                continue
            
            # Calculate priority score
            has_bp = broken_promise_map.get(client.get('uuid'), False)
            score = self._calculate_priority_score(
                client, 
                max_days_overdue, 
                total_debt, 
                has_bp
            )
            bucket = self._determine_bucket(score)
            
            queue.append({
                "id": client.get('uuid'),
                "rut": rut,
                "name": client.get('razon_social'),
                "priorityScore": score,
                "bucket": bucket,
                "totalDebt": total_debt,
                "daysOverdue": max_days_overdue,
                "risk": risk,
                "lastAction": "Start",  # Placeholder
                "status": client.get('estado_actual', 'Pendiente')
            })
        
        # Sort by score descending
        queue.sort(key=lambda x: x['priorityScore'], reverse=True)
        
        return queue
    
    def get_client_detail(self, client_id: str, tenant_id: str, exchange_rate: float = 42.0) -> Dict:
        """
        Get detailed client information
        
        Args:
            client_id: Client UUID
            tenant_id: Tenant UUID
            exchange_rate: USD to UYU rate
            
        Returns:
            Client detail dict
        """
        # Get client
        client = self.client_repo.find_by_id(client_id, tenant_id)
        if not client:
            raise ValueError(f"Client {client_id} not found")
        
        # Get invoices
        rut = client.get('rut_ci')
        invoices = self.invoice_repo.find_by_client_rut(rut, tenant_id)
        
        # Get CRM history
        crm_history = self.crm_repo.find_by_client(client_id, tenant_id, limit=50)
        
        # Calculate debt
        overdue, upcoming = self._calculate_debt_split(invoices, exchange_rate)
        
        # Format invoices
        formatted_invs = [
            {
                "id": inv.get('id'),
                "amount": inv.get('saldo_pendiente'),
                "currency": inv.get('moneda'),
                "dueDate": inv.get('fecha_vencimiento'),
                "issueDate": inv.get('fecha_emision'),
                "status": inv.get('estado')
            }
            for inv in invoices
        ]
        
        return {
            "id": client_id,
            "rut": rut,
            "name": client.get('razon_social'),
            "risk": client.get('status_riesgo'),
            "totalDebt": overdue + upcoming,
            "overdue": overdue,
            "upcoming": upcoming,
            "agentName": "Sin Asignar",  # Would need user lookup
            "invoices": formatted_invs,
            "crmHistory": crm_history
        }
    
    def update_status(self, client_id: str, new_status: str, tenant_id: str) -> Dict:
        """
        Update client status
        
        Args:
            client_id: Client UUID
            new_status: New status
            tenant_id: Tenant UUID
            
        Returns:
            Updated client
        """
        updated = self.client_repo.update_current_status(client_id, new_status, tenant_id)
        if not updated:
            raise ValueError(f"Client {client_id} not found or update failed")
        return updated
    
    def _group_invoices_by_rut(self, invoices: List[Dict]) -> Dict[str, List[Dict]]:
        """Group invoices by RUT"""
        grouped = {}
        for inv in invoices:
            rut = inv.get('rut_ci')
            if rut not in grouped:
                grouped[rut] = []
            grouped[rut].append(inv)
        return grouped
    
    def _matches_aging_bucket(self, days_overdue: int, bucket: str) -> bool:
        """Check if days overdue matches aging bucket"""
        if bucket == '1-30':
            return 1 <= days_overdue <= 30
        elif bucket == '31-60':
            return 31 <= days_overdue <= 60
        elif bucket == '61-90':
            return 61 <= days_overdue <= 90
        elif bucket == '+90':
            return days_overdue > 90
        return True
    
    def _calculate_priority_score(
        self, 
        client: Dict, 
        debt_age_days: int, 
        debt_amount: float, 
        has_broken_promise: bool
    ) -> int:
        """Calculate priority score (0-150+)"""
        # Risk score (40%)
        risk_map = {
            'Crítico': 100, 'Legal': 100, 'Incobrable': 100,
            'Alto': 70, 'Mal Pagador': 70, 'Atraso Frecuente': 70,
            'Medio': 40, 'Regular': 40,
            'Bajo': 10, 'Excelente': 10, 'Buen Pagador': 10
        }
        risk_val = risk_map.get(client.get('status_riesgo', 'Regular'), 40)
        score = risk_val * 0.40
        
        # Aging score (30%)
        aging_val = min((debt_age_days / 360) * 100, 100)
        score += aging_val * 0.30
        
        # Amount score (20%)
        amount_val = min((debt_amount / 100000) * 100, 100)
        score += amount_val * 0.20
        
        # Broken promise penalty
        if has_broken_promise:
            score += 50
        
        return int(score)
    
    def _determine_bucket(self, score: int) -> str:
        """Determine priority bucket"""
        if score > 80:
            return 'Urgente'
        if score >= 50:
            return 'Seguimiento'
        return 'Preventivo'
    
    def _calculate_debt_split(self, invoices: List[Dict], rate_uyu: float) -> tuple:
        """Calculate overdue and upcoming debt"""
        overdue = 0
        upcoming = 0
        today = date.today()
        
        for inv in invoices:
            amount = inv.get("saldo_pendiente", 0)
            currency = inv.get("moneda", "UYU")
            due_date_str = inv.get("fecha_vencimiento")
            
            final_amount = amount if currency == "UYU" else amount * rate_uyu
            
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

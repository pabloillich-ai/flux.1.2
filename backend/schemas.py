from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum

# === ENUMS ===

class RiskLevel(str, Enum):
    CRITICO = "Crítico"
    ALTO = "Alto"
    MEDIO = "Medio"
    BAJO = "Bajo"
    REGULAR = "Regular"
    ATRASO_FRECUENTE = "Atraso Frecuente"
    MAL_PAGADOR = "Mal Pagador"
    LEGAL = "Legal"
    INCOBRABLE = "Incobrable"
    EXCELENTE = "Excelente"
    BUEN_PAGADOR = "Buen Pagador"
    # Fallback for unexpected values if necessary, generally better to fail or sanitize before
    
class InvoiceStatus(str, Enum):
    PENDIENTE = "Pendiente"
    PAGADO = "Pagado"
    VENCIDA = "Vencida"
    ANULADO = "Anulado"

# === SUB-MODELS ===

class InvoiceRead(BaseModel):
    id: Optional[str] = None # Some might map from id_interno or database id
    docNumber: Optional[str] = None
    issueDate: Optional[str] = None
    dueDate: Optional[str] = None
    amount: float
    currency: str
    status: Optional[str] = None 

class CRMHistoryItem(BaseModel):
    # Reflects DB columns mostly, but for frontend consistency
    id: Optional[int] = None
    fecha_y_hora: Optional[str] = None
    tipo_gestion: Optional[str] = None
    canal: Optional[str] = None
    sentido: Optional[str] = None
    resultado_estado: Optional[str] = None
    observaciones_mensaje: Optional[str] = None
    agente_responsable: Optional[str] = None

class DashboardCRMHighlevel(BaseModel):
    lastNote: str
    date: str

class DashboardClientItem(BaseModel):
    id: str
    rut: str
    name: str
    risk: str # Using str to check against Enum but allow flexibility if backend sends variations
    creditLimit: float
    agentId: Optional[str] = None
    agentName: str
    invoices: List[InvoiceRead]
    crmHistory: List[CRMHistoryItem]
    crm: DashboardCRMHighlevel
    status: str
    promiseDate: Optional[str] = None
    overdue: float
    upcoming: float
    totalDebt: float

class DashboardKPIs(BaseModel):
    total: str
    critical: str
    recovered: str
    effectiveness: str

# === MAIN MODELS ===

class DashboardData(BaseModel):
    items: List[DashboardClientItem]
    kpis: DashboardKPIs
    exchange_rate: float

class DashboardStats(BaseModel):
    cashFlow: float
    cashFlowClients: List[Dict[str, Any]] # Keeping generic for minor sub-list
    operationalVolume: int
    commitmentsToday: int
    commitmentsCompleted: int
    criticalRisk: int

class QueueItem(BaseModel):
    id: str
    rut: str
    name: str
    priorityScore: int
    bucket: str
    totalDebt: float
    daysOverdue: int
    risk: str
    lastAction: str
    status: str

class ClientDetail(BaseModel):
    id: str
    rut: str
    name: str
    risk: str
    totalDebt: float
    overdue: float
    upcoming: float
    agentName: str
    invoices: List[InvoiceRead]
    crmHistory: List[CRMHistoryItem]

class StatusUpdate(BaseModel):
    status: str

class ReportedPaymentUpdate(BaseModel):
    monto_transaccion: Optional[float] = None
    estado: Optional[str] = None
    observacion: Optional[str] = None
    fecha_pago: Optional[str] = None

# === CRM & PORTAL SCHEMAS ===

class CRMEntry(BaseModel):
    tenant_id: str = "a942b959-92f8-4ed1-8397-80ff430d8f1d"
    id_cliente: str
    fecha_y_hora: str
    tipo_gestion: str
    canal: str
    sentido: str
    resultado_estado: str
    observaciones_mensaje: str
    fecha_promesa_pago: Optional[str] = None
    agente_responsable: str = 'Sistema'
    rut_id_cliente: Optional[str] = None

class PortalInteraction(BaseModel):
    uuid: str
    type: str 
    data: dict 

class NotificationRequest(BaseModel):
    client_id: str
    channel: str 
    message_val: str 

# === IMPORT SCHEMAS ===

class ImportRequest(BaseModel):
    type: str 
    data: List[dict]
    mapping: dict

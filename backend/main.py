import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from schemas import (
    DashboardData, QueueItem, StatusUpdate, CRMEntry, 
    NotificationRequest, PortalInteraction, ImportRequest, 
    ClientDetail, DashboardStats, ReportedPaymentUpdate
)
from datetime import datetime, timedelta
import requests
from utils import get_current_uyu_rate
import resend

# Load env from parent directory if not in current
load_dotenv(dotenv_path="../.env")
load_dotenv() # Fallback to current

app = FastAPI(title="CobranzasPro Backend")

# CORS - Dynamic Config
cors_env = os.getenv("CORS_ORIGINS")
if cors_env:
    origins = [origin.strip() for origin in cors_env.split(",")]
    allow_all = False
else:
    # FALLBACK: For development only. In production, ALWAYS set CORS_ORIGINS
    print("WARNING: CORS_ORIGINS not set, allowing all origins (*)")
    origins = ["*"]
    allow_all = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if not allow_all else ["*"],
    # FastAPI/Starlette rule: cannot use allow_origins=['*'] with allow_credentials=True
    allow_credentials=not allow_all, 
    allow_methods=["*"],
    allow_headers=["*"],
)


# Supabase Setup
url: str = os.getenv("VITE_SUPABASE_URL")
# PREFER SERVICE_ROLE_KEY for Backend to bypass RLS!
key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

# Resend Setup
resend.api_key = os.getenv("RESEND_API_KEY")


if not url or not key:
    print("WARNING: Supabase URL or Key not found in environment variables.")

supabase: Client = create_client(url, key)

# DEFAULT TENANT (Main Company) - Hardcoded for now until dynamic auth is passed
# UUID: a942b959-92f8-4ed1-8397-80ff430d8f1d
DEFAULT_TENANT_ID = "a942b959-92f8-4ed1-8397-80ff430d8f1d"

# === MODELS ===
# Moved to schemas.py

# === HELPERS ===

def get_tenant_from_header(authorization: Optional[str] = Header(None)) -> str:
    """
    Extracts tenant_id from the authenticated user's profile.
    Falls back to DEFAULT_TENANT_ID if no auth or error (for dev/testing).
    In Production, this should raise 401 if no auth.
    """
    if not authorization:
        print("No Authorization header, using DEFAULT_TENANT_ID")
        return DEFAULT_TENANT_ID
    
    try:
        token = authorization.replace("Bearer ", "")
        # Verify user with Supabase Auth
        user_resp = supabase.auth.get_user(token)
        if not user_resp or not user_resp.user:
             print("Invalid Token, using DEFAULT_TENANT_ID")
             return DEFAULT_TENANT_ID
             
        user_id = user_resp.user.id
        
        # Fetch Profile to get Tenant
        profile_resp = supabase.table('profiles').select('tenant_id').eq('id', user_id).single().execute()
        if profile_resp.data:
            return profile_resp.data['tenant_id']
            
        print("Profile not found, using DEFAULT_TENANT_ID")
        return DEFAULT_TENANT_ID
        
    except Exception as e:
        print(f"Auth Error: {e}, using DEFAULT_TENANT_ID")
        return DEFAULT_TENANT_ID

def calculate_debt_split(invoices, rate_uyu):
    # ... (Keep existing implementation)
    overdue = 0
    upcoming = 0
    today = datetime.now().date()
    
    for inv in invoices:
        amount = inv.get("saldo_pendiente", 0)
        currency = inv.get("moneda", "UYU")
        due_date_str = inv.get("fecha_vencimiento")
        
        # Convert to UYU
        final_amount = amount if currency == "UYU" else amount * rate_uyu
        
        # Check Overdue
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

def calculate_priority_score(client, debt_age_days, debt_amount_norm, has_broken_promise):
    # 1. Risk Score (40%)
    risk_map = {
        'Crítico': 100, 'Legal': 100, 'Incobrable': 100,
        'Alto': 70, 'Mal Pagador': 70, 'Atraso Frecuente': 70,
        'Medio': 40, 'Regular': 40,
        'Bajo': 10, 'Excelente': 10, 'Buen Pagador': 10
    }
    risk_val = risk_map.get(client.get('status_riesgo', 'Regular'), 40)
    score = risk_val * 0.40
    
    # 2. Aging Score (30%)
    # Cap at 360 days for 100 points
    aging_val = min((debt_age_days / 360) * 100, 100)
    score += aging_val * 0.30
    
    # 3. Amount Score (20%)
    # 0-100 based on normalized debt. 
    # For now, we use a simple logarithmic-like cap: > $100k = 100pts
    amount_val = min((debt_amount_norm / 100000) * 100, 100)
    score += amount_val * 0.20
    
    # 4. Broken Promise Penalty (10% + Extra)
    if has_broken_promise:
        score += 50 # Direct penalty
        
    return min(int(score), 100) # Cap at 100? Or allow >100? Allow >100 for penalties.

def determine_bucket(score):
    if score > 80: return 'Urgente'
    if score >= 50: return 'Seguimiento'
    return 'Preventivo'

def format_money(amount):
    return f"${amount:,.0f}"

# === ENDPOINTS ===

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "CobranzasPro Backend"}

@app.get("/api/dashboard", response_model=DashboardData)
def get_dashboard_data(tenant_id: str = Depends(get_tenant_from_header)):
    try:
        # 1. Get Exchange Rate
        rate_uyu = get_current_uyu_rate()

        # 2. Fetch Data with defensive checks
        print(f"Fetching Dashboard for Tenant: {tenant_id}")
        
        clients = []
        try:
            res = supabase.table('clientes_maestra').select("*").eq('tenant_id', tenant_id).execute()
            clients = res.data or []
        except Exception as e:
            print(f"Dashboard Query Error (clients): {e}")

        users = []
        try:
            res = supabase.table('profiles').select("id, full_name").execute() 
            users = res.data or []
        except Exception as e:
            print(f"Dashboard Query Error (profiles): {e}")

        invoices = []
        try:
            res = supabase.table('inv_docs').select("*").eq('tenant_id', tenant_id).gt('saldo_pendiente', 0).execute()
            invoices = res.data or []
        except Exception as e:
            print(f"Dashboard Query Error (invoices): {e}")

        crms = []
        try:
            res = supabase.table('crm_gestion').select("*").eq('tenant_id', tenant_id).order('fecha_y_hora', desc=True).execute()
            crms = res.data or []
        except Exception as e:
            print(f"Dashboard Query Error (crm): {e}")

        recovered_total = 0
        try:
            res = supabase.table('inv_docs').select("monto_total, moneda").eq('tenant_id', tenant_id).eq('estado', 'Pagado').execute()
            if res.data:
                for inv in res.data:
                    amt = inv.get('monto_total', 0)
                    if inv.get('moneda') == 'USD':
                        amt *= rate_uyu
                    recovered_total += amt
        except Exception as e:
            print(f"Dashboard Query Error (recovered): {e}")

        # 3. Process Data
        processed_items = []
        total_debt_global = 0
        critical_debt_global = 0
        managed_count = 0

        user_map = {u['id']: u['full_name'] for u in users if 'id' in u}
        
        inv_by_client = {}
        for inv in invoices:
            rut = inv.get('rut_ci')
            if rut:
                if rut not in inv_by_client: inv_by_client[rut] = []
                inv_by_client[rut].append(inv)

        crm_by_client = {}
        for c in crms:
            cid = c.get('id_cliente') 
            if cid:
                if cid not in crm_by_client: crm_by_client[cid] = []
                crm_by_client[cid].append(c)

        for client in clients:
            uuid = client.get('uuid')
            if not uuid: continue 
                
            rut = client.get('rut_ci')
            agent_id = client.get('agente')
            agent_name = user_map.get(agent_id, 'Sin Asignar')

            client_invs = inv_by_client.get(rut, []) if rut else []
            frontend_invs = []
            for inv in client_invs:
                frontend_invs.append({
                    "id": inv.get('uuid') or inv.get('id'),
                    "docNumber": inv.get('nro_doc') or inv.get('serie_numero'),
                    "amount": inv.get('saldo_pendiente', 0),
                    "currency": inv.get('moneda', 'UYU'),
                    "dueDate": inv.get('fecha_vencimiento'),
                    "issueDate": inv.get('fecha_emision')
                })
            
            overdue, upcoming = calculate_debt_split(client_invs, rate_uyu)
            total_debt_global += (overdue + upcoming)
            critical_debt_global += overdue

            client_crms = crm_by_client.get(uuid, [])
            latest_crm = client_crms[0] if client_crms else {}
            
            crm_obj = {
                "lastNote": latest_crm.get('observaciones_mensaje', 'Sin gestión reciente'),
                "date": latest_crm.get('fecha_y_hora', '-')
            }
            if crm_obj["date"] != '-':
                  try:
                    dt = datetime.fromisoformat(crm_obj["date"].replace("Z", "+00:00"))
                    crm_obj["date"] = dt.strftime("%Y-%m-%d")
                  except: pass
            
            risk = client.get('status_riesgo', 'Regular')
            status = client.get('estado_actual', 'Pendiente')
            if status != 'Pendiente': managed_count += 1

            item = {
                "id": uuid,
                "rut": rut or "N/A",
                "name": client.get('razon_social', 'Desconocido'),
                "risk": risk or "Regular",
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
            
            if status in ['Comercial', 'Legal', 'Incobrable']:
                item['status'] = 'Escalado'

            processed_items.append(item)

        effectiveness = 0
        if clients:
            effectiveness = int((managed_count / len(clients)) * 100)

        kpis = {
            "total": format_money(total_debt_global),
            "critical": format_money(critical_debt_global),
            "recovered": format_money(recovered_total),
            "effectiveness": f"{effectiveness}%"
        }

        return {
            "items": processed_items,
            "kpis": kpis,
            "exchange_rate": rate_uyu
        }
    except Exception as e:
        print(f"Fatal Dashboard Error: {e}")
        # Final fallback to empty dashboard
        return {
            "items": [],
            "kpis": {"total": "$0", "critical": "$0", "recovered": "$0", "effectiveness": "0%"},
            "exchange_rate": 42.0
        }


@app.post("/crm/interactions")
def add_crm_interaction(entry: CRMEntry, tenant_id: str = Depends(get_tenant_from_header)):
    try:
        # Enforce Tenant Security
        data = entry.dict()
        data['tenant_id'] = tenant_id 
        
        # If no client ID provided (global action?), might error, but assuming frontend sends it.
        # If 'rut_id_cliente' is sent, we might want to ensure 'id_cliente' is filled or vice versa
        # For now, trust the payload tailored by frontend custom for this table.

        res = supabase.table('crm_gestion').insert(data).execute()
        
        return {"status": "success", "data": res.data}
    except Exception as e:
        print(f"Error adding CRM entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# QueueItem moved to schemas.py

@app.get("/api/queue", response_model=List[QueueItem])
def get_prioritized_queue(
    min_debt: float = 0,
    aging_bucket: str = "all", # 1-30, 31-60...
    risk_level: str = "all",
    tenant_id: str = Depends(get_tenant_from_header)
):
    try:
        # Fetch Data with defensive checks
        clients = []
        try:
            res = supabase.table('clientes_maestra').select("*").eq('tenant_id', tenant_id).execute()
            clients = res.data or []
        except Exception as e:
            print(f"Queue Error (clients): {e}")

        invoices = []
        try:
            res = supabase.table('inv_docs').select("*").eq('tenant_id', tenant_id).gt('saldo_pendiente', 0).execute()
            invoices = res.data or []
        except Exception as e:
            print(f"Queue Error (invoices): {e}")

        crms = []
        try:
            res = supabase.table('crm_gestion').select("id_cliente, resultado_estado, fecha_y_hora").eq('tenant_id', tenant_id).execute()
            crms = res.data or []
        except Exception as e:
            print(f"Queue Error (crm): {e}")
        
        # Pre-process Invoices by Client
        inv_map = {}
        for inv in invoices:
            rut = inv.get('rut_ci')
            if rut:
                if rut not in inv_map: inv_map[rut] = []
                inv_map[rut].append(inv)
            
        # Pre-process CRMs for Broken Promises
        broken_promise_map = {} # client_id -> bool
        for c in crms:
            if c.get('resultado_estado') == 'Promesa Incumplida':
                broken_promise_map[c.get('id_cliente')] = True

        queue = []
        today = datetime.now().date()
        rate_uyu = get_current_uyu_rate()

        for client in clients:
            rut = client.get('rut_ci')
            client_invs = inv_map.get(rut, [])
            
            if not client_invs: continue
            
            # Calc Debt & Aging
            total_debt = 0
            max_days_overdue = 0
            
            for inv in client_invs:
                amt = inv.get('saldo_pendiente', 0)
                if inv.get('moneda') == 'USD': amt *= rate_uyu
                total_debt += amt
                
                due_str = inv.get('fecha_vencimiento')
                if due_str:
                    try:
                        due = datetime.strptime(due_str, "%Y-%m-%d").date()
                        days = (today - due).days
                        if days > max_days_overdue: max_days_overdue = days
                    except: pass
            
            # Apply Filters
            if total_debt < min_debt: continue
            
            if aging_bucket != 'all':
                if aging_bucket == '1-30' and not (1 <= max_days_overdue <= 30): continue
                if aging_bucket == '31-60' and not (31 <= max_days_overdue <= 60): continue
                if aging_bucket == '61-90' and not (61 <= max_days_overdue <= 90): continue
                if aging_bucket == '+90' and not (max_days_overdue > 90): continue
                
            risk = client.get('status_riesgo', 'Regular')
            if risk_level != 'all' and risk != risk_level: continue

            # Calc Score
            has_bp = broken_promise_map.get(client.get('uuid'), False)
            score = calculate_priority_score(client, max_days_overdue, total_debt, has_bp)
            bucket = determine_bucket(score)
            
            queue.append({
                "id": client.get('uuid'),
                "rut": rut or "N/A",
                "name": client.get('razon_social', 'Desconocido'),
                "priorityScore": score,
                "bucket": bucket,
                "totalDebt": total_debt,
                "daysOverdue": max_days_overdue,
                "risk": risk,
                "lastAction": "Start", # Placeholder
                "status": client.get('estado_actual', 'Pendiente')
            })

        # Sort by Score DESC
        queue.sort(key=lambda x: x['priorityScore'], reverse=True)
        return queue

    except Exception as e:
        print(f"Fatal Queue Error: {e}")
        return []


# StatusUpdate moved to schemas.py

@app.put("/api/clients/{client_id}/status")
def update_client_status(client_id: str, update: StatusUpdate, tenant_id: str = Depends(get_tenant_from_header)):
    try:
        # Use tenant_id filter for security
        response = supabase.table('clientes_maestra').update({"estado_actual": update.status}).eq('uuid', client_id).eq('tenant_id', tenant_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# CRMEntry moved to schemas.py

@app.post("/api/crm")
def create_crm_entry(entry: CRMEntry, tenant_id: str = Depends(get_tenant_from_header)):
    try:
        data = entry.dict()
        # Overwrite tenant_id from authorized user
        data['tenant_id'] = tenant_id
        response = supabase.table('crm_gestion').insert([data]).execute()
        return {"status": "success", "data": response.data[0] if response.data else {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# NotificationRequest moved to schemas.py

@app.post("/api/notify")
def send_notification(req: NotificationRequest):
    # Placeholder for Email/SMS integration
    print(f"Sending {req.channel} to {req.client_id}: {req.message_val}")
    
    if req.channel.lower() == 'email':
        if not resend.api_key:
             print("Resend API Key not set. Skipping email.")
             return {"status": "error", "message": "Resend API Key missing"}

        # 1. Fetch Client Email
        # Try finding client in clientes_maestra (email_facturacion) or profiles?
        # Assuming client_id is a UUID from clients table
        try:
            client_resp = supabase.table('clientes_maestra').select('email_facturacion, razon_social').eq('uuid', req.client_id).single().execute()
            if client_resp.data:
                dest_email = client_resp.data.get('email_facturacion')
                client_name = client_resp.data.get('razon_social')
                
                if not dest_email or '@' not in dest_email:
                     # Try Contacts?
                     # For now, just error
                     return {"status": "error", "message": "Client has no valid email"}
                
                # 2. Send Email
                r = resend.Emails.send({
                  "from": "CobranzasPro <onboarding@resend.dev>", # Default Test Sender
                  "to": dest_email,
                  "subject": "Notificación de Cobranza",
                  "html": f"<p>Estimado {client_name},</p><p>{req.message_val}</p>"
                })
                print(f"Resend Response: {r}")
                return {"status": "sent", "provider_response": r}
            else:
                 return {"status": "error", "message": "Client not found"}

        except Exception as e:
            print(f"Email Error: {e}")
            return {"status": "error", "detail": str(e)}

    return {"status": "queued", "message": "Notification dispatched (Simulated for non-email)"}

@app.post("/api/admin/run-daily-process")
def run_daily_process():
    """
    Simulates a Nightly Cron Job:
    1. Recalculate all debts
    2. Update 'status_riesgo' based on rules
    3. Log stats
    """
    try:
        # Fetch fresh data (Scoped to Tenant)
        clients = supabase.table('clientes_maestra').select("*").eq('tenant_id', DEFAULT_TENANT_ID).execute().data
        invoices = supabase.table('inv_docs').select("*").eq('tenant_id', DEFAULT_TENANT_ID).gt('saldo_pendiente', 0).execute().data
        
        updated_count = 0
        
        # Example Logic: Mark as 'Critical' if debt > $100,000 UYU equivalent
        rate_uyu = get_current_uyu_rate() 
        
        for client in clients:
            # Calculate debt (simplified)
            total_debt = 0
            client_invs = [i for i in invoices if i['rut_ci'] == client['rut_ci']]
            for inv in client_invs:
                amount = inv['saldo_pendiente']
                if inv['moneda'] == 'USD': amount *= rate_uyu
                total_debt += amount
                
            new_risk = 'Regular'
            if total_debt > 100000: new_risk = 'Atraso Frecuente'
            if total_debt > 500000: new_risk = 'Mal Pagador'
            
            # If changed, update (simulate)
            if client.get('status_riesgo') != new_risk:
                # supabase.table('clientes_maestra').update({'status_riesgo': new_risk}).eq('uuid', client['uuid']).execute()
                updated_count += 1
                
        return {"status": "success", "processed_clients": len(clients), "risk_updates_simulated": updated_count}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === PORTAL ENDPOINTS ===

@app.get("/api/portal/{uuid}")
def get_portal_data(uuid: str):
    try:
        # 1. Fetch Client
        client_resp = supabase.table('clientes_maestra').select("*").eq('uuid', uuid).execute()
        
        if not client_resp.data:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
            
        client = client_resp.data[0]
        
        # 2. Fetch Invoices using RUT
        rut = client.get('rut_ci')
        if not rut:
             return {"client": client, "invoices": []}
             
        # Fetch invoices sorted by due date
        inv_resp = supabase.table('inv_docs').select("*").eq('rut_ci', rut).order('fecha_vencimiento').execute()
        invoices = inv_resp.data
        
        return {
            "client": client,
            "invoices": invoices
        }
        
    except Exception as e:
        print(f"Portal Fetch Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# PortalInteraction moved to schemas.py

@app.post("/api/portal/interaction")
def handle_portal_interaction(interaction: PortalInteraction):
    try:
        # Fetch basic client info for denormalization
        client_resp = supabase.table('clientes_maestra').select("tenant_id, razon_social, rut_ci").eq('uuid', interaction.uuid).single().execute()
        if not client_resp.data:
             raise HTTPException(status_code=404, detail="Client not found")
        
        client = client_resp.data
        
        # Prepare CRM Entry
        new_entry = {
            "id_cliente": interaction.uuid,
            "tenant_id": client.get('tenant_id', DEFAULT_TENANT_ID),
            "cliente_razon_social": client.get('razon_social'),
            "rut_id_cliente": client.get('rut_ci'),
            "tipo_gestion": "gestión Aut",
            "canal": "Web",
            "sentido": "Entrante",
            "agente_responsable": "Web",
            "fecha_y_hora": datetime.now().isoformat()
        }
        
        # Map Logic
        payload = interaction.data
        if interaction.type == 'schedule':
            new_entry["resultado_estado"] = "Promesa de Pago"
            new_entry["fecha_promesa_pago"] = payload.get('date')
            amount = payload.get('amount', 0)
            comment = payload.get('comment', '')
            new_entry["observaciones_mensaje"] = f"{comment} (Monto Prometido: ${amount})" if comment else f"Monto Prometido: ${amount}"

        elif interaction.type == 'error':
            new_entry["resultado_estado"] = "Error Reportado"
            new_entry["observaciones_mensaje"] = payload.get('comment', 'Sin detalles')

        elif interaction.type == 'payment':
            new_entry["resultado_estado"] = "Pago Realizado"
            comment = payload.get('comment', '')
            file_url = payload.get('fileUrl', '')
            amount = payload.get('amount', 0)
            
            msg = comment
            if file_url:
                msg += f" [Comprobante: {file_url}]"
            new_entry["observaciones_mensaje"] = msg

            # Create entry in pagos_reportados for dashboard tracking
            payment_record = {
                "tenant_id": client.get('tenant_id', DEFAULT_TENANT_ID),
                "client_id": interaction.uuid,
                "monto_transaccion": amount,
                "fecha_pago": datetime.now().strftime("%Y-%m-%d"),
                "estado": "Pendiente de Validación",
                "observacion": msg,
                "comprobante_url": file_url
            }
            try:
                supabase.table('pagos_reportados').insert(payment_record).execute()
            except Exception as e:
                print(f"Error inserting into pagos_reportados: {e}")
                # We don't fail the whole interaction if this secondary log fails, 
                # but in production we might want more robust handling.

        elif interaction.type == 'contact':
            new_entry["resultado_estado"] = "Solicitud de Contacto"
            name = payload.get('name')
            phone = payload.get('phone')
            msg = payload.get('comment')
            new_entry["observaciones_mensaje"] = f"Nombre: {name} | Tel: {phone} | Mensaje: {msg}"

        else:
             raise HTTPException(status_code=400, detail="Invalid interaction type")

        # Insert
        response = supabase.table('crm_gestion').insert([new_entry]).execute()
        
        # Trigger Notification (Simulated)
        print(f"TRIGGER: New Portal Interaction [{interaction.type}] for {client.get('razon_social')}")
        
        return {"status": "success", "data": response.data}

    except Exception as e:
        print(f"Interaction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# === IMPORT PROCESSING ===

# ImportRequest moved to schemas.py

@app.post("/api/import/process")
def process_import(req: ImportRequest, tenant_id: str = Depends(get_tenant_from_header)):
    try:
        processed_stats = {"new": 0, "updated": 0, "duplicates": 0, "errors": 0}
        
        # Helper to clean/normalize values
        def clean(val):
            if val is None: return ""
            return str(val).strip()
        
        target_table = ""
        unique_keys = []
        comparison_fields = []
        
        if req.type == 'Clientes':
            target_table = 'clientes_maestra'
            unique_keys = ['rut_ci'] 
            comparison_fields = ['razon_social', 'nombre_fantasia', 'direccion', 'tel', 'email_facturacion', 'limite_de_credito', 'status_riesgo']
            
        elif req.type == 'Contactos':
            target_table = 'contactos'
            unique_keys = ['email'] # Primary match
            comparison_fields = ['nombre', 'apellido', 'cargo', 'movil', 'tel']
            
        elif req.type == 'Facturas':
            target_table = 'inv_docs'
            # For invoices, we try id_interno if available, else composite
            unique_keys = ['id_interno'] 
            comparison_fields = ['saldo_pendiente', 'fecha_vencimiento', 'estado', 'monto_total']
            
        else:
            raise HTTPException(status_code=400, detail="Tipo de importación no válido")

        # Fetch existing data for comparison (Optimize: fetch only needed columns?)
        # For simplicity, we fetch all. For large datasets, this should be paginated or optimized.
        existing_records = []
        try:
             # Fetch all for now (Limit 1000 or similar in prod?)
            existing_records = supabase.table(target_table).select("*").eq('tenant_id', tenant_id).execute().data
        except Exception as e:
            print(f"Fetch Existing Error: {e}")
            
        # Index existing for fast lookup
        existing_map = {}
        for rec in existing_records:
            key_val = ""
            # Facturas logic: prefer id_interno, fallback to composite
            if req.type == 'Facturas':
                if rec.get('id_interno'):
                     key_val = str(rec.get('id_interno'))
                else:
                     # Composite: rut + nro_doc + serie
                     key_val = f"{clean(rec.get('rut_ci'))}_{clean(rec.get('nro_doc'))}_{clean(rec.get('serie_numero'))}"
            elif req.type == 'Contactos':
                 # Prefer email, fallback id_contacto_ext
                 if rec.get('email'):
                     key_val = clean(rec.get('email'))
                 elif rec.get('id_contacto_ext'):
                     key_val = clean(rec.get('id_contacto_ext'))
            else:
                # Clientes -> rut_ci
                key_val = clean(rec.get('rut_ci'))
            
            if key_val:
                existing_map[key_val] = rec

        # Process Incoming Data
        for row in req.data:
            # 1. Map Keys based on Mapping
            mapped_row = {}
            for db_field, file_header in req.mapping.items():
                if file_header: # Only map if user selected a header
                    mapped_row[db_field] = row.get(file_header) 
            
            # Default Tenant
            mapped_row['tenant_id'] = tenant_id
            
            # 2. Identify Key
            row_key = ""
            if req.type == 'Facturas':
                if mapped_row.get('id_interno'):
                    row_key = str(mapped_row.get('id_interno'))
                else:
                    # Construct composite if needed
                     r = clean(mapped_row.get('rut_ci'))
                     n = clean(mapped_row.get('nro_doc'))
                     s = clean(mapped_row.get('serie_numero'))
                     if r and n:
                         row_key = f"{r}_{n}_{s}"
            
            elif req.type == 'Contactos':
                 if mapped_row.get('email'):
                     row_key = clean(mapped_row.get('email'))
                 elif mapped_row.get('id_contacto_ext'):
                     row_key = clean(mapped_row.get('id_contacto_ext'))

            else: # Clientes
                row_key = clean(mapped_row.get('rut_ci'))
            
            if not row_key:
                processed_stats['errors'] += 1
                continue # Skip if no key found
            
            # 3. Compare
            if row_key in existing_map:
                existing = existing_map[row_key]
                
                # Check for changes
                has_changes = False
                for field in comparison_fields:
                    v_new = clean(mapped_row.get(field))
                    v_old = clean(existing.get(field))
                    if v_new and v_new != v_old:
                        has_changes = True
                        break
                
                if has_changes:
                    # Update Logic
                    try:
                        if 'uuid' in existing:
                             supabase.table(target_table).update(mapped_row).eq('uuid', existing['uuid']).execute()
                        processed_stats['updated'] += 1
                    except Exception as e:
                        print(f"Update Error: {e}")
                        processed_stats['errors'] += 1
                else:
                    processed_stats['duplicates'] += 1
            else:
                # New Record
                try:
                    supabase.table(target_table).insert([mapped_row]).execute()
                    processed_stats['new'] += 1
                except Exception as e:
                     print(f"Insert Error: {e}")
                     processed_stats['errors'] += 1
                     
        return {"status": "success", "stats": processed_stats}
        
    except Exception as e:
        print(f"Import Process Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/admin/seed")
def seed_mock_data(tenant_id: str = Depends(get_tenant_from_header)):
    # 1. Clients
    clients = [
        {
            "rut_ci": "210000010015",
            "razon_social": "Constructora Acme SA",
            "status_riesgo": "Crítico",
            "limite_de_credito": 100000,
            "estado_actual": "Pendiente",
            "uuid": "550e8400-e29b-41d4-a716-446655440001",
            "tenant_id": tenant_id
        },
        {
            "rut_ci": "210000020016",
            "razon_social": "Logística Rápida SRL",
            "status_riesgo": "Alto",
            "limite_de_credito": 50000,
            "estado_actual": "Pendiente",
            "uuid": "550e8400-e29b-41d4-a716-446655440002",
            "tenant_id": tenant_id
        },
        {
            "rut_ci": "210000030017",
            "razon_social": "Tech Solutions UY",
            "status_riesgo": "Medio",
            "limite_de_credito": 25000,
            "estado_actual": "Comercial",
            "uuid": "550e8400-e29b-41d4-a716-446655440003",
            "tenant_id": tenant_id
        },
        {
            "rut_ci": "210000040018",
            "razon_social": "Panadería El Sol",
            "status_riesgo": "Bajo",
            "limite_de_credito": 10000,
            "estado_actual": "Pendiente",
            "uuid": "550e8400-e29b-41d4-a716-446655440004",
            "tenant_id": tenant_id
        }
    ]

    for c in clients:
        try:
            supabase.table('clientes_maestra').upsert(c).execute()
        except Exception as e:
            print(f"Client error {c['razon_social']}: {e}")

    # 2. Invoices
    today = datetime.now()
    
    invoices = [
        # Acme (Critical, Very Old Debt)
        {"client_rut": "210000010015", "amount": 150000, "days_ago": 120, "currency": "UYU"},
        {"client_rut": "210000010015", "amount": 5000, "days_ago": 90, "currency": "USD"},
        # Logistica (High, Old, Broken Promise likely)
        {"client_rut": "210000020016", "amount": 45000, "days_ago": 45, "currency": "UYU"},
        # Tech (Medium, Recent)
        {"client_rut": "210000030017", "amount": 20000, "days_ago": 15, "currency": "UYU"},
        # Panaderia (Low, New)
        {"client_rut": "210000040018", "amount": 5000, "days_ago": 5, "currency": "UYU"}
    ]
    
    for i, inv in enumerate(invoices):
        due_date = (today - timedelta(days=inv['days_ago'])).strftime("%Y-%m-%d")
        id_interno = f"MOCK-{i+1000}"
        
        data = {
            "tenant_id": tenant_id,
            "rut_ci": inv['client_rut'],
            "id_interno": id_interno,
            # "nro_doc": str(i+1000), 
            "serie_numero": "A",
            "monto_total": inv['amount'],
            "saldo_pendiente": inv['amount'], 
            "moneda": inv['currency'],
            "fecha_vencimiento": due_date,
            "fecha_emision": (datetime.strptime(due_date, "%Y-%m-%d") - timedelta(days=30)).strftime("%Y-%m-%d"),
            "estado": "Pendiente"
        }
        try:
            supabase.table('inv_docs').upsert(data, on_conflict="id_interno,tenant_id").execute()
        except Exception as e:
            print(f"Inv error: {e}")

    # 3. CRM
    crm_entry = {
        "tenant_id": tenant_id,
        "id_cliente": "550e8400-e29b-41d4-a716-446655440002", 
        "rut_id_cliente": "210000020016",
        "tipo_gestion": "Llamada Saliente",
        "canal": "Teléfono",
        "sentido": "Saliente",
        "resultado_estado": "Promesa Incumplida",
        "observaciones_mensaje": "Prometió pagar hace 7 días y no cumplió. MOCK.",
        "fecha_y_hora": (today - timedelta(days=2)).isoformat(),
        "agente_responsable": "Sistema"
    }
    
    try:
        supabase.table('crm_gestion').insert(crm_entry).execute()
    except Exception as e:
        print(f"CRM error: {e}")

    return {"status": "seeded"}

# ClientDetail moved to schemas.py

# DashboardStats moved to schemas.py

@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(tenant_id: str = Depends(get_tenant_from_header)):
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        
        # 1. Cash Flow (Recaudado Hoy)
        cash_flow = 0
        cash_clients = []
        try:
            payments_res = supabase.table('pagos_reportados').select('monto_transaccion, client_id').eq('fecha_pago', today).eq('tenant_id', tenant_id).execute()
            if payments_res.data:
                cash_flow = sum(p.get('monto_transaccion', 0) for p in payments_res.data)
                
                # Get last 5 clients who paid
                recent_payments = supabase.table('pagos_reportados').select('client_id, monto_transaccion, clientes_maestra(razon_social)').eq('fecha_pago', today).eq('tenant_id', tenant_id).limit(5).execute()
                if recent_payments.data:
                    for p in recent_payments.data:
                         name = p.get('clientes_maestra', {}).get('razon_social', 'Cliente') if p.get('clientes_maestra') else 'Cliente'
                         cash_clients.append({"name": name, "amount": p.get('monto_transaccion', 0)})
        except Exception as e:
            print(f"Stats Error (CashFlow): {e}")

        # 2. Commitments (Promesas Hoy)
        commitments_total = 0
        commitments_completed = 0
        try:
            promises_res = supabase.table('crm_gestion').select('id, resultado_estado').eq('resultado_estado', 'Promesa de Pago').eq('fecha_promesa_pago', today).eq('tenant_id', tenant_id).execute()
            if promises_res.data:
                commitments_total = len(promises_res.data)
                commitments_completed = len([p for p in promises_res.data if p.get('resultado_estado') == 'Cumplida'])
        except Exception as e:
            print(f"Stats Error (Promises): {e}")

        # 3. Critical Risk 
        critical_risk = 0
        try:
            risk_res = supabase.table('clientes_maestra').select('status_riesgo').eq('tenant_id', tenant_id).execute()
            if risk_res.data:
                for r in risk_res.data:
                    status = r.get('status_riesgo', '')
                    if status and status.lower() in ['crítico', 'critico']:
                        critical_risk += 1
        except Exception as e:
            print(f"Stats Error (Risk): {e}")

        # 4. Operational Volume
        operational_volume = 0
        try:
            two_days_ago = (datetime.now() - timedelta(days=2)).isoformat()
            all_clients = supabase.table('clientes_maestra').select('uuid').eq('tenant_id', tenant_id).execute()
            if all_clients.data:
                total_clients = len(all_clients.data)
                recent_crm = supabase.table('crm_gestion').select('id_cliente').eq('tenant_id', tenant_id).gte('fecha_y_hora', two_days_ago).execute()
                touched_ids = set(c['id_cliente'] for c in (recent_crm.data or []))
                operational_volume = max(0, total_clients - len(touched_ids))
        except Exception as e:
            print(f"Stats Error (Volume): {e}")

        return {
            "cashFlow": cash_flow,
            "cashFlowClients": cash_clients,
            "operationalVolume": operational_volume,
            "commitmentsToday": commitments_total,
            "commitmentsCompleted": commitments_completed,
            "criticalRisk": critical_risk
        }
    except Exception as e:
        print(f"Global Stats Error: {e}")
        # Return empty stats instead of 500 to keep UI alive
        return {
            "cashFlow": 0, "cashFlowClients": [], "operationalVolume": 0,
            "commitmentsToday": 0, "commitmentsCompleted": 0, "criticalRisk": 0
        }


@app.get("/api/clients/{client_id}", response_model=ClientDetail)
def get_client_detail(client_id: str, tenant_id: str = Depends(get_tenant_from_header)):
    try:
        # 1. Fetch Client
        try:
            client_resp = supabase.table('clientes_maestra').select("*").eq('uuid', client_id).eq('tenant_id', tenant_id).single().execute()
            client = client_resp.data
        except:
             raise HTTPException(status_code=404, detail="Client not found")

        # 2. Fetch Invoices
        rut = client.get('rut_ci')
        invoices_resp = supabase.table('inv_docs').select("*").eq('rut_ci', rut).eq('tenant_id', tenant_id).gt('saldo_pendiente', 0).execute()
        invoices = invoices_resp.data

        # 3. Fetch CRM
        crm_resp = supabase.table('crm_gestion').select("*").eq('id_cliente', client_id).eq('tenant_id', tenant_id).order('fecha_y_hora', desc=True).execute()
        crms = crm_resp.data

        # 4. Calculate Debt
        # Use existing logic logic if possible, or replicate
        rate_uyu = get_current_uyu_rate() 
        overdue_sum = 0
        upcoming_sum = 0
        
        mapped_invoices = []
        today = datetime.now().date()

        for inv in invoices:
            amount = inv.get('saldo_pendiente', 0)
            currency = inv.get('moneda', 'UYU')
            due_str = inv.get('fecha_vencimiento')
            final_amount = amount if currency == 'UYU' else amount * rate_uyu
            
            # Map for frontend
            mapped_inv = {
                "id": inv.get('id_interno'),
                "issueDate": inv.get('fecha_emision'),
                "dueDate": inv.get('fecha_vencimiento'),
                "amount": amount,
                "currency": currency,
                "status": inv.get('estado')
            }
            mapped_invoices.append(mapped_inv)
            
            if due_str:
                try:
                    due = datetime.strptime(due_str, "%Y-%m-%d").date()
                    if due < today:
                        overdue_sum += final_amount
                    else:
                        upcoming_sum += final_amount
                except:
                     upcoming_sum += final_amount
            else:
                 upcoming_sum += final_amount

        return {
            "id": client.get('uuid'),
            "rut": client.get('rut_ci'),
            "name": client.get('razon_social'),
            "risk": client.get('status_riesgo'),
            "totalDebt": overdue_sum + upcoming_sum,
            "overdue": overdue_sum,
            "upcoming": upcoming_sum,
            "agentName": "Sin Asignar", # Placeholder or fetch from relation
            "invoices": mapped_invoices,
            "crmHistory": crms
        }

    except Exception as e:
        print(f"Error fetching client detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# === REPORTED PAYMENTS ENDPOINTS ===

@app.get("/api/payments/reported")
def get_reported_payments(tenant_id: str = Depends(get_tenant_from_header)):
    try:
        # Fetch all reported payments for tenant
        # Join with clientes_maestra to get client name
        res = supabase.table('pagos_reportados').select('*, clientes_maestra(razon_social, rut_ci)').eq('tenant_id', tenant_id).order('created_at', desc=True).execute()
        return res.data
    except Exception as e:
        print(f"Error fetching payments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/payments/reported/{payment_id}")
def update_reported_payment(payment_id: str, update: ReportedPaymentUpdate, tenant_id: str = Depends(get_tenant_from_header)):
    try:
        data = update.dict(exclude_unset=True)
        res = supabase.table('pagos_reportados').update(data).eq('id', payment_id).eq('tenant_id', tenant_id).execute()
        return {"status": "success", "data": res.data[0] if res.data else {}}
    except Exception as e:
        print(f"Error updating payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

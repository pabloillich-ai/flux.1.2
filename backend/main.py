import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import requests

# Load env from parent directory if not in current
load_dotenv(dotenv_path="../.env")
load_dotenv() # Fallback to current

app = FastAPI(title="CobranzasPro Backend")

# CORS - Allow strict origins in prod, but * for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Setup
url: str = os.getenv("VITE_SUPABASE_URL")
# PREFER SERVICE_ROLE_KEY for Backend to bypass RLS!
key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("WARNING: Supabase URL or Key not found in environment variables.")

supabase: Client = create_client(url, key)

# DEFAULT TENANT (Main Company) - Hardcoded for now until dynamic auth is passed
# UUID: a942b959-92f8-4ed1-8397-80ff430d8f1d
DEFAULT_TENANT_ID = "a942b959-92f8-4ed1-8397-80ff430d8f1d"

# === MODELS ===

class DashboardData(BaseModel):
    items: List[dict]
    kpis: dict
    exchange_rate: float

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

def format_money(amount):
    return f"${amount:,.0f}"

# === ENDPOINTS ===

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "CobranzasPro Backend"}

@app.get("/dashboard", response_model=DashboardData)
def get_dashboard_data(tenant_id: str = Depends(get_tenant_from_header)):
    try:
        # 1. Get Exchange Rate (Cached or Live)
        rate_uyu = 42.0
        try:
            resp = requests.get('https://open.er-api.com/v6/latest/USD', timeout=2)
            if resp.status_code == 200:
                data = resp.json()
                rate_uyu = data['rates']['UYU']
        except Exception as e:
            print(f"Rate fetch failed, using default: {e}")

        # 2. Fetch Data (Scoped to Dynamic Tenant)
        print(f"Fetching Dashboard for Tenant: {tenant_id}")
        
        clients_resp = supabase.table('clientes_maestra').select("*").eq('tenant_id', tenant_id).execute()
        users_resp = supabase.table('profiles').select("id, full_name").execute() 
        invoices_resp = supabase.table('inv_docs').select("*").eq('tenant_id', tenant_id).gt('saldo_pendiente', 0).execute()
        crm_resp = supabase.table('crm_gestion').select("*").eq('tenant_id', tenant_id).order('fecha_y_hora', desc=True).execute()

        # 2a. Fetch Paid Invoices for "Recovered" KPI
        paid_invoices_resp = supabase.table('inv_docs').select("monto_total, moneda").eq('tenant_id', tenant_id).eq('estado', 'Pagado').execute()
        recovered_total = 0
        if paid_invoices_resp.data:
            for inv in paid_invoices_resp.data:
                amt = inv.get('monto_total', 0)
                if inv.get('moneda') == 'USD':
                    amt *= rate_uyu
                recovered_total += amt

        clients = clients_resp.data
        users = users_resp.data
        invoices = invoices_resp.data
        crms = crm_resp.data
        
        # ... (Rest of logic remains identical)
        
        # 3. Process Data
        processed_items = []
        total_debt_global = 0
        critical_debt_global = 0
        managed_count = 0

        # Create lookups
        user_map = {u['id']: u['full_name'] for u in users}
        
        # Invoice Grouping
        inv_by_client = {}
        for inv in invoices:
            rut = inv.get('rut_ci')
            if rut not in inv_by_client:
                inv_by_client[rut] = []
            inv_by_client[rut].append(inv)

        # CRM Grouping 
        crm_by_client = {}
        for c in crms:
            cid = c.get('id_cliente') 
            if cid not in crm_by_client:
                crm_by_client[cid] = []
            crm_by_client[cid].append(c)

        for client in clients:
            uuid = client.get('uuid')
            if not uuid: continue 
                
            rut = client.get('rut_ci')
            agent_id = client.get('agente')
            agent_name = user_map.get(agent_id, 'Sin Asignar')

            client_invs = inv_by_client.get(rut, [])
            frontend_invs = []
            for inv in client_invs:
                frontend_invs.append({
                    "id": inv.get('id'),
                    "amount": inv.get('saldo_pendiente'),
                    "currency": inv.get('moneda'),
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
            
            # Map Backend Risk to Frontend Levels if needed, OR just pass through
            # Backend: 'Excelente', 'Buen Pagador', 'Regular', 'Atraso Frecuente', 'Mal Pagador', 'Legal', 'Incobrable'
            # Frontend Mock: 'ALTO', 'MEDIO', 'BAJO'
            # Let's map for consistency with requested design? 
            # The prompt said "show the risk", I will pass the raw backend risk for now and map in frontend.
            risk = client.get('status_riesgo', 'Regular')
            
            status = client.get('estado_actual', 'Pendiente')
            if status != 'Pendiente': managed_count += 1

            item = {
                "id": uuid,
                "rut": rut,
                "name": client.get('razon_social'),
                "risk": risk,
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

        # 4. Final KPIs
        effectiveness = 0
        if len(clients) > 0:
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
        print(f"Error generating dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class StatusUpdate(BaseModel):
    status: str

@app.put("/api/clients/{client_id}/status")
def update_client_status(client_id: str, update: StatusUpdate, tenant_id: str = Depends(get_tenant_from_header)):
    try:
        # Use tenant_id filter for security
        response = supabase.table('clientes_maestra').update({"estado_actual": update.status}).eq('uuid', client_id).eq('tenant_id', tenant_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CRMEntry(BaseModel):
    tenant_id: str = DEFAULT_TENANT_ID
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

class NotificationRequest(BaseModel):
    client_id: str
    channel: str # email, sms, whatsapp
    message_val: str # template or message

@app.post("/api/notify")
def send_notification(req: NotificationRequest):
    # Placeholder for Email/SMS integration
    print(f"Sending {req.channel} to {req.client_id}: {req.message_val}")
    return {"status": "queued", "message": "Notification dispatched"}

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
        rate_uyu = 42.0 
        
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

class PortalInteraction(BaseModel):
    uuid: str
    type: str # 'schedule', 'error', 'payment', 'contact'
    data: dict # payload specific to type

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
            file_url = payload.get('fileUrl', '') # If handled by frontend upload first, or we can handle upload here too?
            # Ideally frontend uploads to storage and sends URL here to keep backend simple for now or use specific upload endpoint.
            # Assuming frontend handles upload and sends URL.
            msg = comment
            if file_url:
                msg += f" [Comprobante: {file_url}]"
            new_entry["observaciones_mensaje"] = msg

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

class ImportRequest(BaseModel):
    type: str # 'Facturas', 'Contactos', 'Clientes'
    data: List[dict]
    mapping: dict

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



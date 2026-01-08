
import os
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env variables (for Service Key)
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
# Prefer Service Key for seeding to bypass RLS
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing Supabase Credentials in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TENANT_ID = "d227568c-051f-479e-9d29-45041a37c89f"

def seed_detailed_data():
    print(f"Connecting to {SUPABASE_URL}...")

    # Fetch valid tenant
    tenant_res = supabase.table('tenants').select('id').limit(1).execute()
    if not tenant_res.data:
        print("No tenants found! Create a tenant first.")
        return
    TENANT_ID = tenant_res.data[0]['id']
    print(f"Using Tenant ID: {TENANT_ID}")
    
    # 1. Create or Get Target Client
    # Let's create a specific "Heavy Data" client
    client_rut = "219999990019"
    client_name = "Corporación Demo Detallada S.A."
    
    existing = supabase.table('clientes_maestra').select('uuid').eq('rut_ci', client_rut).execute()
    
    if existing.data:
        client_id = existing.data[0]['uuid']
        print(f"Client {client_name} exists ({client_id}).")
    else:
        new_client = {
            "tenant_id": TENANT_ID,
            "rut_ci": client_rut,
            "razon_social": client_name,
            "status_riesgo": "Regular",
            "created_at": datetime.now().isoformat()
        }
        res = supabase.table('clientes_maestra').insert(new_client).execute()
        client_id = res.data[0]['uuid']
        print(f"Created Client {client_name} ({client_id}).")

    # 2. Seed Invoices (Mix of statuses)
    print("Seeding Invoices...")
    invoices = []
    
    today = datetime.now()
    
    # Overdue Invoices
    for i in range(1, 4):
        days_ago = random.randint(30, 90)
        due_date = today - timedelta(days=days_ago)
        issue_date = due_date - timedelta(days=30)
        amount = random.randint(10000, 50000)
        
        invoices.append({
            "tenant_id": TENANT_ID,
            "rut_ci": client_rut,
            "id_interno": 9000 + i, # Ensure uniqueness in mock range
            "fecha_emision": issue_date.strftime("%Y-%m-%d"),
            "fecha_vencimiento": due_date.strftime("%Y-%m-%d"),
            "moneda": "UYU",
            "monto_total": amount,
            "saldo_pendiente": amount, # Fully unpaid
            "estado": "Vencida"
        })

    # Upcoming Invoices
    for i in range(4, 7):
        days_future = random.randint(5, 30)
        due_date = today + timedelta(days=days_future)
        issue_date = today - timedelta(days=5)
        amount = random.randint(500, 2000)
        currency = "USD"
        
        invoices.append({
            "tenant_id": TENANT_ID,
            "rut_ci": client_rut,
            "id_interno": 9000 + i,
            "fecha_emision": issue_date.strftime("%Y-%m-%d"),
            "fecha_vencimiento": due_date.strftime("%Y-%m-%d"),
            "moneda": currency,
            "monto_total": amount,
            "saldo_pendiente": amount,
            "estado": "Pendiente"
        })

     # Insert Invoices safely
    for inv in invoices:
        try:
             # Check if exists by id_interno to avoid duplicate key error
             chk = supabase.table('inv_docs').select('uuid').eq('id_interno', inv['id_interno']).eq('tenant_id', TENANT_ID).execute()
             if not chk.data:
                 supabase.table('inv_docs').insert(inv).execute()
                 print(f"Inserted Inv {inv['id_interno']}")
             else:
                 print(f"Inv {inv['id_interno']} exists. Skipping.")
        except Exception as e:
            # Fallback if uuid is also not expected, but usually it is there
             print(f"Error inserting inv {inv['id_interno']}: {e}")

    # 3. Seed CRM History
    print("Seeding CRM History...")
    crm_entries = [
        {
            "days_ago": 0, "type": "Gestion", "channel": "Telefono", "sense": "Saliente", "res": "Contactado", 
            "msg": "Cliente confirma recepción de factura. Indica que pagará el viernes.", "promise": (today + timedelta(days=2)).strftime("%Y-%m-%d")
        },
        {
            "days_ago": 2, "type": "Recordatorio", "channel": "WhatsApp", "sense": "Saliente", "res": "Leido", 
            "msg": "Recordatorio de vencimiento enviado automáticamente.", "promise": None
        },
        {
            "days_ago": 15, "type": "Gestion", "channel": "Email", "sense": "Entrante", "res": "Promesa de Pago", 
            "msg": "Respuesta a reclamo: 'Estamos procesando el pago'.", "promise": (today - timedelta(days=10)).strftime("%Y-%m-%d")
        },
        {
            "days_ago": 45, "type": "Gestion", "channel": "Telefono", "sense": "Saliente", "res": "No Contesta", 
            "msg": "Intento de contacto sin éxito. Se deja mensaje en buzón.", "promise": None
        }
    ]

    for entry in crm_entries:
        date_act = today - timedelta(days=entry['days_ago'])
        
        crm_data = {
            "tenant_id": TENANT_ID,
            "id_cliente": client_id,
            "rut_id_cliente": client_rut,
            "fecha_y_hora": date_act.isoformat(),
            "tipo_gestion": entry['type'],
            "canal": entry['channel'],
            "sentido": entry['sense'],
            "resultado_estado": entry['res'],
            "observaciones_mensaje": entry['msg'],
            "fecha_promesa_pago": entry['promise'],
            "agente_responsable": "Maria Rodriguez" if entry['sense'] == "Saliente" else "Sistema"
        }
        
        try:
            supabase.table('crm_gestion').insert(crm_data).execute()
            print(f"Inserted CRM interaction: {entry['type']} - {entry['days_ago']} days ago")
        except Exception as e:
             print(f"Error inserting CRM: {e}")

    print("Seeding Complete!")

if __name__ == "__main__":
    seed_detailed_data()

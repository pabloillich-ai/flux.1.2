
import os
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def seed_kpis():
    print("Seeding KPI Data...")
    
    # Get Tenant
    tenant_res = supabase.table('tenants').select('id').limit(1).execute()
    if not tenant_res.data:
        print("No tenant.")
        return
    TENANT_ID = tenant_res.data[0]['id']

    # Get a few clients
    clients_res = supabase.table('clientes_maestra').select('uuid, rut_ci').eq('tenant_id', TENANT_ID).limit(5).execute()
    clients = clients_res.data
    
    if not clients:
        print("No clients found. Run previous seeds first.")
        return

    today_str = datetime.now().strftime("%Y-%m-%d")

    # 1. Recaudado Hoy (Payments)
    print("Seeding Payments for Today...")
    for i in range(3):
        client = random.choice(clients)
        payment = {
            "tenant_id": TENANT_ID,
            "client_id": client['uuid'],
            "monto_transaccion": random.randint(5000, 25000),
            "fecha_pago": today_str,
            "estado": "Validado",
            "observacion": "Pago simulado KPI"
        }
        supabase.table('pagos_reportados').insert(payment).execute()

    # 2. Promesas para Hoy
    print("Seeding Promises for Today...")
    for i in range(2):
        client = random.choice(clients)
        promise = {
            "tenant_id": TENANT_ID,
            "id_cliente": client['uuid'],
            "rut_id_cliente": client['rut_ci'],
            "fecha_y_hora": datetime.now().isoformat(),
            "tipo_gestion": "Promesa de Pago",
            "canal": "Telefono",
            "sentido": "Saliente",
            "resultado_estado": "Promesa",
            "observaciones_mensaje": "Promesa para hoy generada por seed.",
            "fecha_promesa_pago": today_str,
            "agente_responsable": "Sistema"
        }
        supabase.table('crm_gestion').insert(promise).execute()

    # 3. Riesgo Crítico (Update a client)
    print("Setting a client to Critical Risk...")
    crit_client = clients[0]
    supabase.table('clientes_maestra').update({"status_riesgo": "Crítico"}).eq('uuid', crit_client['uuid']).execute()

    # 4. Llamadas Pendientes (Ensure some have old interaction)
    # This is harder to force without deleting recent CRM, but we can assume existing data fits or add a new client with no CRM
    print("Creating Silent Client...")
    new_client = {
            "tenant_id": TENANT_ID,
            "rut_ci": f"999{random.randint(100,999)}",
            "razon_social": "Cliente Silencioso Ltda",
            "status_riesgo": "Alto",
            "created_at": (datetime.now() - timedelta(days=5)).isoformat()
    }
    supabase.table('clientes_maestra').insert(new_client).execute()
    # No CRM added, so it should trigger "Pendiente" logic if based on "no interaction"

    print("KPI Seed Complete.")

if __name__ == "__main__":
    seed_kpis()

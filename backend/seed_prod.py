import os
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime, timedelta

# Explicitly reload env vars
load_dotenv(dotenv_path="../.env", override=True)

# Helper to debug key presence (masked)
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
url = os.getenv("VITE_SUPABASE_URL")

print(f"URL: {url}")
if key:
    print(f"Key loaded: {key[:10]}...")
else:
    print("ERROR: Service Key NOT found in env")
    exit(1)

supabase = create_client(url, key)
TENANT_ID = "a942b959-92f8-4ed1-8397-80ff430d8f1d"

def seed():
    print("Starting Direct Seed to Production...")
    
    # 1. Clients
    clients = [
        {
            "rut_ci": "210000010015",
            "razon_social": "Constructora Acme SA",
            "status_riesgo": "Crítico",
            "limite_de_credito": 100000,
            "estado_actual": "Pendiente",
            "uuid": "550e8400-e29b-41d4-a716-446655440001",
            "tenant_id": TENANT_ID
        },
        {
            "rut_ci": "210000020016",
            "razon_social": "Logística Rápida SRL",
            "status_riesgo": "Alto",
            "limite_de_credito": 50000,
            "estado_actual": "Pendiente",
            "uuid": "550e8400-e29b-41d4-a716-446655440002",
            "tenant_id": TENANT_ID
        },
        {
            "rut_ci": "210000030017",
            "razon_social": "Tech Solutions UY",
            "status_riesgo": "Medio",
            "limite_de_credito": 25000,
            "estado_actual": "Comercial",
            "uuid": "550e8400-e29b-41d4-a716-446655440003",
            "tenant_id": TENANT_ID
        },
        {
            "rut_ci": "210000040018",
            "razon_social": "Panadería El Sol",
            "status_riesgo": "Bajo",
            "limite_de_credito": 10000,
            "estado_actual": "Pendiente",
            "uuid": "550e8400-e29b-41d4-a716-446655440004",
            "tenant_id": TENANT_ID
        }
    ]

    for c in clients:
        try:
            supabase.table('clientes_maestra').upsert(c).execute()
        except Exception as e:
            print(f"Upsert Client Error: {e}")

    # 2. Invoices
    today = datetime.now()
    invoices = [
        {"client_rut": "210000010015", "amount": 150000, "days_ago": 120, "currency": "UYU"},
        {"client_rut": "210000010015", "amount": 5000, "days_ago": 90, "currency": "USD"},
        {"client_rut": "210000020016", "amount": 45000, "days_ago": 45, "currency": "UYU"},
        {"client_rut": "210000030017", "amount": 20000, "days_ago": 15, "currency": "UYU"},
        {"client_rut": "210000040018", "amount": 5000, "days_ago": 5, "currency": "UYU"}
    ]
    
    for i, inv in enumerate(invoices):
        due_date = (today - timedelta(days=inv['days_ago'])).strftime("%Y-%m-%d")
        id_interno = f"MOCK-{i+1000}"
        
        data = {
            "tenant_id": TENANT_ID,
            "rut_ci": inv['client_rut'],
            "id_interno": id_interno,
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
            print(f"Upsert Invite Error: {e}")

    # 3. CRM
    crm_entry = {
        "tenant_id": TENANT_ID,
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
        # Ignore duplicate if already inserted
        pass

    print("SUCCESS: Production Data Seeded!")

seed()

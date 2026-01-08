import os
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime, timedelta

load_dotenv(dotenv_path="../.env", override=True)
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
url = os.getenv("VITE_SUPABASE_URL")
supabase = create_client(url, key)
TENANT_ID = "a942b959-92f8-4ed1-8397-80ff430d8f1d"

def seed():
    print("Retrying Seed for Invoices...")
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
        id_interno = 999000 + i
        
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
        
        # Check if exists first to avoid duplicate errors without constraint
        existing = supabase.table('inv_docs').select("id_interno", count="exact").eq("id_interno", id_interno).eq("tenant_id", TENANT_ID).execute()
        
        if not existing.data:
            try:
                supabase.table('inv_docs').insert(data).execute()
                print(f"Inserted Invoice {id_interno}")
            except Exception as e:
                print(f"Insert Error {id_interno}: {e}")
        else:
             print(f"Skipping {id_interno}, already exists.")

    print("Retry Complete!")

seed()

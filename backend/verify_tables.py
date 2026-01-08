from supabase import create_client
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: Missing credentials")
    exit(1)

supabase = create_client(url, key)

today = datetime.now().strftime("%Y-%m-%d")
print(f"Checking data for TODAY ({today})...")

try:
    # Check pagoss table
    res = supabase.table('pagos_reportados').select("*").eq('fecha_pago', today).execute()
    print(f"Payments Today: {len(res.data)}")
    
    # Check CRM promises
    res_crm = supabase.table('crm_gestion').select("*").eq('fecha_promesa_pago', today).execute()
    print(f"Promises Today: {len(res_crm.data)}")

except Exception as e:
    print(f"Query Error: {e}")

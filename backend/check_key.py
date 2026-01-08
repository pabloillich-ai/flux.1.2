from dotenv import load_dotenv
import os

load_dotenv(dotenv_path="../.env")

service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
print(f"Service Role Key Present: {bool(service_key)}")
if service_key:
    print(f"Key starts with: {service_key[:5]}...")

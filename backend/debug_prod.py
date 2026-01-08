from dotenv import load_dotenv
import os
import requests

# Load from root
load_dotenv(dotenv_path="../.env")

url = os.getenv("VITE_BACKEND_URL")
print(f"URL found: {url}")

if url:
    try:
        print(f"Testing {url}/health...")
        resp = requests.get(f"{url}/health", timeout=5)
        print(f"Health Status: {resp.status_code}")
        print(resp.text)
        
        print(f"\nTesting {url}/api/queue (auth required)...")
        # We need a token to really test queue, but seeing 401 or 403 is better than 404
        resp_q = requests.get(f"{url}/api/queue", timeout=5)
        print(f"Queue Status: {resp_q.status_code}")
        
    except Exception as e:
        print(f"Error: {e}")

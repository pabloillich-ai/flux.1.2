import requests
import sys

URL = "https://backend-g6uy.onrender.com/health"
ORIGIN = "http://localhost:5173"

print(f"Testing connection to {URL} with Origin: {ORIGIN}")

try:
    resp = requests.get(URL, headers={"Origin": ORIGIN})
    print(f"Status: {resp.status_code}")
    print("Headers:")
    for k, v in resp.headers.items():
        print(f"  {k}: {v}")
        
    print("-" * 20)
    
    cors_header = resp.headers.get("access-control-allow-origin")
    if cors_header:
        print(f"CORS Header Found: {cors_header}")
        if cors_header == "*" or cors_header == ORIGIN:
            print("CORS Valid: YES")
        else:
            print(f"CORS Mismatch. Expected {ORIGIN} or *, got {cors_header}")
    else:
        print("CORS Header MISSING!")

except Exception as e:
    print(f"Connection Failed: {e}")

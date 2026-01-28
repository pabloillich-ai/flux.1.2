import requests

URL = "https://backend-g6uy.onrender.com/dashboard"
ORIGIN = "http://localhost:5173"

print(f"Testing connection to {URL} with Origin: {ORIGIN}")

try:
    # Test without auth first
    print("\n--- Request without Auth ---")
    resp = requests.get(URL, headers={"Origin": ORIGIN})
    print(f"Status: {resp.status_code}")
    print(f"CORS Header: {resp.headers.get('access-control-allow-origin')}")
    
    # Test OPTIONS (Preflight)
    print("\n--- OPTIONS Request (Preflight) ---")
    resp = requests.options(URL, headers={
        "Origin": ORIGIN,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "authorization"
    })
    print(f"Status: {resp.status_code}")
    print(f"CORS Header: {resp.headers.get('access-control-allow-origin')}")
    print(f"Allowed Methods: {resp.headers.get('access-control-allow-methods')}")

except Exception as e:
    print(f"Connection Failed: {e}")

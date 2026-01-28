import requests

URL = "https://backend-g6uy.onrender.com/dashboard"
ORIGIN = "http://localhost:5173"

print("Sending request with Dummy Token...")
try:
    resp = requests.get(URL, headers={
        "Origin": ORIGIN, 
        "Authorization": "Bearer dummy_token"
    })
    print(f"Status: {resp.status_code}")
    print(f"Body: {resp.text}")
except Exception as e:
    print(f"Error: {e}")

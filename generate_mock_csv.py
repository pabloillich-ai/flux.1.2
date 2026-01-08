import csv
import random
import uuid
from datetime import datetime, timedelta

# Configuration
TENANT_1 = "a942b959-92f8-4ed1-8397-80ff430d8f1d" # Default
TENANT_2 = "b942b959-92f8-4ed1-8397-80ff430d8f2e" # Secondary
TENANTS = [TENANT_1, TENANT_2]

CLIENTS_PER_TENANT = 25
INVOICES_PER_CLIENT_RANGE = (3, 5) # ~4 avg -> 200 total
CONTACTS_PER_CLIENT_RANGE = (1, 3) # ~2 avg -> 100 total

# Data Lists for Realism
COMPANY_SUFFIXES = ["S.A.", "S.R.L.", "Ltda.", "Inc.", "Group", "Logistics", "Tech"]
COMPANY_ROOTS = [
    "Distribuidora", "Farmacia", "Supermercado", "Barraca", "Constructora", "Estudio", 
    "Laboratorio", "Transporte", "Agro", "Inversiones", "Consultora", "Fabrica", "Importadora"
]
NAMES = ["Juan", "Maria", "Pedro", "Ana", "Luis", "Sofia", "Carlos", "Lucia", "Diego", "Valentina"]
SURNAMES = ["Perez", "Gonzalez", "Rodriguez", "Fernandez", "Lopez", "Martinez", "Garcia", "Silva"]

def generate_rut(idx):
    # Mock RUT generator (12 digits)
    return f"21{str(idx).zfill(6)}001{str(idx % 9)}"

def random_date(start_days_ago, end_days_ago):
    start = datetime.now() - timedelta(days=start_days_ago)
    end = datetime.now() - timedelta(days=end_days_ago)
    # Random timestamp between start and end
    delta = end - start
    random_seconds = random.random() * delta.total_seconds()
    return (start + timedelta(seconds=random_seconds)).strftime("%Y-%m-%d")

def generate_data():
    clients = []
    invoices = []
    contacts = []
    
    global_client_idx = 1
    
    for tenant in TENANTS:
        for _ in range(CLIENTS_PER_TENANT):
            rut = generate_rut(global_client_idx)
            name = f"{random.choice(COMPANY_ROOTS)} {random.choice(SURNAMES)} {random.choice(COMPANY_SUFFIXES)}"
            status_riesgo = random.choice(["Excelente", "Regular", "Regular", "Alto", "Crítico"])
            
            client = {
                "rut_ci": rut,
                "razon_social": name,
                "nombre_fantasia": name.split(" ")[0] + " " + name.split(" ")[1],
                "tenant_id": tenant,
                "direccion": f"Calle {random.randint(1, 100)} No. {random.randint(1000, 9999)}, Montevideo",
                "email_facturacion": f"admin@{name.lower().replace(' ', '').replace('.', '')}.com",
                "tel": f"09{random.randint(1, 9)}{random.randint(100000, 999999)}",
                "status_riesgo": status_riesgo,
                "limite_de_credito": random.choice([50000, 100000, 250000, 500000, 1000000]),
                "estado_actual": "Comercial" if status_riesgo == "Excelente" else "Pendiente"
            }
            clients.append(client)
            
            # Invoices
            num_invoices = random.randint(*INVOICES_PER_CLIENT_RANGE)
            for i in range(num_invoices):
                is_overdue = random.choice([True, False])
                days_ago = random.randint(30, 150) if is_overdue else random.randint(-30, 0)
                amount = random.randint(1000, 50000)
                currency = random.choice(["UYU", "UYU", "UYU", "USD"])
                
                inv = {
                    "tenant_id": tenant,
                    "rut_ci": rut,
                    "id_interno": f"INV-{tenant[:4]}-{global_client_idx}-{i}",
                    "serie_numero": f"A-{random.randint(10000, 99999)}",
                    "monto_total": amount,
                    "saldo_pendiente": amount, # Assuming unpaid for test
                    "moneda": currency,
                    "fecha_emision": random_date(days_ago + 30, days_ago + 30),
                    "fecha_vencimiento": random_date(days_ago, days_ago),
                    "estado": "Pendiente"
                }
                invoices.append(inv)
                
            # Contacts
            num_contacts = random.randint(*CONTACTS_PER_CLIENT_RANGE)
            for i in range(num_contacts):
                first = random.choice(NAMES)
                last = random.choice(SURNAMES)
                email = f"{first.lower()}.{last.lower()}@{name.lower().replace(' ', '').replace('.', '')}.com"
                
                contact = {
                    "tenant_id": tenant,
                    "rut_ci": rut, # Linking field
                    "nombre": first,
                    "apellido": last,
                    "cargo": random.choice(["Gerente", "Contador", "Administrativo", "Dueño"]),
                    "email": email,
                    "movil": f"09{random.randint(8, 9)}{random.randint(100000, 999999)}"
                }
                contacts.append(contact)
            
            global_client_idx += 1

    return clients, invoices, contacts

def write_csv(filename, data):
    if not data: return
    keys = data[0].keys()
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(data)
    print(f"Generated {filename} with {len(data)} rows.")

if __name__ == "__main__":
    clients, invoices, contacts = generate_data()
    write_csv("mock_clients.csv", clients)
    write_csv("mock_invoices.csv", invoices)
    write_csv("mock_contacts.csv", contacts)

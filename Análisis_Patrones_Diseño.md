# Análisis de Patrones de Diseño - Sistema de Cobranzas

## 📋 Resumen Ejecutivo

El sistema de cobranzas implementa una arquitectura **Full-Stack moderna** con separación clara de responsabilidades entre Frontend (React) y Backend (FastAPI/Python). A continuación se detallan los patrones de diseño identificados en ambas capas.

---

## 🎨 FRONTEND (React)

### 1. **Patrón de Arquitectura: Component-Based Architecture**

La aplicación React está estructurada siguiendo el patrón de componentes, dividida en:

```
src/
├── components/       # Componentes reutilizables
├── pages/           # Componentes de página (vistas)
├── context/         # Estado global
├── lib/             # Utilidades y clientes (ej: Supabase)
└── App.jsx          # Routing principal
```

**Ventajas:**
- ✅ Alta reutilización de código
- ✅ Separación de concerns
- ✅ Facilita el testing unitario
- ✅ Escalabilidad

---

### 2. **Patrón Context API (State Management)**

**Ubicación:** `src/context/AuthContext.jsx`

```javascript
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // ... gestión de autenticación
}
```

**Características:**
- **Patrón:** Provider Pattern
- **Propósito:** Gestión centralizada del estado de autenticación
- **Alcance:** Global (toda la aplicación)

**Ventajas:**
- ✅ Estado compartido sin prop drilling
- ✅ Single source of truth para autenticación
- ✅ Integración con Supabase Auth

---

### 3. **Patrón Container/Presentational Components**

**Ejemplo:** `TableroGestion.jsx`

```javascript
// Container Component (lógica)
function TableroGestion() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const fetchData = async () => { /* API calls */ }
    
    // Render presentational components
    return (
        <div>
            <KPICard {...kpiData} />
            <SmartCard client={client} />
        </div>
    )
}

// Presentational Component (UI pura)
function KPICard({ title, value, icon, colorClass }) {
    return (/* JSX puramente visual */)
}
```

**Separación:**
- **Container (Smart)**: `TableroGestion`, `Dashboard`, `Portfolio`
- **Presentational (Dumb)**: `KPICard`, `SmartCard`, `MicroCalendar`

**Ventajas:**
- ✅ Componentes visuales reutilizables
- ✅ Lógica centralizada en containers
- ✅ Testing más sencillo

---

### 4. **Patrón Higher-Order Component (HOC)**

**Ubicación:** `src/components/ProtectedRoute.jsx`

```javascript
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    
    return children;
}
```

**Propósito:** Encapsular lógica de autenticación/autorización

**Ventajas:**
- ✅ Reutilización de lógica de protección
- ✅ Separación de concerns de autenticación
- ✅ Código DRY (Don't Repeat Yourself)

---

### 5. **Patrón Compound Components**

**Ubicación:** `src/components/Layout.jsx`

```javascript
export function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    return (
        <div className="flex h-screen">
            <Sidebar isOpen={isSidebarOpen} />
            <div className="flex-1 flex flex-col">
                <Header />
                <main>
                    <Outlet /> {/* React Router v6 */}
                </main>
            </div>
        </div>
    );
}
```

**Características:**
- Composición de `Sidebar`, `Header` y contenido dinámico (`Outlet`)
- Estado compartido entre componentes relacionados

---

### 6. **Patrón Custom Hooks**

**Ubicación:** `src/context/AuthContext.jsx`

```javascript
export const useAuth = () => useContext(AuthContext);
```

**Uso en componentes:**
```javascript
const { user, profile, signIn, signOut } = useAuth();
```

**Ventajas:**
- ✅ Abstracción de lógica compleja
- ✅ Reutilización de estado
- ✅ API limpia y consistente

---

### 7. **Patrón Render Props / Children as Function**

**Ubicación:** `AuthContext.Provider`

```javascript
<AuthContext.Provider value={value}>
    {loading ? <LoadingScreen /> : children}
</AuthContext.Provider>
```

---

### 8. **Patrón de Routing: Nested Routes**

**Ubicación:** `src/App.jsx`

```javascript
<Routes>
    <Route path="/" element={<RexLanding />} />
    <Route path="/login" element={<Login />} />
    
    {/* Protected Routes */}
    <Route path="/" element={
        <ProtectedRoute>
            <Layout />
        </ProtectedRoute>
    }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="portfolio" element={<Portfolio />} />
        {/* ... más rutas anidadas */}
    </Route>
</Routes>
```

**Patrón:** React Router v6 Nested Routes
**Ventajas:**
- ✅ Layouts compartidos
- ✅ Protección de rutas centralizada
- ✅ Código limpio y mantenible

---

### 9. **Patrón Observer (React Hooks)**

**Uso de `useEffect` para observar cambios:**

```javascript
useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
            setUser(session?.user ?? null);
        }
    );
    
    return () => subscription.unsubscribe();
}, []); // Observer setup/cleanup
```

---

### 10. **Patrón Memoization (Performance)**

**Ubicación:** Varios componentes con `useMemo`

```javascript
const processedData = useMemo(() => {
    return clients.map(/* expensive calculation */);
}, [clients]); // Solo recalcula si clients cambia
```

**Ventajas:**
- ✅ Optimización de rendimiento
- ✅ Evita re-renders innecesarios

---

## 🔧 BACKEND (FastAPI/Python)

### 1. **Patrón de Arquitectura: RESTful API**

**Estructura:**
```
backend/
├── main.py          # Endpoints y lógica principal
├── schemas.py       # DTOs (Data Transfer Objects)
├── utils.py         # Funciones auxiliares
└── requirements.txt # Dependencias
```

**Características:**
- Endpoints semánticos (`/dashboard`, `/api/queue`, `/api/clients/{id}`)
- Verbos HTTP: GET, POST, PUT
- Respuestas JSON estructuradas

---

### 2. **Patrón DTO (Data Transfer Object)**

**Ubicación:** `backend/schemas.py`

```python
from pydantic import BaseModel
from typing import List, Optional

class DashboardData(BaseModel):
    items: List[DashboardClientItem]
    kpis: DashboardKPIs
    exchange_rate: float

class QueueItem(BaseModel):
    id: str
    rut: str
    name: str
    priorityScore: int
    bucket: str
    totalDebt: float
    daysOverdue: int
    risk: str
    lastAction: str
    status: str
```

**Ventajas:**
- ✅ Validación automática con Pydantic
- ✅ Serialización/deserialización type-safe
- ✅ Documentación automática (OpenAPI/Swagger)
- ✅ Separación de modelos de DB y API

---

### 3. **Patrón Enum para Valores Constantes**

**Ubicación:** `schemas.py`

```python
from enum import Enum

class RiskLevel(str, Enum):
    CRITICO = "Crítico"
    ALTO = "Alto"
    MEDIO = "Medio"
    BAJO = "Bajo"
    # ...

class InvoiceStatus(str, Enum):
    PENDIENTE = "Pendiente"
    PAGADO = "Pagado"
    VENCIDA = "Vencida"
    ANULADO = "Anulado"
```

**Ventajas:**
- ✅ Type safety
- ✅ Previene valores inválidos
- ✅ Autocompletado en IDEs

---

### 4. **Patrón Dependency Injection**

**Ubicación:** `main.py`

```python
def get_tenant_from_header(authorization: Optional[str] = Header(None)) -> str:
    # Extrae tenant_id del header de autorización
    # ...
    return tenant_id

@app.get("/dashboard", response_model=DashboardData)
def get_dashboard_data(tenant_id: str = Depends(get_tenant_from_header)):
    # tenant_id se inyecta automáticamente
    # ...
```

**Ventajas:**
- ✅ Reutilización de lógica de autenticación
- ✅ Multi-tenancy automático
- ✅ Testing más sencillo (mocking)

---

### 5. **Patrón Strategy (Algoritmos de Cálculo)**

**Ubicación:** `main.py`

```python
def calculate_priority_score(client, debt_age_days, debt_amount_norm, has_broken_promise):
    # 1. Risk Score (40%)
    risk_map = {
        'Crítico': 100, 'Legal': 100,
        'Alto': 70, 'Mal Pagador': 70,
        # ...
    }
    score = risk_map.get(client.get('status_riesgo', 'Regular'), 40) * 0.40
    
    # 2. Aging Score (30%)
    score += min((debt_age_days / 360) * 100, 100) * 0.30
    
    # 3. Amount Score (20%)
    score += min((debt_amount_norm / 100000) * 100, 100) * 0.20
    
    # 4. Penalty (10%)
    if has_broken_promise:
        score += 50
    
    return min(int(score), 100)
```

**Patrón:** Strategy para cálculo de prioridad
**Ventajas:**
- ✅ Algoritmo configurable
- ✅ Fácil de ajustar pesos

---

### 6. **Patrón Service Layer**

**Funciones auxiliares en `main.py`:**

```python
# Helper Functions (Service Layer)
def calculate_debt_split(invoices, rate_uyu):
    # Lógica de negocio reutilizable
    # ...

def determine_bucket(score):
    # Clasificación de clientes
    if score > 80: return 'Urgente'
    if score >= 50: return 'Seguimiento'
    return 'Preventivo'

def format_money(amount):
    return f"${amount:,.0f}"
```

**Propósito:** Separar lógica de negocio de endpoints

---

### 7. **Patrón Repository (Implícito con Supabase Client)**

```python
supabase: Client = create_client(url, key)

# Repository-like operations
clients_resp = supabase.table('clientes_maestra')\
    .select("*")\
    .eq('tenant_id', tenant_id)\
    .execute()
```

**Ventajas:**
- ✅ Abstracción de acceso a datos
- ✅ Queries tipadas y centralizadas

---

### 8. **Patrón Singleton para Configuración**

```python
# Global Configuration (Singleton-like)
DEFAULT_TENANT_ID = "a942b959-92f8-4ed1-8397-80ff430d8f1d"
supabase: Client = create_client(url, key)  # Instancia única
```

---

### 9. **Patrón Factory para Respuestas**

**Construcción de respuestas complejas:**

```python
def get_dashboard_data(...):
    # Factory para construir DashboardData
    processed_items = []
    for client in clients:
        item = {
            "id": uuid,
            "rut": rut,
            "name": client.get('razon_social'),
            # ... 15+ campos construidos dinámicamente
        }
        processed_items.append(item)
    
    kpis = {
        "total": format_money(total_debt_global),
        "critical": format_money(critical_debt_global),
        # ...
    }
    
    return DashboardData(
        items=processed_items,
        kpis=kpis,
        exchange_rate=rate_uyu
    )
```

---

### 10. **Patrón Middleware (CORS)**

**Ubicación:** `main.py`

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Propósito:** Cross-Cutting Concern (seguridad)

---

### 11. **Patrón Cache (en `utils.py`)**

**Ubicación:** `backend/utils.py`

```python
_rates_cache = {
    "data": None,
    "timestamp": 0
}
CACHE_DURATION = 3600  # 1 hora

def get_brou_rates():
    global _rates_cache
    
    # Check cache
    if _rates_cache["data"] and (time.time() - _rates_cache["timestamp"] < CACHE_DURATION):
        return _rates_cache["data"]
    
    # Fetch new data...
    _rates_cache["data"] = result
    _rates_cache["timestamp"] = time.time()
    
    return result
```

**Patrón:** Cache-Aside Pattern
**Ventajas:**
- ✅ Reduce llamadas externas
- ✅ Mejora performance

---

### 12. **Patrón Multi-Tenancy**

**Implementación:**

```python
@app.get("/dashboard")
def get_dashboard_data(tenant_id: str = Depends(get_tenant_from_header)):
    # TODOS los queries filtran por tenant_id
    clients = supabase.table('clientes_maestra')\
        .select("*")\
        .eq('tenant_id', tenant_id)\  # Filtro por tenant
        .execute()
```

**Características:**
- Seguridad por aislamiento de datos
- Extracción automática desde JWT

---

## 🔗 PATRONES DE INTEGRACIÓN

### 1. **Patrón API Gateway**

**Frontend → Backend:**
```javascript
// Frontend (config.js)
const API_URL = import.meta.env.VITE_API_URL;

// Llamadas HTTP
const response = await fetch(`${API_URL}/dashboard`, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});
```

---

### 2. **Patrón BFF (Backend for Frontend)**

El backend FastAPI actúa como BFF transformando datos de Supabase al formato exacto que el frontend necesita:

```python
# Backend transforma datos de DB a formato Frontend
frontend_invs = []
for inv in client_invs:
    frontend_invs.append({
        "id": inv.get('id'),
        "amount": inv.get('saldo_pendiente'),
        "currency": inv.get('moneda'),
        "dueDate": inv.get('fecha_vencimiento'),
        # Campos renombrados para convenio frontend
    })
```

---

### 3. **Patrón Real-Time Subscription**

**Frontend con Supabase:**
```javascript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
        setUser(session?.user ?? null);
    }
);
```

---

## 📊 RESUMEN DE PATRONES IDENTIFICADOS

### Frontend (React):
1. ✅ **Component-Based Architecture**
2. ✅ **Context API** (State Management)
3. ✅ **Container/Presentational Components**
4. ✅ **Higher-Order Component** (HOC)
5. ✅ **Compound Components**
6. ✅ **Custom Hooks**
7. ✅ **Render Props**
8. ✅ **Nested Routes** (React Router)
9. ✅ **Observer Pattern** (useEffect)
10. ✅ **Memoization** (useMemo)

### Backend (FastAPI/Python):
1. ✅ **RESTful API Architecture**
2. ✅ **DTO Pattern** (Pydantic)
3. ✅ **Enum Pattern**
4. ✅ **Dependency Injection**
5. ✅ **Strategy Pattern**
6. ✅ **Service Layer**
7. ✅ **Repository Pattern**
8. ✅ **Singleton Pattern**
9. ✅ **Factory Pattern**
10. ✅ **Middleware Pattern**
11. ✅ **Cache-Aside Pattern**
12. ✅ **Multi-Tenancy Pattern**

### Integración:
1. ✅ **API Gateway**
2. ✅ **Backend for Frontend (BFF)**
3. ✅ **Real-Time Subscriptions**

---

## 🎯 BUENAS PRÁCTICAS IMPLEMENTADAS

### Frontend:
- ✅ Separación de lógica y presentación
- ✅ Estado global con Context API
- ✅ Protección de rutas con HOC
- ✅ Componentes reutilizables
- ✅ Hooks personalizados
- ✅ Memoization para performance

### Backend:
- ✅ Validación de datos con Pydantic
- ✅ Type hints en Python
- ✅ Multi-tenancy desde autenticación
- ✅ Separación de schemas y lógica
- ✅ Cache para datos externos
- ✅ CORS configurado dinámicamente
- ✅ Dependency Injection para tenant

---

## 🚀 ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────┐
│           FRONTEND (React/Vite)            │
│  ┌────────────────────────────────────┐    │
│  │  Components (Presentational)       │    │
│  ├────────────────────────────────────┤    │
│  │  Pages (Container Components)      │    │
│  ├────────────────────────────────────┤    │
│  │  Context (Global State)            │    │
│  ├────────────────────────────────────┤    │
│  │  Services (API Calls)              │    │
│  └────────────────────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST
                   │ JWT Auth
┌──────────────────▼──────────────────────────┐
│         BACKEND (FastAPI/Python)           │
│  ┌────────────────────────────────────┐    │
│  │  Endpoints (Controllers)           │    │
│  ├────────────────────────────────────┤    │
│  │  Schemas (DTOs - Pydantic)         │    │
│  ├────────────────────────────────────┤    │
│  │  Services (Business Logic)         │    │
│  ├────────────────────────────────────┤    │
│  │  Utils (Helpers, Cache)            │    │
│  └────────────────────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │ Supabase SDK
┌──────────────────▼──────────────────────────┐
│         DATABASE (Supabase/PostgreSQL)     │
│  - clientes_maestra                        │
│  - inv_docs                                │
│  - crm_gestion                             │
│  - contactos                               │
│  - profiles                                │
└────────────────────────────────────────────┘
```

---

## 📝 CONCLUSIONES

### Fortalezas:
1. **Arquitectura moderna y escalable** con separación clara Frontend/Backend
2. **Type safety** completo (TypeScript implícito + Pydantic)
3. **Multi-tenancy** implementado correctamente
4. **Reutilización de código** mediante componentes y servicios
5. **Seguridad** con autenticación JWT y filtrado por tenant
6. **Performance** con cache y memoization

### Áreas de Mejora Potencial:
1. Implementar **Redux/Zustand** si el estado global crece mucho
2. Agregar **React Query** para cache de API calls
3. Implementar **Unit Tests** (Jest, Pytest)
4. Agregar **Error Boundaries** en React
5. Implementar **Logging** centralizado
6. Considerar **GraphQL** si las queries se vuelven muy complejas

---

**Fecha de Análisis:** 26 de Enero de 2026  
**Versión del Sistema:** v2.0  
**Analizado por:** Antigravity AI

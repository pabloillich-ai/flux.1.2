# 📁 Nueva Arquitectura Frontend - Guía de Uso

## 🎯 Visión General

Se ha implementado una **arquitectura por capas** en el frontend para mejorar la organización, mantenibilidad y reutilización del código.

## 📂 Estructura de Carpetas

```
src/
├── services/           # ✨ NUEVO: Capa de servicios
│   ├── api/           # Llamadas HTTP a APIs
│   │   ├── dashboard.service.js
│   │   ├── client.service.js
│   │   ├── crm.service.js
│   │   ├── notification.service.js
│   │   ├── import.service.js
│   │   └── index.js
│   └── business/      # Lógica de negocio pura
│       ├── debt-calculator.js
│       ├── priority-scorer.js
│       └── index.js
│
├── hooks/             # ✨ NUEVO: Custom hooks reutilizables
│   ├── useDashboard.js
│   ├── useClients.js
│   ├── useDebounce.js
│   └── index.js
│
├── utils/             # ✨ NUEVO: Utilidades y helpers
│   ├── formatters.js  # Formateo de datos
│   ├── validators.js  # Validaciones
│   ├── constants.js   # Constantes globales
│   └── index.js
│
├── types/             # ✨ NUEVO: Definiciones de tipos (JSDoc)
│   └── index.js
│
├── components/        # Componentes UI reutilizables
├── pages/            # Componentes de página
├── context/          # Estado global (Context API)
└── lib/              # Clientes externos (Supabase, etc)
```

---

## 🔧 Services Layer

### API Services (`services/api/`)

Encapsulan todas las llamadas HTTP a las APIs. **Ventajas:**
- Centralización de endpoints
- Manejo de errores consistente
- Fácil testing

#### Ejemplo: Dashboard Service

```javascript
import { dashboardService } from '@/services/api';

// En un componente o hook
const token = 'your-auth-token';
const data = await dashboardService.getDashboard(token);
```

#### Servicios Disponibles:

| Servicio | Descripción |
|----------|-------------|
| `dashboardService` | Datos del dashboard, stats |
| `clientService` | Cola de clientes, detalles, actualización de estado |
| `crmService` | Crear entradas CRM, interacciones |
| `notificationService` | Enviar notificaciones (email, SMS, WhatsApp) |
| `importService` | Importar datos, seed mock |

### Business Services (`services/business/`)

Lógica de negocio pura (sin side effects). **Ventajas:**
- Testeable independientemente
- Reutilizable en múltiples componentes
- Sin dependencias de React

#### Ejemplo: Debt Calculator

```javascript
import { calculateDebtSplit, getAgingBucket } from '@/services/business';

const { overdue, upcoming, total } = calculateDebtSplit(invoices, exchangeRate);
const bucket = getAgingBucket(daysOverdue); // '1-30', '31-60', etc.
```

#### Funciones Disponibles:

**Debt Calculator:**
- `calculateDebtSplit(invoices, exchangeRate)` - Dividir deuda en vencida/por vencer
- `calculateDaysOverdue(dueDateStr)` - Calcular días vencidos
- `getAgingBucket(daysOverdue)` - Obtener bucket de aging
- `calculateTotalDebt(invoices, exchangeRate)` - Calcular deuda total

**Priority Scorer:**
- `calculatePriorityScore(client, debtAgeDays, debtAmount, hasBrokenPromise)` - Calcular score de prioridad
- `determinePriorityBucket(score)` - Determinar bucket (Urgente, Seguimiento, Preventivo)
- `getPriorityColor(bucket)` - Obtener clase de color Tailwind
- `getPriorityBgColor(bucket)` - Obtener clase de fondo Tailwind

---

## 🪝 Custom Hooks

Abstraen lógica de fetching y estado. **Ventajas:**
- Reutilización de lógica
- Código de componentes más limpio
- Separación de concerns

### `useDashboard()`

Fetch de datos del dashboard con loading/error states.

```javascript
import { useDashboard } from '@/hooks';

function Dashboard() {
  const { data, loading, error, refetch } = useDashboard();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <DashboardView data={data} onRefresh={refetch} />;
}
```

### `useClientQueue(filters)`

Fetch de cola de clientes con filtros.

```javascript
import { useClientQueue } from '@/hooks';

function QueuePage() {
  const { 
    queue, 
    loading, 
    filters, 
    updateFilters, 
    resetFilters 
  } = useClientQueue({ minDebt: 1000 });
  
  const handleFilterChange = (key, value) => {
    updateFilters({ [key]: value });
  };
  
  return (
    <div>
      <Filters filters={filters} onChange={handleFilterChange} />
      <QueueList items={queue} loading={loading} />
    </div>
  );
}
```

### `useUpdateClientStatus()`

Mutation hook para actualizar estado de cliente.

```javascript
import { useUpdateClientStatus } from '@/hooks';

function ClientCard({ client }) {
  const { updateStatus, loading } = useUpdateClientStatus();
  
  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatus(client.id, newStatus);
      alert('Estado actualizado!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };
  
  return (
    <button onClick={() => handleStatusChange('Promesa')} disabled={loading}>
      {loading ? 'Actualizando...' : 'Marcar Promesa'}
    </button>
  );
}
```

### `useDebounce(value, delay)`

Debounce para búsquedas y filtros.

```javascript
import { useDebounce } from '@/hooks';

function SearchBox() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  useEffect(() => {
    // API call con debouncedSearch (solo se ejecuta después de 300ms sin cambios)
    if (debouncedSearch) {
      searchClients(debouncedSearch);
    }
  }, [debouncedSearch]);
  
  return <input value={search} onChange={e => setSearch(e.target.value)} />;
}
```

---

## 🛠️ Utils - Utilidades

### Formatters (`utils/formatters.js`)

Funciones para formatear datos para display.

```javascript
import { formatMoney, formatDate, formatRUT, formatPercent } from '@/utils';

formatMoney(1234567);              // "$1,234,567"
formatMoney(1234.56, 'USD');       // "US$1,234.56"
formatDate('2024-01-26');          // "26/01/2024"
formatDate('2024-01-26', 'long');  // "26 de enero de 2024"
formatRUT('210000010015');         // "2.100.000-1-0015"
formatPercent(75.5);               // "75.5%"
```

**Funciones disponibles:**
- `formatMoney(amount, currency)` - Formatear dinero
- `formatDate(dateStr, format)` - Formatear fecha
- `formatRelativeDate(date)` - Fecha relativa ("hace 2 días")
- `formatRUT(rut)` - Formatear RUT uruguayo
- `formatPercent(value, decimals, isRatio)` - Formatear porcentaje
- `formatPhone(phone)` - Formatear teléfono
- `truncate(text, maxLength)` - Truncar texto
- `formatFileSize(bytes)` - Formatear tamaño de archivo

### Validators (`utils/validators.js`)

Funciones para validar datos.

```javascript
import { isValidEmail, isValidRUT, isPositiveNumber } from '@/utils';

if (!isValidEmail(email)) {
  alert('Email inválido');
}

if (!isValidRUT(rut)) {
  alert('RUT debe tener 12 dígitos');
}

if (!isPositiveNumber(amount)) {
  alert('Monto debe ser positivo');
}
```

**Funciones disponibles:**
- `isValidEmail(email)` - Validar email
- `isValidRUT(rut)` - Validar RUT uruguayo
- `isValidPhone(phone)` - Validar teléfono
- `isNotFutureDate(dateStr)` - Validar que no sea fecha futura
- `isPositiveNumber(value)` - Validar número positivo
- `isNonNegativeNumber(value)` - Validar número no negativo
- `isNotEmpty(str)` - Validar string no vacío
- `isValidLength(str, min, max)` - Validar longitud de string
- `isValidUUID(uuid)` - Validar UUID
- `sanitizeInput(input)` - Sanitizar input (prevenir XSS)

### Constants (`utils/constants.js`)

Constantes globales de la aplicación.

```javascript
import { RISK_LEVELS, RISK_STYLES, CLIENT_STATUS } from '@/utils';

// Usar constantes en lugar de strings mágicos
if (client.risk === RISK_LEVELS.CRITICO) {
  const styles = RISK_STYLES[RISK_LEVELS.CRITICO];
  // styles = { color: 'red', border: 'border-l-red-500', ... }
}

// Opciones para selects
<select>
  {RISK_LEVEL_OPTIONS.map(opt => (
    <option key={opt.value} value={opt.value}>{opt.label}</option>
  ))}
</select>
```

**Constantes disponibles:**
- `RISK_LEVELS` - Niveles de riesgo
- `RISK_STYLES` - Estilos por nivel de riesgo
- `CLIENT_STATUS` - Estados de cliente
- `AGING_BUCKETS` - Buckets de aging
- `CRM_CHANNELS` - Canales de CRM
- `CURRENCIES` - Monedas
- Y más...

---

## 📝 Types (JSDoc)

Definiciones de tipos para mejor autocompletado en VS Code.

```javascript
/**
 * @typedef {import('@/types').Client} Client
 * @typedef {import('@/types').DashboardData} DashboardData
 */

/**
 * @param {Client} client - Client data
 * @returns {string} Formatted client name
 */
function getClientName(client) {
  return client.name; // ✨ Autocomplete funciona!
}
```

---

## 🚀 Ejemplos de Uso Completos

### Ejemplo 1: Página Simple con Custom Hook

```javascript
import React from 'react';
import { useDashboard } from '@/hooks';
import { formatMoney } from '@/utils';

function MyDashboard() {
  const { data, loading, error } = useDashboard();
  
  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Deuda Total: {formatMoney(data.kpis.total)}</p>
      <p>Tasa de Cambio: {formatMoney(data.exchange_rate)}</p>
    </div>
  );
}
```

### Ejemplo 2: Componente con Filtros y Debounce

```javascript
import React, { useState } from 'react';
import { useClientQueue, useDebounce } from '@/hooks';
import { formatMoney, RISK_LEVEL_OPTIONS } from '@/utils';

function ClientQueue() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  const { queue, loading, filters, updateFilters } = useClientQueue();
  
  // Filtrar localmente con debounce
  const filteredQueue = queue.filter(client => 
    client.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
  
  return (
    <div>
      <input 
        placeholder="Buscar cliente..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      
      <select 
        value={filters.riskLevel}
        onChange={e => updateFilters({ riskLevel: e.target.value })}
      >
        {RISK_LEVEL_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <ul>
          {filteredQueue.map(client => (
            <li key={client.id}>
              {client.name} - {formatMoney(client.totalDebt)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Ejemplo 3: Lógica de Negocio sin React

```javascript
import { 
  calculateDebtSplit, 
  calculatePriorityScore,
  determinePriorityBucket 
} from '@/services/business';

// Puede usarse en Node.js, tests, etc.
function processClients(clients, invoices, exchangeRate) {
  return clients.map(client => {
    const clientInvoices = invoices.filter(inv => inv.clientId === client.id);
    const { overdue, upcoming } = calculateDebtSplit(clientInvoices, exchangeRate);
    
    const score = calculatePriorityScore(
      client, 
      90, // days overdue
      overdue,
      false // has broken promise
    );
    
    const bucket = determinePriorityBucket(score);
    
    return {
      ...client,
      overdue,
      upcoming,
      priorityScore: score,
      priorityBucket: bucket
    };
  });
}
```

---

## ✅ Beneficios de la Nueva Arquitectura

### 1. **Código más Limpio**
- Componentes más pequeños y enfocados
- Separación clara de responsabilidades
- Menos props drilling

### 2. **Reutilización**
- Hooks personalizados reutilizables
- Servicios compartidos entre componentes
- Utilidades comunes

### 3. **Mantenibilidad**
- Fácil encontrar y modificar código
- Código organizado por función
- Menos bugs por cambios

### 4. **Testeable**
- Servicios testeables sin React
- Hooks testeables con `@testing-library/react-hooks`
- Utilidades puras fáciles de testear

### 5. **Performance**
- Hooks optimizados con `useCallback`/`useMemo`
- Debounce reduce llamadas API
- Code splitting más granular

---

## 🔄 Migración Gradual

**No es necesario refactorizar todo de una vez.** Puedes migrar gradualmente:

1. ✅ **Fase 1**: Usar nuevos servicios en componentes nuevos
2. ✅ **Fase 2**: Extraer lógica de componentes existentes a hooks
3. ✅ **Fase 3**: Refactorizar componentes grandes
4. ✅ **Fase 4**: Mover formatters/validators a utils

### Ejemplo de Migración:

**Antes:**
```javascript
function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);
  
  // ... resto del componente
}
```

**Después:**
```javascript
function Dashboard() {
  const { data, loading } = useDashboard(); // ✨ Una línea!
  
  // ... resto del componente
}
```

---

## 📚 Recursos Adicionales

- [React Hooks Documentation](https://react.dev/reference/react)
- [Clean Code JavaScript Guide](https://github.com/ryanmcdermott/clean-code-javascript)
- [JavaScript Design Patterns](https://www.patterns.dev/posts/classic-design-patterns/)

---

## 🎓 Convenciones de Código

### Nomenclatura

- **Services**: `<resource>.service.js` (ej: `dashboard.service.js`)
- **Hooks**: `use<Resource>.js` (ej: `useDashboard.js`)
- **Utils**: `<category>.js` (ej: `formatters.js`, `validators.js`)
- **Constants**: En UPPER_SNAKE_CASE

### Imports

Usa imports absolutos con alias `@/`:

```javascript
// ✅ Correcto
import { useDashboard } from '@/hooks';
import { formatMoney } from '@/utils';

// ❌ Evitar
import { useDashboard } from '../../../hooks';
```

*(Configurar alias en `vite.config.js` si es necesario)*

### Documentación

Todos los servicios y utilidades deben tener JSDoc:

```javascript
/**
 * Calculate debt split between overdue and upcoming
 * @param {Array} invoices - Array of invoices
 * @param {number} exchangeRate - USD to UYU rate
 * @returns {Object} { overdue, upcoming, total }
 */
export function calculateDebtSplit(invoices, exchangeRate) {
  // ...
}
```

---

## 🤝 Contribuir

Al agregar nuevas funcionalidad:

1. ✅ Coloca llamadas API en `services/api/`
2. ✅ Coloca lógica de negocio en `services/business/`
3. ✅ Crea hooks reutilizables en `hooks/`
4. ✅ Agrega formatters/validators en `utils/`
5. ✅ Documenta con JSDoc

---

**¿Preguntas?** Consulta este README o revisa los ejemplos en `src/pages/DashboardRefactored.jsx`

¡Happy coding! 🚀

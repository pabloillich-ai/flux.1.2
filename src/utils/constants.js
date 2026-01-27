/**
 * Application Constants
 * Central location for all app constants
 */

// === RISK LEVELS ===
export const RISK_LEVELS = {
    EXCELENTE: 'Excelente',
    BUEN_PAGADOR: 'Buen Pagador',
    REGULAR: 'Regular',
    ATRASO_FRECUENTE: 'Atraso Frecuente',
    MAL_PAGADOR: 'Mal Pagador',
    LEGAL: 'Legal',
    INCOBRABLE: 'Incobrable',
    CRITICO: 'Crítico',
    ALTO: 'Alto',
    MEDIO: 'Medio',
    BAJO: 'Bajo'
};

export const RISK_LEVEL_OPTIONS = [
    { value: 'all', label: 'Todos los niveles' },
    { value: RISK_LEVELS.CRITICO, label: 'Crítico' },
    { value: RISK_LEVELS.ALTO, label: 'Alto' },
    { value: RISK_LEVELS.MEDIO, label: 'Medio' },
    { value: RISK_LEVELS.BAJO, label: 'Bajo' },
    { value: RISK_LEVELS.EXCELENTE, label: 'Excelente' }
];

// === RISK STYLES ===
export const RISK_STYLES = {
    [RISK_LEVELS.EXCELENTE]: {
        color: 'green',
        border: 'border-l-green-500',
        bg: 'bg-green-500/10',
        text: 'text-green-400'
    },
    [RISK_LEVELS.BUEN_PAGADOR]: {
        color: 'blue',
        border: 'border-l-blue-500',
        bg: 'bg-blue-500/10',
        text: 'text-blue-400'
    },
    [RISK_LEVELS.REGULAR]: {
        color: 'gray',
        border: 'border-l-gray-500',
        bg: 'bg-gray-500/10',
        text: 'text-gray-400'
    },
    [RISK_LEVELS.ATRASO_FRECUENTE]: {
        color: 'yellow',
        border: 'border-l-yellow-500',
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400'
    },
    [RISK_LEVELS.MAL_PAGADOR]: {
        color: 'orange',
        border: 'border-l-orange-500',
        bg: 'bg-orange-500/10',
        text: 'text-orange-400'
    },
    [RISK_LEVELS.LEGAL]: {
        color: 'red',
        border: 'border-l-red-700',
        bg: 'bg-red-900/10',
        text: 'text-red-600'
    },
    [RISK_LEVELS.INCOBRABLE]: {
        color: 'slate',
        border: 'border-l-slate-600',
        bg: 'bg-slate-800',
        text: 'text-slate-400'
    },
    [RISK_LEVELS.CRITICO]: {
        color: 'red',
        border: 'border-l-red-500',
        bg: 'bg-red-500/10',
        text: 'text-red-400'
    },
    [RISK_LEVELS.ALTO]: {
        color: 'orange',
        border: 'border-l-orange-500',
        bg: 'bg-orange-500/10',
        text: 'text-orange-400'
    },
    [RISK_LEVELS.MEDIO]: {
        color: 'yellow',
        border: 'border-l-yellow-500',
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400'
    },
    [RISK_LEVELS.BAJO]: {
        color: 'green',
        border: 'border-l-green-500',
        bg: 'bg-green-500/10',
        text: 'text-green-400'
    }
};

// === CLIENT STATUSES ===
export const CLIENT_STATUS = {
    PENDIENTE: 'Pendiente',
    EN_GESTION: 'En Gestión',
    PROMESA: 'Promesa',
    PAGO: 'Pago',
    ESCALADO: 'Escalado',
    COMERCIAL: 'Comercial',
    LEGAL: 'Legal',
    INCOBRABLE: 'Incobrable'
};

export const STATUS_OPTIONS = [
    { value: CLIENT_STATUS.PENDIENTE, label: 'Pendiente' },
    { value: CLIENT_STATUS.EN_GESTION, label: 'En Gestión' },
    { value: CLIENT_STATUS.PROMESA, label: 'Promesa de Pago' },
    { value: CLIENT_STATUS.PAGO, label: 'Pago Realizado' },
    { value: CLIENT_STATUS.ESCALADO, label: 'Escalado' }
];

// === AGING BUCKETS ===
export const AGING_BUCKETS = {
    CURRENT: 'Current',
    DAYS_1_30: '1-30',
    DAYS_31_60: '31-60',
    DAYS_61_90: '61-90',
    DAYS_90_PLUS: '+90'
};

export const AGING_BUCKET_OPTIONS = [
    { value: 'all', label: 'Todos los periodos' },
    { value: AGING_BUCKETS.CURRENT, label: 'Al día' },
    { value: AGING_BUCKETS.DAYS_1_30, label: '1-30 días' },
    { value: AGING_BUCKETS.DAYS_31_60, label: '31-60 días' },
    { value: AGING_BUCKETS.DAYS_61_90, label: '61-90 días' },
    { value: AGING_BUCKETS.DAYS_90_PLUS, label: '+90 días' }
];

// === CRM CHANNELS ===
export const CRM_CHANNELS = {
    PHONE: 'Teléfono',
    EMAIL: 'Email',
    SMS: 'SMS',
    WHATSAPP: 'WhatsApp',
    WEB: 'Web',
    IN_PERSON: 'Presencial'
};

// === CRM DIRECTIONS ===
export const CRM_DIRECTIONS = {
    OUTBOUND: 'Saliente',
    INBOUND: 'Entrante'
};

// === CRM RESULT STATES ===
export const CRM_RESULTS = {
    CONTACTED: 'Contactado',
    NO_ANSWER: 'Sin Respuesta',
    PROMISE: 'Promesa de Pago',
    PARTIAL_PAYMENT: 'Pago Parcial',
    FULL_PAYMENT: 'Pago Total',
    BROKEN_PROMISE: 'Promesa Incumplida',
    NEGOTIATION: 'En Negociación',
    DISPUTE: 'Disputa',
    UNREACHABLE: 'Inubicable'
};

// === CURRENCIES ===
export const CURRENCIES = {
    UYU: 'UYU',
    USD: 'USD'
};

export const CURRENCY_OPTIONS = [
    { value: CURRENCIES.UYU, label: 'UYU ($)' },
    { value: CURRENCIES.USD, label: 'USD (US$)' }
];

// === INVOICE STATUSES ===
export const INVOICE_STATUS = {
    PENDING: 'Pendiente',
    PAID: 'Pagado',
    OVERDUE: 'Vencida',
    CANCELLED: 'Anulado'
};

// === PRIORITY BUCKETS ===
export const PRIORITY_BUCKETS = {
    URGENT: 'Urgente',
    FOLLOW_UP: 'Seguimiento',
    PREVENTIVE: 'Preventivo'
};

// === DEFAULT VALUES ===
export const DEFAULT_EXCHANGE_RATE = 42;
export const DEFAULT_TENANT_ID = 'a942b959-92f8-4ed1-8397-80ff430d8f1d';

// === PAGINATION ===
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// === DATE FORMATS ===
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const DISPLAY_DATE_FORMAT = 'DD/MM/YYYY';

// === STORAGE KEYS ===
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_PREFERENCES: 'user_preferences',
    DASHBOARD_FILTERS: 'dashboard_filters'
};

// === API TIMEOUTS ===
export const API_TIMEOUT = 30000; // 30 seconds
export const RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000; // 1 second

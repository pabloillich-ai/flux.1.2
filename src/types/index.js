/**
 * Type Definitions (JSDoc for JavaScript)
 * These are used for better IDE autocomplete and documentation
 * Can be converted to TypeScript in the future
 */

/**
 * @typedef {Object} Client
 * @property {string} id - Client UUID
 * @property {string} rut - RUT/CI number
 * @property {string} name - Client name (razon_social)
 * @property {string} risk - Risk level
 * @property {number} creditLimit - Credit limit
 * @property {string} [agentId] - Assigned agent ID
 * @property {string} agentName - Assigned agent name
 * @property {Invoice[]} invoices - Client invoices
 * @property {CRMHistoryItem[]} crmHistory - CRM interaction history
 * @property {CRMHighlevel} crm - Latest CRM summary
 * @property {string} status - Client status
 * @property {string} [promiseDate] - Promise to pay date
 * @property {number} overdue - Overdue amount
 * @property {number} upcoming - Upcoming amount
 * @property {number} totalDebt - Total debt
 */

/**
 * @typedef {Object} Invoice
 * @property {string} id - Invoice ID
 * @property {number} amount - Invoice amount
 * @property {string} currency - Currency code (UYU, USD)
 * @property {string} dueDate - Due date (YYYY-MM-DD)
 * @property {string} issueDate - Issue date (YYYY-MM-DD)
 * @property {string} [status] - Invoice status
 */

/**
 * @typedef {Object} CRMHistoryItem
 * @property {number} [id] - CRM entry ID
 * @property {string} [fecha_y_hora] - Date and time
 * @property {string} [tipo_gestion] - Management type
 * @property {string} [canal] - Channel
 * @property {string} [sentido] - Direction (Inbound/Outbound)
 * @property {string} [resultado_estado] - Result state
 * @property {string} [observaciones_mensaje] - Observations/message
 * @property {string} [agente_responsable] - Responsible agent
 */

/**
 * @typedef {Object} CRMHighlevel
 * @property {string} lastNote - Last note/observation
 * @property {string} date - Date of last interaction
 */

/**
 * @typedef {Object} DashboardKPIs
 * @property {string} total - Total debt formatted
 * @property {string} critical - Critical debt formatted
 * @property {string} recovered - Recovered amount formatted
 * @property {string} effectiveness - Effectiveness percentage
 */

/**
 * @typedef {Object} DashboardData
 * @property {Client[]} items - Client items
 * @property {DashboardKPIs} kpis - KPI metrics
 * @property {number} exchange_rate - USD to UYU exchange rate
 */

/**
 * @typedef {Object} QueueItem
 * @property {string} id - Client ID
 * @property {string} rut - RUT/CI
 * @property {string} name - Client name
 * @property {number} priorityScore - Priority score (0-150+)
 * @property {string} bucket - Priority bucket (Urgente, Seguimiento, Preventivo)
 * @property {number} totalDebt - Total debt amount
 * @property {number} daysOverdue - Days overdue
 * @property {string} risk - Risk level
 * @property {string} lastAction - Last action taken
 * @property {string} status - Client status
 */

/**
 * @typedef {Object} DashboardStats
 * @property {number} cashFlow - Cash flow amount
 * @property {Object[]} cashFlowClients - Clients contributing to cash flow
 * @property {number} operationalVolume - Number of operations
 * @property {number} commitmentsToday - Commitments for today
 * @property {number} commitmentsCompleted - Completed commitments
 * @property {number} criticalRisk - Clients with critical risk
 */

/**
 * @typedef {Object} ClientDetail
 * @property {string} id - Client UUID
 * @property {string} rut - RUT/CI
 * @property {string} name - Client name
 * @property {string} risk - Risk level
 * @property {number} totalDebt - Total debt
 * @property {number} overdue - Overdue amount
 * @property {number} upcoming - Upcoming amount
 * @property {string} agentName - Assigned agent name
 * @property {Invoice[]} invoices - Client invoices
 * @property {CRMHistoryItem[]} crmHistory - CRM history
 */

/**
 * @typedef {Object} APIError
 * @property {string} message - Error message
 * @property {number} [status] - HTTP status code
 * @property {string} [detail] - Detailed error information
 */

export { };

/**
 * Priority Scorer
 * Business logic for calculating client priority scores
 */

/**
 * Risk level weights for priority calculation
 */
const RISK_WEIGHTS = {
    'Crítico': 100,
    'Legal': 100,
    'Incobrable': 100,
    'Alto': 70,
    'Mal Pagador': 70,
    'Atraso Frecuente': 70,
    'Medio': 40,
    'Regular': 40,
    'Bajo': 10,
    'Excelente': 10,
    'Buen Pagador': 10
};

/**
 * Calculate priority score for a client
 * @param {Object} client - Client data
 * @param {number} debtAgeDays - Days overdue for oldest invoice
 * @param {number} debtAmount - Total debt amount
 * @param {boolean} hasBrokenPromise - Whether client has broken promises
 * @returns {number} Priority score (0-150+)
 */
export function calculatePriorityScore(client, debtAgeDays, debtAmount, hasBrokenPromise = false) {
    let score = 0;

    // 1. Risk Score (40% weight)
    const riskLevel = client.risk || client.status_riesgo || 'Regular';
    const riskValue = RISK_WEIGHTS[riskLevel] || 40;
    score += riskValue * 0.40;

    // 2. Aging Score (30% weight)
    // Cap at 360 days for 100 points
    const agingValue = Math.min((debtAgeDays / 360) * 100, 100);
    score += agingValue * 0.30;

    // 3. Amount Score (20% weight)
    // $100,000 UYU = 100 points
    const amountValue = Math.min((debtAmount / 100000) * 100, 100);
    score += amountValue * 0.20;

    // 4. Broken Promise Penalty (10% + extra)
    if (hasBrokenPromise) {
        score += 50; // Direct penalty boost
    }

    return Math.round(score);
}

/**
 * Determine priority bucket based on score
 * @param {number} score - Priority score
 * @returns {string} Bucket name ('Urgente', 'Seguimiento', 'Preventivo')
 */
export function determinePriorityBucket(score) {
    if (score > 80) return 'Urgente';
    if (score >= 50) return 'Seguimiento';
    return 'Preventivo';
}

/**
 * Get color class for priority bucket
 * @param {string} bucket - Priority bucket
 * @returns {string} Tailwind color class
 */
export function getPriorityColor(bucket) {
    const colors = {
        'Urgente': 'text-red-500',
        'Seguimiento': 'text-yellow-500',
        'Preventivo': 'text-green-500'
    };
    return colors[bucket] || 'text-gray-500';
}

/**
 * Get background color for priority bucket
 * @param {string} bucket - Priority bucket
 * @returns {string} Tailwind background class
 */
export function getPriorityBgColor(bucket) {
    const colors = {
        'Urgente': 'bg-red-500/10',
        'Seguimiento': 'bg-yellow-500/10',
        'Preventivo': 'bg-green-500/10'
    };
    return colors[bucket] || 'bg-gray-500/10';
}

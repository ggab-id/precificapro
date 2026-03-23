// pricing.js — Core pricing calculation engine

export const POSITIONING = {
  basic: { label: 'Básico', margin: 40, color: '#22c55e', desc: 'Volume alto, preço acessível', emoji: '🟢' },
  premium: { label: 'Premium', margin: 60, color: '#3b82f6', desc: 'Valor percebido, público qualificado', emoji: '🔵' },
  ultra: { label: 'Ultra-premium', margin: 80, color: '#a855f7', desc: 'Exclusividade, resultado garantido', emoji: '🟣' },
};

export const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

/**
 * Calculate cost per unit
 */
export function calcCostPerUnit({ fixedCosts, variableCosts, expectedSales }) {
  const totalFixed = Object.values(fixedCosts).reduce((a, b) => a + (parseFloat(b) || 0), 0);
  const totalVariable = Object.values(variableCosts).reduce((a, b) => a + (parseFloat(b) || 0), 0);
  const fixedPerUnit = expectedSales > 0 ? totalFixed / expectedSales : 0;
  const variablePerUnit = expectedSales > 0 ? totalVariable / expectedSales : 0;
  return {
    totalFixed,
    totalVariable,
    totalCosts: totalFixed + totalVariable,
    fixedPerUnit,
    variablePerUnit,
    costPerUnit: fixedPerUnit + variablePerUnit,
  };
}

/**
 * Calculate ideal price from cost and margin
 * Price = Cost / (1 - margin% - platformFee% - affiliateFee%)
 */
export function calcIdealPrice({ costPerUnit, desiredMargin, platformFee, affiliateFee }) {
  const margin = (parseFloat(desiredMargin) || 0) / 100;
  const platform = (parseFloat(platformFee) || 0) / 100;
  const affiliate = (parseFloat(affiliateFee) || 0) / 100;
  const divisor = 1 - margin - platform - affiliate;
  if (divisor <= 0) return { minPrice: 0, idealPrice: 0, error: 'Margem + taxas excedem 100%' };
  const minDivisor = 1 - platform - affiliate;
  const minPrice = minDivisor > 0 ? costPerUnit / minDivisor : 0;
  const idealPrice = costPerUnit / divisor;
  return { minPrice, idealPrice, divisor };
}

/**
 * Generate psychological price suggestions (ending in 7, 9, 97)
 */
export function getPsychologicalPrices(idealPrice, platformFee, affiliateFee, costPerUnit) {
  const targets = [];
  // Round to nearest "psychological" value
  const base = Math.ceil(idealPrice);

  // Generate candidates around the ideal price
  const candidates = [];
  for (let i = -3; i <= 5; i++) {
    const hundred = Math.round(idealPrice / 100) * 100 + i * 100;
    if (hundred > 0) {
      candidates.push(hundred - 3);   // ends in 97
      candidates.push(hundred - 1);   // ends in 99
      candidates.push(hundred + 7);   // ends in 07 -> next hundred -3 etc
    }
  }
  // Also add common infoproduct prices
  const common = [17, 27, 37, 47, 57, 67, 77, 87, 97, 127, 147, 167, 197, 247, 297, 347, 397, 497, 597, 697, 797, 897, 997, 1197, 1397, 1497, 1997, 2497, 2997];
  
  // Find 3 closest above or at idealPrice (never below minPrice)
  const pf = (parseFloat(platformFee) || 0) / 100;
  const af = (parseFloat(affiliateFee) || 0) / 100;

  const sorted = common
    .filter(p => p >= idealPrice * 0.85)
    .sort((a, b) => Math.abs(a - idealPrice) - Math.abs(b - idealPrice))
    .slice(0, 5);

  return sorted.map(price => {
    const netAfterFees = price * (1 - pf - af);
    const profit = netAfterFees - costPerUnit;
    const marginPct = price > 0 ? (profit / price) * 100 : 0;
    const diff = ((price - idealPrice) / idealPrice) * 100;
    return {
      price,
      profit: Math.max(profit, 0),
      marginPct,
      diff,
      isLoss: profit < 0,
      label: price < idealPrice ? `${diff.toFixed(1)}%` : `+${diff.toFixed(1)}%`,
    };
  });
}

/**
 * Calculate per-sale breakdown
 */
export function calcPerSaleBreakdown({ price, platformFee, affiliateFee, costPerUnit }) {
  const pf = (parseFloat(platformFee) || 0) / 100;
  const af = (parseFloat(affiliateFee) || 0) / 100;
  const platformValue = price * pf;
  const affiliateValue = price * af;
  const netAfterFees = price - platformValue - affiliateValue;
  const profit = netAfterFees - costPerUnit;
  const marginPct = price > 0 ? (profit / price) * 100 : 0;
  return {
    price,
    platformValue,
    affiliateValue,
    costPerUnit,
    profit,
    marginPct,
    isLoss: profit < 0,
  };
}

/**
 * Calculate launch simulation scenarios
 */
export function calcSimulationScenarios({ price, expectedLeads, conversionRate, cpl, platformFee, affiliateFee, costPerUnit, monthlyGoal }) {
  const pf = (parseFloat(platformFee) || 0) / 100;
  const af = (parseFloat(affiliateFee) || 0) / 100;
  const cr = parseFloat(conversionRate) || 0;
  const leads = parseFloat(expectedLeads) || 0;
  const cplValue = parseFloat(cpl) || 0;
  const totalTrafficCost = leads * cplValue;

  const calcScenario = (multiplier) => {
    const conv = cr * multiplier;
    const sales = Math.round(leads * (conv / 100));
    const grossRevenue = sales * price;
    const platformCut = grossRevenue * pf;
    const affiliateCut = grossRevenue * af;
    const netRevenue = grossRevenue - platformCut - affiliateCut;
    const totalCosts = sales * costPerUnit + (cplValue > 0 ? totalTrafficCost : 0);
    const netProfit = netRevenue - totalCosts;
    const margin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
    return {
      conversion: conv,
      sales,
      grossRevenue,
      platformCut,
      affiliateCut,
      netRevenue,
      totalCosts,
      netProfit,
      margin,
      reachesGoal: netProfit >= monthlyGoal,
    };
  };

  // Reverse: how many leads to reach goal
  const calcLeadsNeeded = (multiplier) => {
    const conv = cr * multiplier / 100;
    if (conv <= 0) return Infinity;
    const priceNet = price * (1 - pf - af) - costPerUnit;
    if (priceNet <= 0) return Infinity;
    // monthlyGoal = sales * priceNet - leads * cplValue
    // sales = leads * conv
    // monthlyGoal = leads * conv * priceNet - leads * cplValue
    // leads = monthlyGoal / (conv * priceNet - cplValue)
    const denom = conv * priceNet - cplValue;
    if (denom <= 0) return Infinity;
    return Math.ceil(monthlyGoal / denom);
  };

  return {
    pessimistic: calcScenario(0.5),
    realistic: calcScenario(1),
    optimistic: calcScenario(2),
    leadsNeeded: {
      pessimistic: calcLeadsNeeded(0.5),
      realistic: calcLeadsNeeded(1),
      optimistic: calcLeadsNeeded(2),
    },
    totalTrafficCost,
  };
}

export function fmtBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export function fmtPct(value, decimals = 1) {
  return `${(value || 0).toFixed(decimals)}%`;
}

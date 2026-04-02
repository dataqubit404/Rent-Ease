/**
 * Calculate rental amount based on dates and price
 */
const calculateRent = (startDate, endDate, price, listingType = 'short_term', options = {}) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) {
    throw new Error('End date must be after start date');
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalNights = Math.ceil((end - start) / msPerDay);
  
  let baseAmount = 0;
  if (listingType === 'long_term') {
    // Calculate total months (approximate as 30 days per month)
    const totalMonths = Math.max(1, Math.ceil(totalNights / 30));
    baseAmount = totalMonths * parseFloat(price);
  } else {
    baseAmount = totalNights * parseFloat(price);
  }

  // Optional fees
  const cleaningFee = options.cleaningFee || 0;
  const serviceFee = options.serviceFee || baseAmount * 0.12; // 12% service fee
  const taxRate = options.taxRate || 0.18; // 18% GST
  const taxAmount = (baseAmount + cleaningFee + serviceFee) * taxRate;
  const totalAmount = baseAmount + cleaningFee + serviceFee + taxAmount;

  // Monthly cycle amount (for long-term monthly pay plans)
  let monthlyCycleAmount = 0;
  if (listingType === 'long_term') {
    const monthlyBase = parseFloat(price);
    const monthlyService = monthlyBase * 0.12;
    const monthlyTax = (monthlyBase + monthlyService) * 0.18;
    monthlyCycleAmount = monthlyBase + monthlyService + monthlyTax;
  }

  return {
    totalNights,
    totalMonths: listingType === 'long_term' ? Math.ceil(totalNights / 30) : 0,
    unitPrice: parseFloat(price),
    baseAmount: Math.round(baseAmount * 100) / 100,
    cleaningFee: Math.round(cleaningFee * 100) / 100,
    serviceFee: Math.round(serviceFee * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    monthlyCycleAmount: Math.round(monthlyCycleAmount * 100) / 100,
  };
};

/**
 * Check if two date ranges overlap
 */
const datesOverlap = (start1, end1, start2, end2) => {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  return s1 < e2 && e1 > s2;
};

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

module.exports = { calculateRent, datesOverlap, formatDate };

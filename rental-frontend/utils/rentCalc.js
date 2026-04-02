export const calculateRentClient = (startDate, endDate, price, listingType = 'short_term') => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) return null;

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalNights = Math.ceil((end - start) / msPerDay);
  
  let baseAmount = 0;
  if (listingType === 'long_term') {
    const totalMonths = Math.max(1, Math.ceil(totalNights / 30));
    baseAmount = totalMonths * parseFloat(price);
  } else {
    baseAmount = totalNights * parseFloat(price);
  }

  const serviceFee = baseAmount * 0.12;
  const taxAmount = (baseAmount + serviceFee) * 0.18;
  const totalAmount = baseAmount + serviceFee + taxAmount;

  // Monthly cycle calculation
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
    baseAmount: Math.round(baseAmount),
    serviceFee: Math.round(serviceFee),
    taxAmount: Math.round(taxAmount),
    totalAmount: Math.round(totalAmount),
    monthlyCycleAmount: Math.round(monthlyCycleAmount),
  };
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

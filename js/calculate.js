function calculate(input, prices) {
  if (input.mode === 'help') return null;
  if (input.mode !== 'outside') return prices.cityBase;
  const km = Math.max(0, Math.min(2000, Number(input.km) || 0));
  return Math.max(prices.cityBase, km * 2 * prices.perKmOutside);
}
if (typeof module !== 'undefined') module.exports = calculate;

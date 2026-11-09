function calculate(input, prices) {
  if (input.mode === 'help') return prices.roadHelp;
  const km = input.mode === 'outside' ? Math.max(0, Math.min(2000, Number(input.km) || 0)) : 0;
  const base = (prices.cityBase + km * prices.perKmOutside) * (prices.vehicle[input.vehicle] || 1);
  return Math.ceil(base + Object.keys(prices.extras).reduce((sum, key) => sum + (input[key] ? prices.extras[key] : 0), 0));
}
if (typeof module !== 'undefined') module.exports = calculate;

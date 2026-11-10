const CONFIG = {
  phone: "+380635056586",
  phoneDisplay: "063 505 65 86",
  arrivalMinutes: 30,
  prices: {
    cityBase: 1800, // Фіксований тариф по Чернігову; мінімум для заміської поїздки
    perKmOutside: 27,
    vehicle: { car: 1.0, suv: 1.0, minibus: 1.0, moto: 1.0 },
    roadHelp: null // Вартість — за домовленістю
  },
  supabaseFunctionUrl: "https://pqasdmiqnlyyjwmmqeyc.supabase.co/functions/v1/tow-lead",
  googleAdsId: "AW-18565415902",
  googleAdsConversionLabels: { call: "XXX", form: "cchjCO-qyrUdEN6H15RF" },
  gaMeasurementId: "G-XXXXXXXXXX",
  siteUrl: "https://evakuator-che.online",
  customDomain: "evakuator-che.online"
};
if (typeof module !== 'undefined') module.exports = CONFIG;

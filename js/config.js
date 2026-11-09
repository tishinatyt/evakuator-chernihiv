const CONFIG = {
  phone: "+380635056586",
  phoneDisplay: "063 505 65 86",
  arrivalMinutes: 30,
  prices: {
    cityBase: 900, // PLACEHOLDER: підтвердити перед запуском реклами
    perKmOutside: 30,
    vehicle: { car: 1.0, suv: 1.2, minibus: 1.5, moto: 0.8 },
    extras: { nonRolling: 300, noKeys: 300, night: 200, winch: 200 },
    roadHelp: 500
  },
  supabaseFunctionUrl: "PLACEHOLDER",
  googleAdsId: "AW-XXXXXXXXX",
  googleAdsConversionLabels: { call: "XXX", form: "XXX", calc: "XXX" },
  gaMeasurementId: "G-XXXXXXXXXX",
  siteUrl: "https://evakuator-che.online",
  customDomain: "evakuator-che.online"
};
if (typeof module !== 'undefined') module.exports = CONFIG;

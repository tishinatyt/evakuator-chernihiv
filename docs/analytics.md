# GA4 and Google Ads

GA4: G-VQBLDDQ4RS. Google Ads: AW-18565415902. One application-owned gtag loader (id=tow-google-tag), two destination configurations, no GTM container. Google may fetch an additional destination script internally.

Consent Mode v2 starts with analytics_storage, ad_storage, ad_user_data and ad_personalization denied; banner acceptance grants all four. Custom events are suppressed without consent. Existing advanced-mode cookieless page measurement is retained.

Events:
- phone_click: location = header / hero / calc / sticky_bar / footer / request / other.
- telegram_click / viber_click: location; delegated handlers for existing or later-added messenger links. No messenger links were added to the site.
- calc_start: once per page, at the first calculator interaction after consent.
- calc_result: numeric price and km, mode = city / route / manual / help. Unknown price/distance for help are omitted rather than invented. Each displayed recalculation is measured, including duplicate requests that are not sent again.
- lead_submit: form = calc / lead; only confirmed successful submissions.
- lead_error: form = calc / lead; failed network/server submissions, excluding client validation failures.

The GA4 helper allowlists names and parameters and explicitly routes to the GA4 destination. No customer names, phones, addresses, routes, comments, submitted payloads or target link URLs are passed. GA4 page_location and page_referrer omit query and hash.

Ads form conversion remains AW-18565415902/cchjCO-qyrUdEN6H15RF with a per-lead transaction_id and duplicate protection; missing labels remain suppressed.

Checks: node build.js; node scripts/test-routes.cjs; node scripts/check-static.cjs; node scripts/verify-ads.cjs; node scripts/verify-analytics.cjs. The last command uses the real Google scripts and checks browser Network collect requests; lead POSTs are intercepted, never sent to Supabase. Messenger handlers use temporary test-only links. Use --live to test the deployed assets while still intercepting all lead submissions. Reports: ignored qa/analytics-network.json. GA requests are genuine debug test traffic.

# Light theme verification — 2026-11-09

- Order: hero, calculator, services, benefits, workflow, gallery, prices, FAQ, request.
- Full-page screenshots reviewed at 360, 390, 768 and 1440 px; no horizontal overflow. Real Google Fonts loaded for screenshots. Screenshots stay in ignored `qa/`.
- Fonts: Unbounded 600/700 and Manrope 400/700, four requested weights, swap.
- Bright orange buttons use graphite text: white on #FF7A00 does not meet AA. Axe color-contrast checks: zero violations at 360 and 1440 px.
- Existing Playwright client scenarios pass at 360 and 1280 px: immediate result, routes, road help, manual distance, validation, network failures, deduplication, repeat limit, lower form, keyboard suggestions, lightbox and CTA focus. No places.json request on initial load.
- Static checks: valid JSON-LD, 8 exact FAQ matches, 6 offers, all resources present. Route tests and mocked Edge Function tests pass.
- One real authorized TEST calculation: 40 km manual point → Chernihiv, 80 km total, 2160 UAH; HTTP 200, notification sent, Telegram heading `РОЗРАХУНОК ВАРТОСТІ` confirmed in function response.
- No database/schema/backend changes. Decorative animations are isolated from business logic and disabled for reduced motion.
- OG image: 1200×630 real photo, warm background, current config price/phone. Regenerate with `node scripts/build-og.cjs` (existing sharp development dependency).
- Build: `node build.js`. Automated checks: `node scripts/check-static.cjs`, `node scripts/verify.cjs`, `node scripts/test-function.mjs`.

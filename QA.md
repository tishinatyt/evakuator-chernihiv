# Перевірка — 09.11.2026

- `node build.js`: згенеровано всі статичні сторінки, sitemap, robots, schema і CORS origin.
- `node scripts/check-static.cjs`: PASS. JSON-LD — валідний JSON, 4 вузли графа, 5 Offer/Service, 8 FAQ збігаються зі сторінкою 1:1. Один H1. Title 46 символів, description 135. Усі локальні посилання на файли існують. Це структурна локальна перевірка, не сертифікація Google Rich Results.
- Текст основних блоків: близько 1 000 видимих слів (понад 1 300 з прихованими відповідями та умовами).
- `node scripts/test-function.mjs`: PASS. CORS/preflight, телефон/згода, великі запити, honeypot, екранування HTML, rate-limit, успіх і помилка Telegram. Telegram замоканий; реальна доставка потребує секретів та деплою.
- `OFFLINE_FONTS=1 node scripts/verify.cjs`: PASS. Ширини 360, 390, 768, 1280, 1440 px без горизонтального переповнення. Перевірені калькулятор, перенесення розрахунку у форму, маска +380, помилка/успіх форми, лайтбокс та Escape, згода й атрибуція. Помилок JavaScript немає. Зовнішні шрифти заблоковано в цьому прогоні через зависання мережевої загрузки; системні fallback працюють.
- Візуально переглянуті скриншоти першого екрану 390/1280 px, OG і розмитий номер Camaro. Скриншоти всіх розмірів — `qa/viewport-*.png` (не публікуються).
- Lighthouse mobile: вимір не завершився. Chrome повідомив `TARGET_CRASHED`, Windows — нестачу віртуальної пам’яті. Числові оцінки не заявляються; ціль ≥90 залишається непідтвердженою. Після звільнення пам’яті повторіть команду нижче.
- GitHub CLI: не авторизований, тому репозиторій і Pages не створені. Живі Supabase/Telegram і Google Ads не перевірені, оскільки значення залишені плейсхолдерами.

```powershell
$env:CHROME_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
node node_modules/lighthouse/cli/index.js http://127.0.0.1:4173/ --output=html --output-path=qa/lighthouse.html --chrome-flags="--headless --disable-gpu"
```

Для запуску спершу потрібні встановлений Lighthouse (`npm install --no-save --package-lock=false lighthouse`) та локальний сервер (`node scripts/serve.cjs`). Перевірку з реальними шрифтами, живими тегами й опублікованим доменом повторіть перед Google Ads.

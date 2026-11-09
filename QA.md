# Перевірка — 09.11.2026

## Поточний стан підключення Supabase

- У конфігурації встановлено `https://ajvgaxevtjsfmtrmmvgr.supabase.co/functions/v1/tow-lead`. CORS розширено на основний домен, www, `https://tishinatyt.github.io` і localhost; локальні тести всіх origin пройшли, сторонній origin відхиляється.
- Supabase CLI 3.0.0 працює з публічними кореневими сертифікатами Windows через NODE_EXTRA_CA_CERTS. Прив’язка проєкту зупинилася на `ProjectPausedError`. Функцію з цієї версії коду поки не задеплоєно: потрібне відновлення проєкту через Dashboard.
- Реальний тест через Invoke-RestMethod спробувано: DNS `ajvgaxevtjsfmtrmmvgr.supabase.co` не резолвиться, HTTP-відповіді немає. Успішна доставка, live-валідація без телефону й live-honeypot не підтверджені. Локальні тести валідації та відсутності Telegram-запиту для honeypot пройшли.
- `https://evakuator-che.online/` і всі 24 ресурси відповідають 200; canonical, Open Graph, JSON-LD, sitemap, robots і CNAME перевірені на домен. DNS — чотири A GitHub Pages, www — CNAME на tishinatyt.github.io. Enforce HTTPS увімкнено; сертифікат до 2027-02-07.
- PSI повторено для нового домену: mobile і desktop повернули 429 RESOURCE_EXHAUSTED, доступна квота 0. Числових оцінок та аудиторських зауважень API не надав.

## Попередні перевірки

- `node build.js`: згенеровано всі статичні сторінки, sitemap, robots, schema і CORS origin.
- `node scripts/check-static.cjs`: PASS. JSON-LD — валідний JSON, 4 вузли графа, 5 Offer/Service, 8 FAQ збігаються зі сторінкою 1:1. Один H1. Title 46 символів, description 135. Усі локальні посилання на файли існують. Це структурна локальна перевірка, не сертифікація Google Rich Results.
- Текст основних блоків: близько 1 000 видимих слів (понад 1 300 з прихованими відповідями та умовами).
- `node scripts/test-function.mjs`: PASS. CORS/preflight, телефон/згода, великі запити, honeypot, екранування HTML, rate-limit, успіх і помилка Telegram. Telegram замоканий; реальна доставка потребує секретів та деплою.
- `OFFLINE_FONTS=1 node scripts/verify.cjs`: PASS. Ширини 360, 390, 768, 1280, 1440 px без горизонтального переповнення. Перевірені калькулятор, перенесення розрахунку у форму, маска +380, помилка/успіх форми, лайтбокс та Escape, згода й атрибуція. Помилок JavaScript немає. Зовнішні шрифти заблоковано в цьому прогоні через зависання мережевої загрузки; системні fallback працюють.
- Візуально переглянуті скриншоти першого екрану 390/1280 px, OG і розмитий номер Camaro. Скриншоти всіх розмірів — `qa/viewport-*.png` (не публікуються).
- Lighthouse mobile: вимір не завершився. Chrome повідомив `TARGET_CRASHED`, Windows — нестачу віртуальної пам’яті. Числові оцінки не заявляються; ціль ≥90 залишається непідтвердженою. Після звільнення пам’яті повторіть команду нижче.
- GitHub Pages опубліковано: https://tishinatyt.github.io/evakuator-chernihiv/. Репозиторій: https://github.com/tishinatyt/evakuator-chernihiv. Джерело — `main`, корінь `/`; HTTPS увімкнено. Початковий deployment run `42608957357` завершився успішно.
- Перевірено поточний індекс та всю історію комітів: `qa/`, `photos/`, `node_modules/`, локальні бінарники та тимчасові QA-файли не комітилися. `git check-ignore` підтвердив виключення. Документ QA.md і скрипти перевірки є вихідними файлами проєкту, а не тимчасовими артефактами.
- `node scripts/check-published.cjs`: PASS — 24 URL повернули HTTP 200, включно з головною, політикою, CSS, трьома JS, всіма варіантами WebP, OG, favicon, sitemap і robots. Усі URL правильно містять підшлях `/evakuator-chernihiv/`. Сирий звіт: `qa/published-assets.json` (ігнорується Git).
- PageSpeed Insights API викликано з `strategy=mobile` і `strategy=desktop`, категорії performance/accessibility/best-practices/seo. Обидва запити повернули HTTP 429 `RESOURCE_EXHAUSTED`: перевищена денна квота, `quota_limit_value: 0`. Оцінки й топ-5 зауважень відсутні, порівняння mobile performance з 90 неможливе. Сирі відповіді: `qa/pagespeed-mobile.json` та `qa/pagespeed-desktop.json` (ігноруються Git). Для повторення потрібен ключ проєкту з увімкненим API та доступною квотою.
- Живі Supabase/Telegram і Google Ads не перевірені, оскільки значення залишені плейсхолдерами.

```powershell
$env:CHROME_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
node node_modules/lighthouse/cli/index.js http://127.0.0.1:4173/ --output=html --output-path=qa/lighthouse.html --chrome-flags="--headless --disable-gpu"
```

Для запуску спершу потрібні встановлений Lighthouse (`npm install --no-save --package-lock=false lighthouse`) та локальний сервер (`node scripts/serve.cjs`). Перевірку з реальними шрифтами, живими тегами й опублікованим доменом повторіть перед Google Ads.

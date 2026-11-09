# Евакуатор Чернігів

Статичний українськомовний лендинг: HTML, CSS і JavaScript, без фреймворку та бандлера. GitHub Pages публікує корінь гілки `main`. Node потрібен тільки для оновлення згенерованих HTML/SEO-файлів, а не для роботи сайту.

## Налаштування

Єдине джерело тарифів: `js/config.js`. Актуальні тарифи: місто — 1800 грн; за місто — 27 грн/км, мінімум 1800 грн. За потреби змініть `prices`, `arrivalMinutes`, `supabaseFunctionUrl`, `googleAdsId`, `googleAdsConversionLabels.call/form/calc`, `gaMeasurementId`. Для власного домену змініть `siteUrl` на `https://ваш-домен` і `customDomain` на домен без протоколу. Після кожної зміни:

```powershell
node build.js
git add .
git commit -m "Update service configuration"
git push
```

`build.js` генерує головну, політику, 404, JSON-LD, sitemap, robots і CORS origin функції. За `customDomain: "DOMAIN"` справжній CNAME не створюється, щоб не зламати GitHub Pages; плейсхолдер лежить у `CNAME.example`. Після введення реального домену build створить `CNAME`. У разі зміни домену повторно задеплойте Edge Function.

Формула за місто: `max(cityBase, km × perKmOutside)`. Кілометри — відстань від Чернігова в один бік; по місту фіксовано `cityBase`. Усі коефіцієнти типу авто дорівнюють 1; тип і додаткові умови передаються як інформація та не змінюють розрахунок. Додаткові умови можуть вплинути на остаточну вартість — уточнюйте телефоном. Допомога на дорозі — за домовленістю, без числової ціни (`amount: null` лише для `vehicle: help`).

## Заявки й аналітика

Деплой описаний у [supabase/README.md](supabase/README.md). Форма підключена до проєкту `pqasdmiqnlyyjwmmqeyc`: спочатку заявка зберігається в `tow_leads`, потім надсилається у Telegram. Якщо Telegram недоступний, збережена заявка приймається успішно та лишається з `tg_sent=false` для ручного опрацювання. Секрети залишаються лише в Edge Function. Міграції та експорт схеми цього спільного проєкту не використовуються.

Google Ads / GA теги не завантажуються з плейсхолдерами або без згоди. Consent Mode v2 використовує default denied; після дозволу — granted. Рекламні UTM/gclid зберігаються в sessionStorage та надсилаються тільки за згодою. Подія calc надсилається один раз за відвідування після зміни калькулятора; у кабінеті Google Ads вручну встановіть її як **Secondary**, call/form — за вашою стратегією конверсій. Властивість Secondary не налаштовується JavaScript-кодом.

Клік на tel фіксує натискання, а не підтверджену телефонну розмову. Live-конверсії можна перевірити тільки після встановлення реальних ID/labels.

## Фотографії

Переглянуто 9 оригіналів: 6 реальних фото, 3 постери. Hero — Jeep Cherokee. Реальні роботи: Camaro (2), Acura, Mazda, Jeep, BMW. Номери на обох Camaro, Acura та передній номер евакуатора на Jeep розмиті до створення WebP. Всі 9 файлів конвертовано у 800w/1600w, але невикористані постери виключено з git і публікації (один містить суперечливий графік). Оригінали `photos/` не комітяться. OG 1200×630 створений із реального фото. Повторна обробка потребує локальних оригіналів та sharp:

```powershell
npm install --no-save --package-lock=false sharp
node scripts/images.cjs
```

## Локальна перевірка

```powershell
node scripts/serve.cjs
# В іншому терміналі:
node scripts/check-static.cjs
node scripts/test-function.mjs
npm install --no-save --package-lock=false playwright lighthouse
node scripts/verify.cjs
```

Для тесту TypeScript-функції без Deno використовується Node 24 з вбудованим зняттям типів. Telegram API замоканий, реальних повідомлень тест не надсилає. `verify.cjs` перевіряє ширини 360/390/768/1280/1440, калькулятор, форму, маску, лайтбокс, cookies і відповідність FAQ/Schema. Використовується локальний Google Chrome; шлях можна змінити в скрипті. Знімки та звіти зберігаються у `qa/`, яка не публікується.

## GitHub Pages

Портативний GitHub CLI завантажений у `qa/gh/bin/gh.exe` (не комітиться). Якщо CLI відсутній у PATH:

```powershell
.\qa\gh\bin\gh.exe auth login --hostname github.com --git-protocol https --web
.\qa\gh\bin\gh.exe api user --jq .login
.\qa\gh\bin\gh.exe repo create tishinatyt/evakuator-chernihiv --public --source . --remote origin --push
.\qa\gh\bin\gh.exe api --method POST repos/tishinatyt/evakuator-chernihiv/pages -f "source[branch]=main" -f "source[path]=/"
```

Сайт уже опубліковано: https://tishinatyt.github.io/evakuator-chernihiv/. Репозиторій: https://github.com/tishinatyt/evakuator-chernihiv, Pages з `main`, корінь `/`. Команди створення вище наведені для довідки; повторно виконувати їх не потрібно. Не починайте Google Ads до підтвердження тарифів, підключення функції та перевірки реальної заявки.

Якщо Git повідомить `dubious ownership` після створення репозиторію в песочниці, додайте виняток лише для цієї папки: `git config --global --add safe.directory C:/Users/Dell/projects/evakuator-chernihiv`.

## Перевірка опублікованого сайту та PageSpeed

`node scripts/check-published.cjs` перевіряє HTTP-статуси сторінок і всіх ресурсів з урахуванням підшляху GitHub Pages. `node scripts/pagespeed.cjs` викликає офіційний PageSpeed Insights API для mobile/desktop та всіх чотирьох категорій. Сирі результати зберігаються тільки в ігнорованій папці `qa/`.

API без ключа повернув 429 (нульова доступна квота). Для повторного заміру задайте `PAGESPEED_API_KEY` у середовищі або створіть `.env.pagespeed` з рядком `PAGESPEED_API_KEY=ваш_ключ`. Потрібен власний проєкт Google Cloud з увімкненим PageSpeed Insights API й доступною квотою. Файл ігнорується Git, ключ не виводиться. Після цього виконайте `node scripts/pagespeed.cjs`. Скрипт виведе реальні оцінки та п’ять зауважень, якщо API поверне результат аудиту.

## DNS власного домену

Спочатку додайте реальний домен у Pages → Custom domain (і конфіг), потім DNS:

| Тип | Ім’я | Значення |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | tishinatyt.github.io |

Увімкніть Enforce HTTPS після випуску сертифіката. Джерело: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site.

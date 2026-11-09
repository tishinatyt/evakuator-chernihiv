# Заявки: Supabase → Telegram

Проєкт `pqasdmiqnlyyjwmmqeyc`. Endpoint: `https://pqasdmiqnlyyjwmmqeyc.supabase.co/functions/v1/tow-lead`.

## Межі доступу

Таблицю `public.tow_leads` створив власник вручну. RLS увімкнено, політик немає. Функція використовує вбудовані `SUPABASE_URL` та `SUPABASE_SERVICE_ROLE_KEY` лише на сервері. Читає/додає/оновлює виключно `tow_leads`. Існуючі таблиці й функції іншого застосунку не змінювати.

**Механізм міграцій у цьому репозиторії не використовувати:** не виконувати migration pull/fetch/repair, db push чи db pull; не експортувати чужу схему. `.temp`, `.branches`, migrations, schemas, seed, roles та дампи виключені з Git. Локальна прив’язка залишається приватною.

## Деплой тільки функції

```powershell
node build.js
npx supabase functions deploy tow-lead --remote=pqasdmiqnlyyjwmmqeyc --no-verify-jwt --use-api --yes
```

Команда перевірена на CLI 3.0.0. Не використовувати `--prune` або деплой усіх функцій. На цьому Windows для CLI потрібен `NODE_EXTRA_CA_CERTS` із публічними кореневими сертифікатами Windows (`qa/windows-ca.pem`, не публікується). TLS-перевірку не вимикати.

`TELEGRAM_BOT_TOKEN` установлений власником, `TELEGRAM_CHAT_ID` налаштований. Не виводити значення секретів, не копіювати їх у frontend або Git.

## Поведінка

POST приймає валідований телефон і `privacy: true`. Honeypot `website` дає тихий `{ok:true}` без запису в базу чи Telegram. Поля форми зберігаються у `tow_leads`; UTM відокремлюються від gclid. Спочатку INSERT, потім Telegram, після підтвердженої доставки — PATCH `tg_sent=true` лише за ID створеної заявки. Помилка збереження повертає 503. Після успішного збереження відповідь завжди `{ok:true}`, навіть якщо Telegram не працює. Записи з `tg_sent=false` потрібно перевіряти вручну: автоматичного повторного надсилання немає. Якщо Telegram доставив повідомлення, але PATCH не вдався, прапорець може залишитися false.

GET `?ping=1` виконує лише `SELECT id LIMIT 1` через REST; повертає `{ok:true}` без вмісту таблиці й без Telegram. При недоступній базі — 503. Origin не потрібен для cron; сторонній Origin відхиляється. CORS: основний домен, www, tishinatyt.github.io і HTTP localhost/loopback. Ліміт POST — 5 запитів за 10 хвилин на IP одного теплого ізоляту, не глобальний. CORS не є захистом від прямого спаму.

## Перевірка й keepalive

`node scripts/test-function.mjs` перевіряє mock-сценарії збереження, Telegram, RLS-доступу через серверний ключ, помилок і ping; без реальних повідомлень.

`powershell -File scripts/test-live-function.ps1` надсилає одну реальну заявку «ТЕСТ», перевіряє телефон/honeypot/CORS/ping, зберігає маркер у `qa/live-test.json`. Окремий read-only запит до `tow_leads` потрібен для підтвердження одного рядка і `tg_sent=true`.

`.github/workflows/keepalive.yml`: щодня о 07:17 UTC та вручну через workflow_dispatch. Виконує GET ping; будь-який статус, крім 200, або `ok` не true завершує job помилкою. Секрети workflow не потрібні. Плановий запуск залежить від доступності GitHub Actions.

Оператор має видаляти непотрібні заявки і Telegram-повідомлення згідно з політикою (до 90 днів); автоматичне видалення не налаштоване. Повторний POST після мережевого таймауту може створити дублікат, тому frontend чекає до 30 секунд.

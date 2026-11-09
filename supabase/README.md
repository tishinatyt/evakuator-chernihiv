# Заявки → Telegram

Потрібні Supabase CLI та проєкт у Supabase. Виконуйте з кореня репозиторію. Команди відповідають офіційній документації; локальна перевірка help не завершилася через аварійне завершення CLI 2.108.0 на цьому Windows. Для CLI v3 перевірте help: хмарні зміни можуть запитувати підтвердження, а старий прапорець project-ref позначений застарілим. Виконуйте інтерактивно й перевіряйте назву цільового проєкту:

```powershell
supabase --help
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy --help
supabase secrets set --help
supabase secrets set TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN" TELEGRAM_CHAT_ID="YOUR_CHAT_ID" --project-ref YOUR_PROJECT_REF
node build.js
supabase functions deploy tow-lead --no-verify-jwt --project-ref YOUR_PROJECT_REF
```

Створіть бота через @BotFather, почніть діалог або додайте його до приватної групи. Отримайте chat ID з Telegram getUpdates. Не додавайте токен до репозиторію чи фронтенду. Щоб токен не потрапляв в історію shell, використовуйте `.env.telegram` (ігнорується git) та `supabase secrets set --env-file .env.telegram --project-ref YOUR_PROJECT_REF`.

У `js/config.js` змініть `supabaseFunctionUrl` на `https://YOUR_PROJECT_REF.supabase.co/functions/v1/tow-lead`, виконайте `node build.js`, закомітьте й опублікуйте. Після зміни `siteUrl` повторіть build і deploy функції: дозволений origin генерується в `site-config.ts`. Дозволені лише цей origin та HTTP localhost/127.0.0.1/IPv6 loopback. Origin не містить шлях, тому GitHub Pages не розрізняє репозиторії одного користувача.

## Перевірка

Надішліть тестову заявку з сайту, перевірте повідомлення у правильному Telegram-чаті, номер, маршрут, калькулятор і час. Повторіть з UTM/gclid після згоди на cookies. Без згоди рекламні мітки не зберігаються. Видаліть тестові повідомлення після перевірки. Функція повертає успіх лише після підтвердження Telegram API (крім honeypot, який тихо відсікається). Помилка Telegram повертає 502.

Ліміт — 5 POST-запитів за 10 хвилин на IP у межах теплого ізоляту. Він не глобальний і скидається при перезапуску; CORS не захищає від прямих бот-запитів. За значного спаму додайте спільний лічильник або CAPTCHA. Тіло обмежене 16 KiB, поля валідовані, HTML екранується. Дані заявок не логуються. Повторне ручне надсилання після таймауту потенційно може створити дублікат.

Таблиці, anon та service_role ключі не потрібні. Оператор має обмежити доступ до Telegram-чату та видаляти непотрібні заявки не пізніше 90 днів, як описано в політиці; автоматичне видалення не реалізоване.

Документація: https://supabase.com/docs/guides/functions/deploy та https://supabase.com/docs/guides/functions/secrets.

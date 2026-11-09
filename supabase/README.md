# Заявки → Telegram

Проєкт: `ajvgaxevtjsfmtrmmvgr`. Команди перевірені через help Supabase CLI 3.0.0. Виконуйте з кореня репозиторію. Проєкт має бути активним: помилка `ProjectPausedError` потребує Restore project у Supabase Dashboard.

```powershell
npx supabase login
npx supabase link --project-ref ajvgaxevtjsfmtrmmvgr
node build.js
npx supabase functions deploy tow-lead --no-verify-jwt --use-api --yes
```

Секрети `TELEGRAM_BOT_TOKEN` та `TELEGRAM_CHAT_ID` вже встановлені власником проєкту. Не додавайте їх до репозиторію чи фронтенду. Якщо потрібно змінити їх, перевірте `npx supabase secrets set --help` для поточної версії CLI та використовуйте локальний `.env.telegram` (ігнорується git). Для цього Windows CLI потребував `NODE_EXTRA_CA_CERTS`, що вказує на PEM-пакет публічних кореневих сертифікатів Windows у `qa/windows-ca.pem`; він не публікується. Перевірку TLS не вимикати.

У `js/config.js` встановлено URL `https://ajvgaxevtjsfmtrmmvgr.supabase.co/functions/v1/tow-lead`. Після зміни `siteUrl` повторіть build і deploy функції: список CORS генерується в `site-config.ts`. Дозволені `https://evakuator-che.online`, `https://www.evakuator-che.online`, `https://tishinatyt.github.io`, а також HTTP localhost/127.0.0.1/IPv6 loopback. Origin не містить шлях, тому GitHub Pages не розрізняє репозиторії одного користувача.

## Перевірка

`powershell -File scripts/test-live-function.ps1` надсилає одну реальну тестову заявку «ТЕСТ» з телефоном `+380000000000` через Invoke-RestMethod, перевіряє відсутній телефон (400), honeypot (тихий успіх) і CORS preflight для всіх адрес. Запускайте лише коли потрібне тестове повідомлення в Telegram. `node scripts/test-function.mjs` перевіряє без реальних повідомлень, зокрема доводить, що honeypot не викликає Telegram API.

Надішліть тестову заявку з сайту, перевірте повідомлення у правильному Telegram-чаті, номер, маршрут, калькулятор і час. Повторіть з UTM/gclid після згоди на cookies. Без згоди рекламні мітки не зберігаються. Видаліть тестові повідомлення після перевірки. Функція повертає успіх лише після підтвердження Telegram API (крім honeypot, який тихо відсікається). Помилка Telegram повертає 502.

Ліміт — 5 POST-запитів за 10 хвилин на IP у межах теплого ізоляту. Він не глобальний і скидається при перезапуску; CORS не захищає від прямих бот-запитів. За значного спаму додайте спільний лічильник або CAPTCHA. Тіло обмежене 16 KiB, поля валідовані, HTML екранується. Дані заявок не логуються. Повторне ручне надсилання після таймауту потенційно може створити дублікат.

Таблиці, anon та service_role ключі не потрібні. Оператор має обмежити доступ до Telegram-чату та видаляти непотрібні заявки не пізніше 90 днів, як описано в політиці; автоматичне видалення не реалізоване.

Документація: https://supabase.com/docs/guides/functions/deploy та https://supabase.com/docs/guides/functions/secrets.

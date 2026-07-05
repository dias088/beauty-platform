# Чек-лист деплоя Beauty Platform

## Перед деплоем

- [ ] `npm run build` — собирается без ошибок
- [ ] `npm run lint` — нет ошибок
- [ ] `npm run type-check` — TypeScript OK
- [ ] Все env переменные заполнены (см. `.env.production.example`)

## Функциональность

- [ ] Авторизация (логин / регистрация) работает
- [ ] Мастер может создать и заполнить профиль
- [ ] Клиент может найти мастера на главной + на карте
- [ ] Клиент может записаться (booking flow)
- [ ] Мастер видит запись в `/dashboard/master`
- [ ] Клиент видит запись в `/dashboard/client`
- [ ] Мастер может подтвердить / завершить / отменить запись
- [ ] Клиент может отменить запись (за 24ч)
- [ ] Отзывы сохраняются и отображаются
- [ ] Beauty Score рассчитывается (триггеры БД)

## SEO & Performance

- [ ] `/sitemap.xml` генерируется
- [ ] `/robots.txt` работает
- [ ] OG Image загружена в `public/og-image.png`
- [ ] Метаданные правильные (Open Graph, Twitter Card)
- [ ] Lighthouse >= 90 (Performance, SEO, Best Practices)

## Email уведомления

- [ ] `RESEND_API_KEY` добавлен в Vercel
- [ ] Домен верифицирован в Resend (или используется `onboarding@resend.dev` для тестов)
- [ ] `booking_created` → клиент и мастер получают письма
- [ ] `booking_confirmed` → клиент получает письмо
- [ ] Cron напоминания работают

## Production деплой

- [ ] GitHub репо создан: `git init && git push`
- [ ] Vercel проект создан и подключён к репо
- [ ] Env переменные добавлены в Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`
  - `NEXT_PUBLIC_YANDEX_MAPS_KEY`
  - `NEXT_PUBLIC_APP_URL`
  - `CRON_SECRET`
- [ ] Домен настроен (DNS → Vercel)
- [ ] SSL активен
- [ ] Supabase: добавить домен в Auth → URL Configuration

## Smoke тест после деплоя

- [ ] Открыть сайт с мобильного
- [ ] Создать аккаунт клиента
- [ ] Записаться к мастеру
- [ ] Получить email-подтверждение
- [ ] Войти как мастер и подтвердить запись
- [ ] Получить email клиенту
- [ ] Оставить отзыв
- [ ] Проверить Beauty Score

## Быстрый деплой на Vercel

```bash
# 1. Push в GitHub
git add .
git commit -m "🚀 Production ready"
git push origin main

# 2. Импорт в Vercel
# → vercel.com/new → выбери репо → добавь env → Deploy

# 3. После деплоя проверь
# → https://beauty-platform.kz/sitemap.xml
# → https://beauty-platform.kz/robots.txt
```

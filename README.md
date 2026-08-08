# 🎁 TG NFT Gift Generator

Telegram Mini App для генерации и минта NFT в стиле Telegram Gifts.
Подключается к TON через TonConnect, генерирует уникальное изображение на клиенте
и минтит его в вашу коллекцию на GetGems через **Getgems Minting API**.

## ✨ Функции

- 🔗 Подключение кошелька через TonConnect
- 🎨 Генерация уникальной картинки (процедурная графика на canvas — работает без ключей от AI, легко заменить на вызов своей AI-модели)
- 🌍 Двуязычный интерфейс (EN / RU)
- 💎 Минт напрямую в вашу коллекцию через Getgems Minting API
- 📱 Полная адаптация под Telegram WebApp

## 🏗️ Структура проекта

```text
tg-nft-gifts/
├── backend/          # Express API: хостит сгенерированную картинку + вызывает Getgems Minting API
├── frontend/         # React + Vite + Tailwind Mini App
└── contract/         # НЕ используется — минт идёт через Getgems API, а не через этот контракт
```

## ⚠️ Важно про `contract/nft_gift.tact`

Этот контракт **не задействован** в текущей схеме. Минт выполняется через
Getgems Minting API на уже существующую коллекцию (GetGems сам создаёт и
отправляет ончейн-транзакции). Файл оставлен только как справочный пример —
деплоить его не нужно.

## 🚀 Деплой на Railway

### Бэкенд (`backend/`)

| Переменная | Описание | Пример |
|------------|----------|--------|
| `SECRET_KEY` | Зарезервировано на будущее (подпись запросов) | `random_string_123` |
| `BASE_URL` | Публичный домен бэкенда (см. ниже) | `https://api-xxx.up.railway.app` |
| `PORT` | Порт сервера | `3000` |
| `GETGEMS_API_KEY` | Ключ Getgems Minting API (получить у Getgems как владелец коллекции) | `...` |
| `GETGEMS_API_HOST` | `https://api.getgems.io` (mainnet) или `https://api.testnet.getgems.io` (testnet) | |
| `NFT_COLLECTION_ADDRESS` | Адрес вашей коллекции | `EQBN2g-7vXXanF0kbLcMDsGs-XvvGL3hi_629-fYvj3AxagS` |

**Start Command:** `npm start`

> Картинки сохраняются на диск бэкенда и отдаются по `BASE_URL/images/...`.
> На Railway файловая система эфемерна (сбрасывается при редеплое) — это ок,
> т.к. Getgems скачивает картинку один раз, в момент минта, и сам её закрепляет.
> Если нужна постоянная история картинок — подключите Railway Volume к
> `backend/generated-images` (как в проекте FlagMint).

### Фронтенд (`frontend/`)

| Переменная | Описание | Пример |
|------------|----------|--------|
| `VITE_BACKEND_URL` | URL бэкенда | `https://api-xxx.up.railway.app` |
| `VITE_COLLECTION_ADDRESS` | Адрес NFT коллекции в TON (для ссылки на страницу коллекции) | `EQ...` |
| `PORT` | Порт превью-сервера | `8080` |

**Build Command:** `npm run build`
**Start Command:** `npm run preview`

> ⚠️ После первого деплоя бэкенда сгенерируйте домен в Railway → Networking →
> Generate Domain и пропишите его в `BASE_URL` (бэкенд) и `VITE_BACKEND_URL`
> (фронтенд).

## 📄 tonconnect-manifest.json

Файл лежит в `frontend/public/tonconnect-manifest.json` — он должен быть на
том же домене, что и сам фронтенд (в `main.tsx` URL манифеста уже вычисляется
автоматически как `window.location.origin + '/tonconnect-manifest.json'`,
менять код не нужно). После деплоя фронтенда замените в самом JSON-файле
`url` и `iconUrl` на реальный домен Railway.

## 🤖 Подключение к Telegram

1. @BotFather → `/newapp`
2. Web App URL = домен фронтенда из Railway
3. Готово: `t.me/your_bot/appname`

## 🛠️ Стек

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS
- **Blockchain:** TON Connect, Getgems Minting API
- **Backend:** Node.js 18+, Express
- **Hosting:** Railway
- **i18n:** i18next (EN/RU)

## 📝 Лицензия

MIT

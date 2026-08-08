# 🎁 TG NFT Gift Generator

Telegram Mini App для генерации и минта NFT в стиле Telegram Gifts.
Подключается к TON, генерирует уникальные метаданные и отображает NFT в GetGems.

## ✨ Функции

- 🔗 Подключение кошелька через TonConnect
- 🎨 Генерация уникальных NFT с glassmorphism-дизайном
- 🌍 Двуязычный интерфейс (EN / RU)
- 👥 Реферальная система через deep links
- 💎 Автоматическое отображение в GetGems
- 📱 Полная адаптация под Telegram WebApp

## 🏗️ Структура проекта

```text
tg-nft-gifts/
├── backend/          # Express API для генерации метаданных
├── frontend/         # React + Vite + Tailwind Mini App
└── contract/         # Tact смарт-контракт NFT коллекции
```

## 🚀 Деплой на Railway

### Бэкенд (`backend/`)

| Переменная | Описание | Пример |
|------------|----------|--------|
| `SECRET_KEY` | Ключ для подписи метаданных | `random_string_123` |
| `BASE_URL` | Публичный домен бэкенда | `https://api-xxx.up.railway.app` |
| `PORT` | Порт сервера | `3000` |

**Start Command:** `npm start`

### Фронтенд (`frontend/`)

| Переменная | Описание | Пример |
|------------|----------|--------|
| `VITE_BACKEND_URL` | URL бэкенда | `https://api-xxx.up.railway.app` |
| `VITE_COLLECTION_ADDRESS` | Адрес NFT коллекции в TON | `EQ...` |
| `PORT` | Порт превью-сервера | `8080` |

**Build Command:** `npm run build`
**Start Command:** `npm run preview`

> ⚠️ После первого деплоя бэкенда обязательно сгенерируйте домен в Railway → Networking → Generate Domain и пропишите его в `BASE_URL` и `VITE_BACKEND_URL`.

## 📄 tonconnect-manifest.json

Файл находится в `frontend/public/tonconnect-manifest.json`.
После деплоя фронтенда замените `url` и `iconUrl` на реальный домен Railway.

## 🔗 Смарт-контракт

Контракт написан на **Tact**. Для деплоя используйте:
- [Blueprint CLI](https://github.com/ton-community/blueprint)
- [Tact IDE](https://ide.ton.org)
- [minter.ton.org](https://minter.ton.org) (для стандартных коллекций)

После деплоя вставьте адрес коллекции в переменную `VITE_COLLECTION_ADDRESS`.

## 🤖 Подключение к Telegram

1. @BotFather → `/newapp`
2. Web App URL = домен фронтенда из Railway
3. Готово: `t.me/your_bot/appname`

## 🛠️ Стек

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, Framer Motion
- **Blockchain:** TON Connect, Tact, TEP-62/64
- **Backend:** Node.js, Express
- **Hosting:** Railway
- **i18n:** i18next (EN/RU)

## 📝 Лицензия

MIT

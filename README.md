# Prokat63Bot

Telegram-бот для аренды инструментов.

## Структура

```
prokat63bot/
├── src/
│   ├── config.js
│   ├── data/
│   │   └── tools.js
│   ├── menus.js
│   ├── server.js
│   ├── bot.js
│   ├── commands/
│   │   ├── start.js
│   │   ├── menu.js
│   │   ├── instruments.js
│   │   ├── rental.js
│   │   ├── history.js
│   │   └── misc.js
│   └── utils/
│       ├── date.js
│       └── storage.js
├── index.js
├── package.json
└── .env.example
```

## Установка и запуск

1. `npm install`
2. Создать `.env` на основе `.env.example`
3. `npm start`

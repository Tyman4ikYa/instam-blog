# 📸 InstAm — Блог

Полноценное фулстек-приложение: блог с авторизацией, постами, комментариями и лайками.

## 🛠 Стек технологий

**Бэкенд:**
- Node.js + Express
- SQLite (sql.js)
- JWT для авторизации
- bcrypt для хеширования паролей

**Фронтенд:**
- React + Vite
- React Router (роутинг)
- Axios (запросы к API)
- Bootstrap (стили)

## 📁 Структура проекта
blog-project/
├── server/ # Бэкенд (Express + SQLite)
│ ├── src/
│ │ ├── index.ts # Точка входа
│ │ ├── db.ts # БД + таблицы
│ │ ├── auth.ts # JWT + bcrypt
│ │ ├── middleware/ # Проверка токена
│ │ └── routes/ # API роуты
│ └── package.json
│
└── client/ # Фронтенд (React)
├── src/
│ ├── pages/ # Страницы
│ ├── components/ # Компоненты
│ ├── context/ # AuthContext
│ └── api/ # Axios настройки
└── package.json

## 🚀 Установка и запуск

### 1. Клонировать репозиторий
```bash
git clone <ссылка-на-репо>
cd blog-project

2. Запустить бэкенд

cd server
npm install
npm run dev

Сервер запустится на http://localhost:4000


3. Запустить фронтенд
Открой второй терминал:

cd client
npm install
npm run dev

Фронтенд откроется на http://localhost:5173



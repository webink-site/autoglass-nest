# 🚗 Autoglass - Backend API

NestJS REST API для веб-сайта автостекла с админ-панелью и интеграцией с фронтендом на Nuxt.js.

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Установка зависимостей
npm install

# Настройка базы данных
docker compose up -d postgres
npx prisma migrate dev
npx prisma db seed

# Запуск в режиме разработки
npm run start:dev
```

API будет доступен по адресу: http://localhost:3001

### Production развертывание

Полная инструкция по развертыванию в файле [DEPLOYMENT.md](./DEPLOYMENT.md)

Быстрый деплой:
```bash
# 1. Настройте VPS сервер
./scripts/init-server.sh

# 2. Настройте GitHub Secrets
# 3. Push в main ветку - автоматический деплой через GitHub Actions
```

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nuxt.js       │───▶│   Nginx         │───▶│   NestJS API    │
│   Frontend      │    │   Reverse Proxy │    │   (Port 3001)   │
│                 │    │   SSL/HTTPS     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                         │
                       ┌─────────────────┐              │
                       │   Redis         │◀─────────────┤
                       │   (Кеширование) │              │
                       └─────────────────┘              │
                                                         │
                       ┌─────────────────┐              │
                       │   PostgreSQL    │◀─────────────┘
                       │   (База данных) │
                       └─────────────────┘
```

## 📁 Структура проекта

```
autoglass-nest/
├── src/                    # Исходный код
│   ├── globals/           # Глобальные настройки
│   ├── service/           # Модуль услуг
│   ├── wrap/              # Модуль оклейки
│   ├── gallery/           # Модуль галереи
│   ├── file/              # Модуль файлов
│   ├── form/              # Модуль форм
│   └── prisma/            # Prisma ORM
├── prisma/                # Схема и миграции БД
├── scripts/               # Скрипты развертывания
├── nginx/                 # Конфигурация Nginx
├── .github/workflows/     # GitHub Actions CI/CD
├── docker-compose.yml     # Dev окружение
├── docker-compose.prod.yml # Production окружение
├── Dockerfile            # Docker образ
└── DEPLOYMENT.md         # Полная инструкция по деплою
```

## 🛠️ Основные команды

### Разработка
```bash
npm run start:dev          # Запуск с hot reload
npm run start:debug        # Запуск с debug
npm run build              # Сборка
npm run start:prod         # Запуск production
```

### База данных
```bash
npx prisma migrate dev     # Применить миграции
npx prisma db seed         # Заполнить тестовыми данными
npx prisma studio          # Веб-интерфейс БД
npx prisma generate        # Сгенерировать клиент
```

### Тестирование
```bash
npm run test               # Unit тесты
npm run test:e2e           # E2E тесты
npm run test:cov           # Покрытие кода
```

### Docker
```bash
# Development
docker compose up -d

# Production
docker compose -f docker-compose.prod.yml up -d
```

## 🔧 API Endpoints

### Основные эндпоинты:
- `GET /health` - Проверка состояния API
- `GET /api/globals` - Глобальные настройки
- `GET /api/services` - Список услуг
- `GET /api/services/:id` - Детали услуги
- `GET /api/wrap/elements` - Элементы оклейки
- `GET /api/gallery` - Галерея изображений
- `POST /api/files/upload` - Загрузка файлов

### Документация API:
API документация будет доступна по адресу `/api/docs` (Swagger) после запуска приложения.

## 🌟 Основные функции

### ✅ Реализовано:
- REST API с валидацией данных
- Загрузка и обработка изображений/видео
- База данных PostgreSQL с Prisma ORM
- Docker контейнеризация
- CI/CD через GitHub Actions
- Nginx reverse proxy с SSL
- Health checks и мониторинг
- Автоматическое резервное копирование

### 🚧 В планах:
- WebSocket для real-time уведомлений
- Интеграция с Telegram Bot
- Email уведомления
- Админ-панель
- Интеграция с CRM системами

## 📊 Мониторинг

```bash
# Статус сервисов
./scripts/deploy.sh status

# Логи API
./scripts/deploy.sh logs api

# Логи Nginx
./scripts/deploy.sh logs nginx

# Системная статистика
/usr/local/bin/server-stats.sh
```

## 🔐 Безопасность

- JWT токены для аутентификации
- Rate limiting на API и auth эндпоинты
- CORS настройки
- Валидация всех входных данных
- Файрвол и Fail2Ban на сервере
- SSL/TLS шифрование
- Docker security best practices

## 📝 Переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения:

```bash
cp .env.example .env
nano .env
```

Основные переменные:
- `DATABASE_URL` - Строка подключения к PostgreSQL
- `JWT_SECRET` - Секретный ключ для JWT (мин. 32 символа)
- `REDIS_PASSWORD` - Пароль Redis
- `NODE_ENV` - Окружение (development/production)

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature ветку (`git checkout -b feature/amazing-feature`)
3. Commit изменений (`git commit -m 'Add amazing feature'`)
4. Push в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект использует лицензию MIT. Подробности в файле [LICENSE](LICENSE).

## 📞 Поддержка

При возникновении проблем:

1. Проверьте [DEPLOYMENT.md](./DEPLOYMENT.md) для детальных инструкций
2. Изучите логи: `./scripts/deploy.sh logs`
3. Создайте Issue в GitHub репозитории

---

**Команда разработки Autoglass** ⭐

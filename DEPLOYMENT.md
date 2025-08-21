# 🚀 Руководство по развертыванию Autoglass

Полная инструкция по развертыванию NestJS API + Nuxt.js фронтенда на VPS с PostgreSQL, Redis и Nginx.

## 📋 Содержание

- [Требования](#требования)
- [Подготовка VPS](#подготовка-vps)
- [Настройка домена](#настройка-домена)
- [Настройка GitHub Actions](#настройка-github-actions)
- [Первый деплой](#первый-деплой)
- [Мониторинг и обслуживание](#мониторинг-и-обслуживание)
- [Устранение неполадок](#устранение-неполадок)

## 🔧 Требования

### Минимальные требования к VPS:
- **CPU**: 2 vCore
- **RAM**: 4 GB
- **Диск**: 40 GB SSD
- **ОС**: Ubuntu 20.04/22.04 LTS
- **Сеть**: 1 Gbps

### Рекомендуемые требования:
- **CPU**: 4 vCore  
- **RAM**: 8 GB
- **Диск**: 80 GB SSD

### Необходимые сервисы:
- Домен с возможностью настройки DNS
- VPS с публичным IP
- GitHub репозиторий
- Email для SSL сертификата

## 🖥️ Подготовка VPS

### 1. Подключение к серверу

```bash
# Подключитесь к серверу по SSH
ssh root@YOUR_SERVER_IP

# Создайте нового пользователя (рекомендуется)
adduser deploy
usermod -aG sudo deploy

# Настройте SSH ключ для нового пользователя
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Переключитесь на нового пользователя
su - deploy
```

### 2. Запуск инициализации сервера

```bash
# Скачайте скрипт инициализации
wget https://raw.githubusercontent.com/YOUR_USERNAME/autoglass-nest/main/scripts/init-server.sh
chmod +x init-server.sh

# Запустите инициализацию
./init-server.sh

# После завершения перезагрузите сервер
sudo reboot
```

### 3. Проверка установки

После перезагрузки проверьте, что все сервисы работают:

```bash
# Проверка Docker
docker --version
docker compose version

# Проверка файрвола
sudo ufw status

# Проверка Fail2Ban
sudo systemctl status fail2ban
```

## 🌐 Настройка домена

### 1. DNS записи

В панели управления вашим доменом создайте следующие записи:

```
Тип    Имя              Значение           TTL
A      @                YOUR_SERVER_IP     300
A      www              YOUR_SERVER_IP     300
AAAA   @                YOUR_SERVER_IPv6   300  (если есть IPv6)
AAAA   www              YOUR_SERVER_IPv6   300  (если есть IPv6)
```

### 2. Проверка DNS

```bash
# Проверьте, что домен резолвится правильно
nslookup your-domain.com
ping your-domain.com
```

### 3. Получение SSL сертификата

```bash
# Сначала убедитесь, что Nginx остановлен
sudo systemctl stop nginx

# Получите SSL сертификат
sudo certbot --standalone -d your-domain.com -d www.your-domain.com --email admin@your-domain.com --agree-tos --non-interactive

# Или используйте webroot метод (если Nginx уже запущен)
sudo certbot --webroot -w /var/www/certbot -d your-domain.com -d www.your-domain.com
```

## 🔧 Настройка GitHub Actions

### 1. Генерация SSH ключа для деплоя

На вашем локальном компьютере:

```bash
# Генерируйте новый SSH ключ
ssh-keygen -t ed25519 -C "deploy@your-domain.com" -f ~/.ssh/autoglass_deploy

# Скопируйте публичный ключ на сервер
ssh-copy-id -i ~/.ssh/autoglass_deploy.pub deploy@YOUR_SERVER_IP

# Выведите приватный ключ (понадобится для GitHub Secrets)
cat ~/.ssh/autoglass_deploy
```

### 2. Настройка GitHub Secrets

В репозитории GitHub перейдите в Settings → Secrets and variables → Actions и добавьте:

```
Название              Значение
VPS_HOST             YOUR_SERVER_IP или your-domain.com
VPS_USER             deploy
SSH_PRIVATE_KEY      (содержимое ~/.ssh/autoglass_deploy)
POSTGRES_DB          aglass
POSTGRES_USER        postgres
POSTGRES_PASSWORD    ваш_безопасный_пароль
JWT_SECRET           случайная_строка_32+_символов
REDIS_PASSWORD       ваш_redis_пароль
```

### 3. Генерация безопасных паролей

```bash
# JWT Secret (32+ символов)
openssl rand -base64 32

# Пароли для БД и Redis
openssl rand -base64 24
```

### 4. Настройка окружений GitHub

В Settings → Environments создайте окружение `production` с защитой main ветки.

## 🚀 Первый деплой

### 1. Подготовка серверной директории

На сервере:

```bash
# Создайте рабочую директорию
mkdir -p ~/autoglass
cd ~/autoglass

# Создайте файл с переменными окружения
cp .env.example .env.prod
nano .env.prod  # Отредактируйте переменные
```

### 2. Ручной деплой (для тестирования)

```bash
# Склонируйте репозиторий на сервер
git clone https://github.com/YOUR_USERNAME/autoglass-nest.git temp
cp temp/docker-compose.prod.yml ~/autoglass/
cp -r temp/nginx ~/autoglass/
rm -rf temp

# Отредактируйте конфигурацию Nginx
nano ~/autoglass/nginx/sites-available/autoglass.conf
# Замените your-domain.com на ваш реальный домен

# Запустите приложение
cd ~/autoglass
./scripts/deploy.sh
```

### 3. Автоматический деплой через GitHub Actions

```bash
# На локальном компьютере сделайте коммит в main ветку
git add .
git commit -m "feat: setup production deployment"
git push origin main
```

GitHub Actions автоматически:
1. Запустит тесты
2. Соберет Docker образ
3. Развернет на сервер
4. Проверит здоровье сервисов

## 📊 Мониторинг и обслуживание

### 1. Проверка статуса сервисов

```bash
# Статус всех контейнеров
cd ~/autoglass
docker compose -f docker-compose.prod.yml ps

# Логи конкретного сервиса
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f nginx

# Статистика ресурсов
./scripts/deploy.sh status

# Системная статистика
/usr/local/bin/server-stats.sh
```

### 2. Резервное копирование

```bash
# Создание резервной копии БД
./scripts/deploy.sh backup

# Настройка автоматического бэкапа (cron)
crontab -e
# Добавьте:
# 0 2 * * * /home/deploy/autoglass/scripts/deploy.sh backup

# Резервная копия файлов
tar -czf backup_$(date +%Y%m%d).tar.gz uploads/ logs/
```

### 3. Обновление SSL сертификатов

```bash
# Автообновление Let's Encrypt (уже настроено)
sudo systemctl status certbot.timer

# Ручное обновление
sudo certbot renew --dry-run
sudo certbot renew
```

### 4. Логирование и мониторинг

```bash
# Просмотр логов системы
sudo journalctl -u docker
tail -f ~/autoglass/logs/nginx/access.log

# Мониторинг дискового пространства
df -h

# Мониторинг памяти
free -h
htop
```

## 🔧 Обслуживание фронтенда

### 1. Деплой Nuxt.js фронтенда

```bash
# В репозитории фронтенда создайте похожий GitHub Action
# Который будет билдить статические файлы и копировать в ~/autoglass/frontend/dist/

# Пример структуры:
~/autoglass/
├── frontend/
│   └── dist/          # Сборка Nuxt.js приложения
│       ├── index.html
│       ├── _nuxt/
│       └── ...
```

### 2. Обновление фронтенда

```bash
# Если фронтенд в отдельном репозитории
cd ~/frontend-repo
npm run build
rsync -av dist/ deploy@your-server:/home/deploy/autoglass/frontend/dist/

# Nginx автоматически будет отдавать обновленные файлы
```

## 🐛 Устранение неполадок

### Проблемы с запуском

```bash
# Контейнер не запускается
docker compose -f docker-compose.prod.yml logs api

# Проблемы с базой данных
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d aglass

# Проблемы с Nginx
docker compose -f docker-compose.prod.yml exec nginx nginx -t
sudo nginx -t
```

### Проблемы с SSL

```bash
# Проверка сертификата
sudo certbot certificates
openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -text -noout

# Перевыпуск сертификата
sudo certbot --force-renewal -d your-domain.com
```

### Проблемы с GitHub Actions

1. Проверьте все secrets в репозитории
2. Убедитесь, что SSH ключ корректный
3. Проверьте логи workflow в GitHub
4. Проверьте права доступа к файлам на сервере

### Восстановление после сбоя

```bash
# Откат к предыдущей версии
cd ~/autoglass
./scripts/deploy.sh rollback

# Восстановление из резервной копии
./scripts/deploy.sh backup  # Создать текущий бэкап
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d aglass < backups/db_backup_YYYYMMDD_HHMMSS.sql
```

## 📈 Оптимизация производительности

### 1. Настройка кеширования

```bash
# Nginx кеширование (уже настроено в конфиге)
# Redis для API кеширования
# PostgreSQL настройки в docker-compose

# Мониторинг производительности
docker stats
htop
```

### 2. Масштабирование

```bash
# Горизонтальное масштабирование API
# В docker-compose.prod.yml можно добавить:
# deploy:
#   replicas: 3

# Вертикальное масштабирование
# Увеличить ресурсы VPS
```

## 🔐 Безопасность

### Регулярные обновления

```bash
# Обновление системы (раз в неделю)
sudo apt update && sudo apt upgrade -y

# Обновление Docker образов
cd ~/autoglass
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Проверка безопасности
sudo fail2ban-client status
sudo ufw status
```

### Мониторинг безопасности

```bash
# Проверка логов атак
sudo tail -f /var/log/fail2ban.log
sudo tail -f /var/log/auth.log

# Мониторинг сетевых подключений
sudo netstat -tulpn
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `./scripts/deploy.sh logs`
2. Проверьте статус: `./scripts/deploy.sh status`
3. Перезапустите сервисы: `./scripts/deploy.sh restart`
4. В крайнем случае: `./scripts/deploy.sh rollback`

---

## Чек-лист развертывания

- [ ] VPS настроен и доступен по SSH
- [ ] Домен указывает на сервер
- [ ] SSL сертификат получен
- [ ] GitHub Secrets настроены
- [ ] Переменные окружения заполнены
- [ ] Первый деплой выполнен успешно
- [ ] API доступен по https://your-domain.com/api
- [ ] Фронтенд доступен по https://your-domain.com
- [ ] Мониторинг настроен
- [ ] Резервное копирование настроено

**Поздравляем! 🎉 Ваше приложение Autoglass успешно развернуто!**

#!/bin/bash

# Autoglass Manual Deployment Script
# Скрипт для ручного развертывания приложения на сервере

set -euo pipefail

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Конфигурация
PROJECT_DIR="$HOME/autoglass"
BACKUP_DIR="$PROJECT_DIR/backups"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

# Функции логирования
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Проверка зависимостей
check_dependencies() {
    log_info "Проверка зависимостей..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен!"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose не доступен!"
        exit 1
    fi
    
    log_success "Зависимости проверены"
}

# Создание резервной копии базы данных
backup_database() {
    log_info "Создание резервной копии базы данных..."
    
    local backup_file="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p "$BACKUP_DIR"
    
    if docker compose -f "$DOCKER_COMPOSE_FILE" ps postgres | grep -q "Up"; then
        docker compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_dump -U postgres aglass > "$backup_file"
        log_success "Резервная копия создана: $backup_file"
    else
        log_warning "PostgreSQL не запущен, пропускаем резервное копирование"
    fi
}

# Проверка конфигурации
check_config() {
    log_info "Проверка конфигурации..."
    
    if [ ! -f "$PROJECT_DIR/.env.prod" ]; then
        log_error "Файл .env.prod не найден!"
        log_info "Создайте файл с переменными окружения:"
        cat << 'EOF'
NODE_ENV=production
POSTGRES_DB=aglass
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
REDIS_PASSWORD=your_redis_password
EOF
        exit 1
    fi
    
    log_success "Конфигурация проверена"
}

# Остановка старых контейнеров
stop_containers() {
    log_info "Остановка текущих контейнеров..."
    
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        docker compose -f "$DOCKER_COMPOSE_FILE" down || true
    fi
    
    log_success "Контейнеры остановлены"
}

# Обновление образов
pull_images() {
    log_info "Обновление Docker образов..."
    
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        docker compose -f "$DOCKER_COMPOSE_FILE" pull
        log_success "Образы обновлены"
    else
        log_error "Файл $DOCKER_COMPOSE_FILE не найден!"
        exit 1
    fi
}

# Запуск контейнеров
start_containers() {
    log_info "Запуск контейнеров..."
    
    # Копируем .env.prod как .env для docker-compose
    cp "$PROJECT_DIR/.env.prod" "$PROJECT_DIR/.env"
    
    docker compose -f "$DOCKER_COMPOSE_FILE" up -d --remove-orphans
    
    log_success "Контейнеры запущены"
}

# Проверка здоровья сервисов
health_check() {
    log_info "Проверка состояния сервисов..."
    
    # Ждем запуска сервисов
    sleep 30
    
    # Проверяем статус контейнеров
    log_info "Статус контейнеров:"
    docker compose -f "$DOCKER_COMPOSE_FILE" ps
    
    # Проверяем логи API
    log_info "Последние логи API:"
    docker compose -f "$DOCKER_COMPOSE_FILE" logs --tail=20 api
    
    # Проверяем доступность API
    if curl -f -s http://localhost:3001/health > /dev/null; then
        log_success "API доступен"
    else
        log_error "API недоступен!"
        return 1
    fi
    
    # Проверяем Nginx
    if curl -f -s http://localhost/health > /dev/null; then
        log_success "Nginx работает корректно"
    else
        log_warning "Nginx может быть недоступен через внешний интерфейс"
    fi
}

# Очистка старых образов
cleanup() {
    log_info "Очистка неиспользуемых ресурсов..."
    
    docker system prune -f
    docker image prune -f
    
    log_success "Очистка завершена"
}

# Откат к предыдущей версии
rollback() {
    log_warning "Выполняется откат к предыдущей версии..."
    
    # Восстанавливаем из последней резервной копии
    local latest_backup=$(ls -t "$BACKUP_DIR"/db_backup_*.sql | head -n1)
    
    if [ -n "$latest_backup" ] && [ -f "$latest_backup" ]; then
        log_info "Восстанавливаем базу данных из: $latest_backup"
        docker compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U postgres -d aglass < "$latest_backup"
        log_success "База данных восстановлена"
    else
        log_warning "Резервная копия не найдена"
    fi
    
    # Перезапускаем сервисы
    docker compose -f "$DOCKER_COMPOSE_FILE" restart
}

# Показать логи
show_logs() {
    local service=${1:-"api"}
    local lines=${2:-50}
    
    log_info "Показываю последние $lines строк логов для $service:"
    docker compose -f "$DOCKER_COMPOSE_FILE" logs --tail="$lines" "$service"
}

# Показать статус
show_status() {
    log_info "Статус всех сервисов:"
    docker compose -f "$DOCKER_COMPOSE_FILE" ps
    
    echo ""
    log_info "Использование ресурсов:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
}

# Главная функция развертывания
deploy() {
    log_info "Начало развертывания Autoglass..."
    
    cd "$PROJECT_DIR"
    
    check_dependencies
    check_config
    backup_database
    stop_containers
    pull_images
    start_containers
    
    # Проверяем здоровье сервисов
    if health_check; then
        cleanup
        log_success "Развертывание успешно завершено!"
    else
        log_error "Развертывание не удалось!"
        log_warning "Выполняется автоматический откат..."
        rollback
        exit 1
    fi
}

# Обработка параметров командной строки
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "logs")
        show_logs "${2:-api}" "${3:-50}"
        ;;
    "status")
        show_status
        ;;
    "restart")
        log_info "Перезапуск сервисов..."
        docker compose -f "$DOCKER_COMPOSE_FILE" restart
        health_check
        ;;
    "stop")
        log_info "Остановка всех сервисов..."
        docker compose -f "$DOCKER_COMPOSE_FILE" down
        ;;
    "start")
        log_info "Запуск всех сервисов..."
        docker compose -f "$DOCKER_COMPOSE_FILE" up -d
        health_check
        ;;
    "backup")
        backup_database
        ;;
    *)
        echo "Использование: $0 {deploy|rollback|logs|status|restart|stop|start|backup}"
        echo ""
        echo "Команды:"
        echo "  deploy   - Полное развертывание (по умолчанию)"
        echo "  rollback - Откат к предыдущей версии"
        echo "  logs     - Показать логи сервиса"
        echo "  status   - Показать статус всех сервисов"
        echo "  restart  - Перезапустить все сервисы"
        echo "  stop     - Остановить все сервисы"
        echo "  start    - Запустить все сервисы"
        echo "  backup   - Создать резервную копию БД"
        echo ""
        echo "Примеры:"
        echo "  $0 logs api 100    - Показать 100 строк логов API"
        echo "  $0 logs nginx 50   - Показать 50 строк логов Nginx"
        exit 1
        ;;
esac

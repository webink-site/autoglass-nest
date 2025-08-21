#!/bin/bash

# Autoglass Server Initialization Script
# Этот скрипт настраивает Ubuntu VPS для развертывания приложения

set -euo pipefail

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для логирования
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка, что скрипт запущен как root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "Этот скрипт не должен запускаться от root!"
        log_info "Запустите: bash init-server.sh"
        exit 1
    fi
}

# Обновление системы
update_system() {
    log_info "Обновление системных пакетов..."
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y curl wget git htop nano ufw fail2ban
    log_success "Система обновлена"
}

# Настройка файрвола
setup_firewall() {
    log_info "Настройка UFW файрвола..."
    
    # Базовые правила
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Разрешаем SSH, HTTP, HTTPS
    sudo ufw allow ssh
    sudo ufw allow 80
    sudo ufw allow 443
    
    # Включаем файрвол
    sudo ufw --force enable
    
    log_success "Файрвол настроен"
}

# Настройка fail2ban
setup_fail2ban() {
    log_info "Настройка Fail2Ban..."
    
    sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
ignoreip = 127.0.0.1/8

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-dos]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 10
findtime = 60
bantime = 600
EOF

    sudo systemctl restart fail2ban
    sudo systemctl enable fail2ban
    
    log_success "Fail2Ban настроен"
}

# Установка Docker
install_docker() {
    log_info "Установка Docker..."
    
    # Удаляем старые версии
    sudo apt remove -y docker docker-engine docker.io containerd runc || true
    
    # Устанавливаем зависимости
    sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Добавляем GPG ключ Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Добавляем репозиторий
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Устанавливаем Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Добавляем пользователя в группу docker
    sudo usermod -aG docker $USER
    
    # Включаем автозапуск
    sudo systemctl enable docker
    sudo systemctl start docker
    
    log_success "Docker установлен"
}

# Настройка директорий проекта
setup_project_dirs() {
    log_info "Создание директорий проекта..."
    
    mkdir -p ~/autoglass/{logs/nginx,uploads,backups,frontend/dist,nginx/ssl}
    
    log_success "Директории созданы"
}

# Настройка SSL сертификата (Let's Encrypt)
setup_ssl() {
    log_info "Установка Certbot для SSL сертификатов..."
    
    sudo apt install -y snapd
    sudo snap install core; sudo snap refresh core
    sudo snap install --classic certbot
    sudo ln -sf /snap/bin/certbot /usr/bin/certbot
    
    log_success "Certbot установлен"
    log_warning "После настройки домена запустите: sudo certbot --nginx -d your-domain.com"
}

# Настройка мониторинга
setup_monitoring() {
    log_info "Настройка базового мониторинга..."
    
    # Создаем скрипт для мониторинга ресурсов
    sudo tee /usr/local/bin/server-stats.sh > /dev/null <<'EOF'
#!/bin/bash
echo "=== Статистика сервера $(date) ==="
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')%"
echo "RAM: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
echo "Disk: $(df -h / | awk 'NR==2{print $5}')"
echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
echo "Docker containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
EOF

    sudo chmod +x /usr/local/bin/server-stats.sh
    
    log_success "Мониторинг настроен"
}

# Создание пользователя для деплоя (если нужно)
setup_deploy_user() {
    if [ "$1" != "skip" ]; then
        log_info "Создание пользователя для деплоя..."
        read -p "Создать отдельного пользователя для деплоя? (y/N): " create_user
        
        if [[ $create_user =~ ^[Yy]$ ]]; then
            read -p "Имя пользователя для деплоя: " deploy_user
            sudo adduser $deploy_user
            sudo usermod -aG docker $deploy_user
            sudo usermod -aG sudo $deploy_user
            log_success "Пользователь $deploy_user создан"
        fi
    fi
}

# Главная функция
main() {
    log_info "Начало инициализации сервера для Autoglass..."
    
    check_root
    update_system
    setup_firewall
    setup_fail2ban
    install_docker
    setup_project_dirs
    setup_ssl
    setup_monitoring
    setup_deploy_user ${1:-""}
    
    log_success "Сервер успешно настроен!"
    log_info "Перезагрузите сервер: sudo reboot"
    log_warning "После перезагрузки:"
    log_warning "1. Настройте домен и DNS записи"
    log_warning "2. Получите SSL сертификат: sudo certbot --nginx -d your-domain.com"
    log_warning "3. Настройте GitHub Actions secrets"
    log_warning "4. Запустите первый деплой"
}

# Запуск
main "$@"

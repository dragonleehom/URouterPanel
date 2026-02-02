#!/bin/bash

#===========================================
# URouterOS Services Control Script
#===========================================

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "This script must be run as root"
    exit 1
fi

# Service names
BACKEND_SERVICE="urouteros-backend.service"
FRONTEND_SERVICE="urouteros-frontend.service"

# Function to show usage
show_usage() {
    echo "Usage: $0 {start|stop|restart|status|logs|enable|disable}"
    echo ""
    echo "Commands:"
    echo "  start    - Start both services"
    echo "  stop     - Stop both services"
    echo "  restart  - Restart both services"
    echo "  status   - Show status of both services"
    echo "  logs     - Show logs of both services"
    echo "  enable   - Enable services to start on boot"
    echo "  disable  - Disable services from starting on boot"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 status"
    echo "  $0 logs"
}

# Function to start services
start_services() {
    log_info "Starting services..."
    
    systemctl start $BACKEND_SERVICE
    log_success "Started backend service"
    
    sleep 2  # Wait for backend to start
    
    systemctl start $FRONTEND_SERVICE
    log_success "Started frontend service"
    
    echo ""
    show_status
}

# Function to stop services
stop_services() {
    log_info "Stopping services..."
    
    systemctl stop $FRONTEND_SERVICE
    log_success "Stopped frontend service"
    
    systemctl stop $BACKEND_SERVICE
    log_success "Stopped backend service"
    
    echo ""
    show_status
}

# Function to restart services
restart_services() {
    log_info "Restarting services..."
    
    systemctl restart $BACKEND_SERVICE
    log_success "Restarted backend service"
    
    sleep 2  # Wait for backend to start
    
    systemctl restart $FRONTEND_SERVICE
    log_success "Restarted frontend service"
    
    echo ""
    show_status
}

# Function to show status
show_status() {
    log_info "Service Status:"
    echo ""
    
    BACKEND_STATUS=$(systemctl is-active $BACKEND_SERVICE)
    FRONTEND_STATUS=$(systemctl is-active $FRONTEND_SERVICE)
    
    echo "Backend Service:"
    if [ "$BACKEND_STATUS" = "active" ]; then
        log_success "Running"
    else
        log_error "Not Running"
    fi
    systemctl status $BACKEND_SERVICE --no-pager | head -10
    echo ""
    
    echo "Frontend Service:"
    if [ "$FRONTEND_STATUS" = "active" ]; then
        log_success "Running"
    else
        log_error "Not Running"
    fi
    systemctl status $FRONTEND_SERVICE --no-pager | head -10
    echo ""
}

# Function to show logs
show_logs() {
    log_info "Showing logs (press Ctrl+C to exit)..."
    echo ""
    
    journalctl -u $BACKEND_SERVICE -u $FRONTEND_SERVICE -f --no-pager
}

# Function to enable services
enable_services() {
    log_info "Enabling services for auto-start on boot..."
    
    systemctl enable $BACKEND_SERVICE
    log_success "Enabled backend service"
    
    systemctl enable $FRONTEND_SERVICE
    log_success "Enabled frontend service"
}

# Function to disable services
disable_services() {
    log_info "Disabling services from auto-start on boot..."
    
    systemctl disable $BACKEND_SERVICE
    log_success "Disabled backend service"
    
    systemctl disable $FRONTEND_SERVICE
    log_success "Disabled frontend service"
}

# Main logic
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    enable)
        enable_services
        ;;
    disable)
        disable_services
        ;;
    *)
        show_usage
        exit 1
        ;;
esac

exit 0

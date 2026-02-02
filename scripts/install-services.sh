#!/bin/bash

#===========================================
# URouterOS Systemd Services Installation Script
#===========================================

set -e

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

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SYSTEMD_DIR="/etc/systemd/system"

log_info "========================================="
log_info "URouterOS Systemd Services Installation"
log_info "========================================="
echo ""

# Step 1: Copy service files
log_info "Step 1: Copying service files to $SYSTEMD_DIR..."

if [ -f "$PROJECT_ROOT/systemd/urouteros-backend.service" ]; then
    cp "$PROJECT_ROOT/systemd/urouteros-backend.service" "$SYSTEMD_DIR/"
    log_success "Copied urouteros-backend.service"
else
    log_error "urouteros-backend.service not found"
    exit 1
fi

if [ -f "$PROJECT_ROOT/systemd/urouteros-frontend.service" ]; then
    cp "$PROJECT_ROOT/systemd/urouteros-frontend.service" "$SYSTEMD_DIR/"
    log_success "Copied urouteros-frontend.service"
else
    log_error "urouteros-frontend.service not found"
    exit 1
fi

echo ""

# Step 2: Reload systemd daemon
log_info "Step 2: Reloading systemd daemon..."
systemctl daemon-reload
log_success "Systemd daemon reloaded"
echo ""

# Step 3: Enable services
log_info "Step 3: Enabling services for auto-start on boot..."

systemctl enable urouteros-backend.service
log_success "Enabled urouteros-backend.service"

systemctl enable urouteros-frontend.service
log_success "Enabled urouteros-frontend.service"
echo ""

# Step 4: Start services
log_info "Step 4: Starting services..."

systemctl start urouteros-backend.service
log_success "Started urouteros-backend.service"

sleep 3  # Wait for backend to start

systemctl start urouteros-frontend.service
log_success "Started urouteros-frontend.service"
echo ""

# Step 5: Check service status
log_info "Step 5: Checking service status..."
echo ""

echo "Backend Service Status:"
systemctl status urouteros-backend.service --no-pager || true
echo ""

echo "Frontend Service Status:"
systemctl status urouteros-frontend.service --no-pager || true
echo ""

# Summary
log_info "========================================="
log_info "Installation Summary"
log_info "========================================="
echo ""

BACKEND_STATUS=$(systemctl is-active urouteros-backend.service)
FRONTEND_STATUS=$(systemctl is-active urouteros-frontend.service)

if [ "$BACKEND_STATUS" = "active" ]; then
    log_success "Backend Service: Running"
else
    log_error "Backend Service: Not Running"
fi

if [ "$FRONTEND_STATUS" = "active" ]; then
    log_success "Frontend Service: Running"
else
    log_error "Frontend Service: Not Running"
fi

echo ""
log_info "Services are configured to start automatically on boot"
log_info "Use 'systemctl status urouteros-backend' to check backend status"
log_info "Use 'systemctl status urouteros-frontend' to check frontend status"
log_info "Use 'journalctl -u urouteros-backend -f' to view backend logs"
log_info "Use 'journalctl -u urouteros-frontend -f' to view frontend logs"
echo ""

log_success "Installation completed!"

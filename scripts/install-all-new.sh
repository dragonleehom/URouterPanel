#!/bin/bash
#
# URouterOS 一键部署脚本 (重构版)
# 职责:安装依赖、部署应用、启动服务
# 配置由后台服务在首次启动时自动完成
#

# 不使用set -e,改用容错机制
# set -e

echo "========================================="
echo "URouterOS 一键部署脚本 (v2.0)"
echo "========================================="
echo ""
echo "此脚本将自动完成以下步骤:"
echo "  1. 安装系统依赖(Node.js, firewalld, 网络工具等)"
echo "  2. 部署应用(安装依赖、构建、初始化数据库)"
echo "  3. 配置systemd服务(开机自启动)"
echo "  4. 启动后台服务(自动初始化网络配置)"
echo ""
echo "预计耗时: 10-20分钟"
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
  echo "错误: 请使用root权限运行此脚本 (sudo ./install-all.sh)"
  exit 1
fi

read -p "是否继续? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "已取消部署"
  exit 0
fi

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 初始化日志和状态跟踪
LOG_FILE="$PROJECT_DIR/install.log"
STEP_STATUS=()
STEP_MESSAGES=()

# 日志函数
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ ERROR: $1" | tee -a "$LOG_FILE"
}

log_success() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ SUCCESS: $1" | tee -a "$LOG_FILE"
}

log_warning() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  WARNING: $1" | tee -a "$LOG_FILE"
}

# 记录步骤状态
record_step() {
  local step_name="$1"
  local status="$2"  # success/failed/skipped
  local message="$3"
  
  STEP_STATUS+=("$step_name:$status")
  STEP_MESSAGES+=("$message")
}

# 输出安装摘要
print_summary() {
  echo ""
  echo "========================================="
  echo "安装摘要"
  echo "========================================="
  echo ""
  
  local success_count=0
  local failed_count=0
  local skipped_count=0
  
  for i in "${!STEP_STATUS[@]}"; do
    local step="${STEP_STATUS[$i]}"
    local step_name="${step%%:*}"
    local status="${step##*:}"
    local message="${STEP_MESSAGES[$i]}"
    
    case "$status" in
      success)
        echo "✅ $step_name: 成功"
        ((success_count++))
        ;;
      failed)
        echo "❌ $step_name: 失败 - $message"
        ((failed_count++))
        ;;
      skipped)
        echo "⏭️  $step_name: 跳过 - $message"
        ((skipped_count++))
        ;;
    esac
  done
  
  echo ""
  echo "总计: $success_count 成功, $failed_count 失败, $skipped_count 跳过"
  echo ""
  
  if [ $failed_count -gt 0 ]; then
    echo "⚠️  部分步骤失败,请查看日志: $LOG_FILE"
  fi
}

echo ""
echo "========================================="
echo "开始部署..."
echo "========================================="
echo ""
log "开始URouterOS部署"

# ============================================
# 步骤1: 安装系统依赖
# ============================================
echo ""
echo "========================================="
echo "步骤 1/4: 安装系统依赖"
echo "========================================="
echo ""
log "步骤1: 安装系统依赖"

if bash "$SCRIPT_DIR/install-dependencies.sh" 2>&1 | tee -a "$LOG_FILE"; then
  log_success "系统依赖安装完成"
  record_step "安装系统依赖" "success" ""
else
  log_error "系统依赖安装失败,但继续执行"
  record_step "安装系统依赖" "failed" "部分依赖可能未安装"
fi

# ============================================
# 步骤2: 安装firewalld (替代setup-network.sh)
# ============================================
echo ""
echo "========================================="
echo "步骤 2/4: 安装firewalld防火墙"
echo "========================================="
echo ""
log "步骤2: 安装firewalld防火墙"

if bash "$SCRIPT_DIR/firewalld-setup.sh" 2>&1 | tee -a "$LOG_FILE"; then
  log_success "firewalld安装完成"
  record_step "安装firewalld" "success" ""
else
  log_warning "firewalld安装失败,将在后台服务启动时重试"
  record_step "安装firewalld" "failed" "后台服务将尝试重新配置"
fi

# ============================================
# 步骤3: 部署应用
# ============================================
echo ""
echo "========================================="
echo "步骤 3/4: 部署应用"
echo "========================================="
echo ""
log "步骤3: 部署应用"

if bash "$SCRIPT_DIR/deploy-app.sh" 2>&1 | tee -a "$LOG_FILE"; then
  log_success "应用部署完成"
  record_step "部署应用" "success" ""
else
  log_error "应用部署失败,但继续执行"
  record_step "部署应用" "failed" "可能需要手动运行pnpm install"
fi

# ============================================
# 步骤4: 配置systemd服务 (关键步骤,必须成功)
# ============================================
echo ""
echo "========================================="
echo "步骤 4/4: 配置systemd服务"
echo "========================================="
echo ""
log "步骤4: 配置systemd服务"

if bash "$SCRIPT_DIR/setup-systemd.sh" 2>&1 | tee -a "$LOG_FILE"; then
  log_success "systemd服务配置完成"
  record_step "配置systemd服务" "success" ""
else
  log_error "systemd服务配置失败"
  record_step "配置systemd服务" "failed" "核心服务未启动"
  print_summary
  echo ""
  echo "❌ 部署失败: systemd服务配置失败"
  echo "请查看日志: $LOG_FILE"
  exit 1
fi

# ============================================
# 步骤5: 启动服务 (关键步骤,必须成功)
# ============================================
echo ""
echo "========================================="
echo "启动后台服务..."
echo "========================================="
echo ""
log "启动后台服务"

# 启动服务
if systemctl start urouteros 2>&1 | tee -a "$LOG_FILE"; then
  log_success "后台服务启动成功"
  record_step "启动后台服务" "success" ""
  
  # 等待服务启动
  echo "等待服务初始化..."
  sleep 5
  
  # 检查服务状态
  if systemctl is-active --quiet urouteros; then
    log_success "后台服务运行正常"
  else
    log_warning "后台服务可能未正常启动,请检查日志"
  fi
else
  log_error "后台服务启动失败"
  record_step "启动后台服务" "failed" "服务未运行"
  print_summary
  echo ""
  echo "❌ 部署失败: 后台服务启动失败"
  echo "请查看日志: $LOG_FILE"
  echo "或运行: sudo journalctl -u urouteros -n 50"
  exit 1
fi

# ============================================
# 完成
# ============================================
print_summary

echo ""
echo "========================================="
echo "部署完成!"
echo "========================================="
echo ""
echo "URouterOS已成功部署并启动!"
echo ""
echo "访问Web界面:"
echo "  - 本地: http://localhost:3000"
echo "  - 局域网: http://<your-ip>:3000"
echo ""
echo "⚠️  首次启动说明:"
echo "  - 后台服务正在自动检测网卡并创建默认配置"
echo "  - 请访问Web界面查看网络配置状态"
echo "  - 默认会将第一个网卡配置为WAN(DHCP客户端)"
echo "  - 如有第二个网卡,会配置为LAN(192.168.1.1/24)"
echo ""
echo "常用命令:"
echo "  - 查看服务状态: sudo systemctl status urouteros"
echo "  - 查看日志: sudo journalctl -u urouteros -f"
echo "  - 重启服务: sudo systemctl restart urouteros"
echo "  - 查看安装日志: cat $LOG_FILE"
echo ""
echo "如需帮助,请访问: https://github.com/dragonleehom/URouterPanel"
echo ""

log "URouterOS部署完成"

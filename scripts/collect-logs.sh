#!/bin/bash
#
# URouterOS 日志收集脚本
# 收集所有相关日志用于问题排查
#

set -e

echo "========================================="
echo "URouterOS 日志收集脚本"
echo "========================================="
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
  echo "错误: 请使用root权限运行此脚本 (sudo ./collect-logs.sh)"
  exit 1
fi

# 创建临时目录
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_DIR="/tmp/urouteros-logs-$TIMESTAMP"
mkdir -p "$LOG_DIR"

echo "日志收集目录: $LOG_DIR"
echo ""

# 获取脚本所在目录的父目录(项目根目录)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "项目目录: $PROJECT_DIR"
echo ""

# 1. 收集系统信息
echo "========================================="
echo "1/10: 收集系统信息"
echo "========================================="
echo ""

echo "操作系统信息..." 
lsb_release -a > "$LOG_DIR/system-info.txt" 2>&1
echo "" >> "$LOG_DIR/system-info.txt"

echo "内核版本..." 
uname -a >> "$LOG_DIR/system-info.txt" 2>&1
echo "" >> "$LOG_DIR/system-info.txt"

echo "CPU信息..." 
lscpu >> "$LOG_DIR/system-info.txt" 2>&1
echo "" >> "$LOG_DIR/system-info.txt"

echo "内存信息..." 
free -h >> "$LOG_DIR/system-info.txt" 2>&1
echo "" >> "$LOG_DIR/system-info.txt"

echo "磁盘信息..." 
df -h >> "$LOG_DIR/system-info.txt" 2>&1

echo "✓ 系统信息收集完成"
echo ""

# 2. 收集软件版本信息
echo "========================================="
echo "2/10: 收集软件版本信息"
echo "========================================="
echo ""

echo "Node.js版本..." 
node --version > "$LOG_DIR/software-versions.txt" 2>&1
echo "" >> "$LOG_DIR/software-versions.txt"

echo "pnpm版本..." 
pnpm --version >> "$LOG_DIR/software-versions.txt" 2>&1
echo "" >> "$LOG_DIR/software-versions.txt"

echo "MySQL版本..." 
mysql --version >> "$LOG_DIR/software-versions.txt" 2>&1
echo "" >> "$LOG_DIR/software-versions.txt"

echo "Git版本和最新提交..." 
cd "$PROJECT_DIR"
git --version >> "$LOG_DIR/software-versions.txt" 2>&1
echo "" >> "$LOG_DIR/software-versions.txt"
git log -5 --oneline >> "$LOG_DIR/software-versions.txt" 2>&1

echo "✓ 软件版本信息收集完成"
echo ""

# 3. 收集服务状态
echo "========================================="
echo "3/10: 收集服务状态"
echo "========================================="
echo ""

echo "URouterOS服务状态..." 
systemctl status urouteros --no-pager > "$LOG_DIR/service-status.txt" 2>&1 || true
echo "" >> "$LOG_DIR/service-status.txt"

echo "dnsmasq服务状态..." 
systemctl status dnsmasq --no-pager >> "$LOG_DIR/service-status.txt" 2>&1 || true
echo "" >> "$LOG_DIR/service-status.txt"

echo "MySQL服务状态..." 
systemctl status mysql --no-pager >> "$LOG_DIR/service-status.txt" 2>&1 || true

echo "✓ 服务状态收集完成"
echo ""

# 4. 收集URouterOS服务日志
echo "========================================="
echo "4/10: 收集URouterOS服务日志"
echo "========================================="
echo ""

echo "最近1000行日志..." 
journalctl -u urouteros -n 1000 --no-pager > "$LOG_DIR/urouteros-service.log" 2>&1 || true

echo "今天的错误日志..." 
journalctl -u urouteros --since today -p err --no-pager > "$LOG_DIR/urouteros-errors.log" 2>&1 || true

echo "✓ URouterOS服务日志收集完成"
echo ""

# 5. 收集网络配置
echo "========================================="
echo "5/10: 收集网络配置"
echo "========================================="
echo ""

echo "网络接口信息..." 
ip addr show > "$LOG_DIR/network-config.txt" 2>&1
echo "" >> "$LOG_DIR/network-config.txt"

echo "路由表..." 
ip route show >> "$LOG_DIR/network-config.txt" 2>&1
echo "" >> "$LOG_DIR/network-config.txt"

echo "路由表(详细)..." 
ip route show table all >> "$LOG_DIR/network-config.txt" 2>&1
echo "" >> "$LOG_DIR/network-config.txt"

echo "ARP表..." 
ip neigh show >> "$LOG_DIR/network-config.txt" 2>&1

echo "✓ 网络配置收集完成"
echo ""

# 6. 收集防火墙规则
echo "========================================="
echo "6/10: 收集防火墙规则"
echo "========================================="
echo ""

echo "iptables filter表..." 
iptables -L -n -v > "$LOG_DIR/iptables-rules.txt" 2>&1
echo "" >> "$LOG_DIR/iptables-rules.txt"

echo "iptables nat表..." 
iptables -t nat -L -n -v >> "$LOG_DIR/iptables-rules.txt" 2>&1
echo "" >> "$LOG_DIR/iptables-rules.txt"

echo "iptables mangle表..." 
iptables -t mangle -L -n -v >> "$LOG_DIR/iptables-rules.txt" 2>&1

echo "✓ 防火墙规则收集完成"
echo ""

# 7. 收集dnsmasq配置
echo "========================================="
echo "7/10: 收集dnsmasq配置"
echo "========================================="
echo ""

echo "dnsmasq主配置..." 
if [ -f /etc/dnsmasq.conf ]; then
  cp /etc/dnsmasq.conf "$LOG_DIR/dnsmasq.conf" 2>&1 || true
fi

echo "dnsmasq配置目录..." 
if [ -d /etc/dnsmasq.d ]; then
  mkdir -p "$LOG_DIR/dnsmasq.d"
  cp /etc/dnsmasq.d/* "$LOG_DIR/dnsmasq.d/" 2>&1 || true
fi

echo "✓ dnsmasq配置收集完成"
echo ""

# 8. 收集数据库信息
echo "========================================="
echo "8/10: 收集数据库信息"
echo "========================================="
echo ""

echo "数据库连接测试..." 
if [ -f "$PROJECT_DIR/.env" ]; then
  # 从.env文件提取数据库连接信息
  DATABASE_URL=$(grep DATABASE_URL "$PROJECT_DIR/.env" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
  
  if [ -n "$DATABASE_URL" ]; then
    echo "数据库URL: $DATABASE_URL" > "$LOG_DIR/database-info.txt"
    echo "" >> "$LOG_DIR/database-info.txt"
    
    # 尝试连接数据库并获取表信息
    echo "数据库表列表:" >> "$LOG_DIR/database-info.txt"
    mysql -e "SHOW TABLES;" urouteros >> "$LOG_DIR/database-info.txt" 2>&1 || echo "无法连接数据库" >> "$LOG_DIR/database-info.txt"
  else
    echo "未找到DATABASE_URL配置" > "$LOG_DIR/database-info.txt"
  fi
else
  echo "未找到.env文件" > "$LOG_DIR/database-info.txt"
fi

echo "✓ 数据库信息收集完成"
echo ""

# 9. 收集应用配置
echo "========================================="
echo "9/10: 收集应用配置"
echo "========================================="
echo ""

echo "环境变量(脱敏)..." 
if [ -f "$PROJECT_DIR/.env" ]; then
  # 复制.env但隐藏敏感信息
  sed 's/\(PASSWORD\|SECRET\|KEY\)=.*/\1=***HIDDEN***/g' "$PROJECT_DIR/.env" > "$LOG_DIR/env-sanitized.txt" 2>&1
else
  echo "未找到.env文件" > "$LOG_DIR/env-sanitized.txt"
fi

echo "package.json..." 
if [ -f "$PROJECT_DIR/package.json" ]; then
  cp "$PROJECT_DIR/package.json" "$LOG_DIR/package.json" 2>&1 || true
fi

echo "✓ 应用配置收集完成"
echo ""

# 10. 收集进程信息
echo "========================================="
echo "10/10: 收集进程信息"
echo "========================================="
echo ""

echo "Node.js进程..." 
ps aux | grep node > "$LOG_DIR/processes.txt" 2>&1
echo "" >> "$LOG_DIR/processes.txt"

echo "网络监听端口..." 
netstat -tlnp >> "$LOG_DIR/processes.txt" 2>&1 || ss -tlnp >> "$LOG_DIR/processes.txt" 2>&1

echo "✓ 进程信息收集完成"
echo ""

# 创建压缩包
echo "========================================="
echo "创建压缩包"
echo "========================================="
echo ""

ARCHIVE_FILE="/tmp/urouteros-logs-$TIMESTAMP.tar.gz"
tar -czf "$ARCHIVE_FILE" -C /tmp "urouteros-logs-$TIMESTAMP"

echo "✓ 压缩包创建完成"
echo ""

# 清理临时目录
rm -rf "$LOG_DIR"

# 完成
echo "========================================="
echo "日志收集完成!"
echo "========================================="
echo ""
echo "日志包位置: $ARCHIVE_FILE"
echo "文件大小: $(du -h "$ARCHIVE_FILE" | cut -f1)"
echo ""
echo "请将此文件发送给开发者进行问题排查。"
echo ""
echo "提示: 可以使用scp命令下载到本地:"
echo "  scp root@192.168.188.1:$ARCHIVE_FILE ."
echo ""

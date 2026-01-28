#!/bin/bash
#
# URouterOS systemd服务配置脚本
# 创建systemd服务并启用开机自启动
#

set -e

echo "========================================="
echo "URouterOS systemd服务配置脚本"
echo "========================================="
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
  echo "错误: 请使用root权限运行此脚本 (sudo ./setup-systemd.sh)"
  exit 1
fi

# 获取脚本所在目录的父目录(项目根目录)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "项目目录: $PROJECT_DIR"
echo ""

# 检查项目目录
if [ ! -f "$PROJECT_DIR/package.json" ]; then
  echo "错误: 未找到package.json,请确认项目目录正确"
  exit 1
fi

# 获取当前用户
if [ -n "$SUDO_USER" ]; then
  APP_USER=$SUDO_USER
else
  APP_USER=$(whoami)
fi

echo "服务用户: $APP_USER"
echo ""

# 创建systemd服务文件
echo "[1/2] 创建systemd服务文件..."

cat > /etc/systemd/system/urouteros.service <<EOF
[Unit]
Description=URouterOS Web Management Interface
Documentation=https://github.com/yourusername/urouteros
After=network.target mysql.service docker.service
Wants=mysql.service docker.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$PROJECT_DIR
Environment="NODE_ENV=production"
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/node $PROJECT_DIR/dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=urouteros

# 安全配置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=$PROJECT_DIR /var/lib/urouteros /var/log/urouteros

# 资源限制
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

echo "✓ systemd服务文件创建完成: /etc/systemd/system/urouteros.service"
echo ""

# 重新加载systemd配置
echo "[2/2] 配置服务..."
systemctl daemon-reload

# 启用服务
systemctl enable urouteros.service

# 启动服务
systemctl start urouteros.service

# 等待服务启动
sleep 3

# 检查服务状态
if systemctl is-active --quiet urouteros.service; then
  echo "✓ URouterOS服务已启动"
else
  echo "⚠ URouterOS服务启动失败,查看日志:"
  echo "  sudo journalctl -u urouteros.service -n 50"
  exit 1
fi
echo ""

# 输出总结
echo "========================================="
echo "systemd服务配置完成!"
echo "========================================="
echo ""
echo "服务信息:"
echo "  - 服务名称: urouteros.service"
echo "  - 运行用户: $APP_USER"
echo "  - 工作目录: $PROJECT_DIR"
echo "  - 开机自启: 已启用"
echo ""
echo "常用命令:"
echo "  - 查看状态: sudo systemctl status urouteros"
echo "  - 启动服务: sudo systemctl start urouteros"
echo "  - 停止服务: sudo systemctl stop urouteros"
echo "  - 重启服务: sudo systemctl restart urouteros"
echo "  - 查看日志: sudo journalctl -u urouteros -f"
echo ""
echo "访问Web界面:"
echo "  - 本地: http://localhost:3000"
echo "  - 局域网: http://192.168.188.1:3000"
echo ""

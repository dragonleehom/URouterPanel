#!/bin/bash
#
# URouterOS 一键部署脚本
# 自动执行所有部署步骤
#

set -e

echo "========================================="
echo "URouterOS 一键部署脚本"
echo "========================================="
echo ""
echo "此脚本将自动完成以下步骤:"
echo "  1. 安装系统依赖(Docker, QEMU, 网络工具等)"
echo "  2. 配置网络(WAN/LAN自动检测)"
echo "  3. 部署应用(安装依赖、构建、初始化数据库)"
echo "  4. 配置systemd服务(开机自启动)"
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

echo ""
echo "========================================="
echo "开始部署..."
echo "========================================="
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 步骤1: 安装系统依赖
echo ""
echo "========================================="
echo "步骤 1/4: 安装系统依赖"
echo "========================================="
echo ""
bash "$SCRIPT_DIR/install-dependencies.sh"

# 步骤2: 配置网络
echo ""
echo "========================================="
echo "步骤 2/4: 配置网络"
echo "========================================="
echo ""
bash "$SCRIPT_DIR/setup-network.sh"

# 步骤3: 部署应用
echo ""
echo "========================================="
echo "步骤 3/4: 部署应用"
echo "========================================="
echo ""
bash "$SCRIPT_DIR/deploy-app.sh"

# sudo权限配置不再需要,服务以root运行
echo ""
echo "========================================="
echo "步骤 4/4: 配置systemd服务"
echo "========================================="
echo ""
bash "$SCRIPT_DIR/setup-systemd.sh"

# 完成
echo ""
echo "========================================="
echo "部署完成!"
echo "========================================="
echo ""
echo "URouterOS已成功部署并启动!"
echo ""
echo "访问Web界面:"
echo "  - 本地: http://localhost:3000"
echo "  - 局域网: http://192.168.188.1:3000"
echo ""
echo "默认网络配置:"
echo "  - WAN: 自动检测(DHCP客户端)"
echo "  - LAN: 192.168.188.1/24"
echo "  - DHCP范围: 192.168.188.2-254"
echo ""
echo "常用命令:"
echo "  - 查看服务状态: sudo systemctl status urouteros"
echo "  - 查看日志: sudo journalctl -u urouteros -f"
echo "  - 重启服务: sudo systemctl restart urouteros"
echo ""
echo "如需帮助,请访问: https://github.com/yourusername/urouteros"
echo ""

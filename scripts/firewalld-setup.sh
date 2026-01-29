#!/bin/bash
#
# Firewalld安装和配置脚本
# 用于URouterOS项目,替代UFW,配置符合OpenWrt风格的防火墙区域
#

set -e

echo "========================================="
echo "URouterOS Firewalld Setup Script"
echo "========================================="

# 检查是否以root权限运行
if [ "$EUID" -ne 0 ]; then
  echo "错误: 请使用root权限运行此脚本"
  echo "使用: sudo $0"
  exit 1
fi

# 1. 禁用UFW(如果存在)
echo ""
echo "[1/6] 检查并禁用UFW防火墙..."
if command -v ufw &> /dev/null; then
  echo "检测到UFW,正在禁用..."
  ufw disable || true
  systemctl stop ufw || true
  systemctl disable ufw || true
  echo "✓ UFW已禁用"
else
  echo "✓ 未检测到UFW,跳过"
fi

# 2. 安装Firewalld
echo ""
echo "[2/6] 安装Firewalld..."
if command -v firewall-cmd &> /dev/null; then
  echo "✓ Firewalld已安装"
else
  echo "正在安装firewalld..."
  apt-get update
  apt-get install -y firewalld
  echo "✓ Firewalld安装完成"
fi

# 3. 启动并启用Firewalld服务
echo ""
echo "[3/6] 启动Firewalld服务..."
systemctl start firewalld
systemctl enable firewalld
echo "✓ Firewalld服务已启动并设置为开机自启"

# 4. 创建自定义防火墙区域
echo ""
echo "[4/6] 创建自定义防火墙区域..."

# 创建WAN区域(参考OpenWrt wan区域)
echo "创建WAN区域..."
if firewall-cmd --permanent --get-zones | grep -q "^wan$"; then
  echo "  WAN区域已存在,跳过创建"
else
  firewall-cmd --permanent --new-zone=wan
  echo "  ✓ WAN区域已创建"
fi

# 配置WAN区域策略
firewall-cmd --permanent --zone=wan --set-target=DROP
firewall-cmd --permanent --zone=wan --add-masquerade
firewall-cmd --permanent --zone=wan --set-description="WAN zone for internet-facing interfaces"

# ⚠️ 测试环境配置: 允许SSH和HTTP访问
# 生产环境部署时,请移除以下规则以增强安全性
echo "  ⚠️  添加测试环境端口允许规则 (SSH/HTTP/HTTPS)..."
firewall-cmd --permanent --zone=wan --add-service=ssh
firewall-cmd --permanent --zone=wan --add-service=http
firewall-cmd --permanent --zone=wan --add-service=https
firewall-cmd --permanent --zone=wan --add-port=3000/tcp  # 开发服务器端口

echo "  ✓ WAN区域策略已配置 (target=DROP, masquerade=enabled)"
echo "  ⚠️  测试模式: SSH(22), HTTP(80), HTTPS(443), Dev(3000) 已开放"

# 创建LAN区域(参考OpenWrt lan区域)
echo "创建LAN区域..."
if firewall-cmd --permanent --get-zones | grep -q "^lan$"; then
  echo "  LAN区域已存在,跳过创建"
else
  firewall-cmd --permanent --new-zone=lan
  echo "  ✓ LAN区域已创建"
fi

# 配置LAN区域策略
firewall-cmd --permanent --zone=lan --set-target=ACCEPT
firewall-cmd --permanent --zone=lan --set-description="LAN zone for trusted internal network"
# 允许LAN区域访问路由器管理服务
firewall-cmd --permanent --zone=lan --add-service=ssh
firewall-cmd --permanent --zone=lan --add-service=http
firewall-cmd --permanent --zone=lan --add-service=https
firewall-cmd --permanent --zone=lan --add-service=dns
firewall-cmd --permanent --zone=lan --add-service=dhcp
firewall-cmd --permanent --zone=lan --add-service=dhcpv6
firewall-cmd --permanent --zone=lan --add-port=3000/tcp  # Web管理界面端口
echo "  ✓ LAN区域策略已配置 (target=ACCEPT, services=ssh/http/https/dns/dhcp, ports=3000)"

# 创建Docker区域
echo "创建Docker区域..."
if firewall-cmd --permanent --get-zones | grep -q "^docker$"; then
  echo "  Docker区域已存在,跳过创建"
else
  firewall-cmd --permanent --new-zone=docker
  echo "  ✓ Docker区域已创建"
fi

# 配置Docker区域策略
firewall-cmd --permanent --zone=docker --set-target=ACCEPT
firewall-cmd --permanent --zone=docker --set-description="Docker zone for container networking"
echo "  ✓ Docker区域策略已配置 (target=ACCEPT)"

# 5. 配置区域间转发规则
echo ""
echo "[5/6] 配置区域间转发规则..."

# LAN → WAN转发(允许内网访问互联网)
echo "配置LAN → WAN转发..."
firewall-cmd --permanent --zone=lan --add-forward
echo "  ✓ LAN → WAN转发已启用"

# Docker → WAN转发(允许容器访问互联网)
echo "配置Docker → WAN转发..."
firewall-cmd --permanent --zone=docker --add-forward
echo "  ✓ Docker → WAN转发已启用"

# 6. 重新加载防火墙配置
echo ""
echo "[6/6] 重新加载防火墙配置..."
firewall-cmd --reload
echo "✓ 防火墙配置已重新加载"

# 显示配置摘要
echo ""
echo "========================================="
echo "Firewalld配置完成!"
echo "========================================="
echo ""
echo "区域配置摘要:"
echo ""
echo "WAN区域:"
echo "  - 默认策略: DROP (拒绝所有未明确允许的流量)"
echo "  - NAT伪装: 已启用"
echo "  - ⚠️  测试模式: SSH(22), HTTP(80), HTTPS(443), Dev(3000) 已开放"
echo "  - 用途: 连接到互联网的接口"
echo ""
echo "LAN区域:"
echo "  - 默认策略: ACCEPT (允许所有流量)"
echo "  - 服务: SSH, HTTP, HTTPS, DNS, DHCP"
echo "  - 端口: 3000 (Web管理界面)"
echo "  - 用途: 内网接口,信任的网络"
echo ""
echo "Docker区域:"
echo "  - 默认策略: ACCEPT (允许所有流量)"
echo "  - 用途: Docker容器网络"
echo ""
echo "转发规则:"
echo "  - LAN → WAN: 已启用 (内网访问互联网)"
echo "  - Docker → WAN: 已启用 (容器访问互联网)"
echo ""
echo "查看当前配置:"
echo "  firewall-cmd --list-all-zones"
echo ""
echo "查看特定区域:"
echo "  firewall-cmd --zone=wan --list-all"
echo "  firewall-cmd --zone=lan --list-all"
echo "  firewall-cmd --zone=docker --list-all"
echo ""
echo "绑定接口到区域(示例):"
echo "  firewall-cmd --zone=wan --add-interface=eth0 --permanent"
echo "  firewall-cmd --zone=lan --add-interface=eth1 --permanent"
echo "  firewall-cmd --reload"
echo ""
echo "========================================="

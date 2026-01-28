#!/bin/bash

#############################################
# URouterOS Sudo权限配置脚本
# 为URouterOS服务配置无密码sudo权限
#############################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "配置URouterOS Sudo权限"
echo "========================================="

# 检查是否以root运行
if [ "$EUID" -ne 0 ]; then
  echo "错误: 此脚本需要root权限运行"
  echo "请使用: sudo $0"
  exit 1
fi

# 获取运行URouterOS的用户
UROUTEROS_USER="${UROUTEROS_USER:-ubuntu}"

echo "为用户 $UROUTEROS_USER 配置sudo权限..."

# 创建sudoers配置文件
SUDOERS_FILE="/etc/sudoers.d/urouteros"

cat > "$SUDOERS_FILE" << 'EOF'
# URouterOS sudo权限配置
# 允许URouterOS服务执行网络管理命令

# 网络接口管理 - 允许所有ip命令
Cmnd_Alias NETWORK_CMDS = /usr/sbin/ip, /usr/bin/ip, \
                          /usr/sbin/ifconfig, /usr/bin/ifconfig, \
                          /usr/sbin/route, /usr/bin/route, \
                          /usr/sbin/ethtool, /usr/bin/ethtool

# 无线网络管理 - 允许iw和hostapd
Cmnd_Alias WIRELESS_CMDS = /usr/sbin/iw, /usr/bin/iw, \
                           /usr/sbin/hostapd, /usr/bin/hostapd, \
                           /usr/sbin/wpa_supplicant, /usr/bin/wpa_supplicant

# 系统服务管理 - 允许管理特定服务
Cmnd_Alias SERVICE_CMDS = /usr/bin/systemctl start hostapd, \
                          /usr/bin/systemctl stop hostapd, \
                          /usr/bin/systemctl restart hostapd, \
                          /usr/bin/systemctl is-active hostapd, \
                          /usr/bin/systemctl status hostapd, \
                          /usr/bin/systemctl start dnsmasq, \
                          /usr/bin/systemctl stop dnsmasq, \
                          /usr/bin/systemctl restart dnsmasq, \
                          /usr/bin/systemctl is-active dnsmasq, \
                          /usr/bin/systemctl status dnsmasq, \
                          /usr/bin/systemctl start docker, \
                          /usr/bin/systemctl stop docker, \
                          /usr/bin/systemctl restart docker, \
                          /usr/bin/systemctl is-active docker, \
                          /usr/bin/systemctl status docker, \
                          /usr/bin/journalctl

# 配置文件写入 - 允许写入特定配置文件
Cmnd_Alias CONFIG_CMDS = /usr/bin/tee /etc/hostapd/hostapd.conf, \
                         /usr/bin/tee /etc/dnsmasq.d/urouteros.conf, \
                         /usr/bin/tee /etc/dnsmasq.d/static-leases.conf, \
                         /usr/bin/mkdir, \
                         /usr/bin/chmod, \
                         /usr/bin/chown

# 防火墙管理 - 允许iptables和nftables
Cmnd_Alias FIREWALL_CMDS = /usr/sbin/iptables, /usr/bin/iptables, \
                           /usr/sbin/ip6tables, /usr/bin/ip6tables, \
                           /usr/sbin/iptables-save, /usr/bin/iptables-save, \
                           /usr/sbin/iptables-restore, /usr/bin/iptables-restore, \
                           /usr/sbin/nft, /usr/bin/nft

# Docker/容器管理 - 允许docker命令
Cmnd_Alias DOCKER_CMDS = /usr/bin/docker, \
                         /usr/local/bin/docker, \
                         /usr/bin/docker-compose, \
                         /usr/local/bin/docker-compose

# 允许ubuntu用户无密码执行这些命令
%UROUTEROS_USER% ALL=(ALL) NOPASSWD: NETWORK_CMDS, WIRELESS_CMDS, SERVICE_CMDS, CONFIG_CMDS, FIREWALL_CMDS, DOCKER_CMDS
EOF

# 替换用户名占位符
sed -i "s/%UROUTEROS_USER%/$UROUTEROS_USER/g" "$SUDOERS_FILE"

# 设置正确的权限
chmod 0440 "$SUDOERS_FILE"

# 验证sudoers文件语法
if visudo -c -f "$SUDOERS_FILE"; then
  echo "✓ Sudo权限配置成功"
  echo "  配置文件: $SUDOERS_FILE"
  echo "  用户: $UROUTEROS_USER"
else
  echo "✗ Sudoers文件语法错误,已删除"
  rm -f "$SUDOERS_FILE"
  exit 1
fi

echo ""
echo "========================================="
echo "Sudo权限配置完成"
echo "========================================="
echo ""
echo "已授予 $UROUTEROS_USER 用户以下权限:"
echo "  - 网络接口管理 (ip, ifconfig, route, ethtool)"
echo "  - 无线网络管理 (iw, hostapd, wpa_supplicant)"
echo "  - 系统服务管理 (systemctl, journalctl)"
echo "  - 配置文件写入 (tee, mkdir, chmod, chown)"
echo "  - 防火墙管理 (iptables, ip6tables, nft)"
echo "  - Docker管理 (docker, docker-compose)"
echo ""

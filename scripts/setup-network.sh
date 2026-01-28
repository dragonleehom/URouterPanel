#!/bin/bash
#
# URouterOS 自动网络配置脚本
# 自动检测并配置WAN/LAN网络
# - WAN: DHCP客户端模式(连接Internet的接口)
# - LAN: DHCP服务器模式(192.168.188.1/24, IP范围2-254)
#

set -e

echo "========================================="
echo "URouterOS 网络配置脚本"
echo "========================================="
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
  echo "错误: 请使用root权限运行此脚本 (sudo ./setup-network.sh)"
  exit 1
fi

# 检查必需的工具
for cmd in ip brctl iptables dnsmasq; do
  if ! command -v $cmd &> /dev/null; then
    echo "错误: 缺少必需工具 $cmd,请先运行 install-dependencies.sh"
    exit 1
  fi
done

# 获取所有物理网络接口(排除lo和虚拟接口)
echo "[1/6] 检测网络接口..."
ALL_INTERFACES=$(ip -o link show | awk -F': ' '{print $2}' | grep -v -E '^(lo|docker|br-|veth|virbr)')
echo "检测到物理接口:"
for iface in $ALL_INTERFACES; do
  echo "  - $iface"
done
echo ""

# 检测哪个接口连接了Internet
echo "[2/6] 检测Internet连接..."
WAN_INTERFACE=""
for iface in $ALL_INTERFACES; do
  # 启动接口
  ip link set $iface up
  sleep 2
  
  # 尝试通过DHCP获取IP
  dhclient -1 -timeout 10 $iface &> /dev/null || true
  sleep 2
  
  # 检查是否有IP地址
  if ip addr show $iface | grep -q "inet "; then
    # 尝试ping网关
    GATEWAY=$(ip route | grep "default.*$iface" | awk '{print $3}')
    if [ -n "$GATEWAY" ] && ping -c 1 -W 2 $GATEWAY &> /dev/null; then
      # 尝试ping公网DNS
      if ping -c 1 -W 3 8.8.8.8 &> /dev/null; then
        WAN_INTERFACE=$iface
        echo "✓ 检测到WAN接口: $iface (已连接Internet)"
        break
      fi
    fi
  fi
done

if [ -z "$WAN_INTERFACE" ]; then
  echo "⚠ 未检测到Internet连接,将使用第一个接口作为WAN"
  WAN_INTERFACE=$(echo $ALL_INTERFACES | awk '{print $1}')
  echo "  选择WAN接口: $WAN_INTERFACE"
fi
echo ""

# 确定LAN接口(除WAN外的所有接口)
LAN_INTERFACES=""
for iface in $ALL_INTERFACES; do
  if [ "$iface" != "$WAN_INTERFACE" ]; then
    LAN_INTERFACES="$LAN_INTERFACES $iface"
  fi
done

if [ -z "$LAN_INTERFACES" ]; then
  echo "⚠ 只有一个网络接口,将不配置LAN"
  LAN_ENABLED=false
else
  echo "LAN接口:"
  for iface in $LAN_INTERFACES; do
    echo "  - $iface"
  done
  LAN_ENABLED=true
fi
echo ""

# 配置WAN接口
echo "[3/6] 配置WAN接口..."
cat > /etc/network/interfaces.d/wan <<EOF
# WAN接口配置 (DHCP客户端)
auto $WAN_INTERFACE
iface $WAN_INTERFACE inet dhcp
EOF

# 重启WAN接口
ifdown $WAN_INTERFACE 2>/dev/null || true
ifup $WAN_INTERFACE

echo "✓ WAN接口配置完成: $WAN_INTERFACE"
WAN_IP=$(ip addr show $WAN_INTERFACE | grep "inet " | awk '{print $2}' | cut -d'/' -f1)
if [ -n "$WAN_IP" ]; then
  echo "  IP地址: $WAN_IP"
fi
echo ""

# 配置LAN接口和网桥
if [ "$LAN_ENABLED" = true ]; then
  echo "[4/6] 配置LAN接口和网桥..."
  
  # 创建br-lan网桥
  if ! brctl show | grep -q "br-lan"; then
    brctl addbr br-lan
  fi
  
  # 将所有LAN接口添加到网桥
  for iface in $LAN_INTERFACES; do
    ip link set $iface up
    brctl addif br-lan $iface 2>/dev/null || true
    echo "  ✓ $iface 已添加到 br-lan"
  done
  
  # 配置网桥IP地址
  ip addr flush dev br-lan
  ip addr add 192.168.188.1/24 dev br-lan
  ip link set br-lan up
  
  # 写入配置文件
  cat > /etc/network/interfaces.d/lan <<EOF
# LAN网桥配置
auto br-lan
iface br-lan inet static
    address 192.168.188.1
    netmask 255.255.255.0
    bridge_ports $(echo $LAN_INTERFACES | tr ' ' ' ')
    bridge_stp off
    bridge_fd 0

EOF

  # 为每个LAN接口创建配置
  for iface in $LAN_INTERFACES; do
    cat >> /etc/network/interfaces.d/lan <<EOF
auto $iface
iface $iface inet manual

EOF
  done
  
  echo "✓ LAN网桥配置完成: br-lan (192.168.188.1/24)"
  echo ""
  
  # 配置DHCP服务器
  echo "[5/6] 配置DHCP服务器..."
  
  # 备份原配置
  if [ -f /etc/dnsmasq.conf ]; then
    cp /etc/dnsmasq.conf /etc/dnsmasq.conf.bak
  fi
  
  # 创建dnsmasq配置
  cat > /etc/dnsmasq.conf <<EOF
# URouterOS DHCP服务器配置

# 监听接口
interface=br-lan

# DHCP配置
dhcp-range=192.168.188.2,192.168.188.254,255.255.255.0,12h
dhcp-option=3,192.168.188.1  # 默认网关
dhcp-option=6,192.168.188.1  # DNS服务器

# DNS转发
server=8.8.8.8
server=8.8.4.4

# 禁止读取/etc/hosts
no-hosts

# 禁止读取/etc/resolv.conf
no-resolv

# 日志
log-queries
log-dhcp

# 绑定到指定接口
bind-interfaces
EOF

  # 启动dnsmasq服务
  systemctl enable dnsmasq
  systemctl restart dnsmasq
  
  echo "✓ DHCP服务器配置完成"
  echo "  - 网关: 192.168.188.1"
  echo "  - IP范围: 192.168.188.2-254"
  echo "  - 租期: 12小时"
  echo ""
else
  echo "[4/6] 跳过LAN配置 (无LAN接口)"
  echo "[5/6] 跳过DHCP服务器配置"
  echo ""
fi

# 配置NAT转发
echo "[6/6] 配置NAT转发..."

# 启用IP转发
echo "net.ipv4.ip_forward=1" > /etc/sysctl.d/99-urouteros.conf
sysctl -p /etc/sysctl.d/99-urouteros.conf

# 清除现有iptables规则
iptables -F
iptables -t nat -F
iptables -t mangle -F
iptables -X

# 配置NAT规则
if [ "$LAN_ENABLED" = true ]; then
  # MASQUERADE规则(LAN -> WAN)
  iptables -t nat -A POSTROUTING -o $WAN_INTERFACE -j MASQUERADE
  
  # FORWARD规则
  iptables -A FORWARD -i br-lan -o $WAN_INTERFACE -j ACCEPT
  iptables -A FORWARD -i $WAN_INTERFACE -o br-lan -m state --state RELATED,ESTABLISHED -j ACCEPT
fi

# 允许本地回环
iptables -A INPUT -i lo -j ACCEPT

# 允许已建立的连接
iptables -A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT

# 允许WAN接口的DHCP客户端
iptables -A INPUT -i $WAN_INTERFACE -p udp --dport 68 -j ACCEPT

# 允许LAN接口的所有流量
if [ "$LAN_ENABLED" = true ]; then
  iptables -A INPUT -i br-lan -j ACCEPT
fi

# 允许SSH(端口22)
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# 允许Web界面(端口3000)
iptables -A INPUT -p tcp --dport 3000 -j ACCEPT

# 默认策略
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# 保存iptables规则
iptables-save > /etc/iptables/rules.v4

echo "✓ NAT转发配置完成"
echo ""

# 输出网络配置总结
echo "========================================="
echo "网络配置完成!"
echo "========================================="
echo ""
echo "网络配置:"
echo "  - WAN接口: $WAN_INTERFACE"
if [ -n "$WAN_IP" ]; then
  echo "    IP地址: $WAN_IP (DHCP)"
fi

if [ "$LAN_ENABLED" = true ]; then
  echo "  - LAN网桥: br-lan"
  echo "    IP地址: 192.168.188.1/24"
  echo "    DHCP范围: 192.168.188.2-254"
  echo "    LAN接口: $LAN_INTERFACES"
fi

echo ""
echo "防火墙规则:"
echo "  - NAT转发: 已启用"
echo "  - 开放端口: 22(SSH), 3000(Web界面)"
echo ""
echo "下一步:"
echo "  1. 连接设备到LAN接口,应自动获取192.168.188.x IP"
echo "  2. 访问Web界面: http://192.168.188.1:3000"
echo "  3. 运行应用部署脚本: sudo ./deploy-app.sh"
echo ""

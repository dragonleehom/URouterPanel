#!/bin/bash
#
# URouterOS 系统依赖安装脚本 (支持ARM架构)
# 安装Docker、QEMU/KVM、网络工具、Node.js、数据库等所有依赖
#

set -e

echo "========================================="
echo "URouterOS 系统依赖安装脚本"
echo "========================================="
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
  echo "错误: 请使用root权限运行此脚本 (sudo ./install-dependencies.sh)"
  exit 1
fi

# 检测操作系统和架构
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
  VERSION=$VERSION_ID
else
  echo "错误: 无法检测操作系统"
  exit 1
fi

ARCH=$(uname -m)
echo "检测到系统信息:"
echo "  - 操作系统: $OS $VERSION"
echo "  - 架构: $ARCH"
echo ""

# 检查是否为Ubuntu
if [ "$OS" != "ubuntu" ]; then
  echo "警告: 此脚本专为Ubuntu设计,其他发行版可能需要手动调整"
  read -p "是否继续? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 更新系统包列表
echo "[1/8] 更新系统包列表..."
apt-get update -qq
echo "✓ 系统包列表已更新"
echo ""

# 安装基础工具
echo "[2/8] 安装基础工具..."
apt-get install -y \
  curl \
  wget \
  git \
  build-essential \
  ca-certificates \
  gnupg \
  lsb-release \
  software-properties-common
echo "✓ 基础工具安装完成"
echo ""

# 安装Docker
echo "[3/8] 安装Docker..."
if command -v docker &> /dev/null; then
  echo "✓ Docker已安装: $(docker --version)"
else
  # 添加Docker官方GPG密钥
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  
  # 添加Docker仓库
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  
  # 安装Docker Engine
  apt-get update -qq
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  
  # 启动Docker服务
  systemctl enable docker
  systemctl start docker
  
  # 添加当前用户到docker组
  if [ -n "$SUDO_USER" ]; then
    usermod -aG docker $SUDO_USER
  fi
  
  echo "✓ Docker安装完成: $(docker --version)"
fi
echo ""

# 安装QEMU/KVM
echo "[4/8] 安装QEMU/KVM虚拟化..."

# 检查CPU虚拟化支持
if egrep -c '(vmx|svm)' /proc/cpuinfo > /dev/null; then
  echo "✓ CPU支持硬件虚拟化"
  KVM_SUPPORT=true
else
  echo "⚠ CPU不支持硬件虚拟化,将使用QEMU软件模拟"
  KVM_SUPPORT=false
fi

# 根据架构安装对应的QEMU包
if [ "$ARCH" = "x86_64" ]; then
  apt-get install -y qemu-system-x86 qemu-utils qemu-kvm
elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
  # ARM架构安装QEMU,支持多架构虚拟化
  apt-get install -y qemu-system-x86 qemu-system-arm qemu-utils qemu-efi-aarch64 qemu-efi-arm
  echo "✓ 已安装ARM和x86 QEMU支持"
else
  echo "警告: 未知架构 $ARCH,尝试安装通用QEMU包"
  apt-get install -y qemu-system qemu-utils
fi

# 安装KVM相关包(如果支持)
if [ "$KVM_SUPPORT" = true ]; then
  apt-get install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils virt-manager
  
  # 加载KVM模块
  modprobe kvm || true
  if [ "$ARCH" = "x86_64" ]; then
    modprobe kvm-intel || modprobe kvm-amd || true
  fi
  
  # 检查KVM设备
  if [ -e /dev/kvm ]; then
    chmod 666 /dev/kvm
    echo "✓ KVM模块加载成功"
  else
    echo "⚠ KVM设备不可用,将使用QEMU软件模拟"
  fi
  
  # 启动libvirt服务
  systemctl enable libvirtd
  systemctl start libvirtd
fi

# 验证QEMU安装
if command -v qemu-system-x86_64 &> /dev/null; then
  QEMU_VERSION=$(qemu-system-x86_64 --version | head -n 1)
  echo "✓ QEMU安装成功: $QEMU_VERSION"
else
  echo "错误: QEMU安装失败"
  exit 1
fi
echo ""

# 安装网络工具
echo "[5/8] 安装网络工具..."
apt-get install -y \
  bridge-utils \
  iproute2 \
  iptables \
  iptables-persistent \
  dnsmasq \
  net-tools \
  ethtool \
  vlan \
  tcpdump \
  nftables
  
# 停止dnsmasq服务(稍后由脚本管理)
systemctl stop dnsmasq || true
systemctl disable dnsmasq || true

echo "✓ 网络工具安装完成"
echo ""

# 安装Node.js和pnpm
echo "[6/8] 安装Node.js和pnpm..."
if command -v node &> /dev/null; then
  echo "✓ Node.js已安装: $(node --version)"
else
  # 安装Node.js 22.x
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
  echo "✓ Node.js安装完成: $(node --version)"
fi

if command -v pnpm &> /dev/null; then
  echo "✓ pnpm已安装: $(pnpm --version)"
else
  npm install -g pnpm
  echo "✓ pnpm安装完成: $(pnpm --version)"
fi
echo ""

# 安装MySQL
echo "[7/8] 安装MySQL数据库..."
if command -v mysql &> /dev/null; then
  echo "✓ MySQL已安装: $(mysql --version)"
else
  # 设置MySQL root密码(默认为urouteros123)
  debconf-set-selections <<< 'mysql-server mysql-server/root_password password urouteros123'
  debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password urouteros123'
  
  apt-get install -y mysql-server mysql-client
  
  # 启动MySQL服务
  systemctl enable mysql
  systemctl start mysql
  
  # 创建数据库和用户
  mysql -uroot -purouteros123 -e "CREATE DATABASE IF NOT EXISTS urouteros CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  mysql -uroot -purouteros123 -e "CREATE USER IF NOT EXISTS 'urouteros'@'localhost' IDENTIFIED BY 'urouteros123';"
  mysql -uroot -purouteros123 -e "GRANT ALL PRIVILEGES ON urouteros.* TO 'urouteros'@'localhost';"
  mysql -uroot -purouteros123 -e "FLUSH PRIVILEGES;"
  
  echo "✓ MySQL安装完成"
  echo "  - 数据库: urouteros"
  echo "  - 用户: urouteros"
  echo "  - 密码: urouteros123"
fi
echo ""

# 配置IOMMU和vfio-pci(如果硬件支持)
echo "[8/8] 配置硬件直通支持..."

# 检查IOMMU支持
if [ -d "/sys/kernel/iommu_groups" ] && [ "$(ls -A /sys/kernel/iommu_groups)" ]; then
  echo "✓ IOMMU已启用"
  IOMMU_ENABLED=true
else
  echo "⚠ IOMMU未启用,需要在BIOS中启用VT-d/AMD-Vi并添加内核参数"
  echo "  请在/etc/default/grub中添加:"
  if [ "$ARCH" = "x86_64" ]; then
    echo "  GRUB_CMDLINE_LINUX_DEFAULT=\"... intel_iommu=on iommu=pt\""
  fi
  echo "  然后运行: sudo update-grub && sudo reboot"
  IOMMU_ENABLED=false
fi

# 安装vfio-pci模块
if [ "$IOMMU_ENABLED" = true ]; then
  if ! lsmod | grep -q vfio_pci; then
    modprobe vfio-pci || true
  fi
  
  # 添加vfio-pci到自动加载
  if ! grep -q "vfio-pci" /etc/modules; then
    echo "vfio-pci" >> /etc/modules
  fi
  
  echo "✓ vfio-pci模块已配置"
fi
echo ""

# 创建存储目录
echo "创建URouterOS存储目录..."
mkdir -p /var/lib/urouteros/vms
mkdir -p /var/lib/urouteros/iso
mkdir -p /var/lib/urouteros/containers
mkdir -p /var/log/urouteros

if [ -n "$SUDO_USER" ]; then
  chown -R $SUDO_USER:$SUDO_USER /var/lib/urouteros
  chown -R $SUDO_USER:$SUDO_USER /var/log/urouteros
fi

echo "✓ 存储目录创建完成"
echo ""

# 输出总结
echo "========================================="
echo "系统依赖安装完成!"
echo "========================================="
echo ""
echo "已安装组件:"
echo "  - Docker: $(docker --version | cut -d' ' -f3)"
echo "  - QEMU: $QEMU_VERSION"
echo "  - KVM支持: $KVM_SUPPORT"
echo "  - Node.js: $(node --version)"
echo "  - pnpm: $(pnpm --version)"
echo "  - MySQL: $(mysql --version | cut -d' ' -f6)"
echo "  - IOMMU: $IOMMU_ENABLED"
echo ""
echo "下一步:"
echo "  1. 运行网络配置脚本: sudo ./setup-network.sh"
echo "  2. 运行应用部署脚本: sudo ./deploy-app.sh"
echo "  3. 配置systemd服务: sudo ./setup-systemd.sh"
echo ""

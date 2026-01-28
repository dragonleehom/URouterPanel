#!/bin/bash
#
# URouterOS 虚拟机环境部署脚本
# 安装QEMU、检测KVM支持、创建存储目录
#

set -e

echo "========================================="
echo "URouterOS 虚拟机环境部署脚本"
echo "========================================="
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
  echo "错误: 请使用root权限运行此脚本 (sudo ./setup-vm-environment.sh)"
  exit 1
fi

# 检测操作系统
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
  VERSION=$VERSION_ID
else
  echo "错误: 无法检测操作系统"
  exit 1
fi

echo "检测到操作系统: $OS $VERSION"
echo ""

# 检查CPU虚拟化支持
echo "[1/5] 检查CPU虚拟化支持..."
if egrep -c '(vmx|svm)' /proc/cpuinfo > /dev/null; then
  echo "✓ CPU支持硬件虚拟化 (KVM加速可用)"
  KVM_SUPPORT=true
else
  echo "⚠ CPU不支持硬件虚拟化 (将使用QEMU软件模拟)"
  KVM_SUPPORT=false
fi
echo ""

# 安装QEMU
echo "[2/5] 安装QEMU虚拟化软件..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
  apt-get update -qq
  apt-get install -y qemu-system-x86 qemu-utils
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
  yum install -y qemu-kvm qemu-img
elif [ "$OS" = "fedora" ]; then
  dnf install -y qemu-system-x86 qemu-img
else
  echo "错误: 不支持的操作系统: $OS"
  exit 1
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

# 安装KVM(如果支持)
if [ "$KVM_SUPPORT" = true ]; then
  echo "[3/5] 安装KVM内核模块..."
  if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get install -y qemu-kvm libvirt-daemon-system
  elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
    yum install -y qemu-kvm libvirt -y || dnf install -y qemu-kvm libvirt
  fi
  
  # 加载KVM模块
  modprobe kvm || true
  if [ -e /dev/kvm ]; then
    echo "✓ KVM模块加载成功"
    chmod 666 /dev/kvm
  else
    echo "⚠ KVM模块加载失败,将使用QEMU软件模拟"
  fi
else
  echo "[3/5] 跳过KVM安装 (CPU不支持)"
fi
echo ""

# 创建虚拟机存储目录
echo "[4/5] 创建虚拟机存储目录..."
VM_STORAGE_PATH="/var/lib/urouteros/vms"
mkdir -p "$VM_STORAGE_PATH"
chown -R ubuntu:ubuntu /var/lib/urouteros 2>/dev/null || chown -R $SUDO_USER:$SUDO_USER /var/lib/urouteros
chmod 755 "$VM_STORAGE_PATH"
echo "✓ 存储目录创建成功: $VM_STORAGE_PATH"
echo ""

# 测试QEMU基本功能
echo "[5/5] 测试QEMU基本功能..."
if qemu-img create -f qcow2 /tmp/test-vm.qcow2 1G &> /dev/null; then
  echo "✓ QEMU镜像创建测试通过"
  rm -f /tmp/test-vm.qcow2
else
  echo "错误: QEMU功能测试失败"
  exit 1
fi
echo ""

# 输出总结
echo "========================================="
echo "虚拟机环境部署完成!"
echo "========================================="
echo ""
echo "环境信息:"
echo "  - QEMU版本: $QEMU_VERSION"
echo "  - KVM支持: $KVM_SUPPORT"
echo "  - 存储路径: $VM_STORAGE_PATH"
echo ""
echo "下一步:"
echo "  1. 重启URouterOS服务: sudo systemctl restart urouteros"
echo "  2. 访问Web界面: http://your-server-ip:3000/vms"
echo "  3. 创建虚拟机并上传ISO镜像"
echo ""

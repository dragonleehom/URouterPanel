# URouterOS 部署指南

本文档提供URouterOS在ARM架构Ubuntu设备上的完整部署指南。

## 系统要求

### 硬件要求
- **CPU**: ARM64/aarch64架构(如树莓派4、Orange Pi、Jetson Nano等)
- **内存**: 最低2GB RAM,推荐4GB以上
- **存储**: 最低16GB,推荐32GB以上(用于虚拟机镜像存储)
- **网络**: 至少1个网络接口(推荐2个或以上,用于WAN/LAN分离)

### 软件要求
- **操作系统**: Ubuntu 20.04/22.04/24.04 LTS (ARM64版本)
- **权限**: root或sudo权限

## 快速部署

### 一键部署(推荐)

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/urouteros.git
cd urouteros

# 2. 运行一键部署脚本
sudo ./scripts/install-all.sh
```

一键部署脚本将自动完成:
1. 安装所有系统依赖(Docker、QEMU、网络工具等)
2. 自动检测并配置网络(WAN/LAN)
3. 部署应用(安装依赖、构建、初始化数据库)
4. 配置systemd服务(开机自启动)

部署完成后,访问 `http://192.168.188.1:3000` 即可使用Web界面。

## 分步部署

如果需要更精细的控制,可以分步执行:

### 步骤1: 安装系统依赖

```bash
sudo ./scripts/install-dependencies.sh
```

此脚本将安装:
- Docker(容器管理)
- QEMU/KVM(虚拟机支持)
- 网络工具(bridge-utils, iptables, dnsmasq等)
- Node.js 22.x和pnpm
- MySQL数据库

### 步骤2: 配置网络

```bash
sudo ./scripts/setup-network.sh
```

此脚本将:
- 自动检测连接Internet的网络接口作为WAN
- 配置WAN为DHCP客户端模式
- 将剩余接口配置为LAN(网桥br-lan)
- 配置DHCP服务器(192.168.188.1/24, IP范围2-254)
- 配置NAT转发和防火墙规则

### 步骤3: 部署应用

```bash
sudo ./scripts/deploy-app.sh
```

此脚本将:
- 安装Node.js依赖
- 创建.env配置文件
- 初始化数据库schema
- 构建前端和后端代码

### 步骤4: 配置systemd服务

```bash
sudo ./scripts/setup-systemd.sh
```

此脚本将:
- 创建systemd服务文件
- 启用开机自启动
- 启动URouterOS服务

## 网络配置

### 默认网络拓扑

```
Internet
   |
   | (DHCP Client)
   |
[WAN接口] ---- [URouterOS设备] ---- [LAN接口/br-lan] ---- 局域网设备
                                      (192.168.188.1/24)
```

### 默认配置

- **WAN接口**: 自动检测,DHCP客户端模式
- **LAN网桥**: br-lan
- **LAN IP**: 192.168.188.1/24
- **DHCP范围**: 192.168.188.2 - 192.168.188.254
- **默认网关**: 192.168.188.1
- **DNS服务器**: 192.168.188.1(转发到8.8.8.8/8.8.4.4)

### 手动修改网络配置

如需修改网络配置,编辑以下文件:

```bash
# 修改WAN配置
sudo nano /etc/network/interfaces.d/wan

# 修改LAN配置
sudo nano /etc/network/interfaces.d/lan

# 修改DHCP服务器配置
sudo nano /etc/dnsmasq.conf

# 重启网络服务
sudo systemctl restart networking
sudo systemctl restart dnsmasq
```

## 代码更新

### 自动更新(推荐)

当GitHub仓库有新代码更新时,使用update.sh脚本一键更新:

```bash
cd /path/to/urouteros
sudo ./scripts/update.sh
```

更新脚本将自动完成:
1. 停止URouterOS服务
2. 备份当前代码到 `/var/backups/urouteros/`
3. 从GitHub拉取最新代码
4. 检查并安装新增依赖
5. 运行数据库迁移
6. 重新构建应用
7. 重启服务

更新过程预计耗时: 3-5分钟

### 手动更新

如果需要手动控制更新过程:

```bash
cd /path/to/urouteros

# 1. 停止服务
sudo systemctl stop urouteros

# 2. 备份代码(可选)
tar -czf ~/urouteros_backup_$(date +%Y%m%d).tar.gz .

# 3. 拉取最新代码
git pull origin main

# 4. 安装依赖
pnpm install

# 5. 运行数据库迁移
pnpm db:push

# 6. 重新构建
pnpm build

# 7. 启动服务
sudo systemctl start urouteros
```

### 回滚到之前版本

如果更新后出现问题,可以回滚到备份版本:

```bash
# 1. 停止服务
sudo systemctl stop urouteros

# 2. 恢复备份
sudo tar -xzf /var/backups/urouteros/urouteros_backup_YYYYMMDD_HHMMSS.tar.gz -C /path/to/urouteros

# 3. 启动服务
sudo systemctl start urouteros
```

或者使用Git回滚到指定版本:

```bash
cd /path/to/urouteros

# 查看提交历史
git log --oneline -10

# 回滚到指定版本
git reset --hard <commit-hash>

# 重新构建并重启
pnpm install
pnpm build
sudo systemctl restart urouteros
```

## 服务管理

### 常用命令

```bash
# 查看服务状态
sudo systemctl status urouteros

# 启动服务
sudo systemctl start urouteros

# 停止服务
sudo systemctl stop urouteros

# 重启服务
sudo systemctl restart urouteros

# 查看实时日志
sudo journalctl -u urouteros -f

# 查看最近日志
sudo journalctl -u urouteros -n 100
```

### 服务配置文件

- **systemd服务**: `/etc/systemd/system/urouteros.service`
- **应用配置**: `/path/to/urouteros/.env`
- **日志目录**: `/var/log/urouteros/`

## 数据库管理

### 默认配置

- **数据库名**: urouteros
- **用户名**: urouteros
- **密码**: urouteros123
- **连接地址**: localhost:3306

### 数据库操作

```bash
# 连接数据库
mysql -u urouteros -purouteros123 urouteros

# 备份数据库
mysqldump -u urouteros -purouteros123 urouteros > backup.sql

# 恢复数据库
mysql -u urouteros -purouteros123 urouteros < backup.sql
```

## 虚拟机存储

### 存储目录

- **虚拟机磁盘**: `/var/lib/urouteros/vms/`
- **ISO镜像**: `/var/lib/urouteros/iso/`
- **容器数据**: `/var/lib/urouteros/containers/`

### 磁盘空间管理

```bash
# 查看存储使用情况
df -h /var/lib/urouteros

# 清理未使用的虚拟机磁盘
sudo find /var/lib/urouteros/vms -name "*.qcow2" -type f -mtime +30

# 压缩虚拟机磁盘
sudo qemu-img convert -O qcow2 -c old.qcow2 new.qcow2
```

## 硬件直通配置

### 启用IOMMU

如需使用GPU直通、网卡SR-IOV等高级功能,需要在BIOS中启用IOMMU:

1. 进入BIOS设置
2. 找到虚拟化选项(Virtualization Technology)
3. 启用VT-d(Intel)或AMD-Vi(AMD)
4. 保存并重启

### 配置内核参数

编辑GRUB配置:

```bash
sudo nano /etc/default/grub
```

添加内核参数:

```
# Intel CPU
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash intel_iommu=on iommu=pt"

# AMD CPU
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash amd_iommu=on iommu=pt"
```

更新GRUB并重启:

```bash
sudo update-grub
sudo reboot
```

### 验证IOMMU

```bash
# 检查IOMMU组
ls /sys/kernel/iommu_groups/

# 查看设备IOMMU组
for d in /sys/kernel/iommu_groups/*/devices/*; do 
  n=${d#*/iommu_groups/*}
  n=${n%%/*}
  printf 'IOMMU Group %s ' "$n"
  lspci -nns "${d##*/}"
done
```

## 故障排查

### 服务无法启动

```bash
# 查看详细错误日志
sudo journalctl -u urouteros -n 100 --no-pager

# 检查端口占用
sudo netstat -tlnp | grep 3000

# 检查数据库连接
mysql -u urouteros -purouteros123 -e "SELECT 1"
```

### 网络无法访问

```bash
# 检查网络接口状态
ip addr show

# 检查路由表
ip route show

# 检查防火墙规则
sudo iptables -L -n -v

# 检查DHCP服务
sudo systemctl status dnsmasq
```

### 虚拟机无法启动

```bash
# 检查KVM支持
lsmod | grep kvm

# 检查/dev/kvm权限
ls -l /dev/kvm

# 手动测试QEMU
qemu-system-x86_64 --version
```

## 性能优化

### 系统优化

```bash
# 启用大页内存(Hugepages)
echo 1024 | sudo tee /sys/kernel/mm/hugepages/hugepages-2048kB/nr_hugepages

# 永久配置
echo "vm.nr_hugepages=1024" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 虚拟机优化

在Web界面创建虚拟机时,使用"性能优化"标签页:
- 启用CPU Pinning(将vCPU绑定到物理核心)
- 配置NUMA节点绑定
- 启用大页内存
- 配置GPU/网卡直通

## 安全建议

1. **修改默认密码**: 首次登录后立即修改数据库密码
2. **启用防火墙**: 仅开放必要端口(22, 3000)
3. **定期备份**: 定期备份数据库和虚拟机磁盘
4. **更新系统**: 定期更新Ubuntu和应用依赖
5. **监控日志**: 定期检查系统和应用日志

## 卸载

```bash
# 停止并禁用服务
sudo systemctl stop urouteros
sudo systemctl disable urouteros
sudo rm /etc/systemd/system/urouteros.service

# 删除应用文件
sudo rm -rf /path/to/urouteros

# 删除数据库
mysql -u root -p -e "DROP DATABASE urouteros; DROP USER 'urouteros'@'localhost';"

# 删除存储目录
sudo rm -rf /var/lib/urouteros

# 卸载依赖(可选)
sudo apt-get remove --purge docker-ce qemu-system mysql-server
```

## 支持

如遇到问题,请:
1. 查看本文档的故障排查章节
2. 查看GitHub Issues: https://github.com/yourusername/urouteros/issues
3. 提交新Issue并附上详细日志

## 更新日志

- **v1.0.0** (2026-01-28): 初始版本,支持ARM架构部署

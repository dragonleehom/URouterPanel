# URouterOS 权限需求分析

## 需要Root权限的命令分类

### 1. 网络接口管理 (networkInterfaceService.ts)
- `ip addr` - 配置IP地址
- `ip link` - 启用/禁用接口,创建/删除桥接
- `ip route` - 配置路由
- `ethtool` - 查询网卡信息(只读,可能不需要sudo)

### 2. 无线网络管理 (wirelessService.ts)
- `iw` - 无线接口配置和客户端管理
- `hostapd` - WiFi热点服务
- `systemctl` - 管理hostapd服务

### 3. DHCP/DNS管理 (dhcpService.ts)
- `systemctl` - 管理dnsmasq服务
- `tee` - 写入配置文件到/etc目录

### 4. 防火墙管理 (未实现)
- `iptables` - IPv4防火墙规则
- `ip6tables` - IPv6防火墙规则
- `iptables-save` - 保存防火墙规则
- `iptables-restore` - 恢复防火墙规则

### 5. 系统监控 (只读操作,可能不需要sudo)
- `/sys/class/net/` - 读取网络接口信息
- `/proc/` - 读取系统信息

## 修复策略

1. **网络命令**: 所有`ip`命令都需要添加`sudo`前缀
2. **服务管理**: 所有`systemctl`命令都需要添加`sudo`前缀
3. **配置文件写入**: 使用`sudo tee`写入/etc目录下的文件
4. **只读操作**: ethtool, /sys, /proc等只读操作先测试是否需要sudo

## 需要修改的文件

1. `server/services/networkInterfaceService.ts` - 添加sudo到所有ip命令
2. `server/services/dhcpService.ts` - 添加sudo到所有systemctl和tee命令
3. `server/services/wirelessService.ts` - 确保所有需要的命令都有sudo
4. `scripts/setup-sudo.sh` - 更新sudo权限配置

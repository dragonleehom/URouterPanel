# OpenWrt网络管理功能分析

## OpenWrt网络架构概览

根据OpenWrt官方文档,OpenWrt的网络管理由以下核心组件构成:

### 1. 网络配置层次结构

```
LuCI (Web UI)
    ↓
UCI Network Subsystem (/etc/config/network)
    ↓
netifid (Network Interface Daemon)
    ↓
Linux Kernel Network Stack
```

### 2. 核心配置文件

- `/etc/config/network` - 网络接口、设备、路由配置
- `/etc/config/wireless` - 无线网络配置
- `/etc/config/firewall` - 防火墙规则配置
- `/etc/config/dhcp` - DHCP/DNS服务器配置

### 3. OpenWrt网络管理核心功能模块

根据OpenWrt官方文档和LuCI界面,网络管理包含以下主要功能:

#### 3.1 接口配置 (Interfaces)
- **逻辑接口管理** (lan/wan/wan6等)
- **物理设备绑定** (device option)
- **协议支持**:
  - Static (静态IP)
  - DHCP Client (DHCP客户端)
  - PPPoE (拨号上网)
  - 3G/4G/LTE (移动网络)
  - IPv6 (DHCPv6, 6in4, 6to4, 6rd等)
  - VPN (OpenVPN, WireGuard, L2TP, PPTP等)
- **接口选项**:
  - MTU设置
  - MAC地址克隆
  - 开机自动启动
  - IPv6启用/禁用
  - 强制链路状态
  - 路由表选择(ip4table/ip6table)

#### 3.2 交换机/VLAN配置 (Switch/VLAN)
- **DSA (Distributed Switch Architecture)** - OpenWrt 21.02+
- **Legacy swconfig** - OpenWrt 21.02之前
- **VLAN配置**:
  - VLAN ID分配
  - 端口标记(Tagged/Untagged)
  - 端口隔离
  - 镜像端口

#### 3.3 桥接配置 (Bridge)
- **网桥创建** (br-lan等)
- **网桥成员管理** (添加/移除接口)
- **STP/RSTP** (生成树协议)
- **IGMP Snooping** (组播管理)

#### 3.4 无线网络配置 (Wireless)
- **WiFi设备管理** (radio0/radio1等)
- **SSID配置**:
  - 网络名称(ESSID)
  - 加密方式(WPA2/WPA3/WEP/Open)
  - 密码设置
  - 隐藏SSID
  - 最大客户端数
- **高级选项**:
  - 信道选择
  - 发射功率
  - 国家代码
  - 802.11n/ac/ax模式
  - 频宽(20/40/80/160MHz)

#### 3.5 防火墙配置 (Firewall)
- **防火墙区域** (Zone):
  - wan/lan/guest/dmz等
  - 区域间转发规则
  - 默认策略(ACCEPT/REJECT/DROP)
- **端口转发** (Port Forwarding)
- **NAT配置**:
  - SNAT (Source NAT)
  - DNAT (Destination NAT)
  - MASQUERADE (IP伪装)
- **流量规则** (Traffic Rules):
  - 源/目标IP过滤
  - 端口过滤
  - 协议过滤(TCP/UDP/ICMP等)
- **自定义规则** (Custom Rules)

#### 3.6 DHCP/DNS服务器 (DHCP and DNS)
- **DHCP服务器配置**:
  - 地址池范围
  - 租期时间
  - 网关设置
  - DNS服务器设置
  - 静态地址分配(MAC绑定)
  - DHCP选项(Option 66/67等)
- **DNS配置**:
  - DNS转发器
  - DNS缓存
  - 本地域名解析
  - Hosts文件管理

#### 3.7 静态路由配置 (Static Routes)
- **IPv4路由**:
  - 目标网络
  - 网关
  - 跃点数(Metric)
  - 路由表选择
- **IPv6路由**:
  - 目标前缀
  - 网关
  - 跃点数

#### 3.8 QoS流量控制 (QoS / SQM)
- **SQM (Smart Queue Management)**:
  - 上传/下载带宽限制
  - 队列算法(fq_codel/cake等)
  - 流量整形
- **传统QoS**:
  - 流量分类
  - 优先级设置
  - 带宽限制

#### 3.9 网络诊断工具 (Diagnostics)
- **Ping** (连通性测试)
- **Traceroute** (路由追踪)
- **Nslookup** (DNS查询)
- **网络统计** (实时流量监控)
- **ARP表查看**
- **路由表查看**
- **连接跟踪** (Conntrack)

#### 3.10 高级功能
- **多WAN负载均衡** (mwan3)
- **动态DNS** (DDNS)
- **UPnP** (通用即插即用)
- **IPv6前缀委托** (DHCPv6-PD)
- **热点认证** (Captive Portal)
- **VPN服务器** (OpenVPN/WireGuard)

## OpenWrt配置管理机制

### 配置应用流程

OpenWrt使用UCI (Unified Configuration Interface)系统管理配置:

1. **配置修改**: 修改`/etc/config/*`文件
2. **配置验证**: UCI系统验证配置语法
3. **配置提交**: `uci commit`保存配置
4. **服务重启**: `/etc/init.d/network restart`应用配置

### 配置回滚机制

OpenWrt提供配置回滚功能:
- **备份配置**: `/sbin/sysupgrade -b /tmp/backup.tar.gz`
- **恢复配置**: `/sbin/sysupgrade -r /tmp/backup.tar.gz`
- **重置配置**: `firstboot && reboot`

### LuCI的保存/应用机制

LuCI (Web界面)提供三种配置操作:
1. **Save** (保存): 修改UCI配置但不应用
2. **Save & Apply** (保存并应用): 修改UCI配置并重启相关服务
3. **Revert** (复位): 放弃未应用的修改

## 参考资料

- [OpenWrt Network Configuration](https://openwrt.org/docs/guide-user/network/network_configuration)
- [OpenWrt Firewall Configuration](https://openwrt.org/docs/guide-user/firewall/firewall_configuration)
- [OpenWrt Wireless Configuration](https://openwrt.org/docs/guide-user/network/wifi/basic)
- [OpenWrt DHCP and DNS Configuration](https://openwrt.org/docs/guide-user/base-system/dhcp)

---

# URouterOS vs OpenWrt 功能对比清单

## 功能对比矩阵

| 功能模块 | OpenWrt支持 | URouterOS当前状态 | 完成度 | 缺失功能 |
|---------|------------|------------------|--------|---------|
| **1. 接口配置** | ✅ 完整 | 🟡 部分实现 | 60% | - 缺少PPPoE/3G/4G协议支持<br>- 缺少MAC地址克隆<br>- 缺少IPv6配置UI |
| **2. 交换机/VLAN** | ✅ 完整 | ❌ 未实现 | 0% | - 无VLAN配置功能<br>- 无端口标记功能<br>- 无端口隔离功能 |
| **3. 桥接配置** | ✅ 完整 | ❌ 未实现 | 0% | - 无网桥创建UI<br>- 无STP/RSTP支持<br>- 无IGMP Snooping |
| **4. 无线网络** | ✅ 完整 | ❌ 未实现 | 0% | - 无WiFi配置UI<br>- 无SSID管理<br>- 无加密配置 |
| **5. 防火墙** | ✅ 完整 | 🟡 部分实现 | 40% | - 缺少端口转发UI<br>- 缺少自定义规则UI<br>- 缺少流量规则UI |
| **6. DHCP/DNS** | ✅ 完整 | 🟡 部分实现 | 50% | - 缺少静态地址分配UI<br>- 缺少DNS转发器配置<br>- 缺少Hosts管理 |
| **7. 静态路由** | ✅ 完整 | ❌ 未实现 | 0% | - 无静态路由配置UI<br>- 无路由表管理 |
| **8. QoS流量控制** | ✅ 完整 | ❌ 未实现 | 0% | - 无QoS配置UI<br>- 无带宽限制功能<br>- 无流量整形 |
| **9. 网络诊断** | ✅ 完整 | ❌ 未实现 | 0% | - 无Ping/Traceroute工具<br>- 无DNS查询工具<br>- 无实时流量监控 |
| **10. 高级功能** | ✅ 完整 | ❌ 未实现 | 0% | - 无多WAN负载均衡<br>- 无DDNS支持<br>- 无UPnP支持 |

**总体完成度**: **15%** (仅完成基础接口配置和部分防火墙功能)

---

## 详细功能缺失清单

### 🔴 高优先级 (核心路由器功能)

#### 1. DHCP/DNS服务器完善
**当前状态**: 后端已实现基础DHCP服务器配置,但前端UI不完整
**缺失功能**:
- [ ] 静态地址分配(MAC绑定)UI
- [ ] DNS转发器配置UI
- [ ] 本地域名解析UI
- [ ] Hosts文件管理UI
- [ ] DHCP选项配置(Option 66/67等)

#### 2. 静态路由配置
**当前状态**: 完全未实现
**需要实现**:
- [ ] 数据库schema扩展(routes表)
- [ ] 后端API (添加/删除/修改路由)
- [ ] 后端配置应用器(应用到系统路由表)
- [ ] 前端UI (路由列表+添加/编辑对话框)
- [ ] IPv4/IPv6路由支持
- [ ] 路由表选择(main/custom)

#### 3. 端口转发/NAT规则
**当前状态**: 完全未实现
**需要实现**:
- [ ] 数据库schema扩展(port_forwarding表)
- [ ] 后端API (添加/删除/修改转发规则)
- [ ] 后端配置应用器(应用到firewalld)
- [ ] 前端UI (转发规则列表+添加/编辑对话框)
- [ ] DNAT/SNAT支持
- [ ] 端口范围支持

#### 4. 防火墙自定义规则
**当前状态**: 完全未实现
**需要实现**:
- [ ] 数据库schema扩展(firewall_rules表)
- [ ] 后端API (添加/删除/修改规则)
- [ ] 后端配置应用器(应用到firewalld)
- [ ] 前端UI (规则列表+添加/编辑对话框)
- [ ] 源/目标IP过滤
- [ ] 端口/协议过滤

#### 5. 网络诊断工具
**当前状态**: 完全未实现
**需要实现**:
- [ ] 后端API (执行ping/traceroute/nslookup)
- [ ] 前端UI (诊断工具页面)
- [ ] 实时输出显示
- [ ] 结果保存/导出

---

### 🟡 中优先级 (增强功能)

#### 6. QoS流量控制
**当前状态**: 完全未实现
**需要实现**:
- [ ] 数据库schema扩展(qos_rules表)
- [ ] 后端API (添加/删除/修改QoS规则)
- [ ] 后端配置应用器(使用tc命令)
- [ ] 前端UI (QoS规则列表+配置对话框)
- [ ] 上传/下载带宽限制
- [ ] 流量优先级设置

#### 7. VLAN配置
**当前状态**: 完全未实现
**需要实现**:
- [ ] 数据库schema扩展(vlan_config表)
- [ ] 后端API (添加/删除/修改VLAN)
- [ ] 后端配置应用器(使用ip link命令)
- [ ] 前端UI (VLAN配置页面)
- [ ] VLAN ID分配
- [ ] 端口标记(Tagged/Untagged)

#### 8. 网桥配置
**当前状态**: 完全未实现
**需要实现**:
- [ ] 数据库schema扩展(bridge_config表)
- [ ] 后端API (添加/删除/修改网桥)
- [ ] 后端配置应用器(使用ip link命令)
- [ ] 前端UI (网桥配置页面)
- [ ] 网桥成员管理
- [ ] STP/RSTP支持

#### 9. 无线网络配置
**当前状态**: 完全未实现
**需要实现**:
- [ ] 数据库schema扩展(wireless_config表)
- [ ] 后端API (添加/删除/修改WiFi)
- [ ] 后端配置应用器(使用hostapd)
- [ ] 前端UI (WiFi配置页面)
- [ ] SSID管理
- [ ] 加密配置(WPA2/WPA3)
- [ ] 信道/功率设置

---

### 🟢 低优先级 (高级功能)

#### 10. 多WAN负载均衡
**当前状态**: 完全未实现
**需要实现**:
- [ ] 数据库schema扩展(mwan_config表)
- [ ] 后端API (配置多WAN策略)
- [ ] 后端配置应用器(使用mwan3或自定义脚本)
- [ ] 前端UI (多WAN配置页面)

#### 11. 动态DNS (DDNS)
**当前状态**: 完全未实现
**需要实现**:
- [ ] 数据库schema扩展(ddns_config表)
- [ ] 后端API (配置DDNS服务)
- [ ] 后端配置应用器(使用ddclient)
- [ ] 前端UI (DDNS配置页面)

#### 12. UPnP支持
**当前状态**: 完全未实现
**需要实现**:
- [ ] 后端API (启用/禁用UPnP)
- [ ] 后端配置应用器(使用miniupnpd)
- [ ] 前端UI (UPnP开关+设备列表)

---

## 配置管理机制设计

### 保存/应用/复位机制

参考OpenWrt的UCI配置管理机制,URouterOS需要实现以下三种操作:

#### 1. **Save** (保存)
- **行为**: 仅将修改保存到数据库,不应用到系统
- **实现**:
  - 前端: 调用`trpc.network.saveConfig.useMutation()`
  - 后端: 写入数据库,不调用配置应用器
  - 数据库: 添加`pending_changes`标记字段

#### 2. **Save & Apply** (保存并应用)
- **行为**: 保存到数据库并立即应用到系统
- **实现**:
  - 前端: 调用`trpc.network.saveAndApplyConfig.useMutation()`
  - 后端: 写入数据库 + 调用配置应用器
  - 配置应用器: 执行系统命令(ip/firewall-cmd/systemctl等)
  - 错误处理: 应用失败时回滚数据库

#### 3. **Revert/Reset** (复位)
- **行为**: 放弃未应用的修改,恢复到上次应用的状态
- **实现**:
  - 前端: 调用`trpc.network.revertConfig.useMutation()`
  - 后端: 从数据库读取上次应用的配置
  - 前端: 重新渲染UI

### 配置状态管理

数据库需要扩展以下字段来支持配置状态管理:

```typescript
// 所有配置表添加以下字段
interface ConfigState {
  pending_changes: boolean;  // 是否有未应用的修改
  last_applied_at: Date;     // 上次应用时间
  last_applied_config: JSON; // 上次应用的配置快照
  apply_status: 'success' | 'failed' | 'pending'; // 应用状态
  apply_error: string;       // 应用失败的错误信息
}
```

### 配置应用流程

```
用户修改配置
    ↓
点击"Save"按钮
    ↓
写入数据库 (pending_changes=true)
    ↓
显示"未应用"提示
    ↓
点击"Save & Apply"按钮
    ↓
调用配置应用器
    ↓
执行系统命令
    ↓
成功? 
    ├─ 是 → 更新数据库(pending_changes=false, apply_status='success')
    └─ 否 → 回滚数据库 + 显示错误信息
```

### 配置回滚机制

为防止配置错误导致系统无法访问,需要实现自动回滚机制:

1. **应用前备份**: 应用配置前保存当前系统状态
2. **超时检测**: 应用配置后等待用户确认(60秒)
3. **自动回滚**: 超时未确认则自动回滚到备份状态
4. **手动回滚**: 用户可手动触发回滚

---

## 实现优先级建议

根据路由器核心功能的重要性,建议按以下顺序实现:

### Phase 1: 核心路由功能 (1-2周)
1. ✅ 接口配置 (已完成60%)
2. 🔴 DHCP/DNS服务器完善 (静态地址分配、DNS转发)
3. 🔴 静态路由配置
4. 🔴 端口转发/NAT规则

### Phase 2: 安全与诊断 (1周)
5. 🔴 防火墙自定义规则
6. 🔴 网络诊断工具 (Ping/Traceroute/Nslookup)

### Phase 3: 流量管理 (1周)
7. 🟡 QoS流量控制
8. 🟡 实时流量监控

### Phase 4: 高级网络功能 (2周)
9. 🟡 VLAN配置
10. 🟡 网桥配置
11. 🟡 无线网络配置

### Phase 5: 增值功能 (1-2周)
12. 🟢 多WAN负载均衡
13. 🟢 动态DNS (DDNS)
14. 🟢 UPnP支持

**预计总开发时间**: 6-8周

---

## 技术实现建议

### 数据库Schema扩展

建议创建以下新表:

```prisma
// 静态路由表
model StaticRoute {
  id              Int      @id @default(autoincrement())
  destination     String   // 目标网络 (e.g., "192.168.2.0/24")
  gateway         String   // 网关IP
  metric          Int      @default(0)
  interface       String?  // 出接口 (可选)
  ipVersion       Int      @default(4) // 4 or 6
  enabled         Boolean  @default(true)
  pendingChanges  Boolean  @default(false)
  lastAppliedAt   DateTime?
  applyStatus     String   @default("pending")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// 端口转发表
model PortForwarding {
  id              Int      @id @default(autoincrement())
  name            String   // 规则名称
  protocol        String   // tcp/udp/both
  externalPort    String   // 外部端口 (可以是范围, e.g., "8080-8090")
  internalIp      String   // 内部IP
  internalPort    String   // 内部端口
  enabled         Boolean  @default(true)
  pendingChanges  Boolean  @default(false)
  lastAppliedAt   DateTime?
  applyStatus     String   @default("pending")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// 防火墙自定义规则表
model FirewallRule {
  id              Int      @id @default(autoincrement())
  name            String   // 规则名称
  action          String   // accept/reject/drop
  protocol        String?  // tcp/udp/icmp/all
  sourceIp        String?  // 源IP (可选)
  sourcePort      String?  // 源端口 (可选)
  destIp          String?  // 目标IP (可选)
  destPort        String?  // 目标端口 (可选)
  zone            String?  // 防火墙区域 (可选)
  priority        Int      @default(0)
  enabled         Boolean  @default(true)
  pendingChanges  Boolean  @default(false)
  lastAppliedAt   DateTime?
  applyStatus     String   @default("pending")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// QoS规则表
model QosRule {
  id              Int      @id @default(autoincrement())
  name            String   // 规则名称
  interface       String   // 接口名称
  direction       String   // upload/download
  maxBandwidth    Int      // 最大带宽 (Kbps)
  priority        Int      @default(0)
  sourceIp        String?  // 源IP (可选)
  destIp          String?  // 目标IP (可选)
  protocol        String?  // tcp/udp/all
  enabled         Boolean  @default(true)
  pendingChanges  Boolean  @default(false)
  lastAppliedAt   DateTime?
  applyStatus     String   @default("pending")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// DHCP静态地址分配表
model DhcpStaticLease {
  id              Int      @id @default(autoincrement())
  interfaceId     Int      // 关联的接口ID
  hostname        String?  // 主机名 (可选)
  macAddress      String   // MAC地址
  ipAddress       String   // 分配的IP地址
  enabled         Boolean  @default(true)
  pendingChanges  Boolean  @default(false)
  lastAppliedAt   DateTime?
  applyStatus     String   @default("pending")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  interface       NetworkInterface @relation(fields: [interfaceId], references: [id], onDelete: Cascade)
}
```

### 后端配置应用器扩展

建议创建以下新的配置应用器:

```typescript
// backend/src/services/network/routeConfigApplier.ts
export class RouteConfigApplier {
  async applyStaticRoute(route: StaticRoute): Promise<void> {
    // 使用 ip route add 命令
  }
  
  async removeStaticRoute(route: StaticRoute): Promise<void> {
    // 使用 ip route del 命令
  }
}

// backend/src/services/firewall/portForwardingApplier.ts
export class PortForwardingApplier {
  async applyPortForwarding(rule: PortForwarding): Promise<void> {
    // 使用 firewall-cmd --add-forward-port 命令
  }
  
  async removePortForwarding(rule: PortForwarding): Promise<void> {
    // 使用 firewall-cmd --remove-forward-port 命令
  }
}

// backend/src/services/qos/qosConfigApplier.ts
export class QosConfigApplier {
  async applyQosRule(rule: QosRule): Promise<void> {
    // 使用 tc 命令配置流量控制
  }
  
  async removeQosRule(rule: QosRule): Promise<void> {
    // 使用 tc 命令删除流量控制规则
  }
}
```

### 前端UI组件建议

建议创建以下新的前端页面/组件:

```
frontend/src/components/network/
  ├── StaticRoutesTab.tsx          # 静态路由配置页面
  ├── PortForwardingTab.tsx        # 端口转发配置页面
  ├── FirewallRulesTab.tsx         # 防火墙自定义规则页面
  ├── QosTab.tsx                   # QoS流量控制页面
  ├── DiagnosticsTab.tsx           # 网络诊断工具页面
  ├── DhcpStaticLeasesDialog.tsx   # DHCP静态地址分配对话框
  └── ConfigStatusBar.tsx          # 配置状态栏 (显示未应用的修改)
```

---

## 总结

URouterOS当前仅完成了OpenWrt网络管理功能的**15%**,主要集中在基础接口配置和部分防火墙功能。要达到OpenWrt的功能水平,需要补充以下核心功能:

1. **DHCP/DNS服务器完善** (静态地址分配、DNS转发)
2. **静态路由配置**
3. **端口转发/NAT规则**
4. **防火墙自定义规则**
5. **网络诊断工具**
6. **QoS流量控制**
7. **VLAN/网桥配置**
8. **无线网络配置**

同时,需要实现**保存/应用/复位**配置管理机制,确保配置修改的安全性和可回滚性。

建议按照上述优先级分5个阶段实现,预计总开发时间为**6-8周**。

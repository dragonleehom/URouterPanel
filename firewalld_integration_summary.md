# Firewalld防火墙系统集成总结

## 实施时间
2026-01-29

## 实施目标
将Ubuntu默认的UFW防火墙替换为Firewalld,实现与OpenWrt风格一致的防火墙区域管理,支持WAN/LAN/Docker等区域的配置和接口绑定。

## 已完成工作

### 1. OpenWrt防火墙策略研究

**研究来源**: OpenWrt官方文档 (https://openwrt.org/docs/guide-user/firewall/firewall_configuration)

**核心发现**:

#### 防火墙区域策略

| 区域 | Input | Output | Forward | Masquerade | 说明 |
|------|-------|--------|---------|------------|------|
| WAN | REJECT/DROP | ACCEPT | REJECT | 启用 | 外部网络,阻止外部主动连接 |
| LAN | ACCEPT | ACCEPT | ACCEPT | 禁用 | 内部网络,允许管理和互通 |
| Docker | REJECT | ACCEPT | ACCEPT | 禁用 | Docker网络,隔离容器 |

#### 区域间转发规则
- **LAN → WAN**: 允许(内网访问互联网)
- **Docker → WAN**: 允许(容器访问互联网)
- **LAN → Docker**: 可选(按需配置)
- **Docker → LAN**: 谨慎(通常不推荐)

**详细研究文档**: `openwrt_firewall_research.md`

### 2. Firewalld安装配置脚本

**脚本路径**: `scripts/firewalld-setup.sh`

**功能**:
1. 检查并禁用UFW防火墙
2. 安装firewalld包
3. 启动并启用firewalld服务
4. 创建自定义防火墙区域(wan/lan/docker)
5. 配置符合OpenWrt风格的区域策略
6. 配置区域间转发规则

**区域配置**:

```bash
# WAN区域
- target: DROP (拒绝所有未明确允许的流量)
- masquerade: 启用 (NAT伪装)
- 用途: 连接到互联网的接口

# LAN区域
- target: ACCEPT (允许所有流量)
- services: SSH, HTTP, HTTPS, DNS, DHCP
- 用途: 内网接口,信任的网络

# Docker区域
- target: ACCEPT (允许所有流量)
- 用途: Docker容器网络
```

**使用方法**:
```bash
sudo /home/ubuntu/urouteros-frontend/scripts/firewalld-setup.sh
```

### 3. 后端Firewalld服务模块

**文件路径**: `server/services/firewalldService.ts`

**核心功能**:

#### 区域管理
- `listZones()`: 获取所有防火墙区域
- `getZoneInfo(zoneName)`: 获取区域详细信息
- `getAllZonesInfo()`: 获取所有区域的详细信息

#### 接口绑定
- `bindInterfaceToZone(interfaceName, zoneName)`: 绑定接口到区域
- `unbindInterfaceFromZone(interfaceName, zoneName)`: 解绑接口
- `getInterfaceZone(interfaceName)`: 获取接口所属区域

#### 策略管理
- `getZonePolicy(zoneName)`: 获取区域策略配置
- `applyZonePolicy(zoneName, policy)`: 应用区域策略

#### 系统管理
- `checkFirewalldStatus()`: 检查Firewalld运行状态
- `reloadFirewall()`: 重新加载防火墙配置
- `getFirewallStatus()`: 获取防火墙运行状态

**数据结构**:

```typescript
interface FirewallZone {
  name: string;
  target: 'ACCEPT' | 'REJECT' | 'DROP' | 'default';
  interfaces: string[];
  services: string[];
  ports: string[];
  masquerade: boolean;
  forward: boolean;
  description: string;
}

interface ZonePolicy {
  name: string;
  input: 'ACCEPT' | 'REJECT' | 'DROP';
  output: 'ACCEPT' | 'REJECT' | 'DROP';
  forward: 'ACCEPT' | 'REJECT' | 'DROP';
  masquerade: boolean;
}
```

### 4. tRPC API端点

**文件路径**: `server/firewallRouter.ts`

**新增API**:

#### 状态查询
- `firewall.checkFirewalldStatus`: 检查Firewalld是否运行
- `firewall.getFirewalldStatus`: 获取Firewalld详细状态

#### 区域管理
- `firewall.listFirewalldZones`: 获取所有区域列表
- `firewall.getAllFirewalldZonesInfo`: 获取所有区域详细信息
- `firewall.getFirewalldZoneInfo`: 获取单个区域信息
- `firewall.getFirewalldZonePolicy`: 获取区域策略

#### 接口绑定
- `firewall.bindInterfaceToFirewalldZone`: 绑定接口到区域
- `firewall.unbindInterfaceFromFirewalldZone`: 解绑接口
- `firewall.getInterfaceFirewalldZone`: 获取接口所属区域

#### 策略应用
- `firewall.applyFirewalldZonePolicy`: 应用区域策略
- `firewall.reloadFirewalld`: 重新加载防火墙

**调用示例**:

```typescript
// 前端调用示例
import { trpc } from '@/lib/trpc';

// 获取所有区域信息
const { data: zones } = trpc.firewall.getAllFirewalldZonesInfo.useQuery();

// 绑定接口到WAN区域
const bindMutation = trpc.firewall.bindInterfaceToFirewalldZone.useMutation();
await bindMutation.mutateAsync({
  interfaceName: 'eth0',
  zoneName: 'wan',
});

// 获取接口所属区域
const { data: zone } = trpc.firewall.getInterfaceFirewalldZone.useQuery({
  interfaceName: 'eth0',
});

// 应用区域策略
const applyMutation = trpc.firewall.applyFirewalldZonePolicy.useMutation();
await applyMutation.mutateAsync({
  zoneName: 'wan',
  policy: {
    input: 'DROP',
    output: 'ACCEPT',
    forward: 'DROP',
    masquerade: true,
  },
});
```

## 待完成工作

### 1. 更新部署脚本
- [ ] 在`deploy.sh`中集成`firewalld-setup.sh`的调用
- [ ] 确保首次部署时自动安装和配置Firewalld

### 2. 前端集成
- [ ] 更新网口配置对话框,显示防火墙区域选择
- [ ] 添加防火墙区域说明和策略预览
- [ ] 实现接口区域绑定的UI交互
- [ ] 添加防火墙区域管理页面(可选)

### 3. 测试验证
- [ ] 在实际硬件上测试Firewalld安装脚本
- [ ] 验证接口绑定到不同区域的功能
- [ ] 测试区域策略的应用和生效
- [ ] 验证区域间转发规则(LAN→WAN, Docker→WAN)
- [ ] 测试NAT伪装功能

## 技术细节

### Firewalld vs OpenWrt防火墙

| 特性 | OpenWrt | Firewalld |
|------|---------|-----------|
| 后端 | iptables/nftables | nftables |
| 配置方式 | UCI配置文件 | firewall-cmd命令 |
| 区域概念 | 支持 | 支持 |
| 策略粒度 | input/output/forward分离 | target统一控制 |
| 接口绑定 | 通过network配置 | 通过zone绑定 |
| 动态更新 | 需要reload | 支持运行时修改 |

### Firewalld区域target映射

Firewalld使用`target`统一控制区域策略,与OpenWrt的分离策略有所不同:

- `target=ACCEPT`: 等同于 input=ACCEPT, output=ACCEPT, forward=ACCEPT
- `target=DROP`: 等同于 input=DROP, output=DROP, forward=DROP
- `target=REJECT`: 等同于 input=REJECT, output=REJECT, forward=REJECT
- `target=default`: 继承全局默认策略

### 接口绑定流程

1. 检查接口当前所属区域
2. 如果已绑定到其他区域,先解绑
3. 绑定到新区域(运行时)
4. 绑定到新区域(永久配置)
5. 重新加载防火墙(可选)

### 安全最佳实践

1. **WAN区域必须设置为DROP/REJECT**,防止外部主动连接
2. **LAN区域可以设置为ACCEPT**,方便内网管理
3. **使用转发规则精确控制区域间流量**
4. **Docker区域应该隔离**,避免容器直接访问路由器
5. **启用masquerade在WAN区域**,用于内网设备访问互联网

## 参考资料

1. OpenWrt官方防火墙配置文档: https://openwrt.org/docs/guide-user/firewall/firewall_configuration
2. Firewalld官方文档: https://firewalld.org/documentation/
3. 项目内研究文档: `openwrt_firewall_research.md`

## 后续优化建议

1. **添加防火墙规则管理**: 支持自定义规则(端口转发、流量限制等)
2. **实现防火墙日志查看**: 集成firewalld日志到管理界面
3. **添加防火墙模板**: 预设常见场景的防火墙配置
4. **支持IPv6防火墙**: 扩展支持IPv6防火墙规则
5. **集成fail2ban**: 自动封禁恶意IP
6. **添加流量统计**: 按区域统计流量使用情况

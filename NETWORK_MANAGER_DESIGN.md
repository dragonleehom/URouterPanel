# Ubuntu网络配置自适应管理器设计

## 1. 架构概述

### 1.1 核心组件
- **NetworkBackendDetector**: 检测系统使用的网络管理方式
- **NetworkBackendInterface**: 统一的配置接口
- **NetplanBackend**: Netplan实现
- **NetworkManagerBackend**: NetworkManager实现
- **InterfacesBackend**: /etc/network/interfaces实现
- **PhysicalInterfaceMonitor**: 物理接口状态监控

### 1.2 数据流
```
UI → tRPC API → NetworkConfigService → NetworkBackendInterface → 系统配置文件
                                      ↓
                                 PhysicalInterfaceMonitor → 实时状态
```

## 2. 后端实现

### 2.1 检测逻辑
```typescript
detectNetworkBackend(): 'netplan' | 'networkmanager' | 'interfaces' {
  // 1. 检查Netplan: /etc/netplan/*.yaml存在且netplan命令可用
  // 2. 检查NetworkManager: nmcli命令可用且服务运行中
  // 3. 检查interfaces: /etc/network/interfaces存在
  // 4. 默认: 使用ip命令临时配置
}
```

### 2.2 统一接口
```typescript
interface NetworkBackendInterface {
  // 读取系统配置
  readSystemConfig(): Promise<SystemNetworkConfig>;
  
  // 应用配置到系统
  applyConfig(config: NetworkConfig): Promise<void>;
  
  // 验证配置
  validateConfig(config: NetworkConfig): Promise<boolean>;
}

interface SystemNetworkConfig {
  interfaces: PhysicalInterface[];  // 物理接口列表
  wanPorts: LogicalPort[];          // WAN接口配置
  lanPorts: LogicalPort[];          // LAN接口配置
}

interface PhysicalInterface {
  name: string;           // eth0, eth1...
  type: 'ethernet' | 'fiber';  // 电口/光口
  linkStatus: 'up' | 'down';   // 链路状态
  speed: string;          // 100M/1G/2.5G/10G
  duplex: string;         // full/half
  txActivity: boolean;    // 发送指示灯
  rxActivity: boolean;    // 接收指示灯
  macAddress: string;
  driver: string;
}

interface LogicalPort {
  id: number;
  name: string;           // WAN/WAN1/LAN/LAN1...
  type: 'wan' | 'lan';
  physicalInterfaces: string[];  // 绑定的物理接口
  protocol: 'static' | 'dhcp' | 'pppoe';
  ipaddr?: string;
  netmask?: string;
  gateway?: string;
  // ... 其他配置
}
```

### 2.3 物理接口监控
```typescript
class PhysicalInterfaceMonitor {
  // 获取所有物理接口
  async listPhysicalInterfaces(): Promise<PhysicalInterface[]> {
    // 1. 使用 ip link show 获取接口列表
    // 2. 使用 ethtool 获取速率、双工、类型
    // 3. 使用 /sys/class/net/*/statistics/ 获取流量统计
    // 4. 判断光口/电口: ethtool -m 检测SFP模块
  }
  
  // 实时监控流量(用于指示灯)
  async monitorTraffic(ifname: string): Promise<TrafficStats> {
    // 读取 /sys/class/net/{ifname}/statistics/rx_bytes
    // 读取 /sys/class/net/{ifname}/statistics/tx_bytes
    // 计算差值判断是否有数据传输
  }
}
```

## 3. 前端UI设计

### 3.1 布局结构
```
┌─────────────────────────────────────────────────────────┐
│ 网口配置                                                 │
├─────────────────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │ ← 物理端口色块行
│ │ 🔌     │ │ 💡     │ │ 🔌     │ │ 💡     │            │
│ │ ●●     │ │ ●●     │ │ ●●     │ │ ●●     │            │
│ │ 1 Gbps │ │ 10Gbps │ │ Down   │ │ 2.5G   │            │
│ │ eth0   │ │ eth1   │ │ eth2   │ │ eth3   │            │
│ └────────┘ └────────┘ └────────┘ └────────┘            │
├─────────────────────────────────────────────────────────┤
│ WAN  ☑      ☐      ☐      ☐     [WAN] [编辑]          │ ← WAN接口行
│ WAN1 ☐      ☑      ☐      ☐     [WAN1] [编辑]         │
│ LAN  ☐      ☐      ☑      ☐     [LAN] [编辑]          │
│ LAN1 ☐      ☐      ☐      ☑     [LAN1] [编辑]         │
├─────────────────────────────────────────────────────────┤
│ [+ 添加WAN接口] [+ 添加LAN接口]                         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 组件设计
- **PhysicalPortCard**: 物理端口色块组件
  - 图标: 根据type显示电口/光口图标
  - 状态指示灯: 左下(link)、右下(activity)
  - 速率显示: 顶部右侧
  - 接口名: 底部

- **LogicalPortRow**: 逻辑接口行组件
  - Checkbox组: 对应每个物理端口
  - 互斥逻辑: WAN/LAN不能共用同一物理口
  - 接口名称 + 编辑按钮

### 3.3 状态管理
```typescript
// 从后端获取
const { data: physicalInterfaces } = trpc.network.listPhysicalInterfaces.useQuery();
const { data: logicalPorts } = trpc.networkConfig.listPorts.useQuery();

// 本地状态
const [portAssignments, setPortAssignments] = useState<{
  [portId: number]: string[];  // portId -> [eth0, eth1...]
}>();

// 互斥逻辑
function isPhysicalPortAvailable(ifname: string, currentPortId: number): boolean {
  // 检查该物理口是否已被其他逻辑口使用
}
```

## 4. 配置同步流程

### 4.1 启动时同步
```
1. 检测网络后端类型
2. 读取系统配置 (readSystemConfig)
3. 与数据库对比
4. 如果不一致,以系统配置为准,更新数据库
5. 显示到UI
```

### 4.2 用户修改配置
```
1. UI提交配置
2. 验证配置 (validateConfig)
3. 保存到数据库
4. 应用到系统 (applyConfig)
5. 验证应用结果
6. 如果失败,回滚配置
```

## 5. 实现优先级

### Phase 1: 后端基础设施
- [ ] NetworkBackendDetector
- [ ] PhysicalInterfaceMonitor
- [ ] NetworkBackendInterface及三种实现
- [ ] 配置同步逻辑

### Phase 2: API层
- [ ] listPhysicalInterfaces API
- [ ] syncSystemConfig API
- [ ] 更新现有的createPort/updatePort API支持物理接口绑定

### Phase 3: 前端UI
- [ ] PhysicalPortCard组件
- [ ] LogicalPortRow组件
- [ ] 互斥逻辑
- [ ] 页签顺序调整

### Phase 4: 测试与优化
- [ ] 单元测试
- [ ] 物理硬件测试
- [ ] 配置回滚机制
- [ ] 错误处理

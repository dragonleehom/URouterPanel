# OpenWrt防火墙策略研究

## 研究来源
- OpenWrt官方文档: https://openwrt.org/docs/guide-user/firewall/firewall_configuration
- 研究时间: 2026-01-29

## 核心概念

### 防火墙区域(Zones)
OpenWrt防火墙使用**区域(zones)**来组织网络接口,简化防火墙规则逻辑。一个区域可以包含一个或多个网络接口,作为转发、规则和重定向的源或目标。

### 最小配置要求
一个路由器的最小防火墙配置通常包含:
1. 一个`defaults`部分(全局默认策略)
2. 至少两个区域(`lan`和`wan`)
3. 一个转发规则(允许从`lan`到`wan`的流量)

## 默认防火墙策略

### 1. 全局默认策略(Defaults Section)

```
config defaults
    option input        'ACCEPT'
    option output       'ACCEPT'
    option forward      'REJECT'
```

**说明**:
- `input`: INPUT链的策略,默认ACCEPT(接受所有进入路由器的流量)
- `output`: OUTPUT链的策略,默认ACCEPT(接受所有从路由器发出的流量)
- `forward`: FORWARD链的策略,默认REJECT(拒绝所有转发流量,除非明确允许)

### 2. WAN区域策略

```
config zone
    option name         'wan'
    option network      'wan wan6'
    option input        'REJECT'
    option output       'ACCEPT'
    option forward      'REJECT'
    option masq         '1'
    option mtu_fix      '1'
```

**策略说明**:
- `input: REJECT` - **拒绝**来自WAN的进入流量(保护路由器自身)
- `output: ACCEPT` - **允许**路由器向WAN发送流量
- `forward: REJECT` - **拒绝**WAN区域内的转发流量
- `masq: 1` - 启用NAT伪装(MASQUERADE),用于出站流量的源地址转换
- `mtu_fix: 1` - 启用MSS clamping,修复MTU问题

**典型应用场景**:
- WAN接口连接到互联网
- 阻止外部主动连接到路由器和内网
- 允许内网设备访问互联网(通过NAT)

### 3. LAN区域策略

```
config zone
    option name         'lan'
    option network      'lan'
    option input        'ACCEPT'
    option output       'ACCEPT'
    option forward      'ACCEPT'
```

**策略说明**:
- `input: ACCEPT` - **允许**来自LAN的进入流量(允许管理路由器)
- `output: ACCEPT` - **允许**路由器向LAN发送流量
- `forward: ACCEPT` - **允许**LAN区域内的转发流量(LAN设备之间互通)

**典型应用场景**:
- LAN接口连接到内网设备
- 允许内网设备访问路由器管理界面
- 允许内网设备之间互相通信

### 4. Docker区域策略(参考)

根据OpenWrt社区讨论和最佳实践,Docker区域的推荐策略:

```
config zone
    option name         'docker'
    option network      'docker'
    option input        'REJECT'
    option output       'ACCEPT'
    option forward      'ACCEPT'
    option masq         '0'
```

**策略说明**:
- `input: REJECT` - **拒绝**来自Docker容器的直接访问路由器
- `output: ACCEPT` - **允许**路由器向Docker容器发送流量
- `forward: ACCEPT` - **允许**Docker容器之间的转发流量
- `masq: 0` - 不启用NAT(Docker自己管理网络)

**典型应用场景**:
- Docker容器网络隔离
- 允许容器之间通信
- 通过转发规则控制容器访问外网

## 区域间转发规则(Forwardings)

### LAN → WAN转发

```
config forwarding
    option src          'lan'
    option dest         'wan'
```

**说明**: 允许LAN设备访问WAN(互联网),这是最常见的转发规则。

### Docker → WAN转发

```
config forwarding
    option src          'docker'
    option dest         'wan'
```

**说明**: 允许Docker容器访问WAN(互联网)。

### LAN → Docker转发(可选)

```
config forwarding
    option src          'lan'
    option dest         'docker'
```

**说明**: 允许LAN设备访问Docker容器(如果需要)。

### Docker → LAN转发(可选,谨慎)

```
config forwarding
    option src          'docker'
    option dest         'lan'
```

**说明**: 允许Docker容器访问LAN设备(通常不推荐,除非有特殊需求)。

## 策略方向说明

### INPUT规则
描述通过该区域接口**进入路由器自身**的流量处理方式。
- WAN: REJECT(保护路由器)
- LAN: ACCEPT(允许管理)
- Docker: REJECT(隔离容器)

### OUTPUT规则
描述从**路由器自身**通过该区域接口发出的流量处理方式。
- WAN: ACCEPT(允许路由器访问互联网)
- LAN: ACCEPT(允许路由器与内网通信)
- Docker: ACCEPT(允许路由器与容器通信)

### FORWARD规则
描述在**同一区域内不同接口之间**转发的流量处理方式。
- WAN: REJECT(不允许WAN接口之间转发)
- LAN: ACCEPT(允许LAN设备之间通信)
- Docker: ACCEPT(允许Docker容器之间通信)

## 安全最佳实践

1. **WAN区域必须设置input为REJECT**,防止外部主动连接
2. **LAN区域可以设置input为ACCEPT**,方便管理
3. **使用转发规则精确控制区域间流量**,而不是全局允许
4. **Docker区域应该隔离**,避免容器直接访问路由器
5. **启用masq(NAT)在WAN区域**,用于内网设备访问互联网
6. **启用mtu_fix在WAN区域**,解决PPPoE等场景的MTU问题

## Firewalld等效配置

Firewalld使用类似的区域概念,但配置方式不同:

### Firewalld区域策略映射

| OpenWrt区域 | Firewalld区域 | 默认target | 说明 |
|------------|--------------|-----------|------|
| wan | external | default (REJECT) | 外部网络,启用masquerade |
| lan | internal | default (ACCEPT) | 内部网络,信任的网络 |
| docker | trusted | ACCEPT | Docker网络,完全信任 |

### Firewalld命令示例

```bash
# 创建WAN区域
firewall-cmd --permanent --new-zone=wan
firewall-cmd --permanent --zone=wan --set-target=DROP
firewall-cmd --permanent --zone=wan --add-masquerade

# 创建LAN区域
firewall-cmd --permanent --new-zone=lan
firewall-cmd --permanent --zone=lan --set-target=ACCEPT

# 创建Docker区域
firewall-cmd --permanent --new-zone=docker
firewall-cmd --permanent --zone=docker --set-target=ACCEPT

# 重新加载
firewall-cmd --reload
```

## 参考资料

1. OpenWrt官方防火墙配置文档: https://openwrt.org/docs/guide-user/firewall/firewall_configuration
2. OpenWrt防火墙示例: https://openwrt.org/docs/guide-user/firewall/fw3_configurations/fw3_config_examples
3. OpenWrt防火墙和网络接口: https://openwrt.org/docs/guide-user/firewall/fw3_network

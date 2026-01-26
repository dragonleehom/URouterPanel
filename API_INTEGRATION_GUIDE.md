# URouterOS 前后端API集成指南

## 概述

本文档说明如何将前端React页面与Python后端API集成,替换模拟数据为真实的系统操作。

## 架构说明

```
前端React页面 → tRPC Client → Node.js tRPC Server → Python API Client → Python FastAPI Backend
```

### 组件说明

1. **前端页面** (`client/src/pages/*.tsx`)
   - 使用`trpc.*.useQuery()`获取数据
   - 使用`trpc.*.useMutation()`执行操作

2. **tRPC路由** (`server/routers.ts`)
   - 定义所有API端点
   - 调用Python API Client

3. **Python API Client** (`server/api-client.ts`)
   - 封装axios HTTP请求
   - 与Python后端通信

4. **Python后端** (`/home/ubuntu/urouteros/backend/`)
   - FastAPI实现的RESTful API
   - 执行实际的系统命令

## 可用的tRPC路由

### 网络接口管理
- `trpc.networkInterfaces.list.useQuery()` - 获取所有接口
- `trpc.networkInterfaces.get.useQuery({ name })` - 获取指定接口
- `trpc.networkInterfaces.getStats.useQuery({ name })` - 获取接口统计
- `trpc.networkInterfaces.enable.useMutation()` - 启用接口
- `trpc.networkInterfaces.disable.useMutation()` - 禁用接口
- `trpc.networkInterfaces.configure.useMutation()` - 配置接口
- `trpc.networkInterfaces.createBridge.useMutation()` - 创建网桥
- `trpc.networkInterfaces.deleteBridge.useMutation()` - 删除网桥
- `trpc.networkInterfaces.createVLAN.useMutation()` - 创建VLAN
- `trpc.networkInterfaces.deleteVLAN.useMutation()` - 删除VLAN

### 防火墙管理
- `trpc.firewall.getRules.useQuery({ chain? })` - 获取防火墙规则
- `trpc.firewall.addRule.useMutation()` - 添加规则
- `trpc.firewall.deleteRule.useMutation()` - 删除规则
- `trpc.firewall.addMasquerade.useMutation()` - 添加MASQUERADE
- `trpc.firewall.addPortForward.useMutation()` - 添加端口转发
- `trpc.firewall.enableIPForward.useMutation()` - 启用IP转发
- `trpc.firewall.disableIPForward.useMutation()` - 禁用IP转发

### 路由管理
- `trpc.routes.list.useQuery({ table })` - 获取路由表
- `trpc.routes.add.useMutation()` - 添加路由
- `trpc.routes.delete.useMutation()` - 删除路由
- `trpc.routes.getDefaultGateway.useQuery()` - 获取默认网关
- `trpc.routes.setDefaultGateway.useMutation()` - 设置默认网关
- `trpc.routes.getPolicyRules.useQuery()` - 获取策略路由
- `trpc.routes.addPolicyRule.useMutation()` - 添加策略路由

### DHCP/DNS管理
- `trpc.dhcpDns.configureDHCP.useMutation()` - 配置DHCP
- `trpc.dhcpDns.getLeases.useQuery()` - 获取租约列表
- `trpc.dhcpDns.addStaticLease.useMutation()` - 添加静态租约
- `trpc.dhcpDns.deleteStaticLease.useMutation()` - 删除静态租约
- `trpc.dhcpDns.configureDNS.useMutation()` - 配置DNS
- `trpc.dhcpDns.getDNSRecords.useQuery()` - 获取DNS记录
- `trpc.dhcpDns.addDNSRecord.useMutation()` - 添加DNS记录
- `trpc.dhcpDns.deleteDNSRecord.useMutation()` - 删除DNS记录
- `trpc.dhcpDns.getDNSStatus.useQuery()` - 获取DNS状态
- `trpc.dhcpDns.startDNS.useMutation()` - 启动DNS服务
- `trpc.dhcpDns.stopDNS.useMutation()` - 停止DNS服务
- `trpc.dhcpDns.restartDNS.useMutation()` - 重启DNS服务

### 无线网络管理
- `trpc.wireless.getInterfaces.useQuery()` - 获取无线接口
- `trpc.wireless.configure.useMutation()` - 配置无线网络
- `trpc.wireless.enable.useMutation()` - 启用无线网络
- `trpc.wireless.disable.useMutation()` - 禁用无线网络
- `trpc.wireless.getClients.useQuery({ iface })` - 获取客户端列表

### QoS流控管理
- `trpc.qos.getConfig.useQuery()` - 获取QoS配置
- `trpc.qos.configure.useMutation()` - 配置QoS
- `trpc.qos.enable.useMutation()` - 启用QoS
- `trpc.qos.disable.useMutation()` - 禁用QoS

### 多WAN管理
- `trpc.multiwan.getConfig.useQuery()` - 获取多WAN配置
- `trpc.multiwan.configure.useMutation()` - 配置多WAN
- `trpc.multiwan.getStatus.useQuery()` - 获取WAN状态

### VPN管理
- `trpc.vpn.getOpenVPNConfig.useQuery()` - 获取OpenVPN配置
- `trpc.vpn.configureOpenVPN.useMutation()` - 配置OpenVPN
- `trpc.vpn.startOpenVPN.useMutation()` - 启动OpenVPN
- `trpc.vpn.stopOpenVPN.useMutation()` - 停止OpenVPN
- `trpc.vpn.getWireGuardConfig.useQuery()` - 获取WireGuard配置
- `trpc.vpn.configureWireGuard.useMutation()` - 配置WireGuard
- `trpc.vpn.startWireGuard.useMutation()` - 启动WireGuard
- `trpc.vpn.stopWireGuard.useMutation()` - 停止WireGuard
- `trpc.vpn.getClients.useQuery()` - 获取VPN客户端

### IPv6管理
- `trpc.ipv6.getConfig.useQuery()` - 获取IPv6配置
- `trpc.ipv6.configure.useMutation()` - 配置IPv6
- `trpc.ipv6.enable.useMutation()` - 启用IPv6
- `trpc.ipv6.disable.useMutation()` - 禁用IPv6

### DDNS管理
- `trpc.ddns.getConfig.useQuery()` - 获取DDNS配置
- `trpc.ddns.configure.useMutation()` - 配置DDNS
- `trpc.ddns.enable.useMutation()` - 启用DDNS
- `trpc.ddns.disable.useMutation()` - 禁用DDNS
- `trpc.ddns.update.useMutation()` - 强制更新DDNS

### UPnP管理
- `trpc.upnp.getConfig.useQuery()` - 获取UPnP配置
- `trpc.upnp.configure.useMutation()` - 配置UPnP
- `trpc.upnp.enable.useMutation()` - 启用UPnP
- `trpc.upnp.disable.useMutation()` - 禁用UPnP
- `trpc.upnp.getMappings.useQuery()` - 获取端口映射

### 流量统计
- `trpc.traffic.getStats.useQuery()` - 获取实时统计
- `trpc.traffic.getHistory.useQuery({ period })` - 获取历史数据
- `trpc.traffic.getByDevice.useQuery()` - 按设备统计
- `trpc.traffic.getByInterface.useQuery()` - 按接口统计

### MAC地址管理
- `trpc.mac.list.useQuery()` - 获取MAC地址列表
- `trpc.mac.addFilter.useMutation()` - 添加过滤规则
- `trpc.mac.deleteFilter.useMutation()` - 删除过滤规则
- `trpc.mac.clone.useMutation()` - 克隆MAC地址
- `trpc.mac.bind.useMutation()` - 绑定MAC-IP

### WOL网络唤醒
- `trpc.wol.wake.useMutation()` - 发送魔术包
- `trpc.wol.getDevices.useQuery()` - 获取设备列表
- `trpc.wol.addDevice.useMutation()` - 添加设备
- `trpc.wol.deleteDevice.useMutation()` - 删除设备

### 容器管理
- `trpc.containers.list.useQuery()` - 获取容器列表
- `trpc.containers.get.useQuery({ id })` - 获取容器详情
- `trpc.containers.start.useMutation()` - 启动容器
- `trpc.containers.stop.useMutation()` - 停止容器
- `trpc.containers.restart.useMutation()` - 重启容器
- `trpc.containers.delete.useMutation()` - 删除容器
- `trpc.containers.stats.useQuery({ id })` - 获取容器统计

### 镜像管理
- `trpc.images.list.useQuery()` - 获取镜像列表
- `trpc.images.pull.useMutation()` - 拉取镜像
- `trpc.images.delete.useMutation()` - 删除镜像

### 虚拟机管理
- `trpc.vms.list.useQuery()` - 获取虚拟机列表
- `trpc.vms.get.useQuery({ name })` - 获取虚拟机详情
- `trpc.vms.start.useMutation()` - 启动虚拟机
- `trpc.vms.stop.useMutation()` - 停止虚拟机
- `trpc.vms.reboot.useMutation()` - 重启虚拟机
- `trpc.vms.delete.useMutation()` - 删除虚拟机

### 硬件监控
- `trpc.hardware.overview.useQuery()` - 获取系统概览
- `trpc.hardware.cpu.useQuery()` - 获取CPU信息
- `trpc.hardware.memory.useQuery()` - 获取内存信息
- `trpc.hardware.disk.useQuery()` - 获取磁盘信息
- `trpc.hardware.network.useQuery()` - 获取网卡信息
- `trpc.hardware.gpu.useQuery()` - 获取GPU信息

### 网络诊断
- `trpc.diagnostics.ping.useMutation()` - Ping测试
- `trpc.diagnostics.traceroute.useMutation()` - 路由跟踪
- `trpc.diagnostics.portScan.useMutation()` - 端口扫描
- `trpc.diagnostics.dnsQuery.useMutation()` - DNS查询
- `trpc.diagnostics.nslookup.useMutation()` - Nslookup

## 集成示例

### 示例1: 获取网络接口列表

```typescript
import { trpc } from "@/lib/trpc";

export default function NetworkInterfaces() {
  // 使用useQuery获取数据
  const { data: interfaces, isLoading, error } = trpc.networkInterfaces.list.useQuery();

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      {interfaces?.map((iface: any) => (
        <div key={iface.name}>
          <h3>{iface.name}</h3>
          <p>状态: {iface.state}</p>
          <p>MAC: {iface.mac}</p>
        </div>
      ))}
    </div>
  );
}
```

### 示例2: 启用/禁用网络接口

```typescript
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function InterfaceControl({ name }: { name: string }) {
  const utils = trpc.useUtils();
  
  // 使用useMutation执行操作
  const enableMutation = trpc.networkInterfaces.enable.useMutation({
    onSuccess: () => {
      toast.success("接口已启用");
      // 刷新接口列表
      utils.networkInterfaces.list.invalidate();
    },
    onError: (error) => {
      toast.error(`启用失败: ${error.message}`);
    },
  });

  const disableMutation = trpc.networkInterfaces.disable.useMutation({
    onSuccess: () => {
      toast.success("接口已禁用");
      utils.networkInterfaces.list.invalidate();
    },
    onError: (error) => {
      toast.error(`禁用失败: ${error.message}`);
    },
  });

  return (
    <div>
      <button onClick={() => enableMutation.mutate({ name })}>
        启用
      </button>
      <button onClick={() => disableMutation.mutate({ name })}>
        禁用
      </button>
    </div>
  );
}
```

### 示例3: 添加防火墙规则

```typescript
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

export default function AddFirewallRule() {
  const utils = trpc.useUtils();
  const [rule, setRule] = useState({
    chain: "INPUT",
    action: "ACCEPT",
    protocol: "tcp",
    dport: 80,
  });

  const addRuleMutation = trpc.firewall.addRule.useMutation({
    onSuccess: () => {
      toast.success("规则已添加");
      utils.firewall.getRules.invalidate();
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    addRuleMutation.mutate(rule);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      {/* 表单字段 */}
      <button type="submit">添加规则</button>
    </form>
  );
}
```

## 错误处理

### 常见错误类型

1. **网络错误** - Python后端未启动或无法访问
2. **权限错误** - Python后端需要root权限执行系统命令
3. **参数错误** - 传递的参数不符合API要求
4. **系统错误** - 底层系统命令执行失败

### 错误处理最佳实践

```typescript
const { data, isLoading, error } = trpc.networkInterfaces.list.useQuery(
  undefined,
  {
    retry: 3, // 自动重试3次
    retryDelay: 1000, // 重试间隔1秒
    onError: (error) => {
      console.error("API错误:", error);
      toast.error(`获取接口列表失败: ${error.message}`);
    },
  }
);
```

## 环境配置

### 设置Python后端URL

在`.env`文件中配置:

```bash
PYTHON_API_URL=http://localhost:8000
```

### 启动Python后端

```bash
cd /home/ubuntu/urouteros/backend
sudo python3 -m backend.main
```

## 测试建议

1. **单元测试** - 测试tRPC路由逻辑
2. **集成测试** - 测试完整的API调用链路
3. **端到端测试** - 在真实Ubuntu环境测试系统命令执行

## 注意事项

1. **权限要求** - Python后端需要root权限执行网络配置命令
2. **错误处理** - 所有API调用都应该有错误处理
3. **加载状态** - 显示加载状态提升用户体验
4. **数据刷新** - 操作成功后使用`invalidate()`刷新数据
5. **乐观更新** - 对于频繁操作,可以使用乐观更新提升响应速度

## 下一步

1. 按照本指南更新所有前端页面
2. 在Ubuntu VM上部署测试
3. 完善错误处理和用户反馈
4. 添加单元测试和集成测试

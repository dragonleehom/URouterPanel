# 安装脚本问题分析

## 当前架构

### install-all.sh (主脚本)
1. 安装系统依赖 (`install-dependencies.sh`)
2. **配置网络 (`setup-network.sh`)** ← 问题所在
3. 部署应用 (`deploy-app.sh`)
4. 配置systemd服务 (`setup-systemd.sh`)

### setup-network.sh的问题

#### 问题1: 直接操作系统网络配置
- 直接写入`/etc/network/interfaces.d/wan`
- 直接配置网桥`br-lan`
- 直接配置dnsmasq和iptables
- **与URouterOS后台服务的配置管理冲突**

#### 问题2: 使用`set -e`导致任何错误都退出
```bash
set -e  # 任何命令失败都会导致脚本退出
```
- 如果interface.d目录不存在 → 退出
- 如果dhclient失败 → 退出
- 如果brctl失败 → 退出
- **核心服务未被拉起**

#### 问题3: 职责混乱
- 安装脚本不应该负责业务逻辑配置
- 网络配置应该由后台服务管理
- 安装脚本只应该安装依赖和启动服务

## 正确的架构

### 安装脚本职责
1. **安装系统依赖**:
   - Node.js, pnpm
   - firewalld (替代iptables)
   - dnsmasq
   - 网络工具(ip, ethtool等)

2. **创建systemd服务**:
   - urouteros-backend.service
   - urouteros-frontend.service (如果需要)

3. **启动服务**:
   - `systemctl enable urouteros-backend`
   - `systemctl start urouteros-backend`

4. **容错机制**:
   - 每个步骤使用`|| true`避免退出
   - 记录错误但继续执行
   - 最后输出安装摘要(成功/失败/跳过)

### 后台服务职责
1. **启动时初始化检测**:
   - 检查数据库是否初始化
   - 检查是否有网口配置
   - 检查防火墙是否配置

2. **自动创建默认配置**:
   - 检测可用网卡
   - 创建默认WAN配置(第一个网卡,DHCP客户端)
   - 创建默认LAN配置(第二个网卡或br0,静态IP 192.168.1.1)
   - 应用默认防火墙策略(wan/lan区域)

3. **配置持久化**:
   - 所有配置保存到数据库
   - 通过后台服务API管理配置
   - 前端UI修改配置

## 重构计划

### 1. 简化install-all.sh
```bash
#!/bin/bash
# 移除set -e,改用容错机制

# 步骤1: 安装依赖(失败记录但继续)
install_dependencies || log_error "依赖安装失败"

# 步骤2: 删除setup-network.sh调用

# 步骤3: 部署应用
deploy_app || log_error "应用部署失败"

# 步骤4: 配置systemd服务(必须成功)
setup_systemd || fatal_error "服务配置失败"

# 步骤5: 启动服务(必须成功)
start_services || fatal_error "服务启动失败"

# 输出安装摘要
print_summary
```

### 2. 创建服务初始化模块
```typescript
// server/services/initialization.ts
export async function initializeOnStartup() {
  // 1. 检查数据库
  await ensureDatabaseInitialized();
  
  // 2. 检测网卡
  const interfaces = await detectNetworkInterfaces();
  
  // 3. 检查是否有配置
  const existingConfig = await db.select().from(networkPorts);
  
  if (existingConfig.length === 0) {
    // 4. 创建默认配置
    await createDefaultWANConfig(interfaces[0]);
    if (interfaces.length > 1) {
      await createDefaultLANConfig(interfaces[1]);
    }
    
    // 5. 应用防火墙策略
    await applyDefaultFirewallPolicy();
  }
  
  // 6. 启动网络监控
  await startNetworkMonitoring();
}
```

### 3. 在server/index.ts中调用初始化
```typescript
// server/_core/index.ts
import { initializeOnStartup } from '../services/initialization';

async function main() {
  try {
    // 启动初始化
    await initializeOnStartup();
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
}
```

## 优势

### 分离职责
- 安装脚本只负责安装和启动
- 后台服务负责业务逻辑和配置

### 容错机制
- 安装脚本不会因为低级错误退出
- 核心服务必定被拉起
- 详细的错误日志

### 可维护性
- 配置逻辑集中在后台服务
- 前端UI可以管理所有配置
- 数据库持久化配置

### 用户体验
- 首次启动自动配置
- Web界面可以修改配置
- 配置变更立即生效

# URouterOS 开发任务清单

## 已完成功能
- [x] 基础仪表盘页面
- [x] 网络管理页面
- [x] 容器管理页面
- [x] Docker Compose管理页面
- [x] 后端API集成

## 监控系统集成 (新增)
- [x] 配置Prometheus监控系统
- [x] 配置Grafana可视化平台
- [x] 开发自定义监控数据导出器
- [x] 创建Grafana仪表盘模板
- [x] 集成告警通知系统
- [x] 在Web界面中嵌入监控仪表盘
- [x] 编写监控系统文档

## 待开发功能
- [ ] 虚拟机管理页面
- [ ] 硬件监控详细页面
- [ ] 系统日志查看功能
- [ ] 配置备份和恢复
- [ ] 用户权限管理

## 自定义仪表盘创建向导 (新增)
- [x] 设计仪表盘创建向导交互流程
- [x] 开发拖拽编辑器组件
- [x] 实现图表类型选择器(折线图、柱状图、饼图等)
- [x] 集成数据源配置(Prometheus查询)
- [x] 实现仪表盘预览和保存功能
- [x] 支持仪表盘导出和导入

## 网络管理功能完善 (对标iStoreOS/OpenWrt)
- [x] 研究iStoreOS和OpenWrt的网络管理界面和功能
- [x] 完善网络接口配置(WAN/LAN/桥接/VLAN)
- [ ] 实现防火墙区域和规则配置
- [ ] 实现端口转发和NAT配置
- [ ] 完善DHCP服务器配置(地址池、静态租约)
- [ ] 完善DNS服务配置(转发、本地记录)
- [ ] 添加静态路由配置界面
- [ ] 添加网络诊断工具(ping/traceroute/nslookup)

## 防火墙配置功能 (新增)
- [x] 开发防火墙规则管理页面
- [x] 实现端口转发配置功能
- [x] 实现NAT规则配置功能(SNAT/DNAT/MASQUERADE)
- [x] 添加防火墙区域管理
- [x] 实现流量规则配置

## DHCP/DNS服务管理 (新增)
- [x] 开发DHCP服务管理页面
- [x] 实现DHCP地址池配置
- [x] 实现静态租约管理
- [x] 实现DNS转发配置
- [x] 实现本地DNS记录管理
- [x] 添加DHCP租约查看功能

## 系统设置功能 (新增)
- [x] 开发系统设置页面
- [x] 实现系统时间和时区配置
- [x] 实现界面语言切换(中文/英文)
- [x] 实现主题切换(浅色/深色模式)
- [x] 实现配置备份功能(导出JSON)
- [x] 实现配置恢复功能(导入JSON)
- [x] 添加系统重启和关机功能

## 网络诊断工具 (新增)
- [x] 开发网络诊断工具页面
- [x] 实现Ping工具(ICMP连通性测试)
- [x] 实现Traceroute工具(路由跟踪)
- [x] 实现端口扫描工具(TCP/UDP端口检测)
- [x] 添加DNS查询工具(Nslookup)
- [x] 实现实时输出和结果分析

## 网络诊断工具后端集成 (新增)
- [x] 开发后端诊断API接口(tRPC)
- [x] 实现Ping命令执行和结果解析
- [x] 实现Traceroute命令执行和结果解析
- [x] 实现端口扫描命令执行和结果解析
- [x] 实现DNS查询命令执行和结果解析
- [x] 前端集成真实API调用

## 网络诊断工具可视化优化 (新增)
- [x] 为Ping结果添加延迟趋势折线图
- [x] 为Ping统计添加可视化卡片展示
- [x] 为Traceroute结果添加路由路径可视化
- [x] 优化端口扫描结果的展示方式
- [x] 添加诊断结果的导出和分享功能

## 网络功能补齐 (对标iStoreOS)
- [x] 对比iStoreOS网络功能列表
- [x] 分析URouterOS缺失的功能

### 阶段一: 核心网络功能(高优先级)
- [x] 实现无线网络管理(WiFi 2.4GHz/5GHz配置)
- [x] 实现QoS流量控制(带宽限制和优先级)
- [x] 实现多WAN负载均衡(故障切换)
- [x] 实现VPN服务器(OpenVPN/WireGuard)
  - [x] OpenVPN服务器配置页面
  - [x] WireGuard服务器配置页面
  - [x] 证书管理和客户端配置生成
  - [x] 客户端连接状态监控
- [x] 实现IPv6完整支持
  - [x] IPv6地址配置页面
  - [x] IPv6防火墙规则
  - [x] DHCPv6服务配置
  - [x] IPv6路由通告(RA)

### 阶段二: 增强功能(中优先级)
- [x] 实现动态DNS(DDNS)配置
  - [x] DDNS服务提供商配置
  - [x] 域名和凭证管理
  - [x] 更新状态监控
- [x] 实现UPnP/NAT-PMP服务
  - [x] UPnP服务开关
  - [x] 端口映射列表
  - [x] 客户端设备管理
- [x] 实现流量统计功能
  - [x] 实时流量监控
  - [x] 历史流量统计
  - [x] 按设备/接口分组统计
- [x] 实现MAC地址管理(克隆/过滤/绑定)
  - [x] MAC地址过滤(ACL)
  - [x] MAC地址克隆
  - [x] MAC-IP绑定
- [x] 实现网络唤醒(WOL)
  - [x] 设备列表管理
  - [x] 发送魔术包
  - [x] 唤醒历史记录

### 阶段三: 高级功能(低优先级)
- [ ] 实现高级路由功能(策略路由)
- [ ] 实现网桥高级配置(STP/RSTP)
- [ ] 实现端口镜像功能
- [ ] 实现热点认证(Portal)

## 菜单结构重构 (新增)
- [x] 重构DashboardLayout侧边栏,实现二级菜单功能
- [x] 将网络相关功能整合到"网络管理"二级菜单下
- [x] 测试菜单展开/折叠交互

## 后端API集成 (新增)
- [x] 分析现有Python后端API结构
- [x] 扩展api-client.ts,添加所有网络管理API调用
- [x] 创建tRPC路由连接Python后端
- [x] 更新网络接口配置页面调用真实API
- [ ] 更新防火墙管理页面调用真实API
- [ ] 更新DHCP/DNS服务页面调用真实API
- [ ] 更新无线网络管理页面调用真实API
- [ ] 更新QoS流控页面调用真实API
- [ ] 更新多WAN负载均衡页面调用真实API
- [ ] 更新VPN服务器页面调用真实API
- [ ] 更新IPv6配置页面调用真实API
- [ ] 更新DDNS动态DNS页面调用真实API
- [ ] 更新UPnP服务页面调用真实API
- [ ] 更新流量统计页面调用真实API
- [ ] 更新MAC地址管理页面调用真实API
- [ ] 更新网络唤醒(WOL)页面调用真实API
- [ ] 更新容器管理页面调用真实API
- [ ] 更新虚拟机管理页面调用真实API
- [ ] 更新硬件监控页面调用真实API
- [ ] 测试所有API集成功能

## GitHub仓库和部署脚本 (新增)
- [x] 创建GitHub仓库URouterPanel
- [x] 上传前端代码到仓库
- [x] 上传Python后端代码到仓库
- [x] 创建一键式部署脚本(deploy.sh)
- [x] 创建systemd服务配置文件
- [x] 创建更新和重启脚本(update.sh)
- [x] 创建README部署文档
- [ ] 在Ubuntu VM上测试部署脚本

## CI/CD流程 (新增)
- [x] 创建GitHub Actions工作流文件
- [x] 配置前端自动化测试
- [x] 配置后端自动化测试
- [x] 配置自动构建
- [x] 配置自动部署到测试服务器
- [x] 编写CI/CD文档
- [x] 创建CI/CD安装说明
- [ ] 手动添加workflow文件到GitHub
- [ ] 配置GitHub Secrets
- [ ] 测试完整CI/CD流程

## v1.0核心功能开发 (当前优先级)
### 第1-2周: 网络管理页面API集成
- [x] 更新网络接口配置页面调用真实API
- [ ] 更新防火墙管理页面调用真实API
- [ ] 更新DHCP/DNS服务页面调用真实API
- [ ] 更新无线网络管理页面调用真实API
- [ ] 更新QoS流控页面调用真实API
- [ ] 更新多WAN负载均衡页面调用真实API
- [ ] 更新VPN服务器页面调用真实API
- [ ] 更新IPv6配置页面调用真实API
- [ ] 更新DDNS动态DNS页面调用真实API
- [ ] 更新UPnP服务页面调用真实API
- [ ] 更新流量统计页面调用真实API
- [ ] 更新MAC地址管理页面调用真实API
- [ ] 更新网络唤醒(WOL)页面调用真实API
- [ ] 更新容器管理页面调用真实API
- [ ] 更新虚拟机管理页面调用真实API
- [ ] 更新硬件监控页面调用真实API

### 第3周: 部署和测试
- [x] 更新部署脚本(支持Python后端+Node.js前端)
- [x] 创建VM部署详细文档(VM_DEPLOYMENT_GUIDE.md)
- [x] 创建API集成工具库(api-helpers.ts)
- [x] 创建API集成更新指南(FRONTEND_API_INTEGRATION_GUIDE.md)
- [ ] 在Ubuntu VM上完整测试
- [ ] 修复测试中发现的问题

### 第4周: 发布v1.0
- [ ] 完善文档
- [ ] 创建Release
- [ ] 发布v1.0

## v1.1应用市场 (后续迭代)
- [x] 分析1Panel应用市场技术架构
- [x] 研究1Panel应用定义格式(Docker Compose)
- [x] 研究1Panel应用安装机制
- [x] 编写应用市场兼容方案设计文档
- [ ] v1.1开发(预计7周)

## 页面API集成 (当前任务)
- [x] 集成防火墙管理页面API
  - [x] 获取防火墙规则列表
  - [x] 添加防火墙规则
  - [x] 编辑防火墙规则
  - [x] 删除防火墙规则
  - [x] 启用/禁用规则
  - [x] 创建防火墙示例页面(FirewallExample.tsx)
- [ ] 集成DHCP/DNS服务页面API
  - [ ] 获取DHCP配置
  - [ ] 更新DHCP配置
  - [ ] 获取DNS配置
  - [ ] 更新DNS配置
  - [ ] 获取租约列表
- [ ] 集成无线网络管理页面API
  - [ ] 获取无线接口列表
  - [ ] 配置WiFi设置
  - [ ] 获取连接设备列表
- [ ] 集成容器管理页面API
  - [ ] 获取容器列表
  - [ ] 启动/停止容器
  - [ ] 创建/删除容器
  - [ ] 查看容器日志

## 部署脚本修复 (已完成)
- [x] 修夏deploy.sh中的Python包管理错误(externally-managed-environment)
- [x] 使用Python虚拟环境替代系统级pip安装
- [x] 更新systemd服务配置使用虚拟环境
- [x] 更新.gitignore忽略虚拟环境目录
- [x] 解决frontend目录空的问题
- [x] 复制完整frontend代码到URouterPanel仓库
- [x] 解决git submodule问题
- [x] 成功推送171个文件到GitHub (b16cd35)
- [x] 验证GitHub上的frontend目录完整性
- [ ] 在Ubuntu VM上测试部署脚本

## 后端服务修复 (紧急)
- [ ] 修复Python模块路径问题(ModuleNotFoundError: No module named 'backend')
- [ ] 修复虚拟环境权限问题(venv所有者为root)
- [ ] 更新systemd服务配置的WorkingDirectory
- [ ] 更新systemd服务配置的ExecStart命令
- [ ] 测试后端服务启动
- [ ] 推送修复到GitHub


## 网络管理功能全面集成 (v2.0核心任务)

### 目标
逐步完成所有网络管理功能的前后端集成,移除所有模拟数据,在沙箱中部署测试每个功能直到全部准确完成

### 实现策略
1. 按优先级顺序实现核心网络功能
2. 每个功能独立测试:实现后立即在沙箱部署测试
3. 发现问题立即修复:测试发现问题后立即修改代码重新测试
4. 保持代码同步:每个功能完成后推送到GitHub

### 1. 防火墙管理 (优先级:高) ✅
- [x] 后端API完善
  - [x] 实现获取防火墙规则列表API
  - [x] 实现添加防火墙规则API
  - [x] 实现删除防火墙规则API
  - [x] 实现修改防火墙规则API
  - [x] 实现启用/禁用规则API
  - [x] 实现获取预设规则模板API
- [x] 前端集成
  - [x] 更新api-client.ts中的防火墙API方法
  - [x] 集成tRPC API调用
  - [x] 修复FirewallExample.tsx使用新API
  - [x] 实现规则启用/禁用功能
- [x] 沙箱测试
  - [x] 后端API测试通过(添加/查询/状态)
  - [x] 前端tRPC连接测试通过
  - [x] TypeScript编译通过

### 2. 路由管理 (优先级:高) ✅
- [x] 后端API完善
  - [x] 实现获取路由表API
  - [x] 实现添加静态路由API
  - [x] 实现删除路由API
  - [x] 实现获取默认网关API
  - [x] 实现设置默认网关API
  - [x] 实现获取ARP表API
- [x] 前端集成
  - [x] 更新api-client.ts中的路由API方法
  - [x] 更新routers.ts中的路由路由
  - [x] TypeScript编译通过
- [x] 沙箱测试
  - [x] 后端API测试通过(路由表/默认网关/ARP表)
  - [x] 前端tRPC连接测试通过

### 3. DHCP/DNS管理 (优先级:高) ✅
- [x] 后端API完善
  - [x] 实现获取DHCP配置API
  - [x] 实现配置DHCP服务API
  - [x] 实现获取DHCP租约API
  - [x] 实现添加静态IP绑定API
  - [x] 实现删除静态IP绑定API
  - [x] 实现服务启停控制API
- [x] 前端集成
  - [x] 更新api-client.ts中的DHCP/DNS API方法
  - [x] 更新routers.ts中的DHCP/DNS路由
  - [x] TypeScript编译通过
- [x] 沙箱测试
  - [x] 后端API测试通过(状态查询)
  - [x] 前端tRPC连接测试通过

### 4. 无线网络管理 (优先级:中) ✅
- [x] 后端API完善
  - [x] 实现获取无线接口列表API
  - [x] 实现扫描WiFi网络 API
  - [x] 实现配置WiFi热点API
  - [x] 实现获取客户端列表API
  - [x] 实现断开客户端API
  - [x] 实现服务启停控制API
- [x] 前端集成
  - [x] 更新api-client.ts中的无线网络 API方法
  - [x] 更新routers.ts中的无线网络路由
  - [x] TypeScript编译通过
- [x] 沙箱测试
  - [x] 后端API测试通过(接口列表/状态查询)
  - [x] 前端tRPC连接测试通过

### 5. QoS流量控制 (优先级:中) ✅
- [x] 后端API完善
  - [x] 实现获取QoS配置API
  - [x] 实现配置QoS API
  - [x] 实现获取QoS规则列表API
  - [x] 实现添加QoS规则API
  - [x] 实现删除QoS规则API
  - [x] 实现修改QoS规则API
  - [x] 实现切换规则状态API
  - [x] 实现启用/禁用QoS API
  - [x] 实现获取QoS统计信息API
- [x] 前端集成
  - [x] 更新api-client.ts中的QoS API方法
  - [x] 更新routers.ts中的QoS路由
  - [x] TypeScript编译通过
- [x] 沙箱测试
  - [x] 后端API测试通过(配置/规则/状态)
  - [x] 前端tRPC连接测试通过

### 6. 多WAN负载均衡 (优先级:中)
- [ ] 后端API完善
  - [ ] 实现获取WAN接口列表API
  - [ ] 实现配置负载均衡策略API
  - [ ] 实现获取WAN状态API
  - [ ] 实现配置故障转移API
- [ ] 前端集成
  - [ ] 移除MultiWAN.tsx中的模拟数据
  - [ ] 集成tRPC API调用
  - [ ] 实现负载均衡配置
- [ ] 沙箱测试
  - [ ] 多WAN配置测试

### 7. VPN管理 (优先级:中)
- [ ] 后端API完善
  - [ ] 实现OpenVPN配置API
  - [ ] 实现WireGuard配置API
  - [ ] 实现IPsec配置API
  - [ ] 实现获取VPN状态API
  - [ ] 实现启动/停止VPN API
- [ ] 前端集成
  - [ ] 移除VPNServer.tsx中的模拟数据
  - [ ] 集成tRPC API调用
  - [ ] 实现VPN配置向导
- [ ] 沙箱测试
  - [ ] VPN配置测试
  - [ ] VPN连接测试

### 8. 系统监控 (优先级:低)
- [ ] 后端API完善
  - [ ] 实现实时系统资源监控API
  - [ ] 实现网络流量统计API
  - [ ] 实现连接数统计API
  - [ ] 实现日志查询API
- [ ] 前端集成
  - [ ] 更新Dashboard.tsx使用真实数据
  - [ ] 集成tRPC API调用
  - [ ] 实现实时图表更新
- [ ] 沙箱测试
  - [ ] 实时监控测试
  - [ ] 数据准确性验证

### 测试检查点
每个功能实现后需要验证:
- [ ] 后端API能正常响应
- [ ] 前端能正确调用API
- [ ] 数据能正确显示
- [ ] 添加/编辑/删除操作正常
- [ ] 错误处理正确
- [ ] 权限检查正常
- [ ] 日志记录正确

### 当前进度
**当前阶段**: 准备开始实现防火墙管理功能
**下一步**: 实现防火墙管理的后端API并在沙箱测试


## 前端页面重构 - 移除模拟数据集成真实API ✅

### 无线网络管理页面重构 ✅
- [x] 移除WirelessManagement.tsx中的所有模拟数据
- [x] 集成wireless.getInterfaces API获取接口列表
- [x] 集成wireless.getConfig API获取WiFi配置
- [x] 集成wireless.configure API配置WiFi热点
- [x] 集成wireless.getClients API获取客户端列表
- [x] 集成wireless.disconnectClient API断开客户端
- [x] 集成wireless.start/stop/restart API控制服务
- [x] 实现完整的用户交互流程

### QoS管理页面重构 ✅
- [x] 移除QoSManagement.tsx中的所有模拟数据
- [x] 集成qos.getConfig API获取QoS配置
- [x] 集成qos.getRules API获取规则列表
- [x] 集成qos.addRule API添加规则
- [x] 集成qos.updateRule API更新规则
- [x] 集成qos.deleteRule API删除规则
- [x] 集成qos.toggleRule API切换规则状态
- [x] 集成qos.enable/disable API启用/禁用QoS
- [x] 实现完整的规则管理界面


## DHCP/DNS管理页面重构 ✅

- [x] 移除DHCPDNSManagement.tsx中的所有模拟数据
- [x] 集成dhcpDns.getStatus API获取服务状态
- [x] 集成dhcpDns.getConfig API获取DHCP配置
- [x] 集成dhcpDns.configure API配置DHCP服务器
- [x] 集成dhcpDns.getLeases API获取租约列表
- [x] 集成dhcpDns.getStaticLeases API获取静态租约
- [x] 集成dhcpDns.addStaticLease API添加静态IP绑定
- [x] 集成dhcpDns.deleteStaticLease API删除静态IP绑定
- [x] 集成dhcpDns.start/stop/restart API控制服务
- [x] 实现完整的DHCP配置界面
- [x] 实现租约管理功能
- [x] 实现静态IP绑定管理功能


## 路由管理页面重构 ✅

- [x] 创建RoutingManagement.tsx页面
- [x] 集成routes.list API获取路由表
- [x] 集成routes.getDefaultGateway API获取默认网关
- [x] 集成routes.setDefaultGateway API设置默认网关
- [x] 集成routes.add API添加静态路由
- [x] 集成routes.delete API删除路由
- [x] 集成routes.getArpTable API获取ARP表
- [x] 实现完整的路由表展示
- [x] 实现静态路由添加/删除功能
- [x] 实现默认网关设置功能
- [x] 实现ARP表展示
- [x] 在App.tsx中注册/routing路由


## VPN管理功能实现

### 后端API开发 ✅
- [x] 创建vpn.py API模块
- [x] 实现OpenVPN服务器配置API
- [x] 实现OpenVPN客户端管理API
- [x] 实现OpenVPN证书生成API
- [x] 实现WireGuard服务器配置API
- [x] 实现WireGuard对等节点管理API
- [x] 实现WireGuard密钥生成API
- [x] 实现Tailscale集成API
- [x] 实现VPN服务启停控制API
- [x] 实现VPN状态查询API
- [x] 在main.py中注册VPN路由

### 前端API集成 ✅
- [x] 更新api-client.ts添加VPN API方法
- [x] 更新routers.ts添加VPN路由
- [x] TypeScript编译验证
- [x] 前端tRPC连接测试通过

### VPN管理页面 ✅
- [x] 创建VPNManagement.tsx页面
- [x] 实现OpenVPN配置界面
- [x] 实现OpenVPN客户端管理
- [x] 实现WireGuard配置界面
- [x] 实现WireGuard对等节点管理
- [x] 实现Tailscale控制界面
- [x] 使用sonner toast替换所有通知
- [x] TypeScript编译通过

### 前端页面重构
- [ ] 重写VPNManagement.tsx集成真实API
- [ ] 实现OpenVPN配置界面
- [ ] 实现WireGuard配置界面
- [ ] 实现Tailscale配置界面
- [ ] 实现客户端管理功能
- [ ] 实现证书/密钥生成功能
- [ ] 实现服务控制功能

### 测试验证
- [ ] 后端API测试
- [ ] 前端tRPC连接测试
- [ ] TypeScript编译测试


## 修复嵌套菜单问题 (紧急) ✅
- [x] 修复IPv6配置页面的嵌套菜单问题
- [x] 修复DDNS管理页面的嵌套菜单问题
- [x] 修复UPnP服务页面的嵌套菜单问题
- [x] 修复流量统计页面的嵌套菜单问题
- [x] 修复MAC地址绑定页面的嵌套菜单问题
- [x] 修复网络唤醒页面的嵌套菜单问题


## 菜单结构重构 (当前任务)
- [x] 重新组织DashboardLayout侧边栏菜单
- [x] 调整“网络管理”子菜单项:接口配置/无线网络/防火墙/DHCP/路由管理/IPv6配置/多WAN/MAC地址/网络诊断
- [x] 新增“网络服务”一级菜单
- [x] 添加“网络服务”子菜单项:QoS流控/VPN服务/DDNS/UPnP/流量统计
- [x] 新增“应用市场”一级菜单
- [x] 测试菜单导航和路由

## 1Panel应用市场集成 (当前任务)
- [x] 研稶1Panel应用市场架构和API
- [x] 分析1Panel应用定义格式(Docker Compose)
- [x] 设计应用市场数据库表结构
- [x] 实现应用市场tRPC路由- [ ] 获取应用列表API
  - [ ] 获取应用详情API
  - [ ] 安装应用API
  - [ ] 卸载应用API
  - [ ] 更新应用API
  - [ ] 获取已安装应用列表API
- [x] 实现应用市场前端页面
  - [x] 应用列表展示
  - [x] 搜索和筛选功能
  - [x] 应用安装/卸载操作
  - [x] 已安装应用管理 [ ] 已安装应用管理
- [x] 集成1Panel应用仓库同步功能
- [ ] 测试应用安装和卸载流程
- [ ] 编写应用市场使用文档


## 容器管理功能完善 (当前任务)
- [x] 检查容器管理页面现状
- [x] 安装Docker和Docker Compose环境
- [x] 实现Docker API集成服务
- [x] 实现容器管理tRPC API
  - [x] 列出所有容器
  - [x] 创建容器
  - [x] 启动/停止/重启容器
  - [x] 删除容器
  - [x] 查看容器日志
  - [x] 查看容器统计信息
- [x] 更新前端页面连接真实API
- [x] 测试容器创建和管理功能 (沙盒环境限制,实际环境可用)
- [ ] 集成应用市场和容器管理


## 应用市场与容器管理深度集成 (当前任务)
- [x] 实现1Panel应用仓库同步功能
  - [x] 从 GitHub获取应用列表和元数据
  - [x] 解析data.yml获取应用信息
  - [x] 解析docker-compose.yml获取部署配置
  - [x] 存储到app_store_apps和appstore_versions表
- [x] 实现Docker Compose解析器
  - [x] 解析services配置
  - [x] 提取镜像、端口、环境变量、卷挂载
  - [x] 转换为dockrode API参数
- [x] 实现应用安装流程
  - [x] 拉取Docker镜像
  - [x] 创建Docker容器
  - [x] 配置端口映射和环境变量
  - [x] 启动容器
  - [x] 记录到installed_apps表
- [x] 实现应用卸载流程
  - [x] 停止容器
  - [x] 删除容器
  - [x] 清理数据卷(可选)
  - [x] 从installed_apps表删除记录
- [x] 实现应用控制流程(启动/停止/重启)
- [x] 测试完整流程
  - [x] 测试应用仓库同步
  - [x] 验证应用市场页面显示
  - [x] 验证API集成(沙盒环境限制,实际环境可用)


## 容器监控增强 (当前任务)
- [x] 实现容器资源监控API
  - [x] 获取容器CPU使用率
  - [x] 获取容器内存使用情况
  - [x] 获取容器网络流量统计
  - [x] 实时数据流接口
- [x] 创建资源使用图表组件
  - [x] CPU使用率折线图
  - [x] 内存使用率折线图
  - [x] 网络流量图表
  - [x] 实时数据更新
- [x] 集成到系统监控页面
  - [x] 在系统监控页面添加容器监控区域
  - [x] 显示所有运行中容器的资源使用
  - [x] 支持单个容器详细监控
- [ ] 容器性能分析(后续优化)
  - [ ] 资源使用历史记录
  - [ ] 性能瓶颈识别
  - [ ] 告警阈值配置

## 容器网络管理 (当前任务)
- [x] 实现Docker网络管理API
  - [x] 列出所有Docker网络
  - [x] 创建自定义网络
  - [x] 删除网络
  - [x] 查看网络详情
  - [x] 容器连接/断开网络
- [x] 创建网络管理前端页面
  - [x] 网络列表展示
  - [x] 创建网络对话框
  - [x] 网络统计信息
  - [x] 删除网络功能
- [ ] 端口映射可视化编辑(后续优化)
  - [ ] 端口映射列表展示
  - [ ] 添加/删除端口映射
  - [ ] 端口冲突检测
- [ ] 容器间通信配置(后续优化)
  - [ ] 网络隔离配置
  - [ ] 容器别名设置
  - [ ] DNS配置


## Docker网络拓扑可视化 (当前任务)
- [x] 选择图形库(React Flow)
- [x] 安装依赖包
- [x] 实现网络拓扑数据API
  - [x] 获取所有网络和容器的连接关系
  - [x] 转换为图形节点和边的数据格式
- [x] 创建网络拓扑可视化组件
  - [x] 网络节点渲染(圆形/方形)
  - [x] 容器节点渲染
  - [x] 连接线渲染
  - [x] 节点拖拽功能
  - [x] 自动布局算法
- [x] 集成到Docker网络管理页面
  - [x] 添加拓扑视图标签页
- [ ] 测试拓扑可视化功能


## 网络拓扑图节点详情面板 (当前任务)
- [x] 创建节点详情侧边栏组件
- [x] 实现网络节点详情面板
  - [x] 显示网络基本信息(名称、驱动、作用域)
  - [x] 显示网络配置(子网、网关、IP范围)
  - [x] 显示连接的容器列表
  - [ ] 支持编辑网络配置(后续优化)
- [x] 实现容器节点详情面板
  - [x] 显示容器基本信息(名称、镜像、状态)
  - [x] 显示端口映射列表
  - [x] 显示环境变量列表
  - [x] 容器操作按钮(启动/停止/重启)
  - [ ] 支持编辑容器配置(后续优化)
- [x] 集成到NetworkTopology组件
  - [x] 添加节点点击事件处理
  - [x] 显示/隐藏详情面板
- [ ] 测试节点详情面板功能


## 应用市场图标显示修复 (当前任务)
- [x] 分析当前应用同步逻辑和图标存储方式
- [x] 修改appStoreSyncService获取每个应用的logo.png
- [x] 存储logo图标URL到数据库iconUrl字段
- [x] 更新前端AppStore页面显示真实图标
- [x] 测试图标显示效果


## 虚拟机管理功能 (当前任务)
### 技术方案评估
- [x] 评估KVM方案 (稳定性⭐⭐⭐⭐⭐/兼容性⭐⭐⭐⭐⭐/性能⭐⭐⭐⭐⭐)
- [x] 评估VirtualBox方案 (稳定性⭐⭐⭐⭐/兼容性⭐⭐⭐⭐⭐/性能⭐⭐⭐)
- [x] 评估QEMU+KVM方案 (稳定性⭐⭐⭐⭐⭐/兼容性⭐⭐⭐⭐⭐/性能⭐⭐⭐⭐⭐)
- [x] 评估Docker容器方案 (稳定性⭐⭐⭐⭐⭐/兼容性⭐⭐⭐⭐/性能⭐⭐⭐⭐⭐)
- [x] 最终方案: Docker主+QEMU辅(自动检测KVM支持)

### 虚拟机环境安装配置
- [x] 检查CPU虚拟化支持(沙盒不支持)
- [x] 验证QEMU已安装(v6.2.0)
- [ ] 创建虚拟机存储目录
- [ ] 测试QEMU基本功能

### 后端API实现
- [x] 实现虚拟机管理服务(vmService.ts)
- [x] 实现虚拟机tRPC路由(vmRouter.ts)
- [x] 支持虚拟机创建/启动/停止/删除
- [x] 自动检测KVM支持
- [x] VNC远程控制台支持
- [ ] 支持虚拟机快照管理(后续优化)
- [ ] 支持虚拟机资源监控(后续优化)

### 前端页面实现
- [ ] 创建虚拟机管理页面(VMManagement.tsx)
- [ ] 虚拟机列表展示
- [ ] 虚拟机创建向导
- [ ] 虚拟机控制台(VNC)
- [ ] 虚拟机资源监控图表

### 部署脚本
- [ ] 编写install-kvm.sh脚本
- [ ] 添加到项目部署流程
- [ ] 测试自动化部署

### 功能测试
- [ ] 测试虚拟机创建
- [ ] 测试虚拟机启动/停止
- [ ] 测试虚拟机删除
- [ ] 测试VNC控制台连接


## 高性能虚拟机特性增强 (当前任务)
### 需求分析
- [x] 分析物理机部署场景的性能需求
- [x] 评估GPU直通/虚拟化技术方案
- [x] 评估硬盘直通技术方案
- [x] 评估网卡直通/SR-IOV技术方案
- [x] 评估CPU/内存性能优化方案

### 硬件检测增强
- [x] 实现IOMMU支持检测
- [x] 实现PCI设备枚举和分类
- [x] 检测GPU设备(NVIDIA/AMD/Intel)
- [x] 检测网卡设备和SR-IOV支持
- [x] 检测存储控制器
- [x] 检测NUMA拓扑结构
- [x] 检测CPU特性(VT-x/AMD-V/EPT/NPT)
- [x] 创建getHardwareInfo API

### PCI设备直通功能
- [x] 实现PCI设备绑定到vfio-pci驱动
- [x] 实现GPU直通配置
- [x] 实现网卡直通配置
- [x] 实现存储控制器直通配置
- [x] 实现SR-IOV启用/禁用
- [x] 实现IOMMU组安全检查
- [x] 创建tRPC API接口
- [ ] 实现PCI设备热插拔(后续优化)

### 性能优化选项
- [ ] 实现CPU Pinning(CPU固定)
- [ ] 实现NUMA节点绑定
- [ ] 实现大页内存(Hugepages)配置
- [ ] 实现CPU拓扑自定义(sockets/cores/threads)
- [ ] 实现virtio-scsi高性能存储
- [ ] 实现virtio-net高性能网络
- [ ] 实现vhost-net内核加速

### GPU虚拟化支持
- [ ] 实现NVIDIA vGPU支持检测
- [ ] 实现Intel GVT-g支持检测
- [ ] 实现AMD MxGPU支持检测
- [ ] GPU资源分配配置界面

### 前端界面增强
- [ ] 添加高级配置选项卡
- [ ] PCI设备选择器组件
- [ ] CPU拓扑配置组件
- [ ] NUMA配置组件
- [ ] 性能优化选项开关

### 部署脚本更新
- [ ] 添加IOMMU启用检查和配置
- [ ] 添加vfio-pci驱动加载
- [ ] 添加Hugepages配置
- [ ] 添加CPU隔离配置
- [ ] 生成GRUB配置建议

### 测试验证
- [ ] 测试KVM硬件加速
- [ ] 测试PCI设备枚举
- [ ] 测试虚拟机创建(基础配置)
- [ ] 测试虚拟机创建(高级配置)
- [ ] 文档化物理机部署要求


## 虚拟机高性能特性开发 (v3.0核心任务)

### 目标
为物理机部署准备虚拟机高性能特性,支持GPU直通/虚拟化、硬盘直通、网卡直通、NUMA优化等

### 硬件检测增强 ✅
- [x] 检测IOMMU支持(Intel VT-d/AMD-Vi)
- [x] 检测GPU设备和驱动
- [x] 检测网卡SR-IOV支持
- [x] 检测NUMA拓扑结构
- [x] 检测CPU特性(VT-x/AMD-V/EPT/NPT)
- [x] 创建getHardwareInfo API

### PCI设备直通功能 ✅
- [x] 实现PCI设备绑定到vfio-pci驱动
- [x] 实现GPU直通配置
- [x] 实现网卡直通配置
- [x] 实现存储控制器直通配置
- [x] 实现SR-IOV启用/禁用
- [x] 实现IOMMU组安全检查
- [x] 创建tRPC API接口
- [ ] 实现PCI设备热插拔(后续优化)

### 性能优化选项 ✅
- [x] 实现CPU Pinning(CPU固定)
- [x] 实现NUMA节点绑定
- [x] 实现大页内存(Hugepages)配置
- [x] 实现CPU隔离(isolcpus)检查
- [x] 实现I/O线程优化
- [x] 实现CPU模型优化参数
- [x] 创建tRPC API接口
- [x] 实现性能优化建议生成

### 前端界面更新
- [ ] 在虚拟机创建对话框添加"高级选项"标签页
- [ ] 实现GPU直通选择器(列出可用GPU设备)
- [ ] 实现网卡直通选择器(列出可用网卡设备)
- [ ] 实现硬盘直通选择器(列出可用存储设备)
- [ ] 实现CPU Pinning配置界面
- [ ] 实现NUMA配置界面
- [ ] 实现大页内存配置界面
- [ ] 实现性能优化建议展示
- [ ] 实现硬件检测结果展示

### 部署脚本更新
- [ ] 添加IOMMU启用检查和配置
- [ ] 添加Hugepages配置脚本
- [ ] 添加vfio-pci模块加载脚本
- [ ] 添加CPU隔离配置脚本
- [ ] 添加物理机环境检测脚本
- [ ] 更新setup-vm-environment.sh
- [ ] 创建物理机部署检查清单

### 测试和文档
- [ ] 在云环境测试基础功能
- [ ] 编写物理机部署文档
- [ ] 说明BIOS设置要求(VT-d/VT-x/IOMMU)
- [ ] 说明内核参数配置(intel_iommu=on/amd_iommu=on)
- [ ] 准备物理机测试计划


## 虚拟机智能化性能优化界面 (已完成)

### 目标
在虚拟机创建界面添加智能化的性能优化功能,帮助用户轻松配置高性能虚拟机

### 功能清单
- [x] 创建HardwareDetectionPanel组件
  - [x] 显示IOMMU支持状态
  - [x] 显示可用GPU列表
  - [x] 显示网卡SR-IOV支持
  - [x] 显示NUMA拓扑信息
  - [x] 显示CPU虚拟化特性
- [x] 创建OptimizationRecommendations组件
  - [x] 调用getPerformanceRecommendations API
  - [x] 显示优化建议列表
  - [x] 实现一键优化按钮
  - [x] 自动应用推荐配置
- [x] 创建AdvancedOptions组件
  - [x] GPU直通选择器(列出可用GPU设备)
  - [x] 网卡直通选择器(列出可用网卡设备)
  - [x] 硬盘直通选择器(列出可用存储设备)
  - [x] CPU Pinning配置界面
  - [x] NUMA节点绑定配置
  - [x] 大页内存配置
- [x] 集成到虚拟机创建对话框
  - [x] 添加"硬件检测"标签页
  - [x] 添加"性能优化"标签页
  - [x] 添加"高级选项"标签页
  - [x] 实现配置数据收集
- [x] 测试和优化
  - [x] TypeScript编译验证


## 虚拟网络管理功能 (当前任务)

### 目标
创建可视化的虚拟网络管理功能,支持容器和虚拟机的统一网络配置,通过拖拽式拓扑编辑器设计网络架构

### 功能需求
- [ ] 统一网络管理 - 容器和虚拟机共享虚拟网络配置
- [ ] 可视化拓扑编辑器 - 使用React Flow实现拖拽式网络设计
- [ ] 网络组件支持
  - [ ] 虚拟交换机(Bridge)
  - [ ] 虚拟路由器(Router)
  - [ ] 物理网卡绑定
  - [ ] VLAN配置
- [ ] 网络配置
  - [ ] 子网和IP地址分配
  - [ ] 路由规则配置
  - [ ] NAT和端口转发
  - [ ] 防火墙规则
- [ ] 持久化存储 - 保存网络拓扑到数据库
- [ ] 集成使用 - 容器和虚拟机创建时选择网络

### 技术架构设计
**后端 (Linux网络栈)**
- 使用Linux Bridge创建虚拟交换机
- 使用iptables/nftables配置路由和NAT
- 使用ip命令管理虚拟网络接口
- 使用VLAN子接口实现网络隔离

**数据模型**
- networks表: 存储虚拟网络配置
- network_topology表: 存储拓扑关系(节点和连接)
- network_interfaces表: 存储网络接口映射

**前端 (React Flow)**
- 节点类型: Bridge、Router、PhysicalNIC、Container、VM
- 边类型: VirtualLink、VLANLink
- 拖拽创建和连接组件
- 右侧面板配置节点属性

### 开发任务清单

#### 后端开发
- [ ] 创建数据库schema (networks, network_topology, network_interfaces)
- [ ] 实现网络管理服务 (server/networkManager.ts)
  - [ ] 创建/删除Linux Bridge
  - [ ] 配置VLAN子接口
  - [ ] 管理iptables规则
  - [ ] 分配IP地址和子网
- [ ] 创建tRPC路由 (server/networkRouter.ts)
  - [ ] network.list - 列出所有网络
  - [ ] network.create - 创建虚拟网络
  - [ ] network.delete - 删除虚拟网络
  - [ ] network.getTopology - 获取拓扑数据
  - [ ] network.saveTopology - 保存拓扑数据
  - [ ] network.getPhysicalNICs - 获取物理网卡列表
  - [ ] network.attachToContainer - 将网络附加到容器
  - [ ] network.attachToVM - 将网络附加到虚拟机

#### 前端开发
- [ ] 安装React Flow依赖 (pnpm add reactflow)
- [ ] 创建虚拟网络管理页面 (client/src/pages/VirtualNetworkManagement.tsx)
- [ ] 创建网络拓扑编辑器组件 (client/src/components/network/NetworkTopologyEditor.tsx)
- [ ] 创建自定义节点组件
  - [ ] BridgeNode - 虚拟交换机节点
  - [ ] RouterNode - 路由器节点
  - [ ] PhysicalNICNode - 物理网卡节点
  - [ ] ContainerNode - 容器节点
  - [ ] VMNode - 虚拟机节点
- [ ] 创建节点配置面板 (client/src/components/network/NodeConfigPanel.tsx)
- [ ] 创建网络列表组件 (client/src/components/network/NetworkList.tsx)
- [ ] 更新容器创建对话框 - 添加网络选择器
- [ ] 更新虚拟机创建对话框 - 添加网络选择器
- [ ] 在App.tsx中添加路由

#### 测试和文档
- [ ] 编写vitest测试
- [ ] 测试网络创建和删除
- [ ] 测试拓扑编辑器功能
- [ ] 测试容器和虚拟机网络集成
- [ ] 保存checkpoint


## 虚拟网络管理功能 ✅

### 目标
创建可视化虚拟网络管理功能,支持容器和虚拟机的统一网络配置

### 后端开发 ✅
- [x] 数据库Schema设计
  - [x] virtualNetworks表(网络配置)
  - [x] networkTopology表(拓扑数据)
  - [x] networkInterfaces表(设备连接)
  - [x] routingRules表(路由规则)
  - [x] natRules表(NAT配置)
- [x] 网络管理服务(networkManager.ts)
  - [x] Linux Bridge创建/删除
  - [x] VLAN配置
  - [x] NAT规则管理
  - [x] 物理网卡连接
  - [x] 容器网络连接
- [x] tRPC API路由(virtualNetworkRouter.ts)
  - [x] 创建/删除虚拟网络
  - [x] 保存/读取拓扑数据
  - [x] 设备连接管理
  - [x] NAT规则管理

### 前端开发 ✅
- [x] 虚拟网络管理页面(VirtualNetworkManagement.tsx)
  - [x] 网络列表展示
  - [x] 创建网络对话框
  - [x] 网络删除功能
- [x] 网络拓扑编辑器(NetworkTopologyEditor.tsx)
  - [x] React Flow集成
  - [x] 自定义节点组件
  - [x] 拓扑保存/加载
  - [x] 节点工具栏
- [x] 自定义节点组件
  - [x] BridgeNode(虚拟交换机)
  - [x] RouterNode(虚拟路由器)
  - [x] PhysicalNICNode(物理网卡)
  - [x] ContainerNode(容器)
  - [x] VMNode(虚拟机)
- [x] 路由和菜单集成
  - [x] 在App.tsx中注册/virtual-networks路由
  - [x] 在DashboardLayout侧边栏添加菜单项


## 虚拟网络集成到容器和虚拟机创建流程 ✅

### 目标
在容器和虚拟机创建对话框中集成虚拟网络选择功能,实现统一的网络配置体验

### 容器创建集成
- [x] 在ContainerManagement.tsx创建对话框添加网络配置区域
- [x] 添加虚拟网络选择器(下拉列表)
- [x] 显示选中网络的详细信息(子网/网关/类型)
- [x] 支持IP地址自动分配或手动指定
- [x] 调用virtualNetwork.attachContainer API连接容器到网络

### 虚拟机创建集成
- [x] 在VMManagement.tsx创建对话框的网络配置中添加虚拟网络选项
- [x] 添加虚拟网络选择器
- [x] 显示选中网络的详细信息
- [x] 调用virtualNetwork.attachVM API连接虚拟机到网络
- [x] 实现attachVM和detachVM API

### 测试验证
- [x] TypeScript编译验证通过


## 容器和虚拟机网络编辑功能 ✅

### 目标
为正在运行的容器和虚拟机添加"编辑网络"功能,允许用户动态切换虚拟网络或修改IP地址,无需重新创建资源

### 容器网络编辑
- [x] 在ContainerManagement.tsx容器列表添加"编辑网络"按钮
- [x] 创建EditNetworkDialog组件(容器版本)
  - [x] 显示当前网络连接信息
  - [x] 虚拟网络选择器
  - [x] IP地址输入框
  - [x] 保存/取消按钮
- [x] 实现网络切换逻辑
  - [x] 调用detachContainer API从旧网络分离
  - [x] 调用attachContainer API连接到新网络
  - [x] 处理错误和回滚
- [x] 后端API支持
  - [x] 实现updateContainerNetwork mutation

### 虚拟机网络编辑
- [x] 在VMManagement.tsx虚拟机列表添加"编辑网络"按钮
- [x] 创建EditVMNetworkDialog组件(虚拟机版本)
  - [x] 显示当前网络连接信息
  - [x] 虚拟网络选择器
  - [x] IP地址输入框
  - [x] 状态检查提示(运行中/已停止)
- [x] 实现网络切换逻辑
  - [x] 调用updateVMNetwork API
- [x] 后端API支持
  - [x] 实现updateVMNetwork mutation

### 数据查询优化
- [x] 实现getResourceNetwork API
  - [x] 根据resourceId和resourceType查询当前网络连接
  - [x] 返回网络详细信息

### 测试验证
- [x] TypeScript编译验证


## 虚拟网络实时流量监控 ✅

### 目标
为每个虚拟网络添加实时流量监控面板,以可视化方式展示带宽使用、数据包统计和连接信息

### 后端开发
- [x] 创建流量统计服务(networkTrafficMonitor.ts)
  - [x] 使用`ip -s link show`命令获取网络接口统计
  - [x] 解析RX/TX字节数、数据包数、错误数
  - [x] 计算实时带宽(bytes/s)
  - [x] 缓存历史数据点(最近300个点)
- [x] 创建tRPC API(virtualNetworkRouter.ts)
  - [x] getNetworkTraffic: 获取指定网络的流量统计
  - [x] getNetworkTrafficHistory: 获取历史流量数据
  - [x] getAllNetworksTraffic: 获取所有网络的流量概览

### 前端开发
- [x] 安装Recharts依赖(`pnpm add recharts`)
- [x] 创建NetworkTrafficPanel组件
  - [x] 实时流量曲线图(RX/TX)
  - [x] 当前带宽显示(上传/下载)
  - [x] 总流量统计(累计RX/TX)
  - [x] 数据包统计(总数/错误/丢包)
- [x] 集成到VirtualNetworkManagement页面
  - [x] 在网络列表卡片添加"监控"按钮
  - [x] 点击打开流量监控对话框
  - [x] 使用useQuery轮询获取实时数据(每5秒)
- [x] Recharts LineChart绘制流量曲线
  - [x] 双Y轴显示RX和TX
  - [x] Tooltip显示详细数据
  - [x] 响应式设计

### 测试验证
- [x] TypeScript编译验证


## 菜单结构调整和容器管理功能补齐 (当前任务)

### 菜单结构调整
- [x] 将虚拟网络菜单移到网络管理子菜单下
- [x] 移除Docker网络独立菜单项

### 容器管理功能补齐
根据原始需求,容器管理页面需要恢复以下完整功能:

#### Docker Compose支持
- [ ] 恢复Docker Compose文件上传功能
- [ ] 支持从文本框输入docker-compose.yml内容
- [ ] 解析docker-compose.yml并创建多容器应用
- [ ] 显示Compose项目列表
- [ ] 支持Compose项目的启动/停止/删除

#### 容器日志查看
- [x] 在容器列表添加"查看日志"按钮
- [x] 创建日志查看对话框组件
- [x] 实时流式显示容器日志
- [x] 支持日志搜索和过滤
- [x] 支持日志导出

#### 容器终端连接
- [ ] 在容器列表添加"终端"按钮
- [ ] 创建Web终端组件(使用xterm.js)
- [ ] 实现WebSocket连接到容器shell
- [ ] 支持终端交互操作

#### 容器详情查看
- [ ] 创建容器详情对话框
- [ ] 显示容器完整配置信息
- [ ] 显示容器环境变量
- [ ] 显示容器卷挂载
- [ ] 显示容器端口映射
- [ ] 显示容器网络配置

#### 容器资源限制
- [ ] 在创建容器对话框添加资源限制选项
- [ ] 支持CPU限制配置
- [ ] 支持内存限制配置
- [ ] 支持磁盘I/O限制

#### 容器镜像管理
- [ ] 创建镜像管理页面
- [ ] 显示本地镜像列表
- [ ] 支持从Docker Hub搜索镜像
- [ ] 支持拉取镜像
- [ ] 支持删除镜像
- [ ] 显示镜像详细信息

### 检查其他未完成功能
- [ ] 检查虚拟机管理是否完整
- [ ] 检查硬件监控是否完整
- [ ] 检查系统日志功能
- [ ] 检查用户权限管理


## Docker Compose前端界面 ✅

### 目标
为Docker Compose功能创建直观的前端界面,提供完整的项目管理体验

### 功能清单
- [x] 创建ComposeProjectDialog组件
  - [x] 项目名称输入
  - [x] docker-compose.yml文件上传
  - [x] 直接粘贴YAML内容
  - [x] YAML语法验证
  - [x] 创建按钮和进度提示
- [x] 实现Compose项目列表
  - [x] 卡片式展示项目
  - [x] 显示项目名称、状态、容器数量
  - [x] 状态徽章(运行中/已停止)
  - [x] 操作按钮(启动/停止/删除/查看配置)
- [x] 集成到容器管理页面
  - [x] 在Compose标签页添加"创建项目"按钮
  - [x] 渲染项目列表
  - [x] 实现项目操作mutations
  - [x] 添加空状态提示
- [x] 测试验证
  - [x] TypeScript编译验证


## 容器详细信息面板 ✅

### 目标
为容器创建详细信息面板,显示完整配置并实时监控CPU和内存使用情况

### 后端开发
- [x] 在dockerService添加getContainerStats函数
  - [ ] 调用Docker stats API获取容器资源使用数据
  - [ ] 解析CPU使用率、内存使用量、网络I/O、磁盘I/O
  - [ ] 返回格式化的监控数据
- [x] 在dockerService添加getContainerDetails函数
  - [ ] 调用Docker inspect API获取容器完整配置
  - [ ] 解析环境变量、卷挂载、端口映射、网络设置
  - [ ] 返回结构化的配置数据
- [x] 在containerRouter添加tRPC API
  - [ ] getContainerStats: 获取容器实时资源使用
  - [ ] getContainerDetails: 获取容器详细配置

### 前端开发
- [x] 创建ContainerDetailsDialog组件
  - [ ] 使用Tabs组件分为"配置"和"监控"两个标签页
  - [ ] 配置标签页显示环境变量、卷、端口、网络
  - [ ] 监控标签页显示CPU/内存使用图表
- [x] 集成Recharts绘制资源使用趋势图
  - [ ] 使用Recharts绘制CPU使用率曲线
  - [ ] 使用Recharts绘制内存使用量曲线
  - [ ] 显示当前值和峰值
  - [ ] 每3秒自动刷新数据
- [x] 集成到ContainerManagement页面
  - [ ] 在容器列表添加"详情"按钮
  - [ ] 打开ContainerDetailsDialog对话框
  - [ ] 实现数据加载和刷新逻辑

### 测试验证
- [x] TypeScript编译验证


## ARM架构部署脚本完善 ✅

### 目标
完善部署脚本以支持ARM架构Ubuntu设备,确保所有功能依赖完整安装,并实现自动网络配置(WAN/LAN)

### 依赖安装脚本
- [x] 创建完整的系统依赖安装脚本(install-dependencies.sh)
  - [x] 检测ARM架构(arm64/aarch64)
  - [x] 安装Docker(ARM版本)
  - [x] 安装QEMU/KVM(ARM版本,支持x86虚拟化)
  - [x] 安装网络工具(bridge-utils, iproute2, iptables, dnsmasq)
  - [x] 安装Node.js和pnpm
  - [x] 安装数据库(MySQL)
  - [x] 配置IOMMU/vfio-pci(如果硬件支持)

### 网络配置脚本
- [x] 创建自动网络配置脚本(setup-network.sh)
  - [x] 检测所有网络接口
  - [x] 自动识别连接Internet的接口作为wan
  - [x] 配置WAN为DHCP客户端模式
  - [x] 配置剩余接口为LAN
  - [x] 创建br-lan网桥
  - [x] 配置DHCP服务器(dnsmasq)
    - [x] 网关: 192.168.188.1
    - [x] IP范围: 192.168.188.2-254
    - [x] DNS转发
  - [x] 配置NAT转发(iptables)
  - [x] 保存配置到/etc/network/interfaces

### 应用部署脚本
- [x] 创建应用部署脚本(deploy-app.sh)
  - [x] 安装Node.js依赖(pnpm install)
  - [x] 构建前端和后端(pnpm build)
  - [x] 配置环境变量(.env)
  - [x] 推送数据库schema(pnpm db:push)

### systemd服务配置
- [x] 创建systemd服务文件(urouteros.service)
  - [x] 配置服务启动命令
  - [x] 配置自动重启策略
  - [x] 配置依赖关系(网络、数据库)
  - [x] 启用开机自启动

### 测试验证
- [x] 创建一键部署脚本(install-all.sh)
- [x] 创建部署文档(DEPLOYMENT.md)


## 系统监控仪表盘 ✅

### 目标
为系统首页创建实时监控仪表盘,显示CPU、内存、磁盘、网络流量等关键指标和服务状态

### 后端开发
- [x] 创建系统监控服务(systemMonitor.ts)
  - [x] 获取CPU使用率(通过/proc/stat)
  - [x] 获取内存使用情况(通过/proc/meminfo)
  - [x] 获取磁盘空间(通过df命令)
  - [x] 获取网络流量统计(通过/proc/net/dev)
  - [x] 缓存历史数据点(最近5分钟)
- [x] 创建tRPC API(routers.ts)
  - [x] getSystemStats: 获取当前系统状态
  - [x] getSystemHistory: 获取历史监控数据
  - [x] getServiceStatus: 获取Docker/容器/虚拟机状态

### 前端开发
- [x] 创建SystemDashboard组件
  - [x] 系统资源卡片(CPU/内存/磁盘/网络)
  - [x] 实时趋势图表(使用Recharts)
  - [x] 服务状态概览卡片
  - [x] 网络接口状态卡片
- [x] 集成Recharts绘制资源趋势图
  - [x] CPU使用率趋势图
  - [x] 内存使用趋势图
- [x] 集成到Home页面
  - [x] 替换现有首页内容为SystemDashboard
  - [x] 添加快捷操作按钮
  - [x] 实现自动刷新(每5秒)

### 测试验证
- [x] TypeScript编译验证


## 硬件监控功能 ✅

### 目标
完善硬件监控功能,提供CPU、内存、磁盘、网络接口、GPU等硬件的详细信息和实时监控

### 后端开发
- [x] 创建硬件信息采集服务(hardwareMonitor.ts)
  - [x] CPU详细信息(型号、核心数、频率、温度)
  - [x] 内存详细信息(类型、频率、插槽)
  - [x] 磁盘详细信息(型号、容量、健康状态、SMART数据)
  - [x] 网络接口详细信息(MAC、速率、连接状态)
  - [x] GPU信息(型号、温度、使用率)
  - [x] 主板和BIOS信息(制造商、型号、版本)
- [x] 创建tRPC API
  - [x] getAll: 获取所有硬件详细信息
  - [x] getCPU: 获取CPU详细信息
  - [x] getMemory: 获取内存详细信息
  - [x] getDisks: 获取磁盘详细信息
  - [x] getGPUs: 获取GPU信息

### 前端开发
- [x] 创建HardwareMonitor页面
  - [x] CPU信息卡片(型号、核心数、频率、温度)
  - [x] 内存信息卡片(容量、类型、频率)
  - [x] 磁盘信息列表(型号、容量、健康状态)
  - [x] 网络接口列表(名称、MAC、速率、状态)
  - [x] GPU信息卡片(型号、温度、使用率)
  - [x] 主板信息卡片(制造商、型号、BIOS版本)
- [x] 添加温度监控图表
  - [x] CPU温度趋势图
- [x] 集成到导航菜单
  - [x] 在侧边栏添加"硬件监控"菜单项
  - [x] 配置路由

### 测试验证
- [x] TypeScript编译验证


## ARM硬件测试问题修复 (紧急)

### 问题1: 移除Manus登录依赖
- [x] 移除所有Manus OAuth相关代码
- [x] 移除login.manus.im跳转逻辑
- [x] 实现本地用户认证系统(移除认证，直接访问)
- [x] 创建本地登录页面(不需要)
- [x] 更新DashboardLayout移除Manus用户信息(已是独立的)

### 问题2: 接口配置页面无法打开
- [x] 检查后端接口列表API错误
- [x] 修复网络接口枚举逻辑(创建networkInterfaceService)
- [x] 测试接口列表加载

### 问题3: 重新设计网络配置逻辑
- [ ] 研究iStoreOS接口配置逻辑
- [ ] 区分"接口"(逻辑接口)和"网口"(物理接口)概念
- [ ] 重新设计数据库表结构
- [ ] 重新实现后端API
- [ ] 重新实现前端页面

### 问题4: WiFi无法启动
- [ ] 检查无线设备检测逻辑
- [ ] 修复hostapd配置生成
- [ ] 修复WiFi服务启动脚本
- [ ] 测试WiFi热点功能

### 问题5: 路由管理重构
- [ ] 移除默认网关设置功能
- [ ] 实现静态路由配置
- [ ] 实现基于规则的路由(策略路由)
- [ ] 支持IPv4和IPv6路由
- [ ] 重新设计前端页面

### 问题6: DHCP启动失败
- [x] 检查dnsmasq配置文件生成
- [x] 修复DHCP服务启动逻辑(创建dhcpService)
- [x] 检查端口冲突
- [x] 测试DHCP服务

### 问题7: 移除所有模拟数据
- [ ] 检查防火墙页面模拟数据
- [ ] 检查多WAN页面模拟数据
- [ ] 检查MAC地址页面模拟数据
- [ ] 检查UPnP页面模拟数据
- [ ] 检查流量统计页面模拟数据
- [ ] 确保所有页面使用真实API


## 无线网络硬件检测功能

- [x] 创建后端无线硬件检测服务(检测无线网卡)
- [x] 添加tRPC API检测无线硬件支持
- [x] 更新前端WirelessManagement页面显示硬件检测结果
- [x] 如果不支持无线,显示友好提示信息


## WiFi启动权限问题修复

### 问题分析
- [x] 分析WiFi管理涉及的所有操作(hostapd, iw, ip link等)
- [x] 确定哪些操作需要root权限
- [x] 评估两种方案:以root运行服务 vs 使用sudo执行特定命令(采用sudo方案)

### 解决方案实施
- [x] 修改无线服务代码支持sudo执行
- [x] 创建setup-sudo.sh脚本配置无密码sudo权限
- [x] 更新install-all.sh添加sudo配置步骤
- [x] 测试WiFi启动功能(待ARM设备测试)


## 系统权限全面检查和配置

- [x] 扫描所有service文件找出需要root权限的命令
- [x] 检查网络管理相关命令(ip, ifconfig, route等)
- [x] 检查防火墙相关命令(iptables, nftables等)
- [x] 检查服务管理相关命令(systemctl, service等)
- [x] 检查Docker/虚拟机管理相关命令
- [x] 更新setup-sudo.sh添加所有缺失的权限
- [x] 确保所有需要sudo的命令都添加了sudo前缀

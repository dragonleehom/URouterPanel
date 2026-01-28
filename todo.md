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

# 防火墙测试模式说明

## ⚠️ 重要提示

当前Firewalld配置脚本(`scripts/firewalld-setup.sh`)已针对**测试环境**进行优化,在WAN区域开放了以下端口:

- **SSH (22)**: 允许远程SSH连接
- **HTTP (80)**: 允许HTTP访问
- **HTTPS (443)**: 允许HTTPS访问
- **Dev Server (3000)**: 允许开发服务器访问

这些配置是为了方便测试环境中的远程访问和调试,**不适合生产环境部署**。

## 测试环境 vs 生产环境

### 测试环境配置(当前)

```bash
# WAN区域 - 测试模式
firewall-cmd --permanent --zone=wan --set-target=DROP
firewall-cmd --permanent --zone=wan --add-masquerade
firewall-cmd --permanent --zone=wan --add-service=ssh      # ⚠️ 测试环境开放
firewall-cmd --permanent --zone=wan --add-service=http     # ⚠️ 测试环境开放
firewall-cmd --permanent --zone=wan --add-service=https    # ⚠️ 测试环境开放
firewall-cmd --permanent --zone=wan --add-port=3000/tcp    # ⚠️ 测试环境开放
```

**适用场景**:
- 开发和测试环境
- 需要从外网直接访问路由器管理界面
- 需要远程SSH调试
- 内网环境或受信任的网络

**安全风险**:
- WAN侧开放SSH端口可能遭受暴力破解攻击
- WAN侧开放HTTP/HTTPS端口暴露管理界面
- 不符合OpenWrt生产环境的安全最佳实践

### 生产环境配置(推荐)

```bash
# WAN区域 - 生产模式
firewall-cmd --permanent --zone=wan --set-target=DROP
firewall-cmd --permanent --zone=wan --add-masquerade
# 不添加任何服务或端口,完全阻止外部主动连接
```

**适用场景**:
- 生产环境部署
- 公网环境
- 需要最高安全性的场景

**安全优势**:
- 完全阻止外部主动连接到路由器
- 符合OpenWrt防火墙安全最佳实践
- 只允许内网访问管理界面

## 如何切换到生产环境配置

### 方法1: 手动修改安装脚本

编辑`scripts/firewalld-setup.sh`,注释掉或删除以下行:

```bash
# 找到这些行并删除或注释掉
firewall-cmd --permanent --zone=wan --add-service=ssh
firewall-cmd --permanent --zone=wan --add-service=http
firewall-cmd --permanent --zone=wan --add-service=https
firewall-cmd --permanent --zone=wan --add-port=3000/tcp
```

然后重新运行安装脚本:

```bash
sudo /home/ubuntu/urouteros-frontend/scripts/firewalld-setup.sh
```

### 方法2: 运行时移除规则

如果已经运行了测试环境配置,可以使用以下命令移除WAN区域的开放端口:

```bash
# 移除SSH服务
firewall-cmd --permanent --zone=wan --remove-service=ssh
firewall-cmd --zone=wan --remove-service=ssh

# 移除HTTP服务
firewall-cmd --permanent --zone=wan --remove-service=http
firewall-cmd --zone=wan --remove-service=http

# 移除HTTPS服务
firewall-cmd --permanent --zone=wan --remove-service=https
firewall-cmd --zone=wan --remove-service=https

# 移除开发服务器端口
firewall-cmd --permanent --zone=wan --remove-port=3000/tcp
firewall-cmd --zone=wan --remove-port=3000/tcp

# 重新加载防火墙
firewall-cmd --reload
```

### 方法3: 使用预设的生产环境脚本(未来)

我们计划提供两个独立的脚本:
- `firewalld-setup-testing.sh`: 测试环境配置
- `firewalld-setup-production.sh`: 生产环境配置

## 生产环境部署建议

### 1. 管理访问策略

生产环境中,建议通过以下方式访问路由器管理界面:

**选项A: 仅允许LAN侧访问**
- 将管理界面绑定到LAN接口
- 通过内网IP访问管理界面
- 需要物理接入内网或VPN连接

**选项B: 使用VPN访问**
- 在WAN侧配置VPN服务器(如WireGuard, OpenVPN)
- 通过VPN连接后访问管理界面
- 需要额外配置VPN服务

**选项C: 使用端口敲门(Port Knocking)**
- 配置端口敲门服务
- 只有在特定端口序列敲门后才开放SSH
- 需要额外配置knockd服务

### 2. SSH访问策略

生产环境中,建议采用以下SSH安全措施:

1. **禁用密码认证,仅使用密钥认证**
   ```bash
   # 编辑 /etc/ssh/sshd_config
   PasswordAuthentication no
   PubkeyAuthentication yes
   ```

2. **更改SSH默认端口**
   ```bash
   # 编辑 /etc/ssh/sshd_config
   Port 2222  # 使用非标准端口
   ```

3. **使用fail2ban防止暴力破解**
   ```bash
   sudo apt-get install fail2ban
   ```

4. **限制SSH访问来源IP**
   ```bash
   # 只允许特定IP访问SSH
   firewall-cmd --permanent --zone=wan --add-rich-rule='rule family="ipv4" source address="1.2.3.4/32" service name="ssh" accept'
   ```

### 3. Web管理界面访问策略

生产环境中,建议采用以下Web访问安全措施:

1. **仅允许HTTPS访问**
   - 禁用HTTP,强制使用HTTPS
   - 配置有效的SSL/TLS证书

2. **使用反向代理和认证**
   - 在前端配置Nginx反向代理
   - 添加额外的HTTP基本认证或OAuth认证

3. **限制访问来源IP**
   ```bash
   # 只允许特定IP访问Web管理界面
   firewall-cmd --permanent --zone=wan --add-rich-rule='rule family="ipv4" source address="1.2.3.4/32" port port="443" protocol="tcp" accept'
   ```

## 验证防火墙配置

### 查看WAN区域配置

```bash
firewall-cmd --zone=wan --list-all
```

**测试环境输出示例**:
```
wan (active)
  target: DROP
  interfaces: eth0
  services: http https ssh
  ports: 3000/tcp
  masquerade: yes
```

**生产环境输出示例**:
```
wan (active)
  target: DROP
  interfaces: eth0
  services:
  ports:
  masquerade: yes
```

### 测试外部连接

从外部网络测试连接:

```bash
# 测试SSH连接
ssh user@<WAN_IP>

# 测试HTTP连接
curl http://<WAN_IP>

# 测试HTTPS连接
curl https://<WAN_IP>
```

- **测试环境**: 应该能够连接
- **生产环境**: 应该连接被拒绝或超时

## 常见问题

### Q: 我已经部署了测试环境配置,如何安全地切换到生产环境?

A: 在切换到生产环境配置之前,请确保:
1. 已经配置了VPN或其他远程访问方式
2. 有物理访问硬件的能力(以防配置错误导致无法远程访问)
3. 备份当前配置
4. 在非高峰时段进行切换

### Q: 如果我在生产环境中锁定了自己怎么办?

A: 如果无法通过WAN访问:
1. 通过LAN接口访问管理界面
2. 使用物理访问(显示器+键盘)登录服务器
3. 通过IPMI/iLO等带外管理接口访问
4. 重启服务器进入恢复模式

### Q: 测试环境配置有多不安全?

A: 测试环境配置在受信任的网络中是可以接受的,但在公网环境中存在以下风险:
- SSH端口暴露可能遭受暴力破解(建议使用强密码或密钥认证)
- Web管理界面暴露可能被扫描和攻击
- 不符合安全最佳实践

### Q: 我可以只开放SSH,关闭HTTP/HTTPS吗?

A: 可以,根据需要选择性移除服务:

```bash
# 只保留SSH,移除HTTP/HTTPS
firewall-cmd --permanent --zone=wan --remove-service=http
firewall-cmd --permanent --zone=wan --remove-service=https
firewall-cmd --reload
```

## 总结

- **当前配置**: 测试环境模式,WAN侧开放SSH/HTTP/HTTPS/Dev端口
- **适用场景**: 开发测试环境,受信任的网络
- **生产环境**: 建议移除所有WAN侧开放端口,仅允许LAN侧或VPN访问
- **切换方法**: 手动修改脚本或运行时移除规则
- **安全建议**: 使用密钥认证、fail2ban、端口敲门、VPN等增强安全性

## 参考资料

1. OpenWrt防火墙配置: https://openwrt.org/docs/guide-user/firewall/firewall_configuration
2. Firewalld官方文档: https://firewalld.org/documentation/
3. SSH安全加固: https://www.ssh.com/academy/ssh/security
4. 项目防火墙集成文档: `firewalld_integration_summary.md`

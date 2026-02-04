# Bug反馈模板

请复制以下模板,填写完整信息后反馈给开发者。

---

## 基本信息

**测试编号**: (如: 测试2.3)  
**模块名称**: (如: DHCP静态租约)  
**功能描述**: (如: 应用DHCP静态租约配置)  
**问题严重程度**: (选择一个)
- [ ] 🔴 严重 - 功能完全无法使用
- [ ] 🟡 中等 - 功能部分可用但有明显问题
- [ ] 🟢 轻微 - 功能可用但有小问题

---

## 问题描述

**简要描述**:  
(用一句话描述问题,如: "点击应用配置后显示500错误")

**详细描述**:  
(详细描述问题现象,包括任何异常行为)

---

## 复现步骤

1. 
2. 
3. 
4. 

---

## 预期结果

(描述应该发生什么)

---

## 实际结果

(描述实际发生了什么)

---

## 错误信息

### 前端错误 (浏览器控制台)

**如何获取**: 按F12打开浏览器开发者工具,切换到"Console"标签页

```
(粘贴控制台的错误信息)
```

### 后端错误 (服务日志)

**如何获取**: SSH连接到路由器,运行以下命令

```bash
sudo journalctl -u urouteros -n 100 --no-pager | grep -i error
```

```
(粘贴日志中的错误信息)
```

### 网络请求错误

**如何获取**: 浏览器F12 → Network标签页 → 找到失败的请求 → 查看Response

```
(粘贴失败请求的响应内容)
```

---

## 系统信息

### 操作系统

```bash
lsb_release -a
```

```
(粘贴输出)
```

### Node.js版本

```bash
node --version
pnpm --version
```

```
(粘贴输出)
```

### 数据库版本

```bash
mysql --version
```

```
(粘贴输出)
```

### URouterOS版本

```bash
cd /opt/urouteros
git log -1 --oneline
```

```
(粘贴输出)
```

---

## 配置文件内容 (如果相关)

### 网络接口配置

```bash
ip addr show
ip route show
```

```
(粘贴输出)
```

### dnsmasq配置

```bash
cat /etc/dnsmasq.d/static-leases.conf
cat /etc/dnsmasq.d/dns-forwarders.conf
```

```
(粘贴输出)
```

### iptables规则

```bash
sudo iptables -L -n -v
sudo iptables -t nat -L -n -v
```

```
(粘贴输出)
```

---

## 截图

(如果有,请附上截图)

---

## 额外信息

(任何其他可能有助于诊断问题的信息)

---

## 完整日志包 (可选)

如果问题复杂,可以运行日志收集脚本:

```bash
cd /opt/urouteros
sudo ./scripts/collect-logs.sh
```

生成的日志包位置: `/tmp/urouteros-logs-YYYYMMDD-HHMMSS.tar.gz`

将此文件发送给开发者。

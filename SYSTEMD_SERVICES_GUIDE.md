# URouterOS Systemd Services Guide

## 概述

本文档介绍如何使用systemd服务文件实现URouterOS的开机自启动和故障自动恢复功能。

## 服务架构

URouterOS包含两个systemd服务:

1. **urouteros-backend.service** - 后台Node.js服务
2. **urouteros-frontend.service** - 前端开发服务器(或生产环境的nginx)

### 服务依赖关系

```
urouteros-frontend.service
    ↓ (依赖)
urouteros-backend.service
    ↓ (依赖)
network.target + mysql.service
```

## 服务文件说明

### 后台服务(urouteros-backend.service)

**位置**: `systemd/urouteros-backend.service`

**主要配置**:
- **依赖**: network.target, network-online.target, mysql.service
- **工作目录**: /opt/urouteros
- **启动命令**: /usr/bin/node /opt/urouteros/dist/index.js
- **重启策略**: on-failure (失败时自动重启)
- **重启延迟**: 5秒
- **日志输出**: journald

**安全设置**:
- NoNewPrivileges=true (禁止提升权限)
- PrivateTmp=true (私有临时目录)

**资源限制**:
- LimitNOFILE=65536 (最大文件描述符数)
- LimitNPROC=4096 (最大进程数)

### 前端服务(urouteros-frontend.service)

**位置**: `systemd/urouteros-frontend.service`

**主要配置**:
- **依赖**: urouteros-backend.service (必须等待后台服务启动)
- **工作目录**: /opt/urouteros
- **启动命令**: /usr/bin/pnpm dev (开发环境)
- **重启策略**: on-failure
- **重启延迟**: 5秒
- **日志输出**: journald

## 安装和使用

### 1. 安装服务

运行安装脚本:

```bash
sudo scripts/install-services.sh
```

安装脚本会自动执行以下操作:
1. 复制服务文件到 `/etc/systemd/system/`
2. 重新加载systemd配置 (`systemctl daemon-reload`)
3. 启用服务开机自启 (`systemctl enable`)
4. 启动服务 (`systemctl start`)
5. 显示服务状态

### 2. 服务控制

使用服务控制脚本管理服务:

```bash
# 启动服务
sudo scripts/service-control.sh start

# 停止服务
sudo scripts/service-control.sh stop

# 重启服务
sudo scripts/service-control.sh restart

# 查看状态
sudo scripts/service-control.sh status

# 查看日志(实时)
sudo scripts/service-control.sh logs

# 启用开机自启
sudo scripts/service-control.sh enable

# 禁用开机自启
sudo scripts/service-control.sh disable
```

### 3. 手动systemctl命令

也可以直接使用systemctl命令:

```bash
# 启动服务
sudo systemctl start urouteros-backend
sudo systemctl start urouteros-frontend

# 停止服务
sudo systemctl stop urouteros-frontend
sudo systemctl stop urouteros-backend

# 重启服务
sudo systemctl restart urouteros-backend
sudo systemctl restart urouteros-frontend

# 查看状态
sudo systemctl status urouteros-backend
sudo systemctl status urouteros-frontend

# 启用开机自启
sudo systemctl enable urouteros-backend
sudo systemctl enable urouteros-frontend

# 禁用开机自启
sudo systemctl disable urouteros-backend
sudo systemctl disable urouteros-frontend

# 查看日志
sudo journalctl -u urouteros-backend -f
sudo journalctl -u urouteros-frontend -f

# 查看最近100行日志
sudo journalctl -u urouteros-backend -n 100
sudo journalctl -u urouteros-frontend -n 100
```

## 故障自动恢复

### 重启策略

两个服务都配置了 `Restart=on-failure`,这意味着:
- 服务异常退出时会自动重启
- 正常停止(systemctl stop)不会自动重启
- 重启延迟为5秒(RestartSec=5s)

### 测试故障恢复

可以手动测试故障恢复功能:

```bash
# 1. 查看服务进程ID
sudo systemctl status urouteros-backend | grep "Main PID"

# 2. 强制终止进程(模拟崩溃)
sudo kill -9 <PID>

# 3. 等待5秒后查看状态,服务应该已经自动重启
sleep 6
sudo systemctl status urouteros-backend
```

## 日志管理

### 查看日志

```bash
# 查看后台服务日志(实时)
sudo journalctl -u urouteros-backend -f

# 查看前端服务日志(实时)
sudo journalctl -u urouteros-frontend -f

# 查看两个服务的日志(实时)
sudo journalctl -u urouteros-backend -u urouteros-frontend -f

# 查看最近100行日志
sudo journalctl -u urouteros-backend -n 100

# 查看今天的日志
sudo journalctl -u urouteros-backend --since today

# 查看最近1小时的日志
sudo journalctl -u urouteros-backend --since "1 hour ago"

# 查看指定时间范围的日志
sudo journalctl -u urouteros-backend --since "2026-02-01 00:00:00" --until "2026-02-01 23:59:59"
```

### 日志过滤

```bash
# 只查看错误日志
sudo journalctl -u urouteros-backend -p err

# 只查看警告及以上级别的日志
sudo journalctl -u urouteros-backend -p warning

# 查看包含特定关键词的日志
sudo journalctl -u urouteros-backend | grep "ERROR"
```

## 开机自启验证

### 检查服务是否已启用

```bash
sudo systemctl is-enabled urouteros-backend
sudo systemctl is-enabled urouteros-frontend
```

输出应该是 `enabled`。

### 测试开机自启

```bash
# 1. 重启系统
sudo reboot

# 2. 系统启动后检查服务状态
sudo systemctl status urouteros-backend
sudo systemctl status urouteros-frontend

# 3. 检查服务是否自动启动
sudo systemctl is-active urouteros-backend
sudo systemctl is-active urouteros-frontend
```

输出应该是 `active`。

## 生产环境部署

### 修改前端服务为nginx

在生产环境中,建议使用nginx替代pnpm dev:

1. 编辑 `/etc/systemd/system/urouteros-frontend.service`:

```ini
[Service]
Type=forking
ExecStart=/usr/sbin/nginx -c /etc/nginx/nginx.conf
ExecReload=/bin/kill -s HUP $MAINPID
ExecStop=/bin/kill -s QUIT $MAINPID
```

2. 重新加载systemd配置:

```bash
sudo systemctl daemon-reload
```

3. 重启前端服务:

```bash
sudo systemctl restart urouteros-frontend
```

### 配置nginx

创建nginx配置文件 `/etc/nginx/sites-available/urouteros`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /opt/urouteros/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置:

```bash
sudo ln -s /etc/nginx/sites-available/urouteros /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 故障排查

### 服务无法启动

1. 查看详细错误信息:

```bash
sudo journalctl -u urouteros-backend -n 50
sudo systemctl status urouteros-backend -l
```

2. 检查服务文件语法:

```bash
sudo systemd-analyze verify /etc/systemd/system/urouteros-backend.service
```

3. 检查工作目录和文件权限:

```bash
ls -la /opt/urouteros
ls -la /opt/urouteros/dist/index.js
```

### 服务频繁重启

1. 查看重启历史:

```bash
sudo journalctl -u urouteros-backend | grep "Started\|Stopped"
```

2. 检查应用程序日志:

```bash
sudo journalctl -u urouteros-backend -p err -n 100
```

3. 增加重启延迟:

编辑服务文件,将 `RestartSec=5s` 改为 `RestartSec=10s`。

### 服务依赖问题

1. 检查依赖服务状态:

```bash
sudo systemctl status network.target
sudo systemctl status mysql.service
```

2. 查看服务依赖关系:

```bash
sudo systemctl list-dependencies urouteros-backend
sudo systemctl list-dependencies urouteros-frontend
```

## 最佳实践

1. **定期查看日志**: 使用 `journalctl` 定期检查服务日志,及时发现问题。

2. **监控服务状态**: 可以使用监控工具(如Prometheus + Grafana)监控服务状态。

3. **备份配置**: 定期备份 `/etc/systemd/system/` 下的服务文件。

4. **测试故障恢复**: 定期测试故障自动恢复功能,确保配置正确。

5. **日志轮转**: 配置journald日志轮转,避免日志占用过多磁盘空间:

```bash
# 编辑 /etc/systemd/journald.conf
SystemMaxUse=1G
SystemKeepFree=500M
SystemMaxFileSize=100M
```

6. **资源限制**: 根据实际需求调整服务文件中的资源限制(LimitNOFILE, LimitNPROC等)。

## 参考资料

- [systemd官方文档](https://www.freedesktop.org/software/systemd/man/)
- [systemd.service手册](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
- [journalctl手册](https://www.freedesktop.org/software/systemd/man/journalctl.html)

# URouterOS 快速参考

## 部署命令

### 首次部署
```bash
git clone https://github.com/dragonleehom/URouterPanel.git
cd URouterPanel
sudo ./scripts/install-all.sh
```

### 代码更新
```bash
cd /path/to/URouterPanel
sudo ./scripts/update.sh
```

### 手动更新
```bash
cd /path/to/URouterPanel
sudo systemctl stop urouteros
git pull origin main
pnpm install
pnpm db:push
pnpm build
sudo systemctl start urouteros
```

## 服务管理

### 查看服务状态
```bash
sudo systemctl status urouteros
```

### 启动服务
```bash
sudo systemctl start urouteros
```

### 停止服务
```bash
sudo systemctl stop urouteros
```

### 重启服务
```bash
sudo systemctl restart urouteros
```

### 查看实时日志
```bash
sudo journalctl -u urouteros -f
```

### 查看最近日志
```bash
sudo journalctl -u urouteros -n 100
```

## 访问地址

- **本地访问**: http://localhost:3000
- **局域网访问**: http://192.168.188.1:3000

## 默认配置

### 网络配置
- **WAN接口**: 自动检测(DHCP客户端)
- **LAN IP**: 192.168.188.1/24
- **DHCP范围**: 192.168.188.2-254
- **DNS服务器**: 192.168.188.1

### 数据库配置
- **数据库名**: urouteros
- **用户名**: urouteros
- **密码**: urouteros123
- **连接地址**: localhost:3306

### 存储目录
- **虚拟机磁盘**: /var/lib/urouteros/vms/
- **ISO镜像**: /var/lib/urouteros/iso/
- **容器数据**: /var/lib/urouteros/containers/
- **备份目录**: /var/backups/urouteros/

## 故障排查

### 服务无法启动
```bash
# 查看详细错误日志
sudo journalctl -u urouteros -n 100 --no-pager

# 检查端口占用
sudo netstat -tlnp | grep 3000

# 检查数据库连接
mysql -u urouteros -purouteros123 -e "SELECT 1"
```

### 网络无法访问
```bash
# 检查网络接口状态
ip addr show

# 检查路由表
ip route show

# 检查防火墙规则
sudo iptables -L -n -v

# 检查DHCP服务
sudo systemctl status dnsmasq
```

### 回滚到之前版本
```bash
# 使用备份回滚
sudo systemctl stop urouteros
sudo tar -xzf /var/backups/urouteros/urouteros_backup_YYYYMMDD_HHMMSS.tar.gz -C /path/to/URouterPanel
sudo systemctl start urouteros

# 使用Git回滚
cd /path/to/URouterPanel
git log --oneline -10
git reset --hard <commit-hash>
pnpm install && pnpm build
sudo systemctl restart urouteros
```

## 数据库操作

### 连接数据库
```bash
mysql -u urouteros -purouteros123 urouteros
```

### 备份数据库
```bash
mysqldump -u urouteros -purouteros123 urouteros > backup.sql
```

### 恢复数据库
```bash
mysql -u urouteros -purouteros123 urouteros < backup.sql
```

## 更多信息

- **完整部署指南**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **GitHub仓库**: https://github.com/dragonleehom/URouterPanel
- **问题反馈**: https://github.com/dragonleehom/URouterPanel/issues

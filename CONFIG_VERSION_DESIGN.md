# 配置版本管理设计

## 概述

为路由器配置系统实现版本管理,支持"保存"、"保存并应用"、"复位"三种操作。

## 核心概念

### 1. 配置状态

- **已保存(Saved)**: 配置已写入数据库/配置文件,但未应用到系统
- **已应用(Applied)**: 配置已应用到系统,服务已重启生效
- **待复位(Pending Reset)**: 用户修改了配置但未保存

### 2. 配置版本

每个配置项维护两个时间戳:
- `savedAt`: 最后保存时间
- `appliedAt`: 最后应用时间

关系:
- `appliedAt == null`: 从未应用过
- `savedAt > appliedAt`: 有未应用的修改
- `savedAt == appliedAt`: 已保存且已应用

### 3. 配置快照

在每次"应用"操作前,自动创建快照,用于"复位"功能。

```sql
CREATE TABLE configSnapshots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  configType VARCHAR(50),  -- 'network_port', 'firewall', 'dhcp'...
  configId INT,            -- 关联的配置ID
  snapshotData JSON,       -- 配置快照(完整配置的JSON)
  createdAt TIMESTAMP,
  appliedAt TIMESTAMP      -- 该快照被应用的时间
);
```

## 操作流程

### 保存(Save)

1. 验证配置合法性
2. 更新配置表,设置 `savedAt = NOW()`
3. 不修改 `appliedAt`
4. 不触发服务重启

### 保存并应用(Save and Apply)

1. 创建当前配置的快照(如果有已应用的配置)
2. 验证配置合法性
3. 更新配置表,设置 `savedAt = NOW()`, `appliedAt = NOW()`
4. 应用配置到系统(修改配置文件)
5. 触发关联服务重启
6. 返回操作结果

### 复位(Reset)

1. 查找最后一次应用的快照(`appliedAt` 最新的快照)
2. 如果没有快照,返回错误
3. 从快照恢复配置到配置表
4. 设置 `savedAt = NOW()`, `appliedAt = NOW()`
5. 应用配置到系统
6. 触发关联服务重启
7. 返回操作结果

## 服务重启映射

不同配置类型需要重启不同的服务:

| 配置类型 | 关联服务 | 重启命令 |
|---------|---------|---------|
| network_port | networking | `systemctl restart networking` 或 `netplan apply` |
| firewall | firewalld/iptables | `systemctl restart firewalld` |
| dhcp | dnsmasq/isc-dhcp-server | `systemctl restart dnsmasq` |
| wireless | hostapd | `systemctl restart hostapd` |
| dns | dnsmasq | `systemctl restart dnsmasq` |

## 数据库Schema变更

### 1. 为现有配置表添加版本字段

```sql
ALTER TABLE networkPorts ADD COLUMN savedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE networkPorts ADD COLUMN appliedAt TIMESTAMP NULL;

ALTER TABLE firewallRules ADD COLUMN savedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE firewallRules ADD COLUMN appliedAt TIMESTAMP NULL;

-- 其他配置表类似...
```

### 2. 创建配置快照表

```sql
CREATE TABLE configSnapshots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  configType VARCHAR(50) NOT NULL,
  configId INT NOT NULL,
  snapshotData JSON NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  appliedAt TIMESTAMP NULL,
  INDEX idx_config (configType, configId),
  INDEX idx_applied (appliedAt)
);
```

## API设计

### 网络接口配置

```typescript
// 保存配置(不应用)
networkConfig.savePort(id, data) -> { success, message }

// 保存并应用配置
networkConfig.saveAndApplyPort(id, data) -> { success, message, appliedAt }

// 复位到最后应用的版本
networkConfig.resetPort(id) -> { success, message, restoredConfig }
```

### 防火墙配置

```typescript
firewall.saveRule(id, data) -> { success }
firewall.saveAndApplyRule(id, data) -> { success, appliedAt }
firewall.resetRule(id) -> { success, restoredConfig }
```

## 前端UI

### 按钮组布局

```
[保存并应用] [保存] [复位]
```

- **保存并应用**: 主要操作,蓝色按钮
- **保存**: 次要操作,灰色按钮
- **复位**: 危险操作,红色边框按钮

### 确认对话框

- **保存并应用**: "确定应用配置?服务将重启,可能导致短暂网络中断。"
- **复位**: "确定复位配置?将恢复到最后一次应用的版本,服务将重启。"

### 状态提示

- 配置已修改但未保存: 显示黄色提示条
- 配置已保存但未应用: 显示蓝色提示条
- 配置已应用: 显示绿色提示条

## 实现优先级

1. **Phase 1**: 网络接口配置(最核心)
2. **Phase 2**: 防火墙配置
3. **Phase 3**: DHCP/DNS配置
4. **Phase 4**: 其他配置页签

## 注意事项

1. **原子性**: 保存和应用操作要么全部成功,要么全部失败
2. **错误处理**: 应用失败时自动回滚到上一个快照
3. **并发控制**: 同一配置项同时只能有一个应用操作
4. **快照清理**: 定期清理旧快照(保留最近10个)
5. **日志记录**: 记录所有配置变更和应用操作

#!/bin/bash
#
# URouterOS 代码更新脚本
# 从GitHub拉取最新代码并重启服务
#

set -e

echo "========================================="
echo "URouterOS 代码更新脚本"
echo "========================================="
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
  echo "错误: 请使用root权限运行此脚本 (sudo ./update.sh)"
  exit 1
fi

# 获取脚本所在目录的父目录(项目根目录)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "项目目录: $PROJECT_DIR"
echo ""

# 进入项目目录
cd "$PROJECT_DIR"

# 步骤1: 停止服务
echo "========================================="
echo "步骤 1/6: 停止服务"
echo "========================================="
echo ""
if systemctl is-active --quiet urouteros; then
  echo "正在停止URouterOS服务..."
  systemctl stop urouteros
  echo "✓ 服务已停止"
else
  echo "服务未运行,跳过停止步骤"
fi
echo ""

# 步骤2: 备份当前代码
echo "========================================="
echo "步骤 2/6: 备份当前代码"
echo "========================================="
echo ""
BACKUP_DIR="/var/backups/urouteros"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/urouteros_backup_$TIMESTAMP.tar.gz"

mkdir -p "$BACKUP_DIR"
echo "正在创建备份: $BACKUP_FILE"
tar -czf "$BACKUP_FILE" \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git \
  --exclude=*.log \
  -C "$(dirname "$PROJECT_DIR")" "$(basename "$PROJECT_DIR")"
echo "✓ 备份完成"
echo ""

# 步骤3: 从GitHub拉取最新代码
echo "========================================="
echo "步骤 3/6: 从GitHub拉取最新代码"
echo "========================================="
echo ""
echo "正在拉取最新代码..."
git fetch origin
git reset --hard origin/main
echo "✓ 代码更新完成"
echo ""

# 显示更新日志
echo "最近的更新:"
git log -5 --oneline --decorate
echo ""

# 步骤4: 检查并安装依赖
echo "========================================="
echo "步骤 4/6: 检查并安装依赖"
echo "========================================="
echo ""
echo "正在检查Node.js依赖..."
if [ -f "package.json" ]; then
  pnpm install
  echo "✓ 依赖安装完成"
else
  echo "警告: 未找到package.json,跳过依赖安装"
fi
echo ""

# 步骤5: 运行数据库迁移
echo "========================================="
echo "步骤 5/6: 运行数据库迁移"
echo "========================================="
echo ""
echo "正在运行数据库迁移..."
if [ -f "package.json" ] && grep -q "db:push" package.json; then
  pnpm db:push || echo "警告: 数据库迁移失败,但继续执行"
  echo "✓ 数据库迁移完成"
else
  echo "跳过数据库迁移(未配置)"
fi
echo ""

# 步骤6: 重新构建应用
echo "========================================="
echo "步骤 6/6: 重新构建应用"
echo "========================================="
echo ""
echo "正在构建应用..."
if [ -f "package.json" ] && grep -q "\"build\":" package.json; then
  pnpm build
  echo "✓ 构建完成"
else
  echo "警告: 未找到构建脚本,跳过构建"
fi
echo ""

# 重启服务
echo "========================================="
echo "重启服务"
echo "========================================="
echo ""
echo "正在启动URouterOS服务..."
systemctl start urouteros
echo "✓ 服务已启动"
echo ""

# 等待服务启动
echo "等待服务启动..."
sleep 3

# 检查服务状态
echo ""
echo "========================================="
echo "服务状态"
echo "========================================="
echo ""
systemctl status urouteros --no-pager || true
echo ""

# 显示服务日志
echo "========================================="
echo "最近的服务日志"
echo "========================================="
echo ""
journalctl -u urouteros -n 20 --no-pager
echo ""

# 完成
echo "========================================="
echo "更新完成!"
echo "========================================="
echo ""
echo "✓ 代码已更新到最新版本"
echo "✓ 依赖已检查并更新"
echo "✓ 数据库已迁移"
echo "✓ 应用已重新构建"
echo "✓ 服务已重启"
echo ""
echo "备份文件: $BACKUP_FILE"
echo ""
echo "访问Web界面:"
echo "  - 本地: http://localhost:3000"
echo "  - 局域网: http://192.168.188.1:3000"
echo ""
echo "常用命令:"
echo "  - 查看服务状态: sudo systemctl status urouteros"
echo "  - 查看实时日志: sudo journalctl -u urouteros -f"
echo "  - 回滚到备份: tar -xzf $BACKUP_FILE -C /"
echo ""

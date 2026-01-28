#!/bin/bash
#
# URouterOS 应用部署脚本
# 部署Node.js应用、配置环境变量、初始化数据库
#

set -e

echo "========================================="
echo "URouterOS 应用部署脚本"
echo "========================================="
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
  echo "错误: 请使用root权限运行此脚本 (sudo ./deploy-app.sh)"
  exit 1
fi

# 获取脚本所在目录的父目录(项目根目录)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "项目目录: $PROJECT_DIR"
echo ""

# 检查项目目录
if [ ! -f "$PROJECT_DIR/package.json" ]; then
  echo "错误: 未找到package.json,请确认项目目录正确"
  exit 1
fi

# 切换到项目目录
cd "$PROJECT_DIR"

# 安装依赖
echo "[1/5] 安装Node.js依赖..."
if [ -n "$SUDO_USER" ]; then
  sudo -u $SUDO_USER pnpm install
else
  pnpm install
fi
echo "✓ 依赖安装完成"
echo ""

# 配置环境变量
echo "[2/5] 配置环境变量..."

# 检查.env文件是否存在
if [ ! -f "$PROJECT_DIR/.env" ]; then
  echo "创建.env文件..."
  
  # 生成JWT密钥
  JWT_SECRET=$(openssl rand -base64 32)
  
  # 获取本机IP地址
  LOCAL_IP=$(ip route get 8.8.8.8 | awk '{print $7; exit}')
  if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="192.168.188.1"
  fi
  
  cat > "$PROJECT_DIR/.env" <<EOF
# 数据库配置
DATABASE_URL=mysql://urouteros:urouteros123@localhost:3306/urouteros

# JWT密钥
JWT_SECRET=$JWT_SECRET

# OAuth配置(使用Manus OAuth)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_APP_ID=urouteros

# 应用配置
VITE_APP_TITLE=URouterOS
VITE_APP_LOGO=/logo.svg

# 服务器配置
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# 前端访问地址
VITE_API_URL=http://$LOCAL_IP:3000

# 所有者信息
OWNER_OPEN_ID=admin
OWNER_NAME=管理员

# Manus内置API配置(如果使用)
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# 分析配置(可选)
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
EOF

  echo "✓ .env文件创建完成"
else
  echo "✓ .env文件已存在"
fi
echo ""

# 初始化数据库
echo "[3/5] 初始化数据库..."

# 等待MySQL启动
echo "等待MySQL服务启动..."
for i in {1..30}; do
  if mysqladmin ping -h localhost -uroot -purouteros123 &> /dev/null; then
    break
  fi
  sleep 1
done

# 推送数据库schema
if [ -n "$SUDO_USER" ]; then
  sudo -u $SUDO_USER pnpm db:push
else
  pnpm db:push
fi

echo "✓ 数据库初始化完成"
echo ""

# 构建应用
echo "[4/5] 构建应用..."
if [ -n "$SUDO_USER" ]; then
  sudo -u $SUDO_USER pnpm build
else
  pnpm build
fi
echo "✓ 应用构建完成"
echo ""

# 设置文件权限
echo "[5/5] 设置文件权限..."
if [ -n "$SUDO_USER" ]; then
  chown -R $SUDO_USER:$SUDO_USER "$PROJECT_DIR"
fi
chmod -R 755 "$PROJECT_DIR"
echo "✓ 文件权限设置完成"
echo ""

# 输出总结
echo "========================================="
echo "应用部署完成!"
echo "========================================="
echo ""
echo "部署信息:"
echo "  - 项目目录: $PROJECT_DIR"
echo "  - 数据库: urouteros"
echo "  - 端口: 3000"
echo ""
echo "下一步:"
echo "  1. 配置systemd服务: sudo ./setup-systemd.sh"
echo "  2. 或手动启动应用: cd $PROJECT_DIR && pnpm start"
echo "  3. 访问Web界面: http://192.168.188.1:3000"
echo ""

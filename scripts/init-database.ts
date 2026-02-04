#!/usr/bin/env tsx
/**
 * 数据库初始化脚本
 * 创建默认用户和初始配置
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { localUsers, sshConfig } from "../drizzle/schema";
import { hashPassword } from "../server/services/localAuthService";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("错误: 未找到DATABASE_URL环境变量");
  console.error("请在.env文件中配置DATABASE_URL");
  process.exit(1);
}

async function initDatabase() {
  console.log("========================================");
  console.log("URouterOS 数据库初始化");
  console.log("========================================");
  console.log("");

  const db = drizzle(DATABASE_URL);

  // 1. 创建默认管理员用户
  console.log("1/2: 创建默认管理员用户");
  console.log("----------------------------------------");

  const defaultUsername = "URouterOS";
  const defaultPassword = "password";

  // 检查用户是否已存在
  const existingUsers = await db
    .select()
    .from(localUsers)
    .where(eq(localUsers.username, defaultUsername))
    .limit(1);

  if (existingUsers.length > 0) {
    console.log(`✓ 用户 "${defaultUsername}" 已存在,跳过创建`);
  } else {
    // 创建默认用户
    const passwordHash = await hashPassword(defaultPassword);
    await db.insert(localUsers).values({
      username: defaultUsername,
      passwordHash,
      role: "admin",
      enabled: 1,
    });

    console.log(`✓ 默认管理员用户创建成功`);
    console.log(`  用户名: ${defaultUsername}`);
    console.log(`  密码: ${defaultPassword}`);
    console.log(`  角色: admin`);
    console.log("");
    console.log("⚠️  重要提示: 请在首次登录后立即修改默认密码!");
  }

  console.log("");

  // 2. 创建默认SSH配置
  console.log("2/2: 创建默认SSH配置");
  console.log("----------------------------------------");

  const existingSshConfig = await db
    .select()
    .from(sshConfig)
    .limit(1);

  if (existingSshConfig.length > 0) {
    console.log("✓ SSH配置已存在,跳过创建");
  } else {
    // 创建默认SSH配置
    await db.insert(sshConfig).values({
      port: 22,
      permitRootLogin: "prohibit-password",
      passwordAuthentication: 1,
      pubkeyAuthentication: 1,
      allowUsers: null,
      denyUsers: null,
      maxAuthTries: 6,
      loginGraceTime: 120,
      clientAliveInterval: 300,
      clientAliveCountMax: 3,
      pendingChanges: 0,
      applyStatus: "success",
    });

    console.log("✓ 默认SSH配置创建成功");
    console.log("  端口: 22");
    console.log("  允许root登录: prohibit-password (仅允许公钥)");
    console.log("  密码认证: 启用");
    console.log("  公钥认证: 启用");
  }

  console.log("");
  console.log("========================================");
  console.log("数据库初始化完成!");
  console.log("========================================");
  console.log("");
  console.log("下一步:");
  console.log("1. 启动Web服务: pnpm dev");
  console.log("2. 访问: http://localhost:3000");
  console.log(`3. 使用默认账户登录: ${defaultUsername} / ${defaultPassword}`);
  console.log("4. 登录后立即修改密码");
  console.log("");
}

initDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("初始化失败:", error);
    process.exit(1);
  });

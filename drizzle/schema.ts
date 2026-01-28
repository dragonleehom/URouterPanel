import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 应用市场应用表
 * 存储从1Panel应用仓库同步的应用信息
 */
export const appStoreApps = mysqlTable("app_store_apps", {
  id: int("id").autoincrement().primaryKey(),
  appKey: varchar("appKey", { length: 100 }).notNull().unique(), // 应用唯一标识(如affine)
  name: varchar("name", { length: 200 }).notNull(),
  shortDesc: text("shortDesc"),
  description: text("description"),
  type: varchar("type", { length: 50 }), // website, tool, database等
  iconUrl: varchar("iconUrl", { length: 500 }),
  website: varchar("website", { length: 500 }),
  github: varchar("github", { length: 500 }),
  document: varchar("document", { length: 500 }),
  tags: text("tags"), // JSON字符串
  architectures: text("architectures"), // JSON字符串
  memoryRequired: int("memoryRequired"), // 所需内存(MB)
  recommend: int("recommend").default(0), // 推荐度
  installCount: int("installCount").default(0), // 安装次数
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppStoreApp = typeof appStoreApps.$inferSelect;
export type InsertAppStoreApp = typeof appStoreApps.$inferInsert;

/**
 * 应用版本表
 * 存储每个应用的不同版本信息
 */
export const appStoreVersions = mysqlTable("app_store_versions", {
  id: int("id").autoincrement().primaryKey(),
  appKey: varchar("appKey", { length: 100 }).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  isStable: int("isStable").default(0), // 0=false, 1=true
  dockerCompose: text("dockerCompose"), // Docker Compose配置
  versionData: text("versionData"), // 版本特定的data.yml
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AppStoreVersion = typeof appStoreVersions.$inferSelect;
export type InsertAppStoreVersion = typeof appStoreVersions.$inferInsert;

/**
 * 已安装应用表
 * 跟踪用户安装的应用实例
 */
export const installedApps = mysqlTable("installed_apps", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // 关联users表
  appKey: varchar("appKey", { length: 100 }).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  containerName: varchar("containerName", { length: 200 }).notNull().unique(),
  status: mysqlEnum("status", ["running", "stopped", "error", "installing"]).default("installing"),
  portMappings: text("portMappings"), // JSON字符串
  envConfig: text("envConfig"), // JSON字符串
  installPath: varchar("installPath", { length: 500 }),
  installedAt: timestamp("installedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InstalledApp = typeof installedApps.$inferSelect;
export type InsertInstalledApp = typeof installedApps.$inferInsert;
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
  containerId: varchar("containerId", { length: 200 }),
  status: mysqlEnum("status", ["running", "stopped", "error", "installing", "failed"]).default("installing"),
  portMappings: text("portMappings"), // JSON字符串
  envConfig: text("envConfig"), // JSON字符串
  installPath: varchar("installPath", { length: 500 }),
  installedAt: timestamp("installedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InstalledApp = typeof installedApps.$inferSelect;
export type InsertInstalledApp = typeof installedApps.$inferInsert;

/**
 * 虚拟网络表
 * 存储虚拟网络配置,支持容器和虚拟机统一管理
 */
export const virtualNetworks = mysqlTable("virtual_networks", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(), // 网络名称(如vnet-prod)
  description: text("description"),
  type: mysqlEnum("type", ["bridge", "nat", "routed", "isolated"]).default("bridge").notNull(),
  subnet: varchar("subnet", { length: 50 }), // CIDR格式(如192.168.100.0/24)
  gateway: varchar("gateway", { length: 50 }), // 网关IP
  vlanId: int("vlanId"), // VLAN ID(可选)
  bridgeName: varchar("bridgeName", { length: 50 }), // Linux bridge名称(如br-vnet0)
  dhcpEnabled: int("dhcpEnabled").default(1), // 0=false, 1=true
  dhcpRange: varchar("dhcpRange", { length: 100 }), // DHCP范围(如192.168.100.100-192.168.100.200)
  dnsServers: text("dnsServers"), // JSON数组
  status: mysqlEnum("status", ["active", "inactive", "error"]).default("inactive"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VirtualNetwork = typeof virtualNetworks.$inferSelect;
export type InsertVirtualNetwork = typeof virtualNetworks.$inferInsert;

/**
 * 网络拓扑表
 * 存储可视化拓扑编辑器的节点和连接关系
 */
export const networkTopology = mysqlTable("network_topology", {
  id: int("id").autoincrement().primaryKey(),
  networkId: int("networkId").notNull(), // 关联virtualNetworks表
  topologyData: text("topologyData").notNull(), // JSON格式的React Flow数据(nodes + edges)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NetworkTopology = typeof networkTopology.$inferSelect;
export type InsertNetworkTopology = typeof networkTopology.$inferInsert;

/**
 * 网络接口映射表
 * 存储容器/虚拟机与虚拟网络的连接关系
 */
export const networkInterfaces = mysqlTable("network_interfaces", {
  id: int("id").autoincrement().primaryKey(),
  networkId: int("networkId").notNull(), // 关联virtualNetworks表
  resourceType: mysqlEnum("resourceType", ["container", "vm"]).notNull(),
  resourceId: varchar("resourceId", { length: 200 }).notNull(), // 容器ID或虚拟机名称
  interfaceName: varchar("interfaceName", { length: 50 }), // 接口名称(如eth0, veth0)
  macAddress: varchar("macAddress", { length: 20 }),
  ipAddress: varchar("ipAddress", { length: 50 }), // 分配的IP地址
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NetworkInterface = typeof networkInterfaces.$inferSelect;
export type InsertNetworkInterface = typeof networkInterfaces.$inferInsert;

/**
 * 路由规则表
 * 存储虚拟网络之间的路由配置
 */
export const routingRules = mysqlTable("routing_rules", {
  id: int("id").autoincrement().primaryKey(),
  sourceNetworkId: int("sourceNetworkId").notNull(),
  destinationNetwork: varchar("destinationNetwork", { length: 50 }).notNull(), // CIDR格式
  gateway: varchar("gateway", { length: 50 }),
  metric: int("metric").default(100),
  enabled: int("enabled").default(1), // 0=false, 1=true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoutingRule = typeof routingRules.$inferSelect;
export type InsertRoutingRule = typeof routingRules.$inferInsert;

/**
 * NAT规则表
 * 存储端口转发和NAT配置
 */
export const natRules = mysqlTable("nat_rules", {
  id: int("id").autoincrement().primaryKey(),
  networkId: int("networkId").notNull(),
  ruleType: mysqlEnum("ruleType", ["snat", "dnat", "masquerade"]).notNull(),
  protocol: mysqlEnum("protocol", ["tcp", "udp", "all"]).default("tcp"),
  sourceIp: varchar("sourceIp", { length: 50 }),
  sourcePort: int("sourcePort"),
  destinationIp: varchar("destinationIp", { length: 50 }),
  destinationPort: int("destinationPort"),
  targetIp: varchar("targetIp", { length: 50 }),
  targetPort: int("targetPort"),
  enabled: int("enabled").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NatRule = typeof natRules.$inferSelect;
export type InsertNatRule = typeof natRules.$inferInsert;

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

// ==================== DHCP静态租约数据库操作 ====================
export const dhcpStaticLeaseDb = {
  /**
   * 获取所有静态租约
   */
  async getAll(networkPortId?: number) {
    const db = await getDb();
    if (!db) return [];
    
    const { dhcpStaticLeases } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    if (networkPortId) {
      return await db.select().from(dhcpStaticLeases)
        .where(eq(dhcpStaticLeases.networkPortId, networkPortId))
        .orderBy(dhcpStaticLeases.ipAddress);
    }
    return await db.select().from(dhcpStaticLeases)
      .orderBy(dhcpStaticLeases.ipAddress);
  },

  /**
   * 根据ID获取静态租约
   */
  async getById(id: number) {
    const db = await getDb();
    if (!db) return null;
    
    const { dhcpStaticLeases } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    const result = await db.select().from(dhcpStaticLeases)
      .where(eq(dhcpStaticLeases.id, id))
      .limit(1);
    return result[0] || null;
  },

  /**
   * 根据MAC地址获取静态租约
   */
  async getByMac(macAddress: string) {
    const db = await getDb();
    if (!db) return null;
    
    const { dhcpStaticLeases } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    const result = await db.select().from(dhcpStaticLeases)
      .where(eq(dhcpStaticLeases.macAddress, macAddress))
      .limit(1);
    return result[0] || null;
  },

  /**
   * 创建静态租约
   */
  async create(data: any) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { dhcpStaticLeases } = await import("../drizzle/schema");
    
    const result = await db.insert(dhcpStaticLeases).values({
      ...data,
      pendingChanges: 1,
      applyStatus: "pending",
    });
    return result;
  },

  /**
   * 更新静态租约
   */
  async update(id: number, data: any) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { dhcpStaticLeases } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.update(dhcpStaticLeases)
      .set({
        ...data,
        pendingChanges: 1,
        applyStatus: "pending",
        updatedAt: new Date(),
      })
      .where(eq(dhcpStaticLeases.id, id));
  },

  /**
   * 删除静态租约
   */
  async delete(id: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { dhcpStaticLeases } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.delete(dhcpStaticLeases)
      .where(eq(dhcpStaticLeases.id, id));
  },

  /**
   * 标记为已应用
   */
  async markAsApplied(id: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { dhcpStaticLeases } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.update(dhcpStaticLeases)
      .set({
        pendingChanges: 0,
        lastAppliedAt: new Date(),
        applyStatus: "success",
        applyError: null,
      })
      .where(eq(dhcpStaticLeases.id, id));
  },

  /**
   * 标记为应用失败
   */
  async markAsFailed(id: number, error: string) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { dhcpStaticLeases } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.update(dhcpStaticLeases)
      .set({
        applyStatus: "failed",
        applyError: error,
      })
      .where(eq(dhcpStaticLeases.id, id));
  },

  /**
   * 获取所有待应用的租约
   */
  async getPendingLeases() {
    const db = await getDb();
    if (!db) return [];
    
    const { dhcpStaticLeases } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    return await db.select().from(dhcpStaticLeases)
      .where(eq(dhcpStaticLeases.pendingChanges, 1));
  },
};

// ==================== DNS转发器数据库操作 ====================
export const dnsForwarderDb = {
  /**
   * 获取所有DNS转发器
   */
  async getAll(networkPortId?: number) {
    const db = await getDb();
    if (!db) return [];
    
    const { dnsForwarders } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    if (networkPortId) {
      return await db.select().from(dnsForwarders)
        .where(eq(dnsForwarders.networkPortId, networkPortId))
        .orderBy(dnsForwarders.priority);
    }
    return await db.select().from(dnsForwarders)
      .orderBy(dnsForwarders.priority);
  },

  /**
   * 创建DNS转发器
   */
  async create(data: any) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { dnsForwarders } = await import("../drizzle/schema");
    
    const result = await db.insert(dnsForwarders).values({
      ...data,
      pendingChanges: 1,
      applyStatus: "pending",
    });
    return result;
  },

  /**
   * 更新DNS转发器
   */
  async update(id: number, data: any) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { dnsForwarders } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.update(dnsForwarders)
      .set({
        ...data,
        pendingChanges: 1,
        applyStatus: "pending",
        updatedAt: new Date(),
      })
      .where(eq(dnsForwarders.id, id));
  },

  /**
   * 删除DNS转发器
   */
  async delete(id: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { dnsForwarders } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.delete(dnsForwarders)
      .where(eq(dnsForwarders.id, id));
  },

  /**
   * 标记为已应用
   */
  async markAsApplied(id: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { dnsForwarders } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.update(dnsForwarders)
      .set({
        pendingChanges: 0,
        lastAppliedAt: new Date(),
        applyStatus: "success",
        applyError: null,
      })
      .where(eq(dnsForwarders.id, id));
  },
};

// ==================== 端口转发规则数据库操作 ====================
export const portForwardingDb = {
  /**
   * 获取所有端口转发规则
   */
  async getAll() {
    const db = await getDb();
    if (!db) return [];
    
    const { portForwardingRules } = await import("../drizzle/schema");
    
    return await db.select().from(portForwardingRules)
      .orderBy(portForwardingRules.createdAt);
  },

  /**
   * 创建端口转发规则
   */
  async create(data: any) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { portForwardingRules } = await import("../drizzle/schema");
    
    const result = await db.insert(portForwardingRules).values({
      ...data,
      pendingChanges: 1,
      applyStatus: "pending",
    });
    return result;
  },

  /**
   * 更新端口转发规则
   */
  async update(id: number, data: any) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { portForwardingRules } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.update(portForwardingRules)
      .set({
        ...data,
        pendingChanges: 1,
        applyStatus: "pending",
        updatedAt: new Date(),
      })
      .where(eq(portForwardingRules.id, id));
  },

  /**
   * 删除端口转发规则
   */
  async delete(id: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { portForwardingRules } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.delete(portForwardingRules)
      .where(eq(portForwardingRules.id, id));
  },

  /**
   * 标记为已应用
   */
  async markAsApplied(id: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { portForwardingRules } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.update(portForwardingRules)
      .set({
        pendingChanges: 0,
        lastAppliedAt: new Date(),
        applyStatus: "success",
        applyError: null,
      })
      .where(eq(portForwardingRules.id, id));
  },
};

// ==================== 防火墙规则数据库操作 ====================
export const firewallRuleDb = {
  /**
   * 获取所有防火墙规则
   */
  async getAll() {
    const db = await getDb();
    if (!db) return [];
    
    const { firewallRules } = await import("../drizzle/schema");
    
    return await db.select().from(firewallRules)
      .orderBy(firewallRules.priority, firewallRules.createdAt);
  },

  /**
   * 创建防火墙规则
   */
  async create(data: any) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { firewallRules } = await import("../drizzle/schema");
    
    const result = await db.insert(firewallRules).values({
      ...data,
      pendingChanges: 1,
      applyStatus: "pending",
    });
    return result;
  },

  /**
   * 更新防火墙规则
   */
  async update(id: number, data: any) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { firewallRules } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.update(firewallRules)
      .set({
        ...data,
        pendingChanges: 1,
        applyStatus: "pending",
        updatedAt: new Date(),
      })
      .where(eq(firewallRules.id, id));
  },

  /**
   * 删除防火墙规则
   */
  async delete(id: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { firewallRules } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.delete(firewallRules)
      .where(eq(firewallRules.id, id));
  },

  /**
   * 标记为已应用
   */
  async markAsApplied(id: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { firewallRules } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.update(firewallRules)
      .set({
        pendingChanges: 0,
        lastAppliedAt: new Date(),
        applyStatus: "success",
        applyError: null,
      })
      .where(eq(firewallRules.id, id));
  },
};

import { getDb } from "../db";
import { staticRoutes, type StaticRoute, type InsertStaticRoute } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * 静态路由服务
 * 管理系统静态路由配置
 */

/**
 * 获取所有静态路由
 */
export async function listStaticRoutes(): Promise<StaticRoute[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(staticRoutes);
}

/**
 * 根据ID获取静态路由
 */
export async function getStaticRoute(id: number): Promise<StaticRoute | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const routes = await db.select().from(staticRoutes).where(eq(staticRoutes.id, id));
  return routes[0];
}

/**
 * 创建静态路由
 */
export async function createStaticRoute(route: InsertStaticRoute): Promise<StaticRoute> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(staticRoutes).values(route);
  const newRoute = await getStaticRoute(Number(result[0].insertId));
  
  if (!newRoute) {
    throw new Error("Failed to create static route");
  }
  
  // 如果启用,立即应用路由
  if (newRoute.enabled) {
    await applyStaticRoute(newRoute);
  }
  
  return newRoute;
}

/**
 * 更新静态路由
 */
export async function updateStaticRoute(id: number, updates: Partial<InsertStaticRoute>): Promise<StaticRoute> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(staticRoutes).set(updates).where(eq(staticRoutes.id, id));
  
  const updatedRoute = await getStaticRoute(id);
  if (!updatedRoute) {
    throw new Error("Static route not found");
  }
  
  // 重新应用路由配置
  if (updatedRoute.enabled) {
    await applyStaticRoute(updatedRoute);
  } else {
    await deleteRouteFromSystem(updatedRoute);
  }
  
  return updatedRoute;
}

/**
 * 删除静态路由
 */
export async function deleteStaticRoute(id: number): Promise<void> {
  const route = await getStaticRoute(id);
  if (route) {
    // 先从系统中删除路由
    await deleteRouteFromSystem(route);
  }
  
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(staticRoutes).where(eq(staticRoutes.id, id));
}

/**
 * 应用静态路由到系统
 */
export async function applyStaticRoute(route: StaticRoute): Promise<void> {
  // 在测试环境下跳过实际的网络配置
  if (process.env.NODE_ENV === "test") {
    return;
  }
  
  try {
    // 先删除旧路由(如果存在)
    await deleteRouteFromSystem(route);
    
    // 构建ip route命令
    let cmd = `ip route add ${route.target}`;
    
    if (route.gateway) {
      cmd += ` via ${route.gateway}`;
    }
    
    if (route.interface) {
      cmd += ` dev ${route.interface}`;
    }
    
    if (route.metric) {
      cmd += ` metric ${route.metric}`;
    }
    
    if (route.mtu) {
      cmd += ` mtu ${route.mtu}`;
    }
    
    if (route.table) {
      cmd += ` table ${route.table}`;
    }
    
    if (route.type && route.type !== "unicast") {
      cmd += ` type ${route.type}`;
    }
    
    await execAsync(cmd);
  } catch (error) {
    console.error(`Failed to apply static route ${route.name}:`, error);
    throw new Error(`Failed to apply static route: ${error}`);
  }
}

/**
 * 从系统中删除路由
 */
async function deleteRouteFromSystem(route: StaticRoute): Promise<void> {
  // 在测试环境下跳过实际的网络配置
  if (process.env.NODE_ENV === "test") {
    return;
  }
  
  try {
    let cmd = `ip route del ${route.target}`;
    
    if (route.table) {
      cmd += ` table ${route.table}`;
    }
    
    // 忽略删除失败的错误(路由可能不存在)
    await execAsync(cmd).catch(() => {});
  } catch (error) {
    // 忽略删除错误
  }
}

/**
 * 应用所有启用的静态路由
 */
export async function applyAllStaticRoutes(): Promise<{ success: number; failed: number }> {
  const routes = await listStaticRoutes();
  const enabledRoutes = routes.filter(r => r.enabled);
  
  let success = 0;
  let failed = 0;
  
  for (const route of enabledRoutes) {
    try {
      await applyStaticRoute(route);
      success++;
    } catch (error) {
      console.error(`Failed to apply route ${route.name}:`, error);
      failed++;
    }
  }
  
  return { success, failed };
}

/**
 * 获取系统当前路由表
 */
export async function getSystemRoutes(): Promise<string> {
  // 在测试环境下返回模拟数据
  if (process.env.NODE_ENV === "test") {
    return "default via 192.168.1.1 dev eth0\\n192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.100";
  }
  
  try {
    const { stdout } = await execAsync("ip route show");
    return stdout;
  } catch (error) {
    console.error("Failed to get system routes:", error);
    return "";
  }
}

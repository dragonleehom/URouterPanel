/**
 * 配置版本管理服务(简化版)
 * 实现配置的保存/应用/回滚功能
 */

import { getDb } from "../db";
import { configSnapshots, networkPorts } from "../../drizzle/schema";
import { eq, and, desc, isNotNull } from "drizzle-orm";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * 服务重启映射
 */
const SERVICE_RESTART_MAP: Record<string, string[]> = {
  network_port: ["networking"],
  firewall_rule: ["firewalld", "iptables"],
  dhcp_config: ["dnsmasq"],
  dns_config: ["dnsmasq"],
  wireless_config: ["hostapd"],
};

/**
 * 重启关联服务
 */
export async function restartRelatedServices(configType: string): Promise<{
  success: boolean;
  message: string;
  details?: string[];
}> {
  const services = SERVICE_RESTART_MAP[configType];
  
  if (!services || services.length === 0) {
    return { success: true, message: "无需重启服务" };
  }

  const results: string[] = [];
  let hasError = false;

  for (const service of services) {
    try {
      // 检查服务是否存在
      const { stdout } = await execAsync(
        `systemctl list-unit-files | grep -w ${service} || echo "not_found"`
      );
      
      if (stdout.includes("not_found")) {
        results.push(`${service}: 服务不存在,跳过`);
        continue;
      }

      // 尝试重启服务
      try {
        await execAsync(`sudo systemctl restart ${service}`);
        results.push(`${service}: 重启成功`);
      } catch (restartError: any) {
        // 如果是networking服务,尝试使用netplan
        if (service === "networking") {
          try {
            await execAsync(`sudo netplan apply`);
            results.push(`networking: 使用netplan apply成功`);
            continue;
          } catch {
            hasError = true;
            results.push(`networking: 重启失败`);
          }
        } else {
          hasError = true;
          results.push(`${service}: 重启失败`);
        }
      }
    } catch (error: any) {
      hasError = true;
      results.push(`${service}: 检查失败`);
    }
  }

  return {
    success: !hasError,
    message: hasError ? "部分服务重启失败" : "所有服务重启成功",
    details: results,
  };
}

/**
 * 创建配置快照
 */
export async function createSnapshot(
  configType: string,
  configId: number,
  snapshotData: any
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(configSnapshots).values({
    configType,
    configId,
    snapshotData,
    appliedAt: new Date(),
  });

  // 清理旧快照(保留最近10个)
  const snapshots = await db
    .select()
    .from(configSnapshots)
    .where(
      and(
        eq(configSnapshots.configType, configType),
        eq(configSnapshots.configId, configId)
      )
    )
    .orderBy(desc(configSnapshots.createdAt));

  if (snapshots.length > 10) {
    const toDelete = snapshots.slice(10);
    for (const snapshot of toDelete) {
      await db.delete(configSnapshots).where(eq(configSnapshots.id, snapshot.id));
    }
  }
}

/**
 * 获取最后应用的快照
 */
export async function getLastAppliedSnapshot(
  configType: string,
  configId: number
) {
  const db = await getDb();
  if (!db) return null;

  const [snapshot] = await db
    .select()
    .from(configSnapshots)
    .where(
      and(
        eq(configSnapshots.configType, configType),
        eq(configSnapshots.configId, configId),
        isNotNull(configSnapshots.appliedAt)
      )
    )
    .orderBy(desc(configSnapshots.appliedAt))
    .limit(1);
  
  return snapshot || null;
}

/**
 * 1Panel应用仓库同步服务
 * 从GitHub同步应用元数据到数据库
 */

import { getDb } from "./db";
import { appStoreApps, appStoreVersions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const APPSTORE_REPO = "https://raw.githubusercontent.com/1Panel-dev/appstore/master";
const APPS_DIR = "apps";

interface AppData {
  key: string;
  name: string;
  tags: string[];
  shortDescZh: string;
  shortDescEn?: string;
  type: string;
  crossVersionUpdate: boolean;
  limit: number;
  recommend: number;
  website: string;
  github: string;
  document: string;
  versions: string[];
  [key: string]: any;
}

interface VersionData {
  name: string;
  version: string;
  detailZh: string;
  detailEn?: string;
  [key: string]: any;
}

/**
 * 获取应用列表
 */
async function fetchAppList(): Promise<string[]> {
  try {
    // 1Panel应用仓库的apps目录包含所有应用
    // 我们需要手动维护一个常用应用列表
    return [
      "alist",
      "affine",
      "nginx",
      "mysql",
      "redis",
      "postgresql",
      "mongodb",
      "minio",
      "portainer",
      "nextcloud",
      "wordpress",
      "gitlab",
      "jenkins",
      "grafana",
      "prometheus",
      "elasticsearch",
      "kibana",
      "rabbitmq",
      "kafka",
      "nacos",
    ];
  } catch (error) {
    console.error("Failed to fetch app list:", error);
    return [];
  }
}

/**
 * 获取应用的data.yml数据
 */
async function fetchAppData(appKey: string): Promise<AppData | null> {
  try {
    const url = `${APPSTORE_REPO}/${APPS_DIR}/${appKey}/data.yml`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Failed to fetch ${appKey}: ${response.status}`);
      return null;
    }

    const yamlText = await response.text();
    
    // 简单的YAML解析(仅支持基本格式)
    const data: any = {};
    const lines = yamlText.split("\n");
    
    let currentKey = "";
    let inArray = false;
    const arrayValues: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith("#")) continue;
      
      if (trimmed.startsWith("- ")) {
        // 数组项
        arrayValues.push(trimmed.substring(2).trim());
        inArray = true;
      } else if (trimmed.includes(":")) {
        // 保存之前的数组
        if (inArray && currentKey) {
          data[currentKey] = arrayValues.slice();
          arrayValues.length = 0;
          inArray = false;
        }
        
        const [key, ...valueParts] = trimmed.split(":");
        const value = valueParts.join(":").trim();
        currentKey = key.trim();
        
        if (value) {
          data[currentKey] = value;
        }
      }
    }
    
    // 保存最后的数组
    if (inArray && currentKey) {
      data[currentKey] = arrayValues;
    }
    
    return {
      key: appKey,
      name: data.name || appKey,
      tags: Array.isArray(data.tags) ? data.tags : [],
      shortDescZh: data.shortDescZh || data.shortDescEn || "",
      shortDescEn: data.shortDescEn,
      type: data.type || "runtime",
      crossVersionUpdate: data.crossVersionUpdate === "true",
      limit: parseInt(data.limit) || 0,
      recommend: parseInt(data.recommend) || 0,
      website: data.website || "",
      github: data.github || "",
      document: data.document || "",
      versions: Array.isArray(data.versions) ? data.versions : [],
    };
  } catch (error) {
    console.error(`Failed to fetch app data for ${appKey}:`, error);
    return null;
  }
}

/**
 * 获取应用版本的docker-compose.yml
 */
async function fetchVersionDockerCompose(
  appKey: string,
  version: string
): Promise<string | null> {
  try {
    const url = `${APPSTORE_REPO}/${APPS_DIR}/${appKey}/versions/${version}/docker-compose.yml`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch docker-compose for ${appKey}@${version}:`, error);
    return null;
  }
}

/**
 * 同步单个应用到数据库
 */
async function syncApp(appKey: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return false;
  }

  try {
    const appData = await fetchAppData(appKey);
    if (!appData) {
      return false;
    }

    // 检查应用是否已存在
    const existing = await db
      .select()
      .from(appStoreApps)
      .where(eq(appStoreApps.appKey, appKey))
      .limit(1);

    // 获取应用logo URL
    const logoUrl = `${APPSTORE_REPO}/${APPS_DIR}/${appKey}/logo.png`;
    
    const appRecord = {
      appKey,
      name: appData.name,
      shortDesc: appData.shortDescZh,
      type: appData.type,
      tags: JSON.stringify(appData.tags),
      iconUrl: logoUrl,
      website: appData.website || null,
      github: appData.github || null,
      document: appData.document || null,
      recommend: appData.recommend,
      crossVersionUpdate: appData.crossVersionUpdate ? 1 : 0,
    };

    if (existing.length > 0) {
      // 更新现有应用
      await db
        .update(appStoreApps)
        .set(appRecord)
        .where(eq(appStoreApps.appKey, appKey));
    } else {
      // 插入新应用
      await db.insert(appStoreApps).values(appRecord);
    }

    // 同步版本信息(仅同步最新版本)
    if (appData.versions.length > 0) {
      const latestVersion = appData.versions[0];
      const dockerCompose = await fetchVersionDockerCompose(appKey, latestVersion);
      
      if (dockerCompose) {
        const existingVersion = await db
          .select()
          .from(appStoreVersions)
          .where(eq(appStoreVersions.appKey, appKey))
          .limit(1);

        const versionRecord = {
          appKey,
          version: latestVersion,
          dockerCompose,
          isStable: 1,
        };

        if (existingVersion.length > 0) {
          await db
            .update(appStoreVersions)
            .set(versionRecord)
            .where(eq(appStoreVersions.appKey, appKey));
        } else {
          await db.insert(appStoreVersions).values(versionRecord);
        }
      }
    }

    console.log(`✓ Synced app: ${appKey}`);
    return true;
  } catch (error) {
    console.error(`Failed to sync app ${appKey}:`, error);
    return false;
  }
}

/**
 * 同步所有应用
 */
export async function syncAllApps(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  console.log("Starting app store sync...");
  
  const appList = await fetchAppList();
  let success = 0;
  let failed = 0;

  for (const appKey of appList) {
    const result = await syncApp(appKey);
    if (result) {
      success++;
    } else {
      failed++;
    }
    
    // 避免请求过快
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`Sync completed: ${success} success, ${failed} failed, ${appList.length} total`);
  
  return {
    success,
    failed,
    total: appList.length,
  };
}

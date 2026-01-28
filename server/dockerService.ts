/**
 * Docker API集成服务
 * 使用dockerode库与Docker守护进程通信
 */

import Docker from "dockerode";

// 创建Docker客户端实例
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

/**
 * 检查Docker是否可用
 */
export async function isDockerAvailable(): Promise<boolean> {
  try {
    await docker.ping();
    return true;
  } catch (error) {
    console.error("Docker is not available:", error);
    return false;
  }
}

/**
 * 列出所有容器
 */
export async function listContainers(all: boolean = true) {
  try {
    const containers = await docker.listContainers({ all });
    return containers.map((container) => ({
      id: container.Id,
      name: container.Names[0]?.replace("/", "") || "unknown",
      image: container.Image,
      state: container.State,
      status: container.Status,
      created: container.Created,
      ports: container.Ports.map((p) => ({
        privatePort: p.PrivatePort,
        publicPort: p.PublicPort,
        type: p.Type,
      })),
    }));
  } catch (error: any) {
    console.error("Failed to list containers:", error);
    throw new Error(`Failed to list containers: ${error.message}`);
  }
}

/**
 * 获取容器详情
 */
export async function getContainerInfo(containerId: string) {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    return {
      id: info.Id,
      name: info.Name.replace("/", ""),
      image: info.Config.Image,
      state: info.State,
      created: info.Created,
      ports: info.NetworkSettings.Ports,
      mounts: info.Mounts,
      env: info.Config.Env,
    };
  } catch (error: any) {
    console.error(`Failed to get container info for ${containerId}:`, error);
    throw new Error(`Failed to get container info: ${error.message}`);
  }
}

/**
 * 创建并启动容器
 */
export async function createContainer(options: {
  name: string;
  image: string;
  env?: string[];
  ports?: { [key: string]: {} };
  volumes?: string[];
  cmd?: string[];
}) {
  try {
    // 检查镜像是否存在,不存在则拉取
    try {
      await docker.getImage(options.image).inspect();
    } catch {
      console.log(`Pulling image: ${options.image}`);
      await new Promise((resolve, reject) => {
        docker.pull(options.image, (err: any, stream: any) => {
          if (err) return reject(err);
          docker.modem.followProgress(stream, (err: any) => {
            if (err) return reject(err);
            resolve(true);
          });
        });
      });
    }

    // 创建容器
    const container = await docker.createContainer({
      name: options.name,
      Image: options.image,
      Env: options.env,
      ExposedPorts: options.ports,
      HostConfig: {
        PortBindings: options.ports,
        Binds: options.volumes,
      },
      Cmd: options.cmd,
    });

    // 启动容器
    await container.start();

    return {
      id: container.id,
      name: options.name,
    };
  } catch (error: any) {
    console.error("Failed to create container:", error);
    throw new Error(`Failed to create container: ${error.message}`);
  }
}

/**
 * 启动容器
 */
export async function startContainer(containerId: string) {
  try {
    const container = docker.getContainer(containerId);
    await container.start();
    return { success: true, message: "Container started" };
  } catch (error: any) {
    console.error(`Failed to start container ${containerId}:`, error);
    throw new Error(`Failed to start container: ${error.message}`);
  }
}

/**
 * 停止容器
 */
export async function stopContainer(containerId: string) {
  try {
    const container = docker.getContainer(containerId);
    await container.stop();
    return { success: true, message: "Container stopped" };
  } catch (error: any) {
    console.error(`Failed to stop container ${containerId}:`, error);
    throw new Error(`Failed to stop container: ${error.message}`);
  }
}

/**
 * 重启容器
 */
export async function restartContainer(containerId: string) {
  try {
    const container = docker.getContainer(containerId);
    await container.restart();
    return { success: true, message: "Container restarted" };
  } catch (error: any) {
    console.error(`Failed to restart container ${containerId}:`, error);
    throw new Error(`Failed to restart container: ${error.message}`);
  }
}

/**
 * 删除容器
 */
export async function removeContainer(containerId: string, force: boolean = false) {
  try {
    const container = docker.getContainer(containerId);
    await container.remove({ force });
    return { success: true, message: "Container removed" };
  } catch (error: any) {
    console.error(`Failed to remove container ${containerId}:`, error);
    throw new Error(`Failed to remove container: ${error.message}`);
  }
}

/**
 * 获取容器日志
 */
export async function getContainerLogs(
  containerId: string,
  tail: number = 100
): Promise<string> {
  try {
    const container = docker.getContainer(containerId);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      timestamps: true,
    });
    return logs.toString("utf8");
  } catch (error: any) {
    console.error(`Failed to get logs for container ${containerId}:`, error);
    throw new Error(`Failed to get container logs: ${error.message}`);
  }
}

/**
 * 获取容器统计信息
 */
export async function getContainerStats(containerId: string) {
  try {
    const container = docker.getContainer(containerId);
    const stats = await container.stats({ stream: false });
    
    // 计算CPU使用率
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

    // 计算内存使用
    const memoryUsage = stats.memory_stats.usage;
    const memoryLimit = stats.memory_stats.limit;
    const memoryPercent = (memoryUsage / memoryLimit) * 100;

    // 网络 I/O
    const networks = stats.networks || {};
    let networkRx = 0;
    let networkTx = 0;
    Object.values(networks).forEach((net: any) => {
      networkRx += net.rx_bytes || 0;
      networkTx += net.tx_bytes || 0;
    });

    // 磁盘 I/O
    const blockIO = stats.blkio_stats?.io_service_bytes_recursive || [];
    let diskRead = 0;
    let diskWrite = 0;
    blockIO.forEach((io: any) => {
      if (io.op === 'Read') diskRead += io.value;
      if (io.op === 'Write') diskWrite += io.value;
    });

    return {
      cpu: {
        percent: parseFloat(cpuPercent.toFixed(2)),
        cores: stats.cpu_stats.online_cpus,
      },
      memory: {
        usage: memoryUsage,
        limit: memoryLimit,
        percent: parseFloat(memoryPercent.toFixed(2)),
      },
      network: {
        rx: networkRx,
        tx: networkTx,
      },
      disk: {
        read: diskRead,
        write: diskWrite,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error(`Failed to get stats for container ${containerId}:`, error);
    throw new Error(`Failed to get container stats: ${error.message}`);
  }
}

/**
 * 列出所有镜像
 */
export async function listImages() {
  try {
    const images = await docker.listImages();
    return images.map((image) => ({
      id: image.Id,
      tags: image.RepoTags || [],
      size: image.Size,
      created: image.Created,
    }));
  } catch (error: any) {
    console.error("Failed to list images:", error);
    throw new Error(`Failed to list images: ${error.message}`);
  }
}

/**
 * 拉取镜像
 */
export async function pullImage(imageName: string): Promise<void> {
  try {
    await new Promise((resolve, reject) => {
      docker.pull(imageName, (err: any, stream: any) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, (err: any) => {
          if (err) return reject(err);
          resolve(true);
        });
      });
    });
  } catch (error: any) {
    console.error(`Failed to pull image ${imageName}:`, error);
    throw new Error(`Failed to pull image: ${error.message}`);
  }
}

/**
 * 删除镜像
 */
export async function removeImage(imageId: string, force: boolean = false) {
  try {
    const image = docker.getImage(imageId);
    await image.remove({ force });
    return { success: true, message: "Image removed" };
  } catch (error: any) {
    console.error(`Failed to remove image ${imageId}:`, error);
    throw new Error(`Failed to remove image: ${error.message}`);
  }
}



/**
 * 列出所有Docker网络
 */
export async function listNetworks() {
  try {
    const networks = await docker.listNetworks();
    return networks.map((network) => ({
      id: network.Id,
      name: network.Name,
      driver: network.Driver,
      scope: network.Scope,
      internal: network.Internal,
      ipam: network.IPAM,
      containers: network.Containers ? Object.keys(network.Containers) : [],
      created: network.Created,
    }));
  } catch (error: any) {
    console.error("Failed to list networks:", error);
    throw new Error(`Failed to list networks: ${error.message}`);
  }
}

/**
 * 创建Docker网络
 */
export async function createNetwork(options: {
  name: string;
  driver?: string;
  internal?: boolean;
  subnet?: string;
  gateway?: string;
}) {
  try {
    const networkConfig: any = {
      Name: options.name,
      Driver: options.driver || "bridge",
      Internal: options.internal || false,
    };

    if (options.subnet || options.gateway) {
      networkConfig.IPAM = {
        Config: [
          {
            Subnet: options.subnet,
            Gateway: options.gateway,
          },
        ],
      };
    }

    const network = await docker.createNetwork(networkConfig);
    return {
      id: network.id,
      name: options.name,
    };
  } catch (error: any) {
    console.error("Failed to create network:", error);
    throw new Error(`Failed to create network: ${error.message}`);
  }
}

/**
 * 删除Docker网络
 */
export async function removeNetwork(networkId: string) {
  try {
    const network = docker.getNetwork(networkId);
    await network.remove();
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to remove network ${networkId}:`, error);
    throw new Error(`Failed to remove network: ${error.message}`);
  }
}

/**
 * 获取网络详情
 */
export async function inspectNetwork(networkId: string) {
  try {
    const network = docker.getNetwork(networkId);
    const info = await network.inspect();
    return {
      id: info.Id,
      name: info.Name,
      driver: info.Driver,
      scope: info.Scope,
      internal: info.Internal,
      ipam: info.IPAM,
      containers: info.Containers ? Object.entries(info.Containers).map(([id, data]: [string, any]) => ({
        id,
        name: data.Name,
        ipv4Address: data.IPv4Address,
        ipv6Address: data.IPv6Address,
        macAddress: data.MacAddress,
      })) : [],
      options: info.Options,
      created: info.Created,
    };
  } catch (error: any) {
    console.error(`Failed to inspect network ${networkId}:`, error);
    throw new Error(`Failed to inspect network: ${error.message}`);
  }
}

/**
 * 将容器连接到网络
 */
export async function connectContainerToNetwork(
  containerId: string,
  networkId: string,
  options?: {
    aliases?: string[];
    ipv4Address?: string;
    ipv6Address?: string;
  }
) {
  try {
    const network = docker.getNetwork(networkId);
    await network.connect({
      Container: containerId,
      EndpointConfig: {
        Aliases: options?.aliases,
        IPAMConfig: {
          IPv4Address: options?.ipv4Address,
          IPv6Address: options?.ipv6Address,
        },
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to connect container to network:`, error);
    throw new Error(`Failed to connect container to network: ${error.message}`);
  }
}

/**
 * 将容器从网络断开
 */
export async function disconnectContainerFromNetwork(
  containerId: string,
  networkId: string,
  force: boolean = false
) {
  try {
    const network = docker.getNetwork(networkId);
    await network.disconnect({
      Container: containerId,
      Force: force,
    });
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to disconnect container from network:`, error);
    throw new Error(`Failed to disconnect container from network: ${error.message}`);
  }
}


/**
 * Docker Compose相关功能
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

// Compose项目存储目录
const COMPOSE_DIR = "/home/ubuntu/docker-compose-projects";

/**
 * 确保Compose项目目录存在
 */
async function ensureComposeDir() {
  try {
    await fs.access(COMPOSE_DIR);
  } catch {
    await fs.mkdir(COMPOSE_DIR, { recursive: true });
  }
}

/**
 * 从docker-compose.yml内容创建项目
 */
export async function createComposeProject(
  projectName: string,
  composeContent: string
): Promise<{ success: boolean; message: string }> {
  try {
    await ensureComposeDir();
    
    // 创建项目目录
    const projectDir = path.join(COMPOSE_DIR, projectName);
    await fs.mkdir(projectDir, { recursive: true });
    
    // 写入docker-compose.yml文件
    const composeFile = path.join(projectDir, "docker-compose.yml");
    await fs.writeFile(composeFile, composeContent, "utf-8");
    
    // 启动Compose项目
    const { stdout, stderr } = await execAsync(
      `docker-compose up -d`,
      { cwd: projectDir }
    );
    
    return {
      success: true,
      message: `项目 ${projectName} 创建成功\n${stdout}`,
    };
  } catch (error: any) {
    console.error("Failed to create compose project:", error);
    return {
      success: false,
      message: `创建失败: ${error.message}`,
    };
  }
}

/**
 * 列出所有Compose项目
 */
export async function listComposeProjects(): Promise<
  Array<{
    name: string;
    path: string;
    status: string;
    containers: number;
  }>
> {
  try {
    await ensureComposeDir();
    
    const projects: Array<{
      name: string;
      path: string;
      status: string;
      containers: number;
    }> = [];
    
    // 读取项目目录
    const entries = await fs.readdir(COMPOSE_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projectDir = path.join(COMPOSE_DIR, entry.name);
        const composeFile = path.join(projectDir, "docker-compose.yml");
        
        try {
          // 检查docker-compose.yml是否存在
          await fs.access(composeFile);
          
          // 获取项目状态
          try {
            const { stdout } = await execAsync(
              `docker-compose ps -q`,
              { cwd: projectDir }
            );
            const containerIds = stdout.trim().split("\n").filter((id) => id);
            const containerCount = containerIds.length;
            
            // 检查容器状态
            let runningCount = 0;
            for (const containerId of containerIds) {
              try {
                const container = docker.getContainer(containerId);
                const info = await container.inspect();
                if (info.State.Running) {
                  runningCount++;
                }
              } catch {
                // 容器可能已被删除
              }
            }
            
            projects.push({
              name: entry.name,
              path: projectDir,
              status: runningCount > 0 ? "running" : "stopped",
              containers: containerCount,
            });
          } catch {
            // docker-compose ps失败,可能项目未启动
            projects.push({
              name: entry.name,
              path: projectDir,
              status: "stopped",
              containers: 0,
            });
          }
        } catch {
          // docker-compose.yml不存在,跳过
        }
      }
    }
    
    return projects;
  } catch (error: any) {
    console.error("Failed to list compose projects:", error);
    throw new Error(`Failed to list compose projects: ${error.message}`);
  }
}

/**
 * 启动Compose项目
 */
export async function startComposeProject(
  projectName: string
): Promise<{ success: boolean; message: string }> {
  try {
    const projectDir = path.join(COMPOSE_DIR, projectName);
    const { stdout, stderr } = await execAsync(
      `docker-compose up -d`,
      { cwd: projectDir }
    );
    
    return {
      success: true,
      message: `项目 ${projectName} 已启动\n${stdout}`,
    };
  } catch (error: any) {
    console.error("Failed to start compose project:", error);
    return {
      success: false,
      message: `启动失败: ${error.message}`,
    };
  }
}

/**
 * 停止Compose项目
 */
export async function stopComposeProject(
  projectName: string
): Promise<{ success: boolean; message: string }> {
  try {
    const projectDir = path.join(COMPOSE_DIR, projectName);
    const { stdout, stderr } = await execAsync(
      `docker-compose stop`,
      { cwd: projectDir }
    );
    
    return {
      success: true,
      message: `项目 ${projectName} 已停止\n${stdout}`,
    };
  } catch (error: any) {
    console.error("Failed to stop compose project:", error);
    return {
      success: false,
      message: `停止失败: ${error.message}`,
    };
  }
}

/**
 * 删除Compose项目
 */
export async function removeComposeProject(
  projectName: string
): Promise<{ success: boolean; message: string }> {
  try {
    const projectDir = path.join(COMPOSE_DIR, projectName);
    
    // 停止并删除容器
    try {
      await execAsync(
        `docker-compose down -v`,
        { cwd: projectDir }
      );
    } catch (error) {
      console.warn("Failed to stop compose project:", error);
    }
    
    // 删除项目目录
    await fs.rm(projectDir, { recursive: true, force: true });
    
    return {
      success: true,
      message: `项目 ${projectName} 已删除`,
    };
  } catch (error: any) {
    console.error("Failed to remove compose project:", error);
    return {
      success: false,
      message: `删除失败: ${error.message}`,
    };
  }
}

/**
 * 获取Compose项目的docker-compose.yml内容
 */
export async function getComposeProjectConfig(
  projectName: string
): Promise<string> {
  try {
    const projectDir = path.join(COMPOSE_DIR, projectName);
    const composeFile = path.join(projectDir, "docker-compose.yml");
    const content = await fs.readFile(composeFile, "utf-8");
    return content;
  } catch (error: any) {
    console.error("Failed to read compose config:", error);
    throw new Error(`Failed to read compose config: ${error.message}`);
  }
}


/**
 * 获取容器详细配置
 */
export async function getContainerDetails(containerId: string) {
  try {
    const container = docker.getContainer(containerId);
    const inspect = await container.inspect();
    
    return {
      id: inspect.Id,
      name: inspect.Name.replace("/", ""),
      image: inspect.Config.Image,
      state: {
        status: inspect.State.Status,
        running: inspect.State.Running,
        paused: inspect.State.Paused,
        restarting: inspect.State.Restarting,
        startedAt: inspect.State.StartedAt,
        finishedAt: inspect.State.FinishedAt,
      },
      config: {
        hostname: inspect.Config.Hostname,
        domainname: inspect.Config.Domainname,
        user: inspect.Config.User,
        env: inspect.Config.Env || [],
        cmd: inspect.Config.Cmd || [],
        workingDir: inspect.Config.WorkingDir,
        entrypoint: inspect.Config.Entrypoint || [],
        labels: inspect.Config.Labels || {},
      },
      network: {
        ipAddress: (inspect.NetworkSettings as any).IPAddress || '',
        macAddress: (inspect.NetworkSettings as any).MacAddress || '',
        ports: inspect.NetworkSettings.Ports || {},
        networks: Object.entries(inspect.NetworkSettings.Networks || {}).map(([name, net]: [string, any]) => ({
          name,
          ipAddress: net.IPAddress,
          gateway: net.Gateway,
          macAddress: net.MacAddress,
        })),
      },
      mounts: (inspect.Mounts || []).map((mount: any) => ({
        type: mount.Type,
        source: mount.Source,
        destination: mount.Destination,
        mode: mount.Mode,
        rw: mount.RW,
      })),
      hostConfig: {
        cpuShares: inspect.HostConfig.CpuShares,
        memory: inspect.HostConfig.Memory,
        memorySwap: inspect.HostConfig.MemorySwap,
        restartPolicy: inspect.HostConfig.RestartPolicy,
        privileged: inspect.HostConfig.Privileged,
      },
    };
  } catch (error: any) {
    console.error(`Failed to get container details:`, error);
    throw new Error(`Failed to get container details: ${error.message}`);
  }
}

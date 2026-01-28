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

    return {
      cpu: cpuPercent.toFixed(2),
      memory: {
        usage: (memoryUsage / 1024 / 1024).toFixed(2), // MB
        limit: (memoryLimit / 1024 / 1024).toFixed(2), // MB
        percent: memoryPercent.toFixed(2),
      },
      network: stats.networks,
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

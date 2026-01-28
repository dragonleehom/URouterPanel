/**
 * 虚拟机管理服务
 * 基于QEMU实现虚拟机创建、启动、停止等功能
 * 自动检测KVM支持并启用硬件加速
 */

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

const VM_STORAGE_PATH = "/var/lib/urouteros/vms";

/**
 * 检查系统是否支持KVM硬件加速
 */
export async function checkKVMSupport(): Promise<boolean> {
  try {
    const { stdout } = await execAsync("egrep -c '(vmx|svm)' /proc/cpuinfo");
    return parseInt(stdout.trim()) > 0;
  } catch {
    return false;
  }
}

/**
 * 虚拟机配置接口
 */
export interface VMConfig {
  name: string;
  memory: number; // MB
  cpus: number;
  diskSize: number; // GB
  isoPath?: string; // ISO镜像路径
  network?: "nat" | "bridge";
}

/**
 * 虚拟机状态
 */
export interface VMInfo {
  name: string;
  status: "running" | "stopped" | "paused";
  pid?: number;
  memory: number;
  cpus: number;
  diskPath: string;
  vncPort?: number;
  createdAt: string;
}

/**
 * 创建虚拟机磁盘
 */
export async function createVMDisk(
  vmName: string,
  sizeGB: number
): Promise<string> {
  const diskPath = path.join(VM_STORAGE_PATH, `${vmName}.qcow2`);

  // 使用qcow2格式创建虚拟磁盘
  await execAsync(
    `qemu-img create -f qcow2 ${diskPath} ${sizeGB}G`
  );

  return diskPath;
}

/**
 * 启动虚拟机
 */
export async function startVM(config: VMConfig): Promise<{ pid: number; vncPort: number }> {
  const diskPath = path.join(VM_STORAGE_PATH, `${config.name}.qcow2`);
  
  // 检查磁盘是否存在
  try {
    await fs.access(diskPath);
  } catch {
    throw new Error(`VM disk not found: ${diskPath}`);
  }

  // 检测KVM支持
  const hasKVM = await checkKVMSupport();
  const accel = hasKVM ? "-enable-kvm" : "";

  // 分配VNC端口(5900+随机数)
  const vncPort = 5900 + Math.floor(Math.random() * 100);
  const vncDisplay = vncPort - 5900;

  // 构建QEMU命令
  let qemuCmd = `qemu-system-x86_64 ${accel} \\
    -m ${config.memory} \\
    -smp ${config.cpus} \\
    -hda ${diskPath} \\
    -vnc :${vncDisplay} \\
    -daemonize \\
    -pidfile ${VM_STORAGE_PATH}/${config.name}.pid`;

  // 如果提供了ISO,添加CD-ROM
  if (config.isoPath) {
    qemuCmd += ` -cdrom ${config.isoPath} -boot d`;
  }

  // 网络配置
  if (config.network === "nat") {
    qemuCmd += ` -netdev user,id=net0 -device e1000,netdev=net0`;
  }

  // 启动虚拟机
  await execAsync(qemuCmd);

  // 读取PID
  const pidFile = path.join(VM_STORAGE_PATH, `${config.name}.pid`);
  const pidContent = await fs.readFile(pidFile, "utf-8");
  const pid = parseInt(pidContent.trim());

  return { pid, vncPort };
}

/**
 * 停止虚拟机
 */
export async function stopVM(vmName: string): Promise<void> {
  const pidFile = path.join(VM_STORAGE_PATH, `${vmName}.pid`);
  
  try {
    const pidContent = await fs.readFile(pidFile, "utf-8");
    const pid = parseInt(pidContent.trim());
    
    // 发送SIGTERM信号优雅关闭
    process.kill(pid, "SIGTERM");
    
    // 等待2秒后检查进程是否还存在
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      process.kill(pid, 0); // 检查进程是否存在
      // 如果还存在,强制kill
      process.kill(pid, "SIGKILL");
    } catch {
      // 进程已经不存在了
    }
    
    // 删除PID文件
    await fs.unlink(pidFile);
  } catch (error) {
    throw new Error(`Failed to stop VM: ${error}`);
  }
}

/**
 * 删除虚拟机
 */
export async function deleteVM(vmName: string): Promise<void> {
  // 先停止虚拟机
  try {
    await stopVM(vmName);
  } catch {
    // 虚拟机可能已经停止
  }

  // 删除磁盘文件
  const diskPath = path.join(VM_STORAGE_PATH, `${vmName}.qcow2`);
  try {
    await fs.unlink(diskPath);
  } catch {
    // 文件可能不存在
  }
}

/**
 * 列出所有虚拟机
 */
export async function listVMs(): Promise<VMInfo[]> {
  const files = await fs.readdir(VM_STORAGE_PATH);
  const vms: VMInfo[] = [];

  for (const file of files) {
    if (file.endsWith(".qcow2")) {
      const vmName = file.replace(".qcow2", "");
      const diskPath = path.join(VM_STORAGE_PATH, file);
      const stats = await fs.stat(diskPath);

      // 检查虚拟机是否在运行
      let status: "running" | "stopped" = "stopped";
      let pid: number | undefined;
      let vncPort: number | undefined;

      const pidFile = path.join(VM_STORAGE_PATH, `${vmName}.pid`);
      try {
        const pidContent = await fs.readFile(pidFile, "utf-8");
        pid = parseInt(pidContent.trim());
        
        // 检查进程是否存在
        try {
          process.kill(pid, 0);
          status = "running";
          // TODO: 从进程信息中提取VNC端口
        } catch {
          // 进程不存在,删除过期的PID文件
          await fs.unlink(pidFile);
          pid = undefined;
        }
      } catch {
        // PID文件不存在
      }

      vms.push({
        name: vmName,
        status,
        pid,
        memory: 0, // TODO: 从配置文件读取
        cpus: 0, // TODO: 从配置文件读取
        diskPath,
        vncPort,
        createdAt: stats.birthtime.toISOString(),
      });
    }
  }

  return vms;
}

/**
 * 获取虚拟机详情
 */
export async function getVMInfo(vmName: string): Promise<VMInfo | null> {
  const vms = await listVMs();
  return vms.find(vm => vm.name === vmName) || null;
}

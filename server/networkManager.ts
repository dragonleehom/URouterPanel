/**
 * 虚拟网络管理服务
 * 基于Linux网络栈实现虚拟网络创建和管理
 * 支持容器和虚拟机的统一网络配置
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * 执行shell命令并返回结果
 */
async function runCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  try {
    const result = await execAsync(command);
    return result;
  } catch (error: any) {
    console.error(`Command failed: ${command}`, error);
    throw new Error(`Command execution failed: ${error.message}`);
  }
}

/**
 * 检查命令是否存在
 */
async function commandExists(command: string): Promise<boolean> {
  try {
    await execAsync(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * 创建Linux Bridge
 */
export async function createBridge(bridgeName: string): Promise<void> {
  // 检查bridge是否已存在
  try {
    await execAsync(`ip link show ${bridgeName}`);
    console.log(`Bridge ${bridgeName} already exists`);
    return;
  } catch {
    // Bridge不存在,创建它
  }

  // 创建bridge
  await runCommand(`sudo ip link add name ${bridgeName} type bridge`);
  await runCommand(`sudo ip link set ${bridgeName} up`);
  console.log(`Created bridge: ${bridgeName}`);
}

/**
 * 删除Linux Bridge
 */
export async function deleteBridge(bridgeName: string): Promise<void> {
  try {
    await runCommand(`sudo ip link set ${bridgeName} down`);
    await runCommand(`sudo ip link delete ${bridgeName} type bridge`);
    console.log(`Deleted bridge: ${bridgeName}`);
  } catch (error: any) {
    console.error(`Failed to delete bridge ${bridgeName}:`, error.message);
    throw error;
  }
}

/**
 * 为Bridge配置IP地址和子网
 */
export async function configureBridgeIP(
  bridgeName: string,
  gateway: string,
  subnet: string
): Promise<void> {
  // 计算CIDR前缀长度
  const cidr = subnet.split("/")[1] || "24";
  await runCommand(`sudo ip addr add ${gateway}/${cidr} dev ${bridgeName}`);
  console.log(`Configured IP ${gateway}/${cidr} on ${bridgeName}`);
}

/**
 * 创建VLAN子接口
 */
export async function createVLAN(
  parentInterface: string,
  vlanId: number,
  vlanName: string
): Promise<void> {
  await runCommand(`sudo ip link add link ${parentInterface} name ${vlanName} type vlan id ${vlanId}`);
  await runCommand(`sudo ip link set ${vlanName} up`);
  console.log(`Created VLAN ${vlanName} (ID: ${vlanId}) on ${parentInterface}`);
}

/**
 * 删除VLAN子接口
 */
export async function deleteVLAN(vlanName: string): Promise<void> {
  await runCommand(`sudo ip link delete ${vlanName}`);
  console.log(`Deleted VLAN: ${vlanName}`);
}

/**
 * 配置NAT (使用iptables)
 */
export async function configureNAT(bridgeName: string, subnet: string): Promise<void> {
  const hasIptables = await commandExists("iptables");
  if (!hasIptables) {
    console.warn("iptables not found, skipping NAT configuration");
    return;
  }

  // 启用IP转发
  await runCommand(`sudo sysctl -w net.ipv4.ip_forward=1`);

  // 配置MASQUERADE规则
  await runCommand(
    `sudo iptables -t nat -A POSTROUTING -s ${subnet} ! -d ${subnet} -j MASQUERADE`
  );
  console.log(`Configured NAT for ${bridgeName} (${subnet})`);
}

/**
 * 删除NAT规则
 */
export async function removeNAT(subnet: string): Promise<void> {
  try {
    await runCommand(
      `sudo iptables -t nat -D POSTROUTING -s ${subnet} ! -d ${subnet} -j MASQUERADE`
    );
    console.log(`Removed NAT rule for ${subnet}`);
  } catch (error: any) {
    console.error(`Failed to remove NAT rule:`, error.message);
  }
}

/**
 * 添加端口转发规则 (DNAT)
 */
export async function addPortForward(
  protocol: string,
  externalPort: number,
  targetIp: string,
  targetPort: number
): Promise<void> {
  await runCommand(
    `sudo iptables -t nat -A PREROUTING -p ${protocol} --dport ${externalPort} -j DNAT --to-destination ${targetIp}:${targetPort}`
  );
  await runCommand(
    `sudo iptables -A FORWARD -p ${protocol} -d ${targetIp} --dport ${targetPort} -j ACCEPT`
  );
  console.log(`Added port forward: ${protocol}/${externalPort} -> ${targetIp}:${targetPort}`);
}

/**
 * 删除端口转发规则
 */
export async function removePortForward(
  protocol: string,
  externalPort: number,
  targetIp: string,
  targetPort: number
): Promise<void> {
  try {
    await runCommand(
      `sudo iptables -t nat -D PREROUTING -p ${protocol} --dport ${externalPort} -j DNAT --to-destination ${targetIp}:${targetPort}`
    );
    await runCommand(
      `sudo iptables -D FORWARD -p ${protocol} -d ${targetIp} --dport ${targetPort} -j ACCEPT`
    );
    console.log(`Removed port forward: ${protocol}/${externalPort} -> ${targetIp}:${targetPort}`);
  } catch (error: any) {
    console.error(`Failed to remove port forward:`, error.message);
  }
}

/**
 * 获取物理网卡列表
 */
export async function getPhysicalNICs(): Promise<
  Array<{ name: string; mac: string; state: string; ip?: string }>
> {
  try {
    const { stdout } = await execAsync(`ip -j link show`);
    const interfaces = JSON.parse(stdout);

    const physicalNICs = interfaces
      .filter((iface: any) => {
        // 过滤掉虚拟接口(lo, docker, br-, veth等)
        return (
          iface.link_type === "ether" &&
          !iface.ifname.startsWith("veth") &&
          !iface.ifname.startsWith("br-") &&
          !iface.ifname.startsWith("docker") &&
          iface.ifname !== "lo"
        );
      })
      .map((iface: any) => ({
        name: iface.ifname,
        mac: iface.address || "N/A",
        state: iface.operstate || "unknown",
      }));

    // 获取IP地址
    for (const nic of physicalNICs) {
      try {
        const { stdout: addrOut } = await execAsync(`ip -j addr show ${nic.name}`);
        const addrData = JSON.parse(addrOut);
        const ipv4 = addrData[0]?.addr_info?.find((addr: any) => addr.family === "inet");
        if (ipv4) {
          nic.ip = ipv4.local;
        }
      } catch {
        // IP地址获取失败,跳过
      }
    }

    return physicalNICs;
  } catch (error: any) {
    console.error("Failed to get physical NICs:", error.message);
    return [];
  }
}

/**
 * 将物理网卡连接到Bridge
 */
export async function attachNICToBridge(nicName: string, bridgeName: string): Promise<void> {
  await runCommand(`sudo ip link set ${nicName} master ${bridgeName}`);
  console.log(`Attached ${nicName} to bridge ${bridgeName}`);
}

/**
 * 从Bridge分离物理网卡
 */
export async function detachNICFromBridge(nicName: string): Promise<void> {
  await runCommand(`sudo ip link set ${nicName} nomaster`);
  console.log(`Detached ${nicName} from bridge`);
}

/**
 * 将容器连接到虚拟网络
 */
export async function attachContainerToNetwork(
  containerId: string,
  bridgeName: string,
  ipAddress?: string
): Promise<void> {
  // Docker网络连接
  if (ipAddress) {
    await runCommand(
      `sudo docker network connect ${bridgeName} ${containerId} --ip ${ipAddress}`
    );
  } else {
    await runCommand(`sudo docker network connect ${bridgeName} ${containerId}`);
  }
  console.log(`Attached container ${containerId} to network ${bridgeName}`);
}

/**
 * 从虚拟网络分离容器
 */
export async function detachContainerFromNetwork(
  containerId: string,
  bridgeName: string
): Promise<void> {
  await runCommand(`sudo docker network disconnect ${bridgeName} ${containerId}`);
  console.log(`Detached container ${containerId} from network ${bridgeName}`);
}

/**
 * 生成唯一的Bridge名称
 */
export function generateBridgeName(networkName: string): string {
  // 限制长度并确保符合Linux接口命名规则
  const sanitized = networkName.replace(/[^a-zA-Z0-9-]/g, "").substring(0, 10);
  return `br-${sanitized}`;
}

/**
 * 分配IP地址(从子网中选择可用IP)
 */
export function allocateIP(subnet: string, usedIPs: string[]): string {
  // 简单实现:从子网的第10个IP开始分配
  const [network, prefix] = subnet.split("/");
  const parts = network.split(".");
  const baseIP = parseInt(parts[3]) + 10;

  for (let i = 0; i < 240; i++) {
    const ip = `${parts[0]}.${parts[1]}.${parts[2]}.${baseIP + i}`;
    if (!usedIPs.includes(ip)) {
      return ip;
    }
  }

  throw new Error("No available IP addresses in subnet");
}

/**
 * 验证IP地址格式
 */
export function isValidIP(ip: string): boolean {
  const pattern =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return pattern.test(ip);
}

/**
 * 验证CIDR格式
 */
export function isValidCIDR(cidr: string): boolean {
  const pattern =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(3[0-2]|[12]?[0-9])$/;
  return pattern.test(cidr);
}

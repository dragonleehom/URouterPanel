import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export interface PassthroughDevice {
  slot: string;
  vendor: string;
  device: string;
  driver: string;
  iommuGroup: string;
  bound: boolean; // 是否已绑定到vfio-pci
}

/**
 * 检查vfio-pci驱动是否已加载
 */
export async function checkVFIODriver(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('lsmod | grep vfio_pci');
    return stdout.includes('vfio_pci');
  } catch {
    return false;
  }
}

/**
 * 加载vfio-pci驱动
 */
export async function loadVFIODriver(): Promise<void> {
  try {
    await execAsync('sudo modprobe vfio-pci');
  } catch (error) {
    throw new Error(`Failed to load vfio-pci driver: ${error}`);
  }
}

/**
 * 获取PCI设备的当前驱动
 */
export async function getCurrentDriver(slot: string): Promise<string | null> {
  try {
    const driverPath = `/sys/bus/pci/devices/${slot}/driver`;
    const { stdout } = await execAsync(`readlink ${driverPath} 2>/dev/null || echo ""`);
    if (stdout.trim()) {
      return stdout.trim().split('/').pop() || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 解绑PCI设备从当前驱动
 */
export async function unbindDevice(slot: string): Promise<void> {
  try {
    const driver = await getCurrentDriver(slot);
    if (driver) {
      const unbindPath = `/sys/bus/pci/drivers/${driver}/unbind`;
      await execAsync(`echo "${slot}" | sudo tee ${unbindPath}`);
    }
  } catch (error) {
    throw new Error(`Failed to unbind device ${slot}: ${error}`);
  }
}

/**
 * 绑定PCI设备到vfio-pci驱动
 */
export async function bindToVFIO(slot: string, vendorId: string, deviceId: string): Promise<void> {
  try {
    // 确保vfio-pci驱动已加载
    const driverLoaded = await checkVFIODriver();
    if (!driverLoaded) {
      await loadVFIODriver();
    }
    
    // 解绑当前驱动
    await unbindDevice(slot);
    
    // 添加设备ID到vfio-pci
    const newIdPath = '/sys/bus/pci/drivers/vfio-pci/new_id';
    await execAsync(`echo "${vendorId} ${deviceId}" | sudo tee ${newIdPath}`);
    
    // 绑定设备
    const bindPath = '/sys/bus/pci/drivers/vfio-pci/bind';
    await execAsync(`echo "${slot}" | sudo tee ${bindPath}`);
  } catch (error) {
    throw new Error(`Failed to bind device ${slot} to vfio-pci: ${error}`);
  }
}

/**
 * 从vfio-pci解绑设备
 */
export async function unbindFromVFIO(slot: string): Promise<void> {
  try {
    const unbindPath = '/sys/bus/pci/drivers/vfio-pci/unbind';
    await execAsync(`echo "${slot}" | sudo tee ${unbindPath}`);
  } catch (error) {
    throw new Error(`Failed to unbind device ${slot} from vfio-pci: ${error}`);
  }
}

/**
 * 获取IOMMU组中的所有设备
 */
export async function getIOMMUGroupDevices(iommuGroup: string): Promise<string[]> {
  try {
    const groupPath = `/sys/kernel/iommu_groups/${iommuGroup}/devices`;
    const { stdout } = await execAsync(`ls ${groupPath} 2>/dev/null || echo ""`);
    return stdout.trim().split('\n').filter(d => d);
  } catch {
    return [];
  }
}

/**
 * 检查IOMMU组是否可以安全直通
 * (组内所有设备都应该绑定到vfio-pci)
 */
export async function checkIOMMUGroupSafety(iommuGroup: string): Promise<{
  safe: boolean;
  devices: string[];
  unboundDevices: string[];
}> {
  const devices = await getIOMMUGroupDevices(iommuGroup);
  const unboundDevices: string[] = [];
  
  for (const device of devices) {
    const driver = await getCurrentDriver(device);
    if (driver !== 'vfio-pci') {
      unboundDevices.push(device);
    }
  }
  
  return {
    safe: unboundDevices.length === 0,
    devices,
    unboundDevices,
  };
}

/**
 * 获取设备的Vendor ID和Device ID
 */
export async function getDeviceIDs(slot: string): Promise<{ vendorId: string; deviceId: string }> {
  try {
    const vendorPath = `/sys/bus/pci/devices/${slot}/vendor`;
    const devicePath = `/sys/bus/pci/devices/${slot}/device`;
    
    const { stdout: vendorId } = await execAsync(`cat ${vendorPath}`);
    const { stdout: deviceId } = await execAsync(`cat ${devicePath}`);
    
    return {
      vendorId: vendorId.trim().replace('0x', ''),
      deviceId: deviceId.trim().replace('0x', ''),
    };
  } catch (error) {
    throw new Error(`Failed to get device IDs for ${slot}: ${error}`);
  }
}

/**
 * 配置GPU直通
 */
export async function configureGPUPassthrough(slot: string): Promise<void> {
  try {
    const { vendorId, deviceId } = await getDeviceIDs(slot);
    await bindToVFIO(slot, vendorId, deviceId);
  } catch (error) {
    throw new Error(`Failed to configure GPU passthrough for ${slot}: ${error}`);
  }
}

/**
 * 配置网卡直通
 */
export async function configureNetworkPassthrough(slot: string): Promise<void> {
  try {
    const { vendorId, deviceId } = await getDeviceIDs(slot);
    await bindToVFIO(slot, vendorId, deviceId);
  } catch (error) {
    throw new Error(`Failed to configure network passthrough for ${slot}: ${error}`);
  }
}

/**
 * 配置存储控制器直通
 */
export async function configureStoragePassthrough(slot: string): Promise<void> {
  try {
    const { vendorId, deviceId } = await getDeviceIDs(slot);
    await bindToVFIO(slot, vendorId, deviceId);
  } catch (error) {
    throw new Error(`Failed to configure storage passthrough for ${slot}: ${error}`);
  }
}

/**
 * 启用SR-IOV虚拟功能
 */
export async function enableSRIOV(slot: string, numVFs: number): Promise<void> {
  try {
    const sriovPath = `/sys/bus/pci/devices/${slot}/sriov_numvfs`;
    await execAsync(`echo ${numVFs} | sudo tee ${sriovPath}`);
  } catch (error) {
    throw new Error(`Failed to enable SR-IOV for ${slot}: ${error}`);
  }
}

/**
 * 禁用SR-IOV虚拟功能
 */
export async function disableSRIOV(slot: string): Promise<void> {
  try {
    const sriovPath = `/sys/bus/pci/devices/${slot}/sriov_numvfs`;
    await execAsync(`echo 0 | sudo tee ${sriovPath}`);
  } catch (error) {
    throw new Error(`Failed to disable SR-IOV for ${slot}: ${error}`);
  }
}

/**
 * 获取所有可直通的设备
 */
export async function getPassthroughDevices(): Promise<PassthroughDevice[]> {
  try {
    const { stdout } = await execAsync('lspci -Dvmm');
    const devices: PassthroughDevice[] = [];
    
    const deviceBlocks = stdout.split('\n\n').filter(block => block.trim());
    
    for (const block of deviceBlocks) {
      const lines = block.split('\n');
      let slot = '';
      let vendor = '';
      let device = '';
      
      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        
        if (key.trim() === 'Slot') slot = value;
        if (key.trim() === 'Vendor') vendor = value;
        if (key.trim() === 'Device') device = value;
      }
      
      if (slot) {
        const driver = await getCurrentDriver(slot) || 'none';
        
        // 获取IOMMU组
        let iommuGroup = '';
        try {
          const iommuPath = `/sys/bus/pci/devices/${slot}/iommu_group`;
          const { stdout: groupLink } = await execAsync(`readlink ${iommuPath} 2>/dev/null || echo ""`);
          if (groupLink) {
            iommuGroup = groupLink.trim().split('/').pop() || '';
          }
        } catch {
          // IOMMU组不存在
        }
        
        if (iommuGroup) {
          devices.push({
            slot,
            vendor,
            device,
            driver,
            iommuGroup,
            bound: driver === 'vfio-pci',
          });
        }
      }
    }
    
    return devices;
  } catch (error) {
    console.error('Error getting passthrough devices:', error);
    return [];
  }
}

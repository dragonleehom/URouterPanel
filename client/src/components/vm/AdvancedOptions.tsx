/**
 * 虚拟机高级选项配置组件
 * GPU直通、网卡直通、硬盘直通、CPU Pinning、NUMA、Hugepages等
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Network, HardDrive, Cpu, Layers, AlertCircle, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface AdvancedVMConfig {
  // GPU直通
  gpuPassthrough?: {
    enabled: boolean;
    pciSlot?: string;
  };
  // 网卡直通
  networkPassthrough?: {
    enabled: boolean;
    pciSlot?: string;
  };
  // 硬盘直通
  diskPassthrough?: {
    enabled: boolean;
    device?: string;
  };
  // CPU Pinning
  cpuPinning?: {
    enabled: boolean;
    vcpuToPcpu?: Record<number, number>;
  };
  // NUMA配置
  numa?: {
    enabled: boolean;
    node?: number;
  };
  // 大页内存
  hugepages?: {
    enabled: boolean;
    size?: "2M" | "1G";
  };
}

interface AdvancedOptionsProps {
  config: AdvancedVMConfig;
  onChange: (config: AdvancedVMConfig) => void;
}

export function AdvancedOptions({ config, onChange }: AdvancedOptionsProps) {
  // 获取可直通设备列表
  const { data: passthroughDevices, isLoading: devicesLoading } = trpc.vm.getPassthroughDevices.useQuery();
  
  // 获取CPU拓扑
  const { data: cpuTopology, isLoading: cpuLoading } = trpc.vm.getCPUTopology.useQuery();
  
  // 获取NUMA拓扑
  const { data: numaTopology, isLoading: numaLoading } = trpc.vm.getNUMATopology.useQuery();

  const updateConfig = (updates: Partial<AdvancedVMConfig>) => {
    onChange({ ...config, ...updates });
  };

  // 过滤GPU设备
  const gpuDevices = passthroughDevices?.filter(
    (dev) => dev.device.toLowerCase().includes("vga") || dev.device.toLowerCase().includes("3d")
  ) || [];

  // 过滤网卡设备
  const networkDevices = passthroughDevices?.filter(
    (dev) => dev.device.toLowerCase().includes("ethernet") || dev.device.toLowerCase().includes("network")
  ) || [];

  if (devicesLoading || cpuLoading || numaLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>高级选项</CardTitle>
          <CardDescription>正在加载硬件信息...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>高级性能选项</CardTitle>
        <CardDescription>
          配置GPU直通、网卡直通、CPU固定等高性能特性
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="passthrough" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="passthrough">设备直通</TabsTrigger>
            <TabsTrigger value="cpu">CPU优化</TabsTrigger>
            <TabsTrigger value="memory">内存优化</TabsTrigger>
          </TabsList>

          {/* 设备直通标签页 */}
          <TabsContent value="passthrough" className="space-y-4">
            {/* GPU直通 */}
            <div className="space-y-3 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-green-600" />
                  <Label htmlFor="gpu-passthrough" className="font-medium">
                    GPU直通
                  </Label>
                </div>
                <Switch
                  id="gpu-passthrough"
                  checked={config.gpuPassthrough?.enabled || false}
                  onCheckedChange={(enabled) =>
                    updateConfig({
                      gpuPassthrough: { ...config.gpuPassthrough, enabled },
                    })
                  }
                />
              </div>

              {config.gpuPassthrough?.enabled && (
                <div className="space-y-2 pl-7">
                  <Label htmlFor="gpu-device" className="text-sm">
                    选择GPU设备
                  </Label>
                  {gpuDevices.length > 0 ? (
                    <Select
                      value={config.gpuPassthrough?.pciSlot}
                      onValueChange={(pciSlot) =>
                        updateConfig({
                          gpuPassthrough: { ...config.gpuPassthrough, enabled: true, pciSlot },
                        })
                      }
                    >
                      <SelectTrigger id="gpu-device">
                        <SelectValue placeholder="选择GPU设备" />
                      </SelectTrigger>
                      <SelectContent>
                        {gpuDevices.map((gpu) => (
                          <SelectItem key={gpu.slot} value={gpu.slot}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs">{gpu.slot}</span>
                              <span className="text-sm">{gpu.device}</span>
                              {gpu.bound && (
                                <Badge variant="secondary" className="text-xs">
                                  已绑定
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        未检测到可直通的GPU设备。请确保IOMMU已启用。
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            {/* 网卡直通 */}
            <div className="space-y-3 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-orange-600" />
                  <Label htmlFor="network-passthrough" className="font-medium">
                    网卡直通
                  </Label>
                </div>
                <Switch
                  id="network-passthrough"
                  checked={config.networkPassthrough?.enabled || false}
                  onCheckedChange={(enabled) =>
                    updateConfig({
                      networkPassthrough: { ...config.networkPassthrough, enabled },
                    })
                  }
                />
              </div>

              {config.networkPassthrough?.enabled && (
                <div className="space-y-2 pl-7">
                  <Label htmlFor="network-device" className="text-sm">
                    选择网卡设备
                  </Label>
                  {networkDevices.length > 0 ? (
                    <Select
                      value={config.networkPassthrough?.pciSlot}
                      onValueChange={(pciSlot) =>
                        updateConfig({
                          networkPassthrough: { ...config.networkPassthrough, enabled: true, pciSlot },
                        })
                      }
                    >
                      <SelectTrigger id="network-device">
                        <SelectValue placeholder="选择网卡设备" />
                      </SelectTrigger>
                      <SelectContent>
                        {networkDevices.map((nic) => (
                          <SelectItem key={nic.slot} value={nic.slot}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs">{nic.slot}</span>
                              <span className="text-sm">{nic.device}</span>
                              {nic.bound && (
                                <Badge variant="secondary" className="text-xs">
                                  已绑定
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        未检测到可直通的网卡设备。请确保IOMMU已启用。
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            {/* 硬盘直通 */}
            <div className="space-y-3 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-blue-600" />
                  <Label htmlFor="disk-passthrough" className="font-medium">
                    硬盘直通
                  </Label>
                </div>
                <Switch
                  id="disk-passthrough"
                  checked={config.diskPassthrough?.enabled || false}
                  onCheckedChange={(enabled) =>
                    updateConfig({
                      diskPassthrough: { ...config.diskPassthrough, enabled },
                    })
                  }
                />
              </div>

              {config.diskPassthrough?.enabled && (
                <div className="space-y-2 pl-7">
                  <Label htmlFor="disk-device" className="text-sm">
                    设备路径
                  </Label>
                  <Input
                    id="disk-device"
                    placeholder="/dev/sdb"
                    value={config.diskPassthrough?.device || ""}
                    onChange={(e) =>
                      updateConfig({
                        diskPassthrough: {
                          ...config.diskPassthrough,
                          enabled: true,
                          device: e.target.value,
                        },
                      })
                    }
                  />
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      输入物理硬盘设备路径,如 /dev/sdb。请确保设备未被挂载。
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </TabsContent>

          {/* CPU优化标签页 */}
          <TabsContent value="cpu" className="space-y-4">
            {/* CPU Pinning */}
            <div className="space-y-3 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  <Label htmlFor="cpu-pinning" className="font-medium">
                    CPU Pinning (CPU固定)
                  </Label>
                </div>
                <Switch
                  id="cpu-pinning"
                  checked={config.cpuPinning?.enabled || false}
                  onCheckedChange={(enabled) =>
                    updateConfig({
                      cpuPinning: { ...config.cpuPinning, enabled },
                    })
                  }
                  disabled={!cpuTopology || cpuTopology.totalCores < 4}
                />
              </div>

              {cpuTopology && (
                <div className="pl-7 text-sm text-muted-foreground">
                  <p>
                    系统CPU: {cpuTopology.totalCores} 核心 ({cpuTopology.sockets} 插槽 × {cpuTopology.coresPerSocket} 核心 × {cpuTopology.threadsPerCore} 线程)
                  </p>
                </div>
              )}

              {config.cpuPinning?.enabled && (
                <Alert className="ml-7">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    CPU Pinning将虚拟CPU固定到物理CPU核心,减少上下文切换,提升性能。
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* NUMA配置 */}
            {numaTopology && numaTopology.nodes.length > 1 && (
              <div className="space-y-3 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-600" />
                    <Label htmlFor="numa-enabled" className="font-medium">
                      NUMA节点绑定
                    </Label>
                  </div>
                  <Switch
                    id="numa-enabled"
                    checked={config.numa?.enabled || false}
                    onCheckedChange={(enabled) =>
                      updateConfig({
                        numa: { ...config.numa, enabled },
                      })
                    }
                  />
                </div>

                <div className="pl-7 text-sm text-muted-foreground">
                  <p>检测到 {numaTopology.nodes.length} 个NUMA节点</p>
                </div>

                {config.numa?.enabled && (
                  <div className="space-y-2 pl-7">
                    <Label htmlFor="numa-node" className="text-sm">
                      选择NUMA节点
                    </Label>
                    <Select
                      value={config.numa?.node?.toString()}
                      onValueChange={(node) =>
                        updateConfig({
                          numa: { ...config.numa, enabled: true, node: parseInt(node) },
                        })
                      }
                    >
                      <SelectTrigger id="numa-node">
                        <SelectValue placeholder="选择NUMA节点" />
                      </SelectTrigger>
                      <SelectContent>
                        {numaTopology.nodes.map((nodeInfo) => (
                          <SelectItem key={nodeInfo.node} value={nodeInfo.node.toString()}>
                            节点 {nodeInfo.node} (CPU: {nodeInfo.cpus.join(", ")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* 内存优化标签页 */}
          <TabsContent value="memory" className="space-y-4">
            {/* 大页内存 */}
            <div className="space-y-3 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <Label htmlFor="hugepages-enabled" className="font-medium">
                    大页内存 (Hugepages)
                  </Label>
                </div>
                <Switch
                  id="hugepages-enabled"
                  checked={config.hugepages?.enabled || false}
                  onCheckedChange={(enabled) =>
                    updateConfig({
                      hugepages: { ...config.hugepages, enabled },
                    })
                  }
                />
              </div>

              {config.hugepages?.enabled && (
                <div className="space-y-3 pl-7">
                  <div className="space-y-2">
                    <Label htmlFor="hugepages-size" className="text-sm">
                      页面大小
                    </Label>
                    <Select
                      value={config.hugepages?.size || "2M"}
                      onValueChange={(size: "2M" | "1G") =>
                        updateConfig({
                          hugepages: { ...config.hugepages, enabled: true, size },
                        })
                      }
                    >
                      <SelectTrigger id="hugepages-size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2M">2MB (推荐)</SelectItem>
                        <SelectItem value="1G">1GB (大内存虚拟机)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      大页内存可以减少TLB Miss,提升内存访问性能。推荐用于内存密集型应用。
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
